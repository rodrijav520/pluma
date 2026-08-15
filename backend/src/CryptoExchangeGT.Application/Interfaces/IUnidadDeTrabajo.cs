namespace CryptoExchangeGT.Application.Interfaces;

/// <summary>
/// Agrupa varios cambios en una sola escritura atómica.
///
/// Antes cada repositorio llamaba a SaveChangesAsync() por su cuenta, así que
/// un caso de uso que tocaba usuario + transacción + wallet hacía tres
/// escrituras independientes: si la segunda fallaba, la primera ya estaba
/// aplicada y no había forma de revertirla.
/// </summary>
public interface IUnidadDeTrabajo
{
    Task GuardarCambiosAsync(CancellationToken ct = default);

    /// <summary>
    /// Abre una transacción de base de datos explícita. No debe mantenerse
    /// abierta mientras se espera a la blockchain: esas llamadas tardan
    /// decenas de segundos y bloquearían la base. Para ese caso se usa el
    /// patrón de compensación (ver ComprarCriptoUseCase).
    /// </summary>
    Task<ITransaccionBd> IniciarTransaccionAsync(CancellationToken ct = default);
}

public interface ITransaccionBd : IAsyncDisposable
{
    Task ConfirmarAsync(CancellationToken ct = default);
    Task RevertirAsync(CancellationToken ct = default);
}
