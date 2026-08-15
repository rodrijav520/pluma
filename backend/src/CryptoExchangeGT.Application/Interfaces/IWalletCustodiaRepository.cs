using CryptoExchangeGT.Domain.Entities;

namespace CryptoExchangeGT.Application.Interfaces;

public interface IWalletCustodiaRepository
{
    Task<WalletCustodia?> ObtenerPorUsuarioIdAsync(Guid usuarioId, CancellationToken ct = default);
    void Agregar(WalletCustodia wallet);
    void Actualizar(WalletCustodia wallet);
}
