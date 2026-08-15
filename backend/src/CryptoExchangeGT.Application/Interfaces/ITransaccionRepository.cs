using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;

namespace CryptoExchangeGT.Application.Interfaces;

public interface ITransaccionRepository
{
    Task<Transaccion?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Historial paginado, para no traer miles de filas de una sola vez.</summary>
    Task<IReadOnlyList<Transaccion>> ObtenerPorUsuarioIdAsync(
        Guid usuarioId, int pagina, int tamanioPagina, CancellationToken ct = default);

    Task<int> ContarPorUsuarioIdAsync(Guid usuarioId, CancellationToken ct = default);

    /// <summary>Las que el worker de confirmación debe revisar contra la blockchain.</summary>
    Task<IReadOnlyList<Transaccion>> ObtenerPorEstadoAsync(
        EstadoTransaccion estado, int limite, CancellationToken ct = default);

    /// <summary>
    /// Base de la idempotencia de depósitos: si la referencia externa ya se
    /// registró, el mismo pago no se acredita dos veces.
    /// </summary>
    Task<bool> ExisteReferenciaExternaAsync(string referenciaExterna, CancellationToken ct = default);

    void Agregar(Transaccion transaccion);
    void Actualizar(Transaccion transaccion);
}
