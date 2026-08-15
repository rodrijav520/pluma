using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Infrastructure.Persistence;
using CryptoExchangeGT.Tests.Infraestructura;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Tests.Persistencia;

/// <summary>
/// Cobertura del hallazgo #6: no había bloqueo optimista sobre el saldo, así que
/// dos operaciones simultáneas leían el mismo valor, ambas pasaban la validación
/// y la segunda escritura pisaba a la primera. El usuario gastaba dos veces el
/// mismo dinero.
/// </summary>
public class ConcurrenciaTests : IDisposable
{
    private readonly BaseDeDatosDePrueba _bd = new();

    private Guid SembrarUsuarioConSaldo(decimal saldo)
    {
        using var contexto = _bd.CrearContexto();
        var usuario = Usuario.Crear("Ana", "ana@demo.gt", "hash");

        if (saldo > 0)
            usuario.AcreditarGTQ(saldo);

        contexto.Usuarios.Add(usuario);
        contexto.SaveChanges();

        return usuario.Id;
    }

    [Fact]
    public async Task Dos_debitos_simultaneos_del_mismo_saldo_no_pueden_ambos_tener_exito()
    {
        var usuarioId = SembrarUsuarioConSaldo(100m);

        // Dos contextos distintos = dos requests simultáneos contra la misma fila.
        using var contextoA = _bd.CrearContexto();
        using var contextoB = _bd.CrearContexto();

        var usuarioA = await contextoA.Usuarios.SingleAsync(u => u.Id == usuarioId);
        var usuarioB = await contextoB.Usuarios.SingleAsync(u => u.Id == usuarioId);

        // Ambos leyeron Q100 y ambos creen tener saldo suficiente.
        usuarioA.DebitarGTQ(100m);
        usuarioB.DebitarGTQ(100m);

        await new UnidadDeTrabajo(contextoA).GuardarCambiosAsync();

        // El segundo tiene que fallar: su token de concurrencia ya no coincide.
        await Assert.ThrowsAsync<ConflictoDeConcurrenciaException>(
            () => new UnidadDeTrabajo(contextoB).GuardarCambiosAsync());

        using var verificacion = _bd.CrearContexto();
        var final = await verificacion.Usuarios.SingleAsync(u => u.Id == usuarioId);

        // Sin el token de concurrencia, acá el saldo también daría 0 pero se
        // habrían entregado Q200 en cripto por Q100 de saldo.
        Assert.Equal(0m, final.SaldoGTQ);
    }

    [Fact]
    public async Task Un_conflicto_de_concurrencia_se_traduce_a_excepcion_de_dominio()
    {
        var usuarioId = SembrarUsuarioConSaldo(500m);

        using var contextoA = _bd.CrearContexto();
        using var contextoB = _bd.CrearContexto();

        var usuarioA = await contextoA.Usuarios.SingleAsync(u => u.Id == usuarioId);
        var usuarioB = await contextoB.Usuarios.SingleAsync(u => u.Id == usuarioId);

        usuarioA.AcreditarGTQ(10m);
        await new UnidadDeTrabajo(contextoA).GuardarCambiosAsync();

        usuarioB.AcreditarGTQ(20m);

        // La API lo traduce a HTTP 409, que le dice al cliente que puede
        // reintentar sin riesgo de duplicar la operación.
        var ex = await Assert.ThrowsAsync<ConflictoDeConcurrenciaException>(
            () => new UnidadDeTrabajo(contextoB).GuardarCambiosAsync());

        Assert.Contains("Intentá de nuevo", ex.Message);
    }

    [Fact]
    public async Task La_referencia_externa_es_unica_a_nivel_de_base_de_datos()
    {
        var usuarioId = SembrarUsuarioConSaldo(0m);

        using var contexto = _bd.CrearContexto();
        contexto.Transacciones.Add(Transaccion.CrearDepositoGtq(usuarioId, 100m, "REF-UNICA"));
        await contexto.SaveChangesAsync();

        // Segunda inserción con la misma referencia: incluso si la verificación
        // de aplicación fallara por una carrera, la base lo impide.
        using var otroContexto = _bd.CrearContexto();
        otroContexto.Transacciones.Add(Transaccion.CrearDepositoGtq(usuarioId, 100m, "REF-UNICA"));

        await Assert.ThrowsAsync<DbUpdateException>(() => otroContexto.SaveChangesAsync());
    }

    [Fact]
    public async Task Varias_transacciones_sin_referencia_externa_conviven_sin_problema()
    {
        var usuarioId = SembrarUsuarioConSaldo(0m);

        using var contexto = _bd.CrearContexto();

        // El índice único está filtrado por IS NOT NULL: si no lo estuviera,
        // solo podría existir una transacción sin referencia en toda la base.
        contexto.Transacciones.AddRange(
            Transaccion.CrearCompra(usuarioId, 1m, 7.75m, 7.75m),
            Transaccion.CrearCompra(usuarioId, 2m, 15.50m, 7.75m),
            Transaccion.CrearCompra(usuarioId, 3m, 23.25m, 7.75m));

        await contexto.SaveChangesAsync();

        Assert.Equal(3, await contexto.Transacciones.CountAsync());
    }

    public void Dispose() => _bd.Dispose();
}
