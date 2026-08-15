namespace CryptoExchangeGT.Application.DTOs;

public class RegistroResponse
{
    public Guid UsuarioId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string WalletDireccionPublica { get; set; } = string.Empty;

    /// <summary>
    /// False si la tesorería no pudo adelantar el ETH para gas. La cuenta queda
    /// creada igual, pero no podrá operar hasta que se reintente el patrocinio.
    /// Antes este fallo era invisible.
    /// </summary>
    public bool GasPatrocinado { get; set; }
}
