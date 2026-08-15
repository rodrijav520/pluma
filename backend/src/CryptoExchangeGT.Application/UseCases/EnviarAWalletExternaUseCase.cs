using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Envía cripto del usuario a una dirección externa.
///
/// La validación de la dirección es la corrección importante: antes solo se
/// comprobaba que la cadena no estuviera vacía. Una dirección mal formada o la
/// dirección cero significan perder los fondos de forma irreversible, y en
/// blockchain no hay reversa posible.
/// </summary>
public class EnviarAWalletExternaUseCase
{
    private readonly IWalletCustodiaRepository _walletRepository;
    private readonly ITransaccionRepository _transaccionRepository;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly IEncriptacionService _encriptacionService;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<EnviarAWalletExternaUseCase> _logger;

    public EnviarAWalletExternaUseCase(
        IWalletCustodiaRepository walletRepository,
        ITransaccionRepository transaccionRepository,
        ICryptoWalletService cryptoWalletService,
        IEncriptacionService encriptacionService,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<EnviarAWalletExternaUseCase> logger)
    {
        _walletRepository = walletRepository;
        _transaccionRepository = transaccionRepository;
        _cryptoWalletService = cryptoWalletService;
        _encriptacionService = encriptacionService;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<EnviarAWalletExternaResponse> EjecutarAsync(
        Guid usuarioId, EnviarAWalletExternaRequest request, CancellationToken ct = default)
    {
        if (!_cryptoWalletService.EsDireccionValida(request.DireccionDestino))
            throw new ReglaDeNegocioException(
                "La dirección destino no es válida. Verificá que sea una dirección Ethereum " +
                "correcta antes de enviar: las transferencias en blockchain no se pueden revertir.");

        var wallet = await _walletRepository.ObtenerPorUsuarioIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("El usuario no tiene una wallet asignada.");

        if (string.Equals(request.DireccionDestino, wallet.DireccionPublica,
                          StringComparison.OrdinalIgnoreCase))
            throw new ReglaDeNegocioException("La dirección destino es tu propia wallet.");

        decimal saldoReal;
        try
        {
            saldoReal = await _cryptoWalletService.ConsultarSaldoAsync(wallet.DireccionPublica, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo consultar el saldo on-chain de {Direccion}",
                wallet.DireccionPublica);
            throw new ServicioExternoNoDisponibleException(
                "No se pudo verificar tu saldo en la blockchain. Intentá de nuevo en unos minutos.", ex);
        }

        if (saldoReal < request.MontoCripto)
            throw new SaldoInsuficienteException("Saldo insuficiente en la wallet cripto.");

        var transaccion = Transaccion.CrearEnvioExterno(
            usuarioId, request.MontoCripto, request.DireccionDestino);

        _transaccionRepository.Agregar(transaccion);
        await _unidadDeTrabajo.GuardarCambiosAsync(ct);

        string hash;
        try
        {
            var llavePrivada = _encriptacionService.Descifrar(wallet.LlavePrivadaCifrada);

            hash = await _cryptoWalletService.EnviarTransaccionAsync(
                llavePrivada, request.DireccionDestino, request.MontoCripto, ct);
        }
        catch (Exception ex)
        {
            transaccion.MarcarComoFallida(ex.Message);
            _transaccionRepository.Actualizar(transaccion);
            await _unidadDeTrabajo.GuardarCambiosAsync(ct);

            _logger.LogError(ex, "Envío externo {TransaccionId} falló.", transaccion.Id);

            throw new TransaccionBlockchainFallidaException(
                "No se pudo completar el envío. Tu saldo no fue afectado.", ex);
        }

        transaccion.MarcarComoEnviadaABlockchain(hash);
        _transaccionRepository.Actualizar(transaccion);

        wallet.ActualizarSaldoCacheado(saldoReal - request.MontoCripto);
        _walletRepository.Actualizar(wallet);

        await _unidadDeTrabajo.GuardarCambiosAsync(ct);

        _logger.LogInformation(
            "Envío externo {TransaccionId} transmitido con hash {Hash} hacia {Destino}",
            transaccion.Id, hash, request.DireccionDestino);

        return new EnviarAWalletExternaResponse
        {
            TransaccionId = transaccion.Id,
            HashBlockchain = hash,
            Estado = transaccion.Estado.ToString()
        };
    }
}
