using System.Security.Cryptography;
using CryptoExchangeGT.Infrastructure.Security;

// Utilidad de línea de comandos para preparar las credenciales del servidor.
//
// Sin esto no había forma de generar el valor de Tesoreria:LlavePrivadaCifrada:
// el README pedía "la llave privada cifrada con la clave maestra" pero no
// existía ninguna herramienta que la produjera, así que en la práctica había que
// escribir código a mano cada vez.
//
// Uso:
//   dotnet run --project tools/CryptoExchangeGT.Cifrador -- generar-clave
//   dotnet run --project tools/CryptoExchangeGT.Cifrador -- cifrar <claveMaestraBase64>
//   dotnet run --project tools/CryptoExchangeGT.Cifrador -- descifrar <claveMaestraBase64> <textoCifrado>
//
// El valor a cifrar se lee de la entrada estándar, no de los argumentos: los
// argumentos quedan registrados en el historial del shell y son visibles en la
// lista de procesos del sistema.

return args.FirstOrDefault() switch
{
    "generar-clave" => GenerarClave(),
    "cifrar" => Cifrar(args),
    "descifrar" => Descifrar(args),
    _ => MostrarAyuda()
};

static int GenerarClave()
{
    Console.WriteLine(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));
    return 0;
}

static int Cifrar(string[] args)
{
    if (args.Length < 2)
    {
        Console.Error.WriteLine("Falta la clave maestra en base64.");
        return 1;
    }

    Console.Error.WriteLine("Pegá el valor a cifrar (la llave privada) y presioná Enter:");
    var valor = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(valor))
    {
        Console.Error.WriteLine("No se recibió ningún valor.");
        return 1;
    }

    try
    {
        var servicio = new AesEncriptacionService(args[1]);
        Console.WriteLine(servicio.Cifrar(valor.Trim()));
        return 0;
    }
    catch (ArgumentException ex)
    {
        Console.Error.WriteLine($"Clave maestra inválida: {ex.Message}");
        return 1;
    }
}

static int Descifrar(string[] args)
{
    if (args.Length < 3)
    {
        Console.Error.WriteLine("Uso: descifrar <claveMaestraBase64> <textoCifrado>");
        return 1;
    }

    try
    {
        var servicio = new AesEncriptacionService(args[1]);
        Console.WriteLine(servicio.Descifrar(args[2]));
        return 0;
    }
    catch (CryptographicException)
    {
        Console.Error.WriteLine(
            "No se pudo descifrar: la clave maestra no corresponde, o el texto fue alterado.");
        return 1;
    }
    catch (ArgumentException ex)
    {
        Console.Error.WriteLine($"Entrada inválida: {ex.Message}");
        return 1;
    }
}

static int MostrarAyuda()
{
    Console.WriteLine("""
        Utilidad de credenciales de CryptoExchangeGT.

          generar-clave
              Genera una clave AES-256 en base64, lista para
              Seguridad:ClaveMaestraBase64 o Jwt:ClaveSecreta.
              Tienen que ser dos claves DISTINTAS: la app no arranca si coinciden.

          cifrar <claveMaestraBase64>
              Cifra un valor leído de la entrada estándar. Se usa para producir
              Tesoreria:LlavePrivadaCifrada a partir de la llave privada.

          descifrar <claveMaestraBase64> <textoCifrado>
              Verifica que un valor cifrado se pueda recuperar.

        Ejemplo de configuración desde cero:

          MAESTRA=$(dotnet run --project tools/CryptoExchangeGT.Cifrador -- generar-clave)
          JWT=$(dotnet run --project tools/CryptoExchangeGT.Cifrador -- generar-clave)
          dotnet run --project tools/CryptoExchangeGT.Cifrador -- cifrar "$MAESTRA"
        """);

    return 0;
}
