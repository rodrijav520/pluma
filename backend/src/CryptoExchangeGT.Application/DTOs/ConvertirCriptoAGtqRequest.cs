using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Application.DTOs;

public class ConvertirCriptoAGtqRequest
{
    [Range(0.000001, 1_000_000, ErrorMessage = "El monto debe ser mayor que cero.")]
    public decimal MontoCripto { get; set; }
}
