namespace CryptoExchangeGT.Application.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public Guid UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Rol del usuario, para que la interfaz muestre u oculte acciones de administración.</summary>
    public string Rol { get; set; } = string.Empty;
}
