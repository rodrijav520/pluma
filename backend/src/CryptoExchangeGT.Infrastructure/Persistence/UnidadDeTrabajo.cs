using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace CryptoExchangeGT.Infrastructure.Persistence;

public class UnidadDeTrabajo : IUnidadDeTrabajo
{
    private readonly AppDbContext _context;

    public UnidadDeTrabajo(AppDbContext context)
    {
        _context = context;
    }

    public async Task GuardarCambiosAsync(CancellationToken ct = default)
    {
        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Otra operación modificó las mismas filas. Se traduce a una
            // excepción de dominio para que la API responda 409 y el cliente
            // sepa que puede reintentar sin riesgo de duplicar nada.
            throw new ConflictoDeConcurrenciaException(
                "La operación no se pudo completar porque otra transacción modificó los mismos " +
                "datos al mismo tiempo. Intentá de nuevo.", ex);
        }
    }

    public async Task<ITransaccionBd> IniciarTransaccionAsync(CancellationToken ct = default)
    {
        // Si ya hay una transacción abierta en este scope, se devuelve una
        // envoltura que no hace nada al confirmar: la transacción externa manda.
        // Evita el error "ya existe una transacción en curso" cuando un caso de
        // uso llama a otro.
        if (_context.Database.CurrentTransaction is not null)
            return new TransaccionAnidada();

        var tx = await _context.Database.BeginTransactionAsync(ct);
        return new TransaccionBd(tx);
    }

    private sealed class TransaccionBd : ITransaccionBd
    {
        private readonly IDbContextTransaction _tx;
        private bool _finalizada;

        public TransaccionBd(IDbContextTransaction tx) => _tx = tx;

        public async Task ConfirmarAsync(CancellationToken ct = default)
        {
            await _tx.CommitAsync(ct);
            _finalizada = true;
        }

        public async Task RevertirAsync(CancellationToken ct = default)
        {
            await _tx.RollbackAsync(ct);
            _finalizada = true;
        }

        /// <summary>
        /// Si el bloque `await using` termina sin haber confirmado — porque se
        /// lanzó una excepción — se revierte. Es lo que garantiza que nunca
        /// quede una escritura a medias.
        /// </summary>
        public async ValueTask DisposeAsync()
        {
            if (!_finalizada)
            {
                try
                {
                    await _tx.RollbackAsync();
                }
                catch
                {
                    // La conexión ya puede estar caída; el dispose de abajo limpia.
                }
            }

            await _tx.DisposeAsync();
        }
    }

    private sealed class TransaccionAnidada : ITransaccionBd
    {
        public Task ConfirmarAsync(CancellationToken ct = default) => Task.CompletedTask;
        public Task RevertirAsync(CancellationToken ct = default) => Task.CompletedTask;
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
