namespace CryptoExchangeGT.Domain.Enums;

/// <summary>
/// Ciclo de vida de una transacción. Los valores son explícitos porque se
/// persisten como enteros: cambiar el orden reinterpretaría filas existentes.
/// </summary>
public enum EstadoTransaccion
{
    /// <summary>Registrada en la base, todavía no transmitida a la blockchain.</summary>
    Pendiente = 0,

    /// <summary>Transmitida y con hash asignado, esperando confirmación on-chain.</summary>
    Confirmando = 1,

    /// <summary>Confirmada en la blockchain con recibo exitoso (Status = 1).</summary>
    Completada = 2,

    /// <summary>No se pudo transmitir, o el recibo revirtió (Status = 0).</summary>
    Fallida = 3
}
