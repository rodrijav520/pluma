using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Domain.Entities;

public class Usuario
{
    public Guid Id { get; private set; }
    public string NombreCompleto { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public decimal SaldoGTQ { get; private set; }
    public RolUsuario Rol { get; private set; }
    public DateTime FechaRegistro { get; private set; }

    /// <summary>
    /// Token de concurrencia optimista. EF lo incluye en el WHERE de cada UPDATE,
    /// así que si otra operación modificó el saldo entre la lectura y la escritura,
    /// el UPDATE afecta 0 filas y EF lanza DbUpdateConcurrencyException.
    /// Sin esto, dos compras simultáneas podían gastar el mismo saldo dos veces.
    /// </summary>
    public Guid Version { get; private set; }

    private Usuario() { }

    public static Usuario Crear(string nombreCompleto, string email, string passwordHash,
                                RolUsuario rol = RolUsuario.Cliente)
    {
        if (string.IsNullOrWhiteSpace(nombreCompleto))
            throw new ReglaDeNegocioException("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ReglaDeNegocioException("El hash de la contraseña es obligatorio.");

        var emailNormalizado = NormalizarEmail(email);

        return new Usuario
        {
            Id = Guid.NewGuid(),
            NombreCompleto = nombreCompleto.Trim(),
            Email = emailNormalizado,
            PasswordHash = passwordHash,
            SaldoGTQ = 0m,
            Rol = rol,
            FechaRegistro = DateTime.UtcNow,
            Version = Guid.NewGuid()
        };
    }

    /// <summary>
    /// Normaliza el email a minúsculas con la cultura invariante. Antes la
    /// entidad usaba ToLowerInvariant() y el repositorio ToLower(), que depende
    /// de la cultura del servidor: en configuración regional turca la "I" no
    /// baja a "i" y el login fallaba silenciosamente.
    /// </summary>
    public static string NormalizarEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ReglaDeNegocioException("El email es obligatorio.");

        var limpio = email.Trim();

        // Validación mínima: exactamente una arroba, con algo a cada lado y un
        // punto en el dominio. La validación de formato completa vive en el DTO.
        var partes = limpio.Split('@');
        if (partes.Length != 2 || partes[0].Length == 0 || !partes[1].Contains('.'))
            throw new ReglaDeNegocioException("Email inválido.");

        return limpio.ToLowerInvariant();
    }

    public void AcreditarGTQ(decimal monto)
    {
        if (monto <= 0)
            throw new ReglaDeNegocioException("El monto a acreditar debe ser positivo.");

        SaldoGTQ = decimal.Round(SaldoGTQ + monto, 2, MidpointRounding.ToZero);
        Version = Guid.NewGuid();
    }

    public void DebitarGTQ(decimal monto)
    {
        if (monto <= 0)
            throw new ReglaDeNegocioException("El monto a debitar debe ser positivo.");

        if (SaldoGTQ < monto)
            throw new SaldoInsuficienteException("Saldo insuficiente en GTQ.");

        SaldoGTQ = decimal.Round(SaldoGTQ - monto, 2, MidpointRounding.ToZero);
        Version = Guid.NewGuid();
    }

    public bool EsAdministrador => Rol == RolUsuario.Administrador;

    /// <summary>
    /// Cambia el rol. Solo lo usa el proceso de arranque que promueve a los
    /// administradores configurados: no hay endpoint que exponga esto, porque un
    /// usuario capaz de darse a sí mismo el rol de administrador podría después
    /// acreditarse saldo.
    /// </summary>
    public void AsignarRol(RolUsuario rol)
    {
        if (Rol == rol)
            return;

        Rol = rol;
        Version = Guid.NewGuid();
    }
}
