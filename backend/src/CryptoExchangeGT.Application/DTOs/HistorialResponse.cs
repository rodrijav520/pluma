namespace CryptoExchangeGT.Application.DTOs;

/// <summary>
/// El historial ya no devuelve entidades de dominio directamente: eso filtraba
/// la forma interna de Transaccion a los clientes de la API.
/// </summary>
public class TransaccionResponse
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public decimal MontoCripto { get; set; }
    public decimal MontoGTQ { get; set; }
    public decimal TasaCambioUsada { get; set; }
    public string? DireccionDestino { get; set; }
    public string? HashBlockchain { get; set; }
    public string? MotivoFallo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaConfirmacion { get; set; }
}

public class HistorialResponse
{
    public IReadOnlyList<TransaccionResponse> Transacciones { get; set; } = [];
    public int Pagina { get; set; }
    public int TamanioPagina { get; set; }
    public int TotalRegistros { get; set; }
    public int TotalPaginas { get; set; }
}
