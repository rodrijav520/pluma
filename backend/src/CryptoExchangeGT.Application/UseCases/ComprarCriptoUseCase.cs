using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Compra de cripto con saldo en quetzales.
///
/// La versión anterior debitaba el saldo, lo persistía y recién después llamaba
/// a la blockchain, sin try/catch. Si el envío fallaba, el usuario perdía los
/// quetzales y la transacción quedaba en Pendiente para siempre.
///
/// Ahora la operación se divide en tres fases con compensación explícita:
///
///   1. Débito y registro de la transacción, en una sola escritura atómica.
///   2. Envío a la blockchain, fuera de toda transacción de base de datos
///      (esas llamadas tardan decenas de segundos y bloquearían la base).
///   3. Confirmación del envío, o reembolso del saldo si el envío falló.
///
/// El estado final del paso 2 no es "completada": eso lo decide el worker de
/// confirmación cuando verifica el recibo on-chain.
/// </summary>
public class ComprarCriptoUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IWalletCustodiaRepository _walletRepository;
    private readonly ITransaccionRepository _transaccionRepository;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly ITasaCambioProvider _tasaCambioProvider;
    private readonly ITesoreriaProvider _tesoreriaProvider;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<ComprarCriptoUseCase> _logger;

    public ComprarCriptoUseCase(
        IUsuarioRepository usuarioRepository,
        IWalletCustodiaRepository walletRepository,
        ITransaccionRepository transaccionRepository,
        ICryptoWalletService cryptoWalletService,
        ITasaCambioProvider tasaCambioProvider,
        ITesoreriaProvider tesoreriaProvider,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<ComprarCriptoUseCase> logger)
    {
        _usuarioRepository = usuarioRepository;
        _walletRepository = walletRepository;
        _transaccionRepository = transaccionRepository;
        _cryptoWalletService = cryptoWalletService;
        _tasaCambioProvider = tasaCambioProvider;
        _tesoreriaProvider = tesoreriaProvider;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<ComprarCriptoResponse> EjecutarAsync(
        Guid usuarioId, ComprarCriptoRequest request, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("Usuario no encontrado.");

        var wallet = await _walletRepository.ObtenerPorUsuarioIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("El usuario no tiene una wallet asignada.");

        // Comprobación temprana y barata contra el saldo del usuario. La
        // autoritativa sigue siendo DebitarGTQ dentro de la transacción; esta
        // solo evita gastar llamadas de red en una compra que ya no puede
        // prosperar, y —sobre todo— que a alguien sin saldo se le responda
        // "el servicio no está disponible" en vez de "no te alcanza".
        if (usuario.SaldoGTQ < request.MontoGTQ)
            throw new SaldoInsuficienteException("Saldo insuficiente en GTQ.");

        // Llamadas externas antes de abrir cualquier transacción de base de datos.
        var tasaCambio = await _tasaCambioProvider.ObtenerTasaUsdtToGtqAsync(ct);

        // Se trunca a los 6 decimales del token: entregar menos de lo cobrado
        // sería robarle al usuario, y entregar más le costaría a la casa. Truncar
        // hacia abajo y cobrar exactamente lo pactado mantiene la cuenta cuadrada.
        var montoCripto = decimal.Round(request.MontoGTQ / tasaCambio, 6, MidpointRounding.ToZero);

        if (montoCripto <= 0)
            throw new ReglaDeNegocioException(
                $"El monto es demasiado pequeño: a la tasa actual ({tasaCambio:N4}) no alcanza " +
                "para comprar una unidad mínima del token.");

        // Verificar la tesorería antes de tocar el saldo del usuario: es más
        // barato rechazar la compra ahora que debitar y tener que reembolsar.
        await VerificarFondosDeTesoreriaAsync(montoCripto, ct);

        // ---------- Fase 1: débito y registro, atómicos ----------
        var transaccion = Transaccion.CrearCompra(usuario.Id, montoCripto, request.MontoGTQ, tasaCambio);

        await using (var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct))
        {
            usuario.DebitarGTQ(request.MontoGTQ);
            _usuarioRepository.Actualizar(usuario);
            _transaccionRepository.Agregar(transaccion);

            await _unidadDeTrabajo.GuardarCambiosAsync(ct);
            await tx.ConfirmarAsync(ct);
        }

        _logger.LogInformation(
            "Compra {TransaccionId} registrada: usuario {UsuarioId} debitó {MontoGTQ} GTQ por {MontoCripto} USDT a tasa {Tasa}",
            transaccion.Id, usuario.Id, request.MontoGTQ, montoCripto, tasaCambio);

        // ---------- Fase 2: blockchain, sin transacción de base abierta ----------
        string hash;
        try
        {
            hash = await _cryptoWalletService.EnviarTransaccionAsync(
                _tesoreriaProvider.ObtenerLlavePrivadaDescifrada(),
                wallet.DireccionPublica,
                montoCripto,
                ct);
        }
        catch (Exception ex)
        {
            // ---------- Fase 3a: compensación ----------
            await ReembolsarAsync(transaccion.Id, usuario.Id, request.MontoGTQ, ex.Message, ct);

            _logger.LogError(ex,
                "Compra {TransaccionId} falló al enviar a la blockchain. Se reembolsaron {MontoGTQ} GTQ.",
                transaccion.Id, request.MontoGTQ);

            throw new TransaccionBlockchainFallidaException(
                "No se pudo completar la compra. El saldo fue devuelto a tu cuenta.", ex);
        }

        // ---------- Fase 3b: confirmar el envío ----------
        transaccion.MarcarComoEnviadaABlockchain(hash);
        _transaccionRepository.Actualizar(transaccion);
        await _unidadDeTrabajo.GuardarCambiosAsync(ct);

        _logger.LogInformation("Compra {TransaccionId} transmitida con hash {Hash}", transaccion.Id, hash);

        return new ComprarCriptoResponse
        {
            TransaccionId = transaccion.Id,
            MontoCriptoRecibido = montoCripto,
            TasaCambioUsada = tasaCambio,
            HashBlockchain = hash,
            Estado = transaccion.Estado.ToString()
        };
    }

    private async Task VerificarFondosDeTesoreriaAsync(decimal montoRequerido, CancellationToken ct)
    {
        decimal saldoTesoreria;
        try
        {
            saldoTesoreria = await _cryptoWalletService.ConsultarSaldoAsync(
                _tesoreriaProvider.ObtenerDireccionPublica(), ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo consultar el saldo de la tesorería.");
            throw new ServicioExternoNoDisponibleException(
                "No se pudo verificar la disponibilidad de fondos. Intentá de nuevo en unos minutos.", ex);
        }

        if (saldoTesoreria < montoRequerido)
        {
            // El detalle del faltante va al log, no a la respuesta: el saldo de
            // la tesorería no es información que deba ver un cliente.
            _logger.LogWarning(
                "Tesorería sin fondos: se requieren {Requerido} USDT y hay {Disponible}.",
                montoRequerido, saldoTesoreria);

            throw new ReglaDeNegocioException(
                "La compra no está disponible en este momento. Intentá de nuevo más tarde.");
        }
    }

    /// <summary>
    /// Devuelve el saldo debitado y marca la transacción como fallida y
    /// compensada, todo en una sola escritura atómica. Se releen las entidades
    /// para no arrastrar el estado en memoria de la fase 1.
    /// </summary>
    private async Task ReembolsarAsync(
        Guid transaccionId, Guid usuarioId, decimal monto, string motivo, CancellationToken ct)
    {
        try
        {
            await using var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct);

            var transaccion = await _transaccionRepository.ObtenerPorIdAsync(transaccionId, ct);
            var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, ct);

            if (transaccion is null || usuario is null)
            {
                _logger.LogCritical(
                    "No se pudo reembolsar la compra {TransaccionId}: falta la transacción o el usuario. " +
                    "Requiere revisión manual.", transaccionId);
                return;
            }

            transaccion.MarcarComoFallida(motivo);

            if (transaccion.MarcarComoCompensada())
            {
                usuario.AcreditarGTQ(monto);
                _usuarioRepository.Actualizar(usuario);
            }

            _transaccionRepository.Actualizar(transaccion);

            await _unidadDeTrabajo.GuardarCambiosAsync(ct);
            await tx.ConfirmarAsync(ct);
        }
        catch (Exception ex)
        {
            // Si la compensación falla, el usuario quedó debitado sin recibir
            // cripto. Es la situación más grave posible acá, así que se registra
            // como crítica con todo el detalle para conciliación manual.
            _logger.LogCritical(ex,
                "FALLÓ LA COMPENSACIÓN de la compra {TransaccionId}. El usuario {UsuarioId} quedó " +
                "debitado en {Monto} GTQ sin recibir cripto. Requiere reembolso manual.",
                transaccionId, usuarioId, monto);
        }
    }
}
