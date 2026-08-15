using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Infrastructure.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CryptoExchangeGT.Infrastructure.BackgroundServices;

/// <summary>
/// Revisa periódicamente las transacciones en estado "Confirmando" y las cierra
/// según lo que diga la blockchain.
///
/// Este worker no existía, y era la razón por la que ninguna transacción llegaba
/// jamás a "Completada": el estado quedaba congelado en "Confirmando" para
/// siempre y FechaConfirmacion siempre en null.
/// </summary>
public class ConfirmacionTransaccionesWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ConfirmacionOptions _opciones;
    private readonly ILogger<ConfirmacionTransaccionesWorker> _logger;

    public ConfirmacionTransaccionesWorker(
        IServiceScopeFactory scopeFactory,
        IOptions<ConfirmacionOptions> opciones,
        ILogger<ConfirmacionTransaccionesWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _opciones = opciones.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_opciones.Habilitado)
        {
            _logger.LogWarning(
                "El worker de confirmación está deshabilitado. Las transacciones quedarán " +
                "en estado Confirmando hasta que se active.");
            return;
        }

        var intervalo = TimeSpan.FromSeconds(_opciones.IntervaloSegundos);

        _logger.LogInformation(
            "Worker de confirmación iniciado: revisa cada {Intervalo} en lotes de {Lote}.",
            intervalo, _opciones.TamanioLote);

        using var timer = new PeriodicTimer(intervalo);

        while (await EsperarSiguienteCicloAsync(timer, stoppingToken))
        {
            try
            {
                // Scope propio por ciclo: el DbContext es scoped y no puede
                // compartirse entre iteraciones ni vivir tanto como el worker.
                using var scope = _scopeFactory.CreateScope();
                var casoDeUso = scope.ServiceProvider.GetRequiredService<ConfirmarTransaccionesUseCase>();

                var procesadas = await casoDeUso.EjecutarAsync(_opciones.TamanioLote, stoppingToken);

                if (procesadas > 0)
                    _logger.LogInformation("Se cerraron {Cantidad} transacciones en este ciclo.", procesadas);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // Un ciclo fallido no puede tumbar el worker: si la excepción
                // escapara, el BackgroundService moriría en silencio y nadie
                // volvería a confirmar transacciones.
                _logger.LogError(ex, "Error en el ciclo de confirmación. Se reintenta en el próximo.");
            }
        }

        _logger.LogInformation("Worker de confirmación detenido.");
    }

    private static async Task<bool> EsperarSiguienteCicloAsync(PeriodicTimer timer, CancellationToken ct)
    {
        try
        {
            return await timer.WaitForNextTickAsync(ct);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
