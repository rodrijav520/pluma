using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Application.DTOs;

public class ComprarCriptoRequest
{
    [Range(1, 1_000_000, ErrorMessage = "El monto debe estar entre Q1 y Q1,000,000.")]
    public decimal MontoGTQ { get; set; }
}
