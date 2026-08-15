using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Infrastructure.Persistence;

public class TransaccionRepository : ITransaccionRepository
{
    private readonly AppDbContext _context;

    public TransaccionRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Transaccion?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Transacciones.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<IReadOnlyList<Transaccion>> ObtenerPorUsuarioIdAsync(
        Guid usuarioId, int pagina, int tamanioPagina, CancellationToken ct = default)
    {
        // AsNoTracking: el historial es solo lectura, no hace falta que el
        // contexto rastree cambios sobre estas entidades.
        return await _context.Transacciones
            .AsNoTracking()
            .Where(t => t.UsuarioId == usuarioId)
            .OrderByDescending(t => t.FechaCreacion)
            .Skip((pagina - 1) * tamanioPagina)
            .Take(tamanioPagina)
            .ToListAsync(ct);
    }

    public Task<int> ContarPorUsuarioIdAsync(Guid usuarioId, CancellationToken ct = default) =>
        _context.Transacciones.CountAsync(t => t.UsuarioId == usuarioId, ct);

    public async Task<IReadOnlyList<Transaccion>> ObtenerPorEstadoAsync(
        EstadoTransaccion estado, int limite, CancellationToken ct = default)
    {
        // Las más viejas primero: si hay atraso, conviene resolver las que llevan
        // más tiempo esperando confirmación.
        return await _context.Transacciones
            .Where(t => t.Estado == estado)
            .OrderBy(t => t.FechaCreacion)
            .Take(limite)
            .ToListAsync(ct);
    }

    public Task<bool> ExisteReferenciaExternaAsync(string referenciaExterna, CancellationToken ct = default) =>
        _context.Transacciones.AnyAsync(t => t.ReferenciaExterna == referenciaExterna, ct);

    public void Agregar(Transaccion transaccion) => _context.Transacciones.Add(transaccion);

    public void Actualizar(Transaccion transaccion)
    {
        if (_context.Entry(transaccion).State == EntityState.Detached)
            _context.Transacciones.Update(transaccion);
    }
}
