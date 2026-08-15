namespace CryptoExchangeGT.Application.Interfaces;

public interface IEncriptacionService
{
    string Cifrar(string textoPlano);
    string Descifrar(string textoCifrado);
}