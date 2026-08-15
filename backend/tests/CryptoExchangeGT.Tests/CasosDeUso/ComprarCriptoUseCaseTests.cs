using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using CryptoExchangeGT.Infrastructure.Persistence;
using CryptoExchangeGT.Tests.Infraestructura;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace CryptoExchangeGT.Tests.CasosDeUso;

/// <summary>
/// Cobertura del hallazgo #3: la versión anterior debitaba el saldo, lo
/// persistía y recién después llamaba a la blockchain, sin try/catch. Si el
/// envío fallaba, el usuario perdía los quetzales para siempre.
/// </summary>
public class ComprarCriptoUseCaseTests : IDisposable
{
    private readonly BaseDeDatosDePrueba _bd = new();
    private readonly ICryptoWalletService _blockchain = Substitute.For<ICryptoWalletService>();
    private readonly ITasaCambioProvider _tasas = Substitute.For<ITasaCambioProvider>();
    private readonly ITesoreriaProvider _tesoreria = Substitute.For<ITesoreriaProvider>();

    private const string DireccionTesoreria = "0x1111111111111111111111111111111111111111";
    private const string DireccionUsuario = "0x2222222222222222222222222222222222222222";

    public ComprarCriptoUseCaseTests()
    {
        _tasas.ObtenerTasaUsdtToGtqAsync(Arg.Any<CancellationToken>()).Returns(7.75m);
        _tesoreria.ObtenerDireccionPublica().Returns(DireccionTesoreria);
        _tesoreria.ObtenerLlavePrivadaDescifrada().Returns("0xllave-tesoreria");

        // Tesorería con fondos de sobra salvo que el test diga lo contrario.
        _blockchain.ConsultarSaldoAsync(DireccionTesoreria, Arg.Any<CancellationToken>())
                   .Returns(1_000_000m);
    }

    private ComprarCriptoUseCase CrearCasoDeUso(AppDbContext contexto) =>
        new(new UsuarioRepository(contexto),
            new WalletCustodiaRepository(contexto),
            new TransaccionRepository(contexto),
            _blockchain, _tasas, _tesoreria,
            new UnidadDeTrabajo(contexto),
            NullLogger<ComprarCriptoUseCase>.Instance);

    private static Usuario SembrarUsuarioConSaldo(AppDbContext contexto, decimal saldo)
    {
        var usuario = Usuario.Crear("Ana", "ana@demo.gt", "hash");
        usuario.AcreditarGTQ(saldo);

        contexto.Usuarios.Add(usuario);
        contexto.WalletsCustodia.Add(
            WalletCustodia.Crear(usuario.Id, DireccionUsuario, "cifrada"));
        contexto.SaveChanges();

        return usuario;
    }

    [Fact]
    public async Task Una_compra_exitosa_debita_el_saldo_y_deja_la_transaccion_Confirmando()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuarioConSaldo(contexto, 1_000m);

        _blockchain.EnviarTransaccionAsync(Arg.Any<string>(), DireccionUsuario,
                                           Arg.Any<decimal>(), Arg.Any<CancellationToken>())
                   .Returns("0xhash-exitoso");

        var respuesta = await CrearCasoDeUso(contexto)
            .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 77.50m });

        Assert.Equal("0xhash-exitoso", respuesta.HashBlockchain);
        Assert.Equal(10m, respuesta.MontoCriptoRecibido);          // 77.50 / 7.75
        Assert.Equal(922.50m, usuario.SaldoGTQ);

        // No queda "Completada": eso lo decide el worker al ver el recibo.
        Assert.Equal(nameof(EstadoTransaccion.Confirmando), respuesta.Estado);
    }

    [Fact]
    public async Task Si_la_blockchain_falla_se_devuelve_el_saldo_al_usuario()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuarioConSaldo(contexto, 1_000m);

        _blockchain.EnviarTransaccionAsync(Arg.Any<string>(), Arg.Any<string>(),
                                           Arg.Any<decimal>(), Arg.Any<CancellationToken>())
                   .ThrowsAsync(new TransaccionBlockchainFallidaException("el nodo RPC no responde"));

        await Assert.ThrowsAsync<TransaccionBlockchainFallidaException>(
            () => CrearCasoDeUso(contexto)
                .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 500m }));

        // Este es el punto: antes el saldo quedaba en 500 y el usuario perdía
        // Q500 sin recibir nada.
        Assert.Equal(1_000m, usuario.SaldoGTQ);

        var transaccion = await contexto.Transacciones.SingleAsync();
        Assert.Equal(EstadoTransaccion.Fallida, transaccion.Estado);
        Assert.True(transaccion.Compensada);
        Assert.Contains("RPC", transaccion.MotivoFallo!);
    }

    [Fact]
    public async Task No_se_puede_comprar_con_saldo_insuficiente()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuarioConSaldo(contexto, 50m);

        await Assert.ThrowsAsync<SaldoInsuficienteException>(
            () => CrearCasoDeUso(contexto)
                .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 100m }));

        Assert.Equal(50m, usuario.SaldoGTQ);
        Assert.Empty(await contexto.Transacciones.ToListAsync());
    }

    [Fact]
    public async Task Si_la_tesoreria_no_tiene_fondos_no_se_toca_el_saldo_del_usuario()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuarioConSaldo(contexto, 1_000m);

        _blockchain.ConsultarSaldoAsync(DireccionTesoreria, Arg.Any<CancellationToken>())
                   .Returns(0.5m);

        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => CrearCasoDeUso(contexto)
                .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 775m }));

        // Se rechaza antes de debitar: es más barato que debitar y compensar.
        Assert.Equal(1_000m, usuario.SaldoGTQ);
        Assert.Empty(await contexto.Transacciones.ToListAsync());

        await _blockchain.DidNotReceive().EnviarTransaccionAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<decimal>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Si_no_hay_tasa_de_cambio_la_compra_se_rechaza()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuarioConSaldo(contexto, 1_000m);

        _tasas.ObtenerTasaUsdtToGtqAsync(Arg.Any<CancellationToken>())
              .ThrowsAsync(new ServicioExternoNoDisponibleException("la API de tasas está caída"));

        // Antes se usaba en silencio una tasa fija de 7.75, lo que abría una
        // ventana de arbitraje justo cuando el proveedor estaba caído.
        await Assert.ThrowsAsync<ServicioExternoNoDisponibleException>(
            () => CrearCasoDeUso(contexto)
                .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 100m }));

        Assert.Equal(1_000m, usuario.SaldoGTQ);
    }

    [Fact]
    public async Task Rechaza_un_usuario_sin_wallet_asignada()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = Usuario.Crear("Sin Wallet", "sinwallet@demo.gt", "hash");
        usuario.AcreditarGTQ(500m);
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();

        await Assert.ThrowsAsync<RecursoNoEncontradoException>(
            () => CrearCasoDeUso(contexto)
                .EjecutarAsync(usuario.Id, new ComprarCriptoRequest { MontoGTQ = 100m }));
    }

    public void Dispose() => _bd.Dispose();
}
