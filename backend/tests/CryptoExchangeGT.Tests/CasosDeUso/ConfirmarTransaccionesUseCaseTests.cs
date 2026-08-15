using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Interfaces;
using CryptoExchangeGT.Infrastructure.Persistence;
using CryptoExchangeGT.Tests.Infraestructura;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace CryptoExchangeGT.Tests.CasosDeUso;

/// <summary>
/// Cobertura de los hallazgos #4 y #5.
///
/// #5: nada llamaba nunca a MarcarComoCompletada(), así que toda transacción
///     quedaba en "Confirmando" para siempre.
/// #4: la conversión a GTQ acreditaba el saldo apenas se transmitía la
///     transferencia. Si esa transferencia revertía on-chain, el usuario se
///     quedaba con la cripto Y con los quetzales.
/// </summary>
public class ConfirmarTransaccionesUseCaseTests : IDisposable
{
    private readonly BaseDeDatosDePrueba _bd = new();
    private readonly ICryptoWalletService _blockchain = Substitute.For<ICryptoWalletService>();

    private const string Hash = "0xhash-de-prueba";

    private ConfirmarTransaccionesUseCase CrearCasoDeUso(AppDbContext contexto) =>
        new(new TransaccionRepository(contexto),
            new UsuarioRepository(contexto),
            _blockchain,
            new UnidadDeTrabajo(contexto),
            NullLogger<ConfirmarTransaccionesUseCase>.Instance);

    private static Usuario SembrarUsuario(AppDbContext contexto, decimal saldo = 0m)
    {
        var usuario = Usuario.Crear("Ana", "ana@demo.gt", "hash");
        if (saldo > 0) usuario.AcreditarGTQ(saldo);

        contexto.Usuarios.Add(usuario);
        contexto.SaveChanges();
        return usuario;
    }

    private static Transaccion SembrarTransaccionConfirmando(
        AppDbContext contexto, Transaccion transaccion)
    {
        transaccion.MarcarComoEnviadaABlockchain(Hash);
        contexto.Transacciones.Add(transaccion);
        contexto.SaveChanges();
        return transaccion;
    }

    [Fact]
    public async Task Una_compra_confirmada_pasa_a_Completada()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        var transaccion = SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearCompra(usuario.Id, 10m, 77.5m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Exitosa);

        var procesadas = await CrearCasoDeUso(contexto).EjecutarAsync();

        Assert.Equal(1, procesadas);
        Assert.Equal(EstadoTransaccion.Completada, transaccion.Estado);
        Assert.NotNull(transaccion.FechaConfirmacion);
    }

    [Fact]
    public async Task Una_conversion_confirmada_acredita_los_quetzales()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        var transaccion = SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearConversionAGtq(usuario.Id, 10m, 77.50m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Exitosa);

        await CrearCasoDeUso(contexto).EjecutarAsync();

        // El saldo se acredita acá, no al momento de la solicitud.
        Assert.Equal(77.50m, usuario.SaldoGTQ);
        Assert.Equal(EstadoTransaccion.Completada, transaccion.Estado);
    }

    [Fact]
    public async Task Una_conversion_revertida_no_acredita_nada()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        var transaccion = SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearConversionAGtq(usuario.Id, 10m, 77.50m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Revertida);

        await CrearCasoDeUso(contexto).EjecutarAsync();

        // El escenario exacto del hallazgo #4: antes el usuario cobraba igual.
        Assert.Equal(0m, usuario.SaldoGTQ);
        Assert.Equal(EstadoTransaccion.Fallida, transaccion.Estado);
    }

    [Fact]
    public async Task Una_compra_revertida_reembolsa_los_quetzales()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        var transaccion = SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearCompra(usuario.Id, 10m, 77.50m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Revertida);

        await CrearCasoDeUso(contexto).EjecutarAsync();

        Assert.Equal(77.50m, usuario.SaldoGTQ);
        Assert.Equal(EstadoTransaccion.Fallida, transaccion.Estado);
        Assert.True(transaccion.Compensada);
    }

    [Fact]
    public async Task Una_transaccion_todavia_en_el_mempool_se_deja_como_esta()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        var transaccion = SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearCompra(usuario.Id, 10m, 77.5m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Pendiente);

        var procesadas = await CrearCasoDeUso(contexto).EjecutarAsync();

        Assert.Equal(0, procesadas);
        Assert.Equal(EstadoTransaccion.Confirmando, transaccion.Estado);
    }

    [Fact]
    public async Task Reprocesar_el_mismo_lote_no_acredita_dos_veces()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);
        SembrarTransaccionConfirmando(contexto,
            Transaccion.CrearConversionAGtq(usuario.Id, 10m, 77.50m, 7.75m));

        _blockchain.ConsultarEstadoAsync(Hash, Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Exitosa);

        var casoDeUso = CrearCasoDeUso(contexto);
        await casoDeUso.EjecutarAsync();
        await casoDeUso.EjecutarAsync();

        // La segunda pasada ya no encuentra nada en Confirmando, y aunque lo
        // hiciera, el flag Compensada impide el doble abono.
        Assert.Equal(77.50m, usuario.SaldoGTQ);
    }

    [Fact]
    public async Task Un_fallo_consultando_una_transaccion_no_detiene_el_lote()
    {
        using var contexto = _bd.CrearContexto();
        var usuario = SembrarUsuario(contexto);

        var conError = Transaccion.CrearCompra(usuario.Id, 1m, 7.75m, 7.75m);
        conError.MarcarComoEnviadaABlockchain("0xhash-que-falla");

        var buena = Transaccion.CrearCompra(usuario.Id, 2m, 15.5m, 7.75m);
        buena.MarcarComoEnviadaABlockchain("0xhash-bueno");

        contexto.Transacciones.AddRange(conError, buena);
        await contexto.SaveChangesAsync();

        _blockchain.ConsultarEstadoAsync("0xhash-que-falla", Arg.Any<CancellationToken>())
                   .Returns<EstadoOnChain>(_ => throw new HttpRequestException("nodo caído"));
        _blockchain.ConsultarEstadoAsync("0xhash-bueno", Arg.Any<CancellationToken>())
                   .Returns(EstadoOnChain.Exitosa);

        var procesadas = await CrearCasoDeUso(contexto).EjecutarAsync();

        Assert.Equal(1, procesadas);
        Assert.Equal(EstadoTransaccion.Confirmando, conError.Estado);
        Assert.Equal(EstadoTransaccion.Completada, buena.Estado);
    }

    public void Dispose() => _bd.Dispose();
}
