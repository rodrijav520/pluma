using System.Security.Cryptography;
using CryptoExchangeGT.Infrastructure.Security;

namespace CryptoExchangeGT.Tests.Seguridad;

public class AesEncriptacionServiceTests
{
    private static string ClaveNueva() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    [Fact]
    public void Cifrar_y_descifrar_devuelve_el_texto_original()
    {
        var servicio = new AesEncriptacionService(ClaveNueva());
        const string llavePrivada = "0x4c0883a69102937d6231471b5dbb6204fe512961708279a1b0e1bb4e07f38d9f";

        var cifrado = servicio.Cifrar(llavePrivada);

        Assert.NotEqual(llavePrivada, cifrado);
        Assert.Equal(llavePrivada, servicio.Descifrar(cifrado));
    }

    [Fact]
    public void Cifrar_el_mismo_texto_dos_veces_da_resultados_distintos()
    {
        var servicio = new AesEncriptacionService(ClaveNueva());

        // Nonce aleatorio por operación: si dos cifrados del mismo valor dieran
        // el mismo resultado, se podría saber qué usuarios comparten una llave.
        Assert.NotEqual(servicio.Cifrar("mismo-texto"), servicio.Cifrar("mismo-texto"));
    }

    [Fact]
    public void Alterar_el_texto_cifrado_hace_fallar_el_descifrado()
    {
        var servicio = new AesEncriptacionService(ClaveNueva());
        var cifrado = servicio.Cifrar("0xllave-privada-secreta");

        // Se voltea un bit del texto cifrado. Con AES-CBC (el esquema anterior)
        // esto pasaba desapercibido: descifraba a basura sin avisar. Con GCM el
        // tag de autenticación lo detecta.
        var bytes = Convert.FromBase64String(cifrado);
        bytes[^3] ^= 0xFF;
        var alterado = Convert.ToBase64String(bytes);

        Assert.ThrowsAny<CryptographicException>(() => servicio.Descifrar(alterado));
    }

    [Fact]
    public void Una_clave_distinta_no_puede_descifrar()
    {
        var cifrado = new AesEncriptacionService(ClaveNueva()).Cifrar("secreto");
        var otroServicio = new AesEncriptacionService(ClaveNueva());

        Assert.ThrowsAny<CryptographicException>(() => otroServicio.Descifrar(cifrado));
    }

    [Fact]
    public void Puede_descifrar_el_formato_anterior_AES_CBC()
    {
        // Compatibilidad hacia atrás: las llaves cifradas antes de la migración
        // a GCM tienen que poder leerse para poder re-cifrarlas.
        var claveBytes = RandomNumberGenerator.GetBytes(32);
        var servicio = new AesEncriptacionService(Convert.ToBase64String(claveBytes));
        const string original = "0xllave-en-formato-viejo";

        var cifradoLegado = CifrarConCbcLegado(claveBytes, original);

        Assert.Equal(original, servicio.Descifrar(cifradoLegado));
    }

    [Theory]
    [InlineData("clave-corta")]
    [InlineData("")]
    public void Rechaza_claves_maestras_invalidas(string clave)
    {
        Assert.Throws<ArgumentException>(() => new AesEncriptacionService(clave));
    }

    [Fact]
    public void Rechaza_claves_maestras_que_no_sean_de_32_bytes()
    {
        var clave16Bytes = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

        var ex = Assert.Throws<ArgumentException>(() => new AesEncriptacionService(clave16Bytes));
        Assert.Contains("32 bytes", ex.Message);
    }

    /// <summary>Reproduce el formato del servicio original: [IV 16B][texto cifrado].</summary>
    private static string CifrarConCbcLegado(byte[] clave, string textoPlano)
    {
        using var aes = Aes.Create();
        aes.Key = clave;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plano = System.Text.Encoding.UTF8.GetBytes(textoPlano);
        var cifrado = encryptor.TransformFinalBlock(plano, 0, plano.Length);

        var resultado = new byte[aes.IV.Length + cifrado.Length];
        Buffer.BlockCopy(aes.IV, 0, resultado, 0, aes.IV.Length);
        Buffer.BlockCopy(cifrado, 0, resultado, aes.IV.Length, cifrado.Length);

        return Convert.ToBase64String(resultado);
    }
}
