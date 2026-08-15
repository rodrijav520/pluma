namespace CryptoExchangeGT.Application.DTOs;

public class ComprarCriptoResponse
{
    public Guid TransaccionId { get; set; }
    public decimal MontoCriptoRecibido { get; set; }
    public decimal TasaCambioUsada { get; set; }
    public string HashBlockchain { get; set; } = string.Empty;

    /// <summary>
    /// Siempre "Confirmando" al responder. La transacción pasa a "Completada"
    /// cuando el worker verifica el recibo on-chain, no antes.
    /// </summary>
    public string Estado { get; set; } = string.Empty;
}
