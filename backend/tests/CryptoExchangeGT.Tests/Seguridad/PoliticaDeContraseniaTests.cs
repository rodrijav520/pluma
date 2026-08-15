using CryptoExchangeGT.Application.Seguridad;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Infrastructure.Security;

namespace CryptoExchangeGT.Tests.Seguridad;

public class PoliticaDeContraseniaTests
{
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Rechaza_contrasenias_vacias(string? password)
    {
        // Este era el hallazgo #9: el registro aceptaba password vacío y el
        // login después lo daba por válido.
        Assert.Throws<ReglaDeNegocioException>(() => PoliticaDeContrasenia.Validar(password));
    }

    [Theory]
    [InlineData("corta1")]
    [InlineData("abc123")]
    public void Rechaza_contrasenias_demasiado_cortas(string password)
    {
        Assert.Throws<ReglaDeNegocioException>(() => PoliticaDeContrasenia.Validar(password));
    }

    [Theory]
    [InlineData("solamenteletras")]
    [InlineData("1234567890123")]
    public void Exige_combinar_letras_y_numeros(string password)
    {
        Assert.Throws<ReglaDeNegocioException>(() => PoliticaDeContrasenia.Validar(password));
    }

    [Theory]
    [InlineData("password1")]
    [InlineData("qwerty123")]
    public void Rechaza_contrasenias_de_listas_filtradas(string password)
    {
        Assert.Throws<ReglaDeNegocioException>(() => PoliticaDeContrasenia.Validar(password));
    }

    [Fact]
    public void Rechaza_contrasenias_de_mas_de_72_bytes()
    {
        // BCrypt trunca en silencio a 72 bytes: aceptar más largo daría una
        // falsa sensación de seguridad.
        var larga = new string('a', 70) + "12345";

        Assert.Throws<ReglaDeNegocioException>(() => PoliticaDeContrasenia.Validar(larga));
    }

    [Theory]
    [InlineData("Quetzal2024seguro")]
    [InlineData("mi-clave-larga-99")]
    public void Acepta_contrasenias_validas(string password)
    {
        PoliticaDeContrasenia.Validar(password);
    }
}

public class BCryptPasswordHasherTests
{
    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Verificar_acepta_la_contrasenia_correcta_y_rechaza_otra()
    {
        var hash = _hasher.Hashear("Quetzal2024seguro");

        Assert.True(_hasher.Verificar("Quetzal2024seguro", hash));
        Assert.False(_hasher.Verificar("otra-contrasenia1", hash));
    }

    [Fact]
    public void Dos_hashes_de_la_misma_contrasenia_son_distintos()
    {
        // Salt aleatorio por hash: sin él, dos usuarios con la misma contraseña
        // tendrían el mismo hash y una tabla precomputada los rompería a ambos.
        Assert.NotEqual(_hasher.Hashear("Quetzal2024seguro"), _hasher.Hashear("Quetzal2024seguro"));
    }

    [Fact]
    public void Verificar_devuelve_false_ante_un_hash_corrupto_en_vez_de_lanzar()
    {
        // Un registro dañado en la base no debe tumbar el endpoint de login.
        Assert.False(_hasher.Verificar("cualquiera", "esto-no-es-un-hash-bcrypt"));
    }

    [Fact]
    public void Verificar_devuelve_false_ante_entradas_vacias()
    {
        Assert.False(_hasher.Verificar("", "hash"));
        Assert.False(_hasher.Verificar("password", ""));
    }
}
