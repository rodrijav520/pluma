namespace CryptoExchangeGT.Domain.Interfaces;

/// <summary>
/// Estado de una transacción según la blockchain, no según nuestra base.
/// </summary>
public enum EstadoOnChain
{
    /// <summary>Todavía no hay recibo: sigue en el mempool o no se conoce.</summary>
    Pendiente,

    /// <summary>Recibo con Status = 1. La transacción se ejecutó.</summary>
    Exitosa,

    /// <summary>Recibo con Status = 0. La transacción revirtió y el gas se consumió.</summary>
    Revertida
}

public interface ICryptoWalletService
{
    (string direccionPublica, string llavePrivada) GenerarWallet();

    /// <summary>
    /// Valida que la dirección tenga formato EVM correcto y que no sea una
    /// dirección hacia la que enviar fondos signifique perderlos
    /// (dirección cero o el propio contrato del token).
    /// </summary>
    bool EsDireccionValida(string direccion);

    Task<decimal> ConsultarSaldoAsync(string direccionPublica, CancellationToken ct = default);

    /// <summary>
    /// Transfiere tokens ERC-20. Lanza TransaccionBlockchainFallidaException si
    /// el recibo revierte: antes se devolvía el hash sin mirar recibo.Status, y
    /// una transferencia revertida se contabilizaba como exitosa.
    /// </summary>
    Task<string> EnviarTransaccionAsync(string llavePrivadaOrigen, string direccionDestino,
                                        decimal monto, CancellationToken ct = default);

    Task<EstadoOnChain> ConsultarEstadoAsync(string hashTransaccion, CancellationToken ct = default);

    Task<string> EnviarEthNativoAsync(string llavePrivadaOrigen, string direccionDestino,
                                      decimal montoEth, CancellationToken ct = default);

    /// <summary>Saldo de ETH nativo, para vigilar los fondos de gas de la tesorería.</summary>
    Task<decimal> ConsultarSaldoEthAsync(string direccionPublica, CancellationToken ct = default);
}
