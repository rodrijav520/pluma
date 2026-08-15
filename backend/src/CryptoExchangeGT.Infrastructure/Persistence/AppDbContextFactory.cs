using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CryptoExchangeGT.Infrastructure.Persistence;

/// <summary>
/// Fábrica que usan las herramientas de EF (`dotnet ef migrations add`,
/// `dotnet ef database update`) para construir el contexto en tiempo de diseño.
///
/// Sin esto, EF intenta arrancar la aplicación completa para obtener el
/// contexto, y falla porque en tiempo de diseño no hay secretos configurados
/// (clave maestra, clave JWT, llave de tesorería). Generar una migración no
/// debería exigir credenciales de producción.
///
/// La cadena de conexión de acá solo sirve para que EF conozca el proveedor y
/// pueda generar el SQL correcto: nunca se usa en tiempo de ejecución.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var cadena = Environment.GetEnvironmentVariable("CRYPTOEXCHANGEGT_MIGRATIONS_CONNECTION")
                     ?? "Data Source=migraciones-diseno.db";

        var opciones = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(cadena)
            .Options;

        return new AppDbContext(opciones);
    }
}
