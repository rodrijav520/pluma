using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Infrastructure.Configuration;

/// <summary>Parámetros del worker que confirma transacciones on-chain.</summary>
public class ConfirmacionOptions
{
    public const string Seccion = "Confirmacion";

    public bool Habilitado { get; set; } = true;

    [Range(5, 3600, ErrorMessage = "Confirmacion:IntervaloSegundos debe estar entre 5 y 3600.")]
    public int IntervaloSegundos { get; set; } = 30;

    [Range(1, 500, ErrorMessage = "Confirmacion:TamanioLote debe estar entre 1 y 500.")]
    public int TamanioLote { get; set; } = 50;
}
