using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Infrastructure.Persistence;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _context;

    public UsuarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Usuario?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<Usuario?> ObtenerPorEmailAsync(string email, CancellationToken ct = default)
    {
        // La normalización se hace acá y en la entidad con ToLowerInvariant.
        // Antes el repositorio usaba ToLower(), que depende de la cultura del
        // servidor: en configuración regional turca la "I" no baja a "i" y el
        // login fallaba sin explicación aparente.
        var normalizado = email.Trim().ToLowerInvariant();
        return _context.Usuarios.FirstOrDefaultAsync(u => u.Email == normalizado, ct);
    }

    public Task<bool> ExisteEmailAsync(string email, CancellationToken ct = default)
    {
        var normalizado = email.Trim().ToLowerInvariant();
        return _context.Usuarios.AnyAsync(u => u.Email == normalizado, ct);
    }

    public void Agregar(Usuario usuario) => _context.Usuarios.Add(usuario);

    // La entidad ya viene siendo rastreada por el contexto, así que basta con
    // marcarla si por alguna razón llegó desconectada. Llamar a Update() sobre
    // una entidad rastreada marcaría todas las propiedades como modificadas.
    public void Actualizar(Usuario usuario)
    {
        if (_context.Entry(usuario).State == EntityState.Detached)
            _context.Usuarios.Update(usuario);
    }
}
