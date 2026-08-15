namespace CryptoExchangeGT.Application.DTOs;

public class ConvertirCriptoAGtqResponse
{
    public Guid TransaccionId { get; set; }

    /// <summary>
    /// Monto que se acreditará. Antes se llamaba MontoGTQRecibido y el saldo se
    /// sumaba de inmediato, aun si la transferencia on-chain revertía. Ahora la
    /// acreditación ocurre solo cuando la transacción se confirma.
    /// </summary>
    public decimal MontoGTQAAcreditar { get; set; }

    public decimal TasaCambioUsada { get; set; }
    public string HashBlockchain { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}
