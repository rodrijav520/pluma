namespace CryptoExchangeGT.Application.DTOs;

public class EnviarAWalletExternaResponse
{
    public Guid TransaccionId { get; set; }
    public string HashBlockchain { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}
