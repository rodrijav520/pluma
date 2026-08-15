using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Infrastructure.Configuration;

public class JwtOptions
{
    public const string Seccion = "Jwt";

    /// <summary>
    /// Clave de firma HS256. El mínimo de 32 caracteres no es cosmético: HS256
    /// exige una clave de al menos 256 bits, y una más corta debilita la firma.
    /// </summary>
    [Required(ErrorMessage = "Falta configurar Jwt:ClaveSecreta.")]
    [MinLength(32, ErrorMessage = "Jwt:ClaveSecreta debe tener al menos 32 caracteres.")]
    public string ClaveSecreta { get; set; } = string.Empty;

    [Required(ErrorMessage = "Falta configurar Jwt:Emisor.")]
    public string Emisor { get; set; } = string.Empty;

    [Required(ErrorMessage = "Falta configurar Jwt:Audiencia.")]
    public string Audiencia { get; set; } = string.Empty;

    [Range(1, 1440, ErrorMessage = "Jwt:ExpiracionMinutos debe estar entre 1 y 1440.")]
    public int ExpiracionMinutos { get; set; } = 60;
}
