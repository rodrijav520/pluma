using CryptoExchangeGT.Application.Interfaces;

namespace CryptoExchangeGT.Infrastructure.Security;

public class BCryptPasswordHasher : IPasswordHasher
{
    /// <summary>
    /// Factor de trabajo. Cada incremento duplica el costo de calcular el hash,
    /// y por lo tanto el de un ataque de fuerza bruta. 12 es el valor razonable
    /// hoy en hardware de servidor (~250 ms por verificación). Antes se usaba el
    /// default de la librería, que es 11.
    /// </summary>
    private const int FactorDeTrabajo = 12;

    public string Hashear(string passwordPlano)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordPlano);
        return BCrypt.Net.BCrypt.HashPassword(passwordPlano, FactorDeTrabajo);
    }

    public bool Verificar(string passwordPlano, string hashGuardado)
    {
        if (string.IsNullOrEmpty(passwordPlano) || string.IsNullOrEmpty(hashGuardado))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(passwordPlano, hashGuardado);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Hash corrupto o con formato desconocido. Devolver false en vez de
            // propagar evita que un registro dañado tumbe el endpoint de login.
            return false;
        }
    }
}
