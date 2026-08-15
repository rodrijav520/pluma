using CryptoExchangeGT.Domain.Entities;

namespace CryptoExchangeGT.Application.Interfaces;

/// <summary>
/// Los métodos ya no persisten por su cuenta: registran la intención y quien
/// llama confirma con IUnidadDeTrabajo.GuardarCambiosAsync(). Eso permite que
/// varios cambios se apliquen o se descarten juntos.
/// </summary>
public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<Usuario?> ObtenerPorEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExisteEmailAsync(string email, CancellationToken ct = default);
    void Agregar(Usuario usuario);
    void Actualizar(Usuario usuario);
}
