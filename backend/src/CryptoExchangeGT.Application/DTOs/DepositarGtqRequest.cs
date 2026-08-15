using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Application.DTOs;

/// <summary>
/// Acreditación manual de quetzales, restringida a administradores.
///
/// Antes cualquier usuario autenticado podía llamar a este endpoint sobre su
/// propia cuenta y acreditarse el monto que quisiera, sin pago de por medio.
/// Ahora exige rol de administrador, indica sobre qué usuario se acredita, y
/// requiere la referencia del pago externo que lo respalda.
/// </summary>
public class DepositarGtqRequest
{
    [Required(ErrorMessage = "Debe indicar el usuario destino del depósito.")]
    public Guid UsuarioDestinoId { get; set; }

    [Range(0.01, 1_000_000, ErrorMessage = "El monto debe estar entre Q0.01 y Q1,000,000.")]
    public decimal Monto { get; set; }

    [Required(ErrorMessage = "La referencia externa del pago es obligatoria.")]
    [StringLength(100, MinimumLength = 4,
        ErrorMessage = "La referencia debe tener entre 4 y 100 caracteres.")]
    public string ReferenciaExterna { get; set; } = string.Empty;
}
