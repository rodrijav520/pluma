using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Convierte cripto del usuario a quetzales, enviando el token a la tesorería.
///
/// El cambio importante frente a la versión anterior: los quetzales ya NO se
/// acreditan acá. Antes se sumaban al saldo apenas se transmitía la
/// transferencia; si esa transferencia revertía on-chain, el usuario se quedaba
/// con su cripto Y con los quetzales.
///
/// Ahora la acreditación la hace el worker de confirmación, y solo después de
/// verificar que el recibo tiene Status = 1. La tasa de cambio queda congelada
/// en la transacción al momento de la solicitud, así que el usuario recibe la
/// tasa que se le mostró aunque la confirmación tarde.
/// </summary>
public class ConvertirCriptoAGtqUseCase
{
    private readonly IWalletCustodiaRepository _walletRepository;
    private readonly ITransaccionRepository _transaccionRepository;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly IEncriptacionService _encriptacionService;
    private readonly ITasaCambioProvider _tasaCambioProvider;
    private readonly ITesoreriaProvider _tesoreriaProvider;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<ConvertirCriptoAGtqUseCase> _logger;

    public ConvertirCriptoAGtqUseCase(
        IWalletCustodiaRepository walletRepository,
        ITransaccionRepository transaccionRepository,
        ICryptoWalletService cryptoWalletService,
        IEncriptacionService encriptacionService,
        ITasaCambioProvider tasaCambioProvider,
        ITesoreriaProvider tesoreriaProvider,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<ConvertirCriptoAGtqUseCase> logger)
    {
        _walletRepository = walletRepository;
        _transaccionRepository = transaccionRepository;
        _cryptoWalletService = cryptoWalletService;
        _encriptacionService = encriptacionService;
        _tasaCambioProvider = tasaCambioProvider;
        _tesoreriaProvider = tesoreriaProvider;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<ConvertirCriptoAGtqResponse> EjecutarAsync(
        Guid usuarioId, ConvertirCriptoAGtqRequest request, CancellationToken ct = default)
    {
        var wallet = await _walletRepository.ObtenerPorUsuarioIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("El usuario no tiene una wallet asignada.");

        var saldoReal = await ConsultarSaldoAsync(wallet.DireccionPublica, ct);

        if (saldoReal < request.MontoCripto)
            throw new SaldoInsuficienteException("Saldo insuficiente en la wallet cripto.");

        var tasaCambio = await _tasaCambioProvider.ObtenerTasaUsdtToGtqAsync(ct);
        var montoGTQ = decimal.Round(request.MontoCripto * tasaCambio, 2, MidpointRounding.ToZero);

        if (montoGTQ <= 0)
            throw new ReglaDeNegocioException(
                "El monto es demasiado pequeño: la conversión resultaría en Q0.00.");

        var transaccion = Transaccion.CrearConversionAGtq(
            usuarioId, request.MontoCripto, montoGTQ, tasaCambio);

        _transaccionRepository.Agregar(transaccion);
        await _unidadDeTrabajo.GuardarCambiosAsync(ct);

        string hash;
        try
        {
            var llavePrivada = _encriptacionService.Descifrar(wallet.LlavePrivadaCifrada);

            hash = await _cryptoWalletService.EnviarTransaccionAsync(
                llavePrivada,
                _tesoreriaProvider.ObtenerDireccionPublica(),
                request.MontoCripto,
                ct);
        }
        catch (Exception ex)
        {
            // No hay saldo que devolver: los quetzales todavía no se acreditaron
            // y la cripto sigue en la wallet del usuario. Solo hay que dejar
            // constancia de por qué no se completó.
            transaccion.MarcarComoFallida(ex.Message);
            _transaccionRepository.Actualizar(transaccion);
            await _unidadDeTrabajo.GuardarCambiosAsync(ct);

            _logger.LogError(ex, "Conversión {TransaccionId} falló al enviar a la blockchain.",
                transaccion.Id);

            throw new TransaccionBlockchainFallidaException(
                "No se pudo completar la conversión. Tu saldo en cripto no fue afectado.", ex);
        }

        transaccion.MarcarComoEnviadaABlockchain(hash);
        _transaccionRepository.Actualizar(transaccion);

        wallet.ActualizarSaldoCacheado(saldoReal - request.MontoCripto);
        _walletRepository.Actualizar(wallet);

        await _unidadDeTrabajo.GuardarCambiosAsync(ct);

        _logger.LogInformation(
            "Conversión {TransaccionId} transmitida con hash {Hash}. Se acreditarán {MontoGTQ} GTQ al confirmarse.",
            transaccion.Id, hash, montoGTQ);

        return new ConvertirCriptoAGtqResponse
        {
            TransaccionId = transaccion.Id,
            MontoGTQAAcreditar = montoGTQ,
            TasaCambioUsada = tasaCambio,
            HashBlockchain = hash,
            Estado = transaccion.Estado.ToString()
        };
    }

    private async Task<decimal> ConsultarSaldoAsync(string direccion, CancellationToken ct)
    {
        try
        {
            return await _cryptoWalletService.ConsultarSaldoAsync(direccion, ct);
        }
        catch (Exception ex)
        {
            // Antes cualquier fallo del RPC subía como error 500 sin contexto.
            // Acá se distingue explícitamente "no pudimos leer el saldo" de
            // "no tenés saldo", que son cosas muy distintas para el usuario.
            _logger.LogError(ex, "No se pudo consultar el saldo on-chain de {Direccion}", direccion);
            throw new ServicioExternoNoDisponibleException(
                "No se pudo verificar tu saldo en la blockchain. Intentá de nuevo en unos minutos.", ex);
        }
    }
}
