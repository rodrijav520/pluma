namespace CryptoExchangeGT.Domain.Enums;

public enum RolUsuario
{
    /// <summary>Usuario final: opera únicamente sobre sus propios fondos.</summary>
    Cliente = 0,

    /// <summary>
    /// Operador de la plataforma. Único rol autorizado a acreditar saldo GTQ
    /// manualmente (ver DepositarGtqUseCase).
    /// </summary>
    Administrador = 1
}
