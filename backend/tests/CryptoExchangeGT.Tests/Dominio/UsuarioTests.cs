using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Tests.Dominio;

public class UsuarioTests
{
    private static Usuario CrearUsuario() =>
        Usuario.Crear("Ana Pérez", "ana@demo.gt", "hash-cualquiera");

    [Fact]
    public void Crear_normaliza_el_email_a_minusculas()
    {
        var usuario = Usuario.Crear("Ana", "  ANA@Demo.GT  ", "hash");

        Assert.Equal("ana@demo.gt", usuario.Email);
    }

    [Fact]
    public void Crear_asigna_rol_Cliente_por_defecto()
    {
        Assert.Equal(RolUsuario.Cliente, CrearUsuario().Rol);
        Assert.False(CrearUsuario().EsAdministrador);
    }

    [Theory]
    [InlineData("sin-arroba.com")]
    [InlineData("@dominio.com")]
    [InlineData("usuario@sinpunto")]
    [InlineData("dos@@arrobas.com")]
    [InlineData("")]
    [InlineData("   ")]
    public void Crear_rechaza_emails_invalidos(string email)
    {
        Assert.Throws<ReglaDeNegocioException>(() => Usuario.Crear("Ana", email, "hash"));
    }

    [Fact]
    public void Crear_rechaza_nombre_vacio()
    {
        Assert.Throws<ReglaDeNegocioException>(() => Usuario.Crear("  ", "ana@demo.gt", "hash"));
    }

    [Fact]
    public void DebitarGTQ_rechaza_montos_mayores_al_saldo()
    {
        var usuario = CrearUsuario();
        usuario.AcreditarGTQ(100m);

        var ex = Assert.Throws<SaldoInsuficienteException>(() => usuario.DebitarGTQ(100.01m));

        Assert.Contains("insuficiente", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(100m, usuario.SaldoGTQ);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public void AcreditarGTQ_y_DebitarGTQ_rechazan_montos_no_positivos(decimal monto)
    {
        var usuario = CrearUsuario();

        Assert.Throws<ReglaDeNegocioException>(() => usuario.AcreditarGTQ(monto));
        Assert.Throws<ReglaDeNegocioException>(() => usuario.DebitarGTQ(monto));
    }

    [Fact]
    public void El_saldo_se_redondea_a_dos_decimales()
    {
        var usuario = CrearUsuario();

        usuario.AcreditarGTQ(10.999m);

        // Se trunca, no se redondea hacia arriba: acreditar de más sería
        // regalar dinero que nadie pagó.
        Assert.Equal(10.99m, usuario.SaldoGTQ);
    }

    [Fact]
    public void Cada_cambio_de_saldo_genera_una_Version_nueva()
    {
        var usuario = CrearUsuario();
        var versionInicial = usuario.Version;

        usuario.AcreditarGTQ(50m);
        var versionTrasAcreditar = usuario.Version;

        usuario.DebitarGTQ(20m);

        Assert.NotEqual(versionInicial, versionTrasAcreditar);
        Assert.NotEqual(versionTrasAcreditar, usuario.Version);
    }
}
