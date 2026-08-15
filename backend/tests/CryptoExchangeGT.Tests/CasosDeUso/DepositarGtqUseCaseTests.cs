using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Infrastructure.Persistence;
using CryptoExchangeGT.Tests.Infraestructura;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace CryptoExchangeGT.Tests.CasosDeUso;

/// <summary>
/// Cobertura del hallazgo #2, el más grave: cualquier usuario autenticado podía
/// acreditarse saldo ilimitado sin ningún pago, y usarlo para comprar cripto
/// real de la tesorería.
/// </summary>
public class DepositarGtqUseCaseTests : IDisposable
{
    private readonly BaseDeDatosDePrueba _bd = new();

    private DepositarGtqUseCase CrearCasoDeUso(AppDbContext contexto) =>
        new(new UsuarioRepository(contexto),
            new TransaccionRepository(contexto),
            new UnidadDeTrabajo(contexto),
            NullLogger<DepositarGtqUseCase>.Instance);

    private static (Usuario admin, Usuario cliente) SembrarUsuarios(AppDbContext contexto)
    {
        var admin = Usuario.Crear("Admin", "admin@demo.gt", "hash", RolUsuario.Administrador);
        var cliente = Usuario.Crear("Cliente", "cliente@demo.gt", "hash");

        contexto.Usuarios.AddRange(admin, cliente);
        contexto.SaveChanges();

        return (admin, cliente);
    }

    [Fact]
    public async Task Un_cliente_no_puede_acreditar_saldo()
    {
        using var contexto = _bd.CrearContexto();
        var (_, cliente) = SembrarUsuarios(contexto);

        var solicitud = new DepositarGtqRequest
        {
            UsuarioDestinoId = cliente.Id,
            Monto = 999_999m,
            ReferenciaExterna = "INTENTO-FRAUDE"
        };

        // Antes esto devolvía 200 y acreditaba el monto.
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => CrearCasoDeUso(contexto).EjecutarAsync(cliente.Id, solicitud));

        Assert.Equal(0m, cliente.SaldoGTQ);
    }

    [Fact]
    public async Task Un_administrador_no_puede_acreditarse_a_si_mismo()
    {
        using var contexto = _bd.CrearContexto();
        var (admin, _) = SembrarUsuarios(contexto);

        var solicitud = new DepositarGtqRequest
        {
            UsuarioDestinoId = admin.Id,
            Monto = 50_000m,
            ReferenciaExterna = "AUTO-DEPOSITO"
        };

        var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => CrearCasoDeUso(contexto).EjecutarAsync(admin.Id, solicitud));

        Assert.Contains("a sí mismo", ex.Message);
        Assert.Equal(0m, admin.SaldoGTQ);
    }

    [Fact]
    public async Task Un_administrador_puede_acreditar_a_un_cliente()
    {
        using var contexto = _bd.CrearContexto();
        var (admin, cliente) = SembrarUsuarios(contexto);

        var respuesta = await CrearCasoDeUso(contexto).EjecutarAsync(admin.Id, new DepositarGtqRequest
        {
            UsuarioDestinoId = cliente.Id,
            Monto = 1_500m,
            ReferenciaExterna = "BANCO-2026-001"
        });

        Assert.Equal(1_500m, respuesta.MontoAcreditado);
        Assert.Equal(1_500m, respuesta.SaldoResultante);
        Assert.Equal(1_500m, cliente.SaldoGTQ);
    }

    [Fact]
    public async Task La_misma_referencia_externa_no_se_acredita_dos_veces()
    {
        using var contexto = _bd.CrearContexto();
        var (admin, cliente) = SembrarUsuarios(contexto);
        var casoDeUso = CrearCasoDeUso(contexto);

        var solicitud = new DepositarGtqRequest
        {
            UsuarioDestinoId = cliente.Id,
            Monto = 1_000m,
            ReferenciaExterna = "BANCO-2026-042"
        };

        await casoDeUso.EjecutarAsync(admin.Id, solicitud);

        // Un reintento por timeout de red no debe duplicar el saldo.
        var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => casoDeUso.EjecutarAsync(admin.Id, solicitud));

        Assert.Contains("ya fue acreditada", ex.Message);
        Assert.Equal(1_000m, cliente.SaldoGTQ);
    }

    [Fact]
    public async Task Cada_deposito_queda_registrado_como_transaccion_auditable()
    {
        using var contexto = _bd.CrearContexto();
        var (admin, cliente) = SembrarUsuarios(contexto);

        await CrearCasoDeUso(contexto).EjecutarAsync(admin.Id, new DepositarGtqRequest
        {
            UsuarioDestinoId = cliente.Id,
            Monto = 250m,
            ReferenciaExterna = "BANCO-2026-007"
        });

        var transaccion = await contexto.Transacciones.SingleAsync();

        // Antes los depósitos no dejaban rastro: se sumaba el saldo y nada más.
        Assert.Equal(TipoTransaccion.DepositoGTQ, transaccion.Tipo);
        Assert.Equal(EstadoTransaccion.Completada, transaccion.Estado);
        Assert.Equal("BANCO-2026-007", transaccion.ReferenciaExterna);
        Assert.Equal(cliente.Id, transaccion.UsuarioId);
    }

    [Fact]
    public async Task Rechaza_un_usuario_destino_inexistente()
    {
        using var contexto = _bd.CrearContexto();
        var (admin, _) = SembrarUsuarios(contexto);

        await Assert.ThrowsAsync<RecursoNoEncontradoException>(
            () => CrearCasoDeUso(contexto).EjecutarAsync(admin.Id, new DepositarGtqRequest
            {
                UsuarioDestinoId = Guid.NewGuid(),
                Monto = 100m,
                ReferenciaExterna = "REF-FANTASMA"
            }));
    }

    public void Dispose() => _bd.Dispose();
}
