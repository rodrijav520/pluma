using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CryptoExchangeGT.Infrastructure.Configuration;

/// <summary>
/// Comprobaciones de seguridad que no se pueden expresar con data annotations
/// porque cruzan varias secciones de configuración.
///
/// Todas nacen de lo encontrado en la revisión: la clave maestra AES y la clave
/// de firma JWT eran el mismo valor, y estaban publicadas en el repositorio.
/// </summary>
public static class ValidacionDeConfiguracion
{
    /// <summary>
    /// Valores que estuvieron versionados en el repositorio público original.
    /// Se guarda el hash, no el valor: publicar de nuevo la clave filtrada para
    /// poder detectarla sería repetir el error que se está previniendo.
    /// </summary>
    private static readonly string[] HashesDeClavesFiltradas =
    [
        // SHA-256 de la clave que servía a la vez de clave maestra AES y de
        // clave de firma JWT en el repositorio original.
        "0fc0c6d692a2ba30eea71e5f8f54c9044bbcb3c8259cda375751956da64c7cc1"
    ];

    public static void ValidarAlArrancar(IServiceProvider servicios, IConfiguration configuration)
    {
        var logger = servicios.GetRequiredService<ILoggerFactory>()
                              .CreateLogger("ValidacionDeConfiguracion");

        var seguridad = servicios.GetRequiredService<IOptions<SeguridadOptions>>().Value;
        var jwt = servicios.GetRequiredService<IOptions<JwtOptions>>().Value;

        ValidarClaveMaestra(seguridad.ClaveMaestraBase64);
        ValidarClavesDistintas(seguridad.ClaveMaestraBase64, jwt.ClaveSecreta);
        ValidarClavesNoFiltradas(seguridad.ClaveMaestraBase64, jwt.ClaveSecreta);
        AdvertirSiHaySecretosEnArchivo(configuration, logger);
    }

    private static void ValidarClaveMaestra(string claveBase64)
    {
        byte[] clave;
        try
        {
            clave = Convert.FromBase64String(claveBase64);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Seguridad:ClaveMaestraBase64 no es base64 válido. " +
                "Generá una con: openssl rand -base64 32", ex);
        }

        if (clave.Length != 32)
            throw new InvalidOperationException(
                $"Seguridad:ClaveMaestraBase64 debe decodificar a 32 bytes (AES-256); " +
                $"decodifica a {clave.Length}. Generá una con: openssl rand -base64 32");
    }

    /// <summary>
    /// La clave que cifra las llaves privadas y la que firma los tokens deben
    /// ser distintas. Reutilizar una sola significa que filtrar cualquiera de
    /// las dos compromete ambas cosas a la vez, y en el repositorio original era
    /// literalmente el mismo string.
    /// </summary>
    private static void ValidarClavesDistintas(string claveMaestra, string claveJwt)
    {
        if (string.Equals(claveMaestra, claveJwt, StringComparison.Ordinal))
            throw new InvalidOperationException(
                "Seguridad:ClaveMaestraBase64 y Jwt:ClaveSecreta no pueden tener el mismo valor. " +
                "Una cifra las llaves privadas de custodia y la otra firma los tokens de sesión: " +
                "compartir el valor hace que filtrar una comprometa ambas. " +
                "Generá dos distintas con: openssl rand -base64 32");
    }

    private static void ValidarClavesNoFiltradas(params string[] claves)
    {
        foreach (var clave in claves)
        {
            if (string.IsNullOrEmpty(clave))
                continue;

            var hash = Convert.ToHexString(
                SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(clave))).ToLowerInvariant();

            if (HashesDeClavesFiltradas.Contains(hash))
                throw new InvalidOperationException(
                    "La clave configurada es una de las que estuvo publicada en el repositorio " +
                    "original y debe considerarse comprometida. Generá una nueva con: " +
                    "openssl rand -base64 32");
        }
    }

    /// <summary>
    /// Avisa si algún secreto está viniendo de un appsettings.json en disco en
    /// vez de user-secrets o variables de entorno. No rompe el arranque —hay
    /// entornos de prueba donde es aceptable— pero deja constancia en el log.
    /// </summary>
    private static void AdvertirSiHaySecretosEnArchivo(IConfiguration configuration, ILogger logger)
    {
        string[] clavesSensibles =
        [
            "Seguridad:ClaveMaestraBase64",
            "Jwt:ClaveSecreta",
            "Tesoreria:LlavePrivadaCifrada"
        ];

        if (configuration is not IConfigurationRoot raiz)
            return;

        foreach (var clave in clavesSensibles)
        {
            var proveedor = raiz.Providers.LastOrDefault(p => p.TryGet(clave, out _));

            if (proveedor is Microsoft.Extensions.Configuration.Json.JsonConfigurationProvider json &&
                json.Source.Path?.Contains("appsettings", StringComparison.OrdinalIgnoreCase) == true)
            {
                logger.LogWarning(
                    "{Clave} está definida en {Archivo}. Ese archivo suele versionarse: movela a " +
                    "user-secrets (desarrollo) o a variables de entorno (producción).",
                    clave, json.Source.Path);
            }
        }
    }
}
