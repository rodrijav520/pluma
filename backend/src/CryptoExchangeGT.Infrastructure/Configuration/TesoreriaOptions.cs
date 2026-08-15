using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Infrastructure.Configuration;

public class TesoreriaOptions
{
    public const string Seccion = "Tesoreria";

    [Required(ErrorMessage = "Falta configurar Tesoreria:DireccionPublica.")]
    [RegularExpression("^0x[a-fA-F0-9]{40}$",
        ErrorMessage = "Tesoreria:DireccionPublica no tiene formato Ethereum válido.")]
    public string DireccionPublica { get; set; } = string.Empty;

    [Required(ErrorMessage = "Falta configurar Tesoreria:LlavePrivadaCifrada.")]
    public string LlavePrivadaCifrada { get; set; } = string.Empty;
}
