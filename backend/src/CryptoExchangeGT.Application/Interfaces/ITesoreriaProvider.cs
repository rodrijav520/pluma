namespace CryptoExchangeGT.Application.Interfaces;

public interface ITesoreriaProvider
{
    string ObtenerDireccionPublica();

    /// <summary>
    /// Devuelve la llave privada de tesorería ya descifrada, lista para firmar.
    /// El descifrado se concentra aquí para que ningún caso de uso tenga que
    /// conocer el servicio de encriptación ni manipular la llave cifrada.
    /// </summary>
    string ObtenerLlavePrivadaDescifrada();
}
