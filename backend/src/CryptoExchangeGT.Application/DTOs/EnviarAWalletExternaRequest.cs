using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Application.DTOs;

public class EnviarAWalletExternaRequest
{
    [Range(0.000001, 1_000_000, ErrorMessage = "El monto debe ser mayor que cero.")]
    public decimal MontoCripto { get; set; }

    [Required(ErrorMessage = "La dirección destino es obligatoria.")]
    [RegularExpression("^0x[a-fA-F0-9]{40}$",
        ErrorMessage = "La dirección destino no tiene formato Ethereum válido.")]
    public string DireccionDestino { get; set; } = string.Empty;
}
