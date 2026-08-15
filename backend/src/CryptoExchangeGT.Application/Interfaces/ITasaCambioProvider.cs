namespace CryptoExchangeGT.Application.Interfaces;

public interface ITasaCambioProvider
{
    /// <summary>
    /// Tasa USDT→GTQ vigente. Lanza ServicioExternoNoDisponibleException si no
    /// se puede obtener una tasa fresca y confiable. Antes devolvía en silencio
    /// una constante de 7.75, lo que abría una ventana de arbitraje contra la
    /// casa justo cuando el proveedor estaba caído.
    /// </summary>
    Task<decimal> ObtenerTasaUsdtToGtqAsync(CancellationToken ct = default);
}
