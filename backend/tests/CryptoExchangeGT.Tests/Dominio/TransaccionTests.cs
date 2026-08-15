using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Tests.Dominio;

public class TransaccionTests
{
    private const string HashValido = "0xabc123";

    private static Transaccion CrearCompra() =>
        Transaccion.CrearCompra(Guid.NewGuid(), 10m, 77.5m, 7.75m);

    [Fact]
    public void Una_transaccion_nueva_nace_Pendiente_y_sin_confirmar()
    {
        var t = CrearCompra();

        Assert.Equal(EstadoTransaccion.Pendiente, t.Estado);
        Assert.Null(t.FechaConfirmacion);
        Assert.Null(t.HashBlockchain);
        Assert.False(t.Compensada);
    }

    [Fact]
    public void MarcarComoEnviadaABlockchain_pasa_a_Confirmando()
    {
        var t = CrearCompra();

        t.MarcarComoEnviadaABlockchain(HashValido);

        Assert.Equal(EstadoTransaccion.Confirmando, t.Estado);
        Assert.Equal(HashValido, t.HashBlockchain);
    }

    [Fact]
    public void No_se_puede_enviar_dos_veces_la_misma_transaccion()
    {
        var t = CrearCompra();
        t.MarcarComoEnviadaABlockchain(HashValido);

        Assert.Throws<ReglaDeNegocioException>(() => t.MarcarComoEnviadaABlockchain("0xotro"));
    }

    [Fact]
    public void MarcarComoCompletada_exige_haber_pasado_por_Confirmando()
    {
        var t = CrearCompra();

        // Saltarse el paso de transmisión dejaría una transacción "completada"
        // que nunca llegó a la blockchain.
        Assert.Throws<ReglaDeNegocioException>(() => t.MarcarComoCompletada());
    }

    [Fact]
    public void MarcarComoCompletada_es_idempotente()
    {
        var t = CrearCompra();
        t.MarcarComoEnviadaABlockchain(HashValido);
        t.MarcarComoCompletada();
        var fecha = t.FechaConfirmacion;

        // El worker puede reprocesar el mismo lote; repetir no debe romper ni
        // mover la fecha de confirmación.
        t.MarcarComoCompletada();

        Assert.Equal(EstadoTransaccion.Completada, t.Estado);
        Assert.Equal(fecha, t.FechaConfirmacion);
    }

    [Fact]
    public void No_se_puede_marcar_como_fallida_una_transaccion_completada()
    {
        var t = CrearCompra();
        t.MarcarComoEnviadaABlockchain(HashValido);
        t.MarcarComoCompletada();

        Assert.Throws<ReglaDeNegocioException>(() => t.MarcarComoFallida("cualquier motivo"));
    }

    [Fact]
    public void MarcarComoCompensada_solo_devuelve_true_la_primera_vez()
    {
        var t = CrearCompra();

        // Este es el candado que impide reembolsar dos veces la misma
        // transacción si el worker la reprocesa.
        Assert.True(t.MarcarComoCompensada());
        Assert.False(t.MarcarComoCompensada());
        Assert.True(t.Compensada);
    }

    [Fact]
    public void El_motivo_de_fallo_se_recorta_a_500_caracteres()
    {
        var t = CrearCompra();

        t.MarcarComoFallida(new string('x', 900));

        Assert.Equal(500, t.MotivoFallo!.Length);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void No_se_pueden_crear_transacciones_con_montos_no_positivos(decimal monto)
    {
        Assert.Throws<ReglaDeNegocioException>(
            () => Transaccion.CrearCompra(Guid.NewGuid(), monto, 100m, 7.75m));

        Assert.Throws<ReglaDeNegocioException>(
            () => Transaccion.CrearEnvioExterno(Guid.NewGuid(), monto, "0x1111111111111111111111111111111111111111"));
    }

    [Fact]
    public void Un_deposito_nace_completado_con_su_referencia_externa()
    {
        var t = Transaccion.CrearDepositoGtq(Guid.NewGuid(), 500m, "BANCO-REF-001");

        Assert.Equal(TipoTransaccion.DepositoGTQ, t.Tipo);
        Assert.Equal(EstadoTransaccion.Completada, t.Estado);
        Assert.Equal("BANCO-REF-001", t.ReferenciaExterna);
        Assert.NotNull(t.FechaConfirmacion);
    }

    [Fact]
    public void Un_deposito_sin_referencia_externa_es_invalido()
    {
        Assert.Throws<ReglaDeNegocioException>(
            () => Transaccion.CrearDepositoGtq(Guid.NewGuid(), 500m, "   "));
    }

    [Fact]
    public void Un_envio_externo_sin_direccion_es_invalido()
    {
        Assert.Throws<ReglaDeNegocioException>(
            () => Transaccion.CrearEnvioExterno(Guid.NewGuid(), 1m, ""));
    }
}
