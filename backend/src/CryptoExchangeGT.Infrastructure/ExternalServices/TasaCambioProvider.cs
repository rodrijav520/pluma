using System.Text.Json;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Infrastructure.ExternalServices;

/// <summary>
/// Tasa USDT→GTQ, vía USD→GTQ (USDT mantiene paridad 1:1 con el dólar).
///
/// La versión anterior devolvía una constante de 7.75 ante cualquier error, sin
/// avisar. Si el proveedor se caía y la tasa real era 7.85, todas las compras se
/// liquidaban a favor del usuario y en contra de la casa — una ventana de
/// arbitraje que se abría justo cuando nadie estaba mirando.
///
/// Ahora hay caché con vencimiento y, si no se puede obtener una tasa fresca ni
/// hay una reciente en caché, la operación se rechaza. Es preferible que el
/// usuario reintente en un minuto a liquidar a un precio inventado.
/// </summary>
public class TasaCambioProvider : ITasaCambioProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TasaCambioProvider> _logger;

    private const string UrlApi = "https://open.er-api.com/v6/latest/USD";

    /// <summary>Cuánto se considera fresca una tasa antes de volver a consultarla.</summary>
    private static readonly TimeSpan DuracionCache = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Margen de gracia: si la API está caída, se sigue usando la última tasa
    /// buena hasta este límite. Pasado eso se rechaza la operación en vez de
    /// operar con un precio viejo.
    /// </summary>
    private static readonly TimeSpan ToleranciaMaxima = TimeSpan.FromMinutes(30);

    // Estáticos porque el HttpClient se registra con AddHttpClient y el provider
    // es scoped: sin esto la caché se perdería en cada request.
    private static readonly SemaphoreSlim Candado = new(1, 1);
    private static decimal _tasaCacheada;
    private static DateTime _obtenidaEnUtc = DateTime.MinValue;

    public TasaCambioProvider(HttpClient httpClient, ILogger<TasaCambioProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<decimal> ObtenerTasaUsdtToGtqAsync(CancellationToken ct = default)
    {
        var ahora = DateTime.UtcNow;

        if (_tasaCacheada > 0 && ahora - _obtenidaEnUtc < DuracionCache)
            return _tasaCacheada;

        await Candado.WaitAsync(ct);
        try
        {
            // Otro hilo pudo refrescarla mientras esperábamos el candado.
            ahora = DateTime.UtcNow;
            if (_tasaCacheada > 0 && ahora - _obtenidaEnUtc < DuracionCache)
                return _tasaCacheada;

            try
            {
                var tasa = await ConsultarApiAsync(ct);

                _tasaCacheada = tasa;
                _obtenidaEnUtc = DateTime.UtcNow;

                return tasa;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var antiguedad = DateTime.UtcNow - _obtenidaEnUtc;

                if (_tasaCacheada > 0 && antiguedad < ToleranciaMaxima)
                {
                    _logger.LogWarning(ex,
                        "No se pudo actualizar la tasa de cambio; se usa la última conocida " +
                        "({Tasa}), obtenida hace {Minutos:N1} minutos.",
                        _tasaCacheada, antiguedad.TotalMinutes);

                    return _tasaCacheada;
                }

                _logger.LogError(ex,
                    "No se pudo obtener la tasa de cambio y no hay ninguna reciente en caché.");

                throw new ServicioExternoNoDisponibleException(
                    "No se pudo obtener la tasa de cambio en este momento. Intentá de nuevo en unos minutos.",
                    ex);
            }
        }
        finally
        {
            Candado.Release();
        }
    }

    private async Task<decimal> ConsultarApiAsync(CancellationToken ct)
    {
        using var respuesta = await _httpClient.GetAsync(UrlApi, ct);
        respuesta.EnsureSuccessStatusCode();

        await using var stream = await respuesta.Content.ReadAsStreamAsync(ct);
        using var documento = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        if (!documento.RootElement.TryGetProperty("rates", out var rates) ||
            !rates.TryGetProperty("GTQ", out var gtq) ||
            !gtq.TryGetDecimal(out var tasa))
        {
            throw new InvalidOperationException(
                "La respuesta de la API de tipo de cambio no trae la tasa GTQ esperada.");
        }

        // Una tasa fuera de todo rango razonable indica que la API cambió de
        // formato o devolvió basura. Operar con ella sería peor que fallar.
        if (tasa is <= 1m or >= 100m)
        {
            throw new InvalidOperationException(
                $"La tasa USD→GTQ recibida ({tasa}) está fuera del rango plausible.");
        }

        return tasa;
    }
}
