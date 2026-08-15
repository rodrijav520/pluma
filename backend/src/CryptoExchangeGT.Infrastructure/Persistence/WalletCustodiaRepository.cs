using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Infrastructure.Persistence;

public class WalletCustodiaRepository : IWalletCustodiaRepository
{
    private readonly AppDbContext _context;

    public WalletCustodiaRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<WalletCustodia?> ObtenerPorUsuarioIdAsync(Guid usuarioId, CancellationToken ct = default) =>
        _context.WalletsCustodia.FirstOrDefaultAsync(w => w.UsuarioId == usuarioId, ct);

    public void Agregar(WalletCustodia wallet) => _context.WalletsCustodia.Add(wallet);

    public void Actualizar(WalletCustodia wallet)
    {
        if (_context.Entry(wallet).State == EntityState.Detached)
            _context.WalletsCustodia.Update(wallet);
    }
}
