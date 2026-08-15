namespace CryptoExchangeGT.Application.DTOs;

/// <summary>
/// Antes no existía forma de consultar el saldo: había que pedir el historial
/// completo y sumar a mano.
/// </summary>
public class SaldoResponse
{
    public decimal SaldoGTQ { get; set; }
    public decimal SaldoCripto { get; set; }
    public string DireccionWallet { get; set; } = string.Empty;

    /// <summary>Valor del saldo cripto en quetzales a la tasa vigente.</summary>
    public decimal EquivalenteGTQ { get; set; }

    public decimal TasaCambio { get; set; }

    /// <summary>
    /// False si no se pudo leer el saldo on-chain. En ese caso SaldoCripto trae
    /// el último valor cacheado y la interfaz debería advertirlo, en vez de
    /// mostrar un número desactualizado como si fuera actual.
    /// </summary>
    public bool SaldoCriptoEnLinea { get; set; }
}
