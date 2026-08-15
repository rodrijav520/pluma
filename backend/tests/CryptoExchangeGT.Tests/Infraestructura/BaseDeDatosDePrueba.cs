using CryptoExchangeGT.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Tests.Infraestructura;

/// <summary>
/// Base SQLite en memoria para los tests.
///
/// Se usa SQLite real y no el proveedor InMemory de EF a propósito: InMemory no
/// soporta transacciones ni aplica tokens de concurrencia, que es justamente lo
/// que hay que verificar acá. Con InMemory los tests de doble gasto pasarían sin
/// probar nada.
/// </summary>
public sealed class BaseDeDatosDePrueba : IDisposable
{
    private readonly SqliteConnection _conexion;

    public BaseDeDatosDePrueba()
    {
        // La conexión debe quedar abierta: al cerrarla, SQLite descarta la base.
        _conexion = new SqliteConnection("DataSource=:memory:");
        _conexion.Open();

        using var contexto = CrearContexto();
        contexto.Database.EnsureCreated();
    }

    public AppDbContext CrearContexto()
    {
        var opciones = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_conexion)
            .EnableSensitiveDataLogging()
            .Options;

        return new AppDbContext(opciones);
    }

    public void Dispose()
    {
        _conexion.Dispose();
    }
}
