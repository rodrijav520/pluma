using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace CryptoExchangeGT.Infrastructure.ExternalServices;

/// <summary>
/// Acceso a las credenciales de la tesorería.
///
/// Antes exponía <c>ObtenerLlavePrivadaCifrada()</c> y cada caso de uso la
/// descifraba por su cuenta, lo que obligaba a inyectar el servicio de
/// encriptación en sitios que no tenían por qué conocerlo. Ahora el descifrado
/// vive únicamente acá.
/// </summary>
public class TesoreriaProvider : ITesoreriaProvider
{
    private readonly TesoreriaOptions _opciones;
    private readonly IEncriptacionService _encriptacionService;

    public TesoreriaProvider(IOptions<TesoreriaOptions> opciones, IEncriptacionService encriptacionService)
    {
        _opciones = opciones.Value;
        _encriptacionService = encriptacionService;
    }

    public string ObtenerDireccionPublica() => _opciones.DireccionPublica;

    public string ObtenerLlavePrivadaDescifrada() =>
        _encriptacionService.Descifrar(_opciones.LlavePrivadaCifrada);
}
