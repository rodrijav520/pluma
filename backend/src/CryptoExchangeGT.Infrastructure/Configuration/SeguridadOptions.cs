using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Infrastructure.Configuration;

public class SeguridadOptions
{
    public const string Seccion = "Seguridad";

    /// <summary>
    /// Clave AES-256 que cifra las llaves privadas de custodia. 32 bytes en
    /// base64. Nunca debe versionarse ni compartir valor con Jwt:ClaveSecreta:
    /// esa validación se hace al arrancar (ver ValidacionDeConfiguracion).
    /// </summary>
    [Required(ErrorMessage = "Falta configurar Seguridad:ClaveMaestraBase64.")]
    public string ClaveMaestraBase64 { get; set; } = string.Empty;
}
