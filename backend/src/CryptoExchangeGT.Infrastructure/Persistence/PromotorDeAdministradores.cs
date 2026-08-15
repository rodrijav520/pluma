using CryptoExchangeGT.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Infrastructure.Persistence;

/// <summary>
/// Promueve a administrador a los usuarios listados en la configuración.
///
/// Resuelve el problema del primer administrador: el endpoint de depósito exige
/// rol de administrador, pero el registro siempre crea clientes y no hay ningún
/// endpoint que otorgue el rol — a propósito, porque un usuario capaz de
/// dárselo a sí mismo podría después acreditarse saldo.
///
/// Los emails se configuran con Administracion:EmailsAdministradores, que en
/// producción debería venir de variable de entorno. El usuario tiene que
/// registrarse normalmente primero; acá solo se le cambia el rol.
/// </summary>
public static class PromotorDeAdministradores
{
    public const string SeccionConfiguracion = "Administracion:EmailsAdministradores";

    public static async Task PromoverAsync(
        AppDbContext contexto, IConfiguration configuration, ILogger logger,
        CancellationToken ct = default)
    {
        var emails = configuration.GetSection(SeccionConfiguracion).Get<string[]>() ?? [];

        if (emails.Length == 0)
            return;

        var normalizados = emails
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        var usuarios = await contexto.Usuarios
            .Where(u => normalizados.Contains(u.Email))
            .ToListAsync(ct);

        var promovidos = 0;

        foreach (var usuario in usuarios.Where(u => !u.EsAdministrador))
        {
            usuario.AsignarRol(RolUsuario.Administrador);
            promovidos++;

            logger.LogWarning("El usuario {Email} fue promovido a administrador por configuración.",
                usuario.Email);
        }

        if (promovidos > 0)
            await contexto.SaveChangesAsync(ct);

        // Un email configurado que no corresponde a ningún usuario suele ser un
        // error de tipeo, y el administrador esperado nunca aparece.
        var faltantes = normalizados.Except(usuarios.Select(u => u.Email)).ToList();

        if (faltantes.Count > 0)
            logger.LogWarning(
                "Estos emails están configurados como administradores pero no tienen usuario " +
                "registrado: {Emails}. Deben registrarse primero.",
                string.Join(", ", faltantes));
    }
}
