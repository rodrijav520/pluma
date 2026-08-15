namespace CryptoExchangeGT.Application.DTOs;

public class DepositarGtqResponse
{
    public Guid TransaccionId { get; set; }
    public Guid UsuarioDestinoId { get; set; }
    public decimal MontoAcreditado { get; set; }
    public decimal SaldoResultante { get; set; }
}
