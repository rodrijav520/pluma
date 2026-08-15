using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Historial de transacciones, paginado.
///
/// Antes el endpoint devolvía la lista completa de entidades de dominio: sin
/// límite de filas (una cuenta activa terminaría devolviendo megabytes) y
/// filtrando la forma interna de Transaccion a los clientes de la API.
/// </summary>
public class ObtenerHistorialUseCase
{
    private readonly ITransaccionRepository _transaccionRepository;

    public const int TamanioPaginaMaximo = 100;
    public const int TamanioPaginaPorDefecto = 20;

    public ObtenerHistorialUseCase(ITransaccionRepository transaccionRepository)
    {
        _transaccionRepository = transaccionRepository;
    }

    public async Task<HistorialResponse> EjecutarAsync(
        Guid usuarioId, int pagina, int tamanioPagina, CancellationToken ct = default)
    {
        pagina = Math.Max(1, pagina);
        tamanioPagina = Math.Clamp(
            tamanioPagina <= 0 ? TamanioPaginaPorDefecto : tamanioPagina,
            1, TamanioPaginaMaximo);

        var total = await _transaccionRepository.ContarPorUsuarioIdAsync(usuarioId, ct);
        var transacciones = await _transaccionRepository.ObtenerPorUsuarioIdAsync(
            usuarioId, pagina, tamanioPagina, ct);

        return new HistorialResponse
        {
            Transacciones = transacciones.Select(Mapear).ToList(),
            Pagina = pagina,
            TamanioPagina = tamanioPagina,
            TotalRegistros = total,
            TotalPaginas = (int)Math.Ceiling(total / (double)tamanioPagina)
        };
    }

    private static TransaccionResponse Mapear(Transaccion t) => new()
    {
        Id = t.Id,
        Tipo = t.Tipo.ToString(),
        Estado = t.Estado.ToString(),
        MontoCripto = t.MontoCripto,
        MontoGTQ = t.MontoGTQ,
        TasaCambioUsada = t.TasaCambioUsada,
        DireccionDestino = t.DireccionDestino,
        HashBlockchain = t.HashBlockchain,
        MotivoFallo = t.MotivoFallo,
        FechaCreacion = t.FechaCreacion,
        FechaConfirmacion = t.FechaConfirmacion
    };
}
