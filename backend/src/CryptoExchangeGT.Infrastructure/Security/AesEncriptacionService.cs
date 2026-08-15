using System.Security.Cryptography;
using System.Text;
using CryptoExchangeGT.Application.Interfaces;

namespace CryptoExchangeGT.Infrastructure.Security;

/// <summary>
/// Cifrado de llaves privadas de custodia con AES-256-GCM.
///
/// La versión anterior usaba AES-256-CBC sin autenticación. El esquema estaba
/// bien implementado (IV aleatorio por cifrado, guardado junto al texto), pero
/// CBC sin MAC es maleable: alguien con acceso de escritura a la base puede
/// alterar el texto cifrado y el descifrado devuelve datos distintos sin que
/// nada lo detecte. GCM agrega un tag de autenticación, así que cualquier
/// modificación hace fallar el descifrado de forma explícita.
///
/// Formato nuevo:  [0x02][nonce 12B][texto cifrado][tag 16B]
/// Formato previo: [IV 16B][texto cifrado]   (CBC, se sigue leyendo)
///
/// Los blobs viejos se siguen descifrando para permitir la migración. Al rotar
/// la clave maestra, re-cifrar cada llave la deja automáticamente en GCM.
/// </summary>
public class AesEncriptacionService : IEncriptacionService
{
    private readonly byte[] _claveMaestra;

    private const byte VersionGcm = 0x02;
    private const int LargoNonce = 12;  // 96 bits, el tamaño recomendado para GCM
    private const int LargoTag = 16;    // 128 bits
    private const int LargoIvCbc = 16;

    public AesEncriptacionService(string claveMaestraBase64)
    {
        if (string.IsNullOrWhiteSpace(claveMaestraBase64))
            throw new ArgumentException("La clave maestra es obligatoria.", nameof(claveMaestraBase64));

        try
        {
            _claveMaestra = Convert.FromBase64String(claveMaestraBase64);
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("La clave maestra debe estar en base64 válido.",
                nameof(claveMaestraBase64), ex);
        }

        if (_claveMaestra.Length != 32)
            throw new ArgumentException(
                $"La clave maestra debe ser de 32 bytes (AES-256); se recibieron {_claveMaestra.Length}.",
                nameof(claveMaestraBase64));
    }

    public string Cifrar(string textoPlano)
    {
        ArgumentNullException.ThrowIfNull(textoPlano);

        var bytesPlano = Encoding.UTF8.GetBytes(textoPlano);
        var nonce = RandomNumberGenerator.GetBytes(LargoNonce);
        var cifrado = new byte[bytesPlano.Length];
        var tag = new byte[LargoTag];

        using (var aes = new AesGcm(_claveMaestra, LargoTag))
        {
            aes.Encrypt(nonce, bytesPlano, cifrado, tag);
        }

        // [versión][nonce][cifrado][tag]
        var resultado = new byte[1 + LargoNonce + cifrado.Length + LargoTag];
        resultado[0] = VersionGcm;
        Buffer.BlockCopy(nonce, 0, resultado, 1, LargoNonce);
        Buffer.BlockCopy(cifrado, 0, resultado, 1 + LargoNonce, cifrado.Length);
        Buffer.BlockCopy(tag, 0, resultado, 1 + LargoNonce + cifrado.Length, LargoTag);

        CryptographicOperations.ZeroMemory(bytesPlano);

        return Convert.ToBase64String(resultado);
    }

    public string Descifrar(string textoCifrado)
    {
        if (string.IsNullOrWhiteSpace(textoCifrado))
            throw new ArgumentException("El texto cifrado es obligatorio.", nameof(textoCifrado));

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(textoCifrado);
        }
        catch (FormatException ex)
        {
            throw new CryptographicException("El texto cifrado no está en base64 válido.", ex);
        }

        // Se intenta GCM primero. Si el tag no valida, AesGcm lanza y se cae al
        // formato anterior: un fallo de autenticación no puede dar falso
        // positivo, así que la detección es fiable.
        if (bytes.Length >= 1 + LargoNonce + LargoTag && bytes[0] == VersionGcm)
        {
            try
            {
                return DescifrarGcm(bytes);
            }
            catch (CryptographicException)
            {
                // Podría ser un blob CBC cuyo IV empieza casualmente en 0x02.
            }
        }

        return DescifrarCbcLegado(bytes);
    }

    private string DescifrarGcm(byte[] bytes)
    {
        var largoCifrado = bytes.Length - 1 - LargoNonce - LargoTag;

        var nonce = new byte[LargoNonce];
        var cifrado = new byte[largoCifrado];
        var tag = new byte[LargoTag];

        Buffer.BlockCopy(bytes, 1, nonce, 0, LargoNonce);
        Buffer.BlockCopy(bytes, 1 + LargoNonce, cifrado, 0, largoCifrado);
        Buffer.BlockCopy(bytes, 1 + LargoNonce + largoCifrado, tag, 0, LargoTag);

        var plano = new byte[largoCifrado];

        using (var aes = new AesGcm(_claveMaestra, LargoTag))
        {
            aes.Decrypt(nonce, cifrado, tag, plano);
        }

        var resultado = Encoding.UTF8.GetString(plano);
        CryptographicOperations.ZeroMemory(plano);

        return resultado;
    }

    /// <summary>
    /// Descifra el formato anterior (AES-CBC con IV al frente). Se mantiene solo
    /// para poder leer y re-cifrar las llaves guardadas antes de la migración.
    /// </summary>
    private string DescifrarCbcLegado(byte[] bytes)
    {
        if (bytes.Length <= LargoIvCbc)
            throw new CryptographicException("El texto cifrado está incompleto o corrupto.");

        var iv = new byte[LargoIvCbc];
        var cifrado = new byte[bytes.Length - LargoIvCbc];

        Buffer.BlockCopy(bytes, 0, iv, 0, LargoIvCbc);
        Buffer.BlockCopy(bytes, LargoIvCbc, cifrado, 0, cifrado.Length);

        using var aes = Aes.Create();
        aes.Key = _claveMaestra;
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor();
        var plano = decryptor.TransformFinalBlock(cifrado, 0, cifrado.Length);

        var resultado = Encoding.UTF8.GetString(plano);
        CryptographicOperations.ZeroMemory(plano);

        return resultado;
    }
}
