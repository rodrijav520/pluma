using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Consulta de saldos. No existía: la única forma de saber cuánto tenía un
/// usuario era pedir el historial completo y sumar a mano.
/// </summary>
public class ConsultarSaldoUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IWalletCustodiaRepository _walletRepository;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly ITasaCambioProvider _tasaCambioProvider;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<ConsultarSaldoUseCase> _logger;

    public ConsultarSaldoUseCase(
        IUsuarioRepository usuarioRepository,
        IWalletCustodiaRepository walletRepository,
        ICryptoWalletService cryptoWalletService,
        ITasaCambioProvider tasaCambioProvider,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<ConsultarSaldoUseCase> logger)
    {
        _usuarioRepository = usuarioRepository;
        _walletRepository = walletRepository;
        _cryptoWalletService = cryptoWalletService;
        _tasaCambioProvider = tasaCambioProvider;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<SaldoResponse> EjecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("Usuario no encontrado.");

        var wallet = await _walletRepository.ObtenerPorUsuarioIdAsync(usuarioId, ct)
            ?? throw new RecursoNoEncontradoException("El usuario no tiene una wallet asignada.");

        // Consultar saldo no debe fallar solo porque el RPC esté caído: se
        // devuelve el último valor cacheado, pero marcado como tal para que la
        // interfaz pueda advertirlo en vez de mostrarlo como dato actual.
        decimal saldoCripto;
        bool enLinea;
        try
        {
            saldoCripto = await _cryptoWalletService.ConsultarSaldoAsync(wallet.DireccionPublica, ct);
            enLinea = true;

            if (saldoCripto != wallet.SaldoCriptoCacheado)
            {
                wallet.ActualizarSaldoCacheado(saldoCripto);
                _walletRepository.Actualizar(wallet);
                await _unidadDeTrabajo.GuardarCambiosAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "No se pudo leer el saldo on-chain de {Direccion}; se devuelve el valor cacheado.",
                wallet.DireccionPublica);

            saldoCripto = wallet.SaldoCriptoCacheado;
            enLinea = false;
        }

        decimal tasa = 0m;
        decimal equivalente = 0m;
        try
        {
            tasa = await _tasaCambioProvider.ObtenerTasaUsdtToGtqAsync(ct);
            equivalente = decimal.Round(saldoCripto * tasa, 2, MidpointRounding.ToZero);
        }
        catch (ServicioExternoNoDisponibleException ex)
        {
            // Igual que arriba: sin tasa se devuelven los saldos crudos en vez
            // de romper toda la consulta.
            _logger.LogWarning(ex, "No se pudo obtener la tasa de cambio para la consulta de saldo.");
        }

        return new SaldoResponse
        {
            SaldoGTQ = usuario.SaldoGTQ,
            SaldoCripto = saldoCripto,
            DireccionWallet = wallet.DireccionPublica,
            EquivalenteGTQ = equivalente,
            TasaCambio = tasa,
            SaldoCriptoEnLinea = enLinea
        };
    }
}
