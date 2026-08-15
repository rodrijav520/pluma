using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Application.DTOs;

public class RegistroRequest
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [StringLength(200, MinimumLength = 3,
        ErrorMessage = "El nombre debe tener entre 3 y 200 caracteres.")]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    [StringLength(200, ErrorMessage = "El email no puede superar los 200 caracteres.")]
    public string Email { get; set; } = string.Empty;

    // Antes no había ninguna regla: se aceptaba password vacío y se podía
    // iniciar sesión con él. El máximo de 72 no es arbitrario: BCrypt trunca
    // silenciosamente a 72 bytes, así que aceptar más da falsa sensación de
    // seguridad. La complejidad se valida además en PoliticaDeContrasenia.
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 10,
        ErrorMessage = "La contraseña debe tener entre 10 y 72 caracteres.")]
    public string Password { get; set; } = string.Empty;
}
