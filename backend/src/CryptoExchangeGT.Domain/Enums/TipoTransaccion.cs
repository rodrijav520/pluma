namespace CryptoExchangeGT.Domain.Enums;

public enum TipoTransaccion
{
    Compra = 0,
    ConversionAGTQ = 1,
    EnvioExterno = 2,
    RecepcionExterna = 3,

    /// <summary>
    /// Acreditación de quetzales. Antes no se registraba como transacción, lo
    /// que dejaba los depósitos fuera de toda auditoría.
    /// </summary>
    DepositoGTQ = 4
}
