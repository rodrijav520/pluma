using System.Text;
using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Application.Seguridad;

/// <summary>
/// Reglas mínimas de contraseña. Antes no existía ninguna: se aceptaba una
/// contraseña vacía en el registro y el login la daba por válida.
/// </summary>
public static class PoliticaDeContrasenia
{
    public const int LargoMinimo = 10;

    /// <summary>
    /// BCrypt trunca en silencio a 72 bytes. Aceptar más largo haría que dos
    /// contraseñas distintas con el mismo prefijo de 72 bytes fueran
    /// equivalentes, sin que el usuario lo sepa.
    /// </summary>
    public const int LargoMaximoBytes = 72;

    /// <summary>
    /// Las 20 contraseñas más filtradas en brechas públicas. No pretende ser una
    /// lista exhaustiva: para producción conviene enchufar un servicio como
    /// Have I Been Pwned.
    /// </summary>
    private static readonly HashSet<string> Prohibidas = new(StringComparer.OrdinalIgnoreCase)
    {
        "123456", "123456789", "12345678", "password", "qwerty", "abc123",
        "111111", "1234567", "iloveyou", "000000", "1234567890", "admin",
        "contrasena", "contraseña", "qwerty123", "1q2w3e4r", "123123",
        "password1", "guatemala", "администратор"
    };

    public static void Validar(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ReglaDeNegocioException("La contraseña es obligatoria.");

        if (password.Length < LargoMinimo)
            throw new ReglaDeNegocioException(
                $"La contraseña debe tener al menos {LargoMinimo} caracteres.");

        if (Encoding.UTF8.GetByteCount(password) > LargoMaximoBytes)
            throw new ReglaDeNegocioException(
                $"La contraseña no puede superar los {LargoMaximoBytes} bytes.");

        var tieneLetra = password.Any(char.IsLetter);
        var tieneDigito = password.Any(char.IsDigit);

        if (!tieneLetra || !tieneDigito)
            throw new ReglaDeNegocioException(
                "La contraseña debe combinar al menos una letra y un número.");

        if (Prohibidas.Contains(password.Trim()))
            throw new ReglaDeNegocioException(
                "Esa contraseña aparece en listas públicas de contraseñas filtradas. Elegí otra.");
    }
}
