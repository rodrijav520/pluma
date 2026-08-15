using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using CryptoExchangeGT.API.Controllers;
using CryptoExchangeGT.API.Middleware;
using CryptoExchangeGT.Infrastructure;
using CryptoExchangeGT.Infrastructure.Configuration;
using CryptoExchangeGT.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(ConfigurarSwagger);

// Toda la composición de Infrastructure + Application vive en un solo lugar.
builder.Services.AgregarInfraestructura(builder.Configuration);

builder.Services.AddScoped<ManejadorGlobalDeExcepciones>();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("base-de-datos");

// ---------- CORS ----------
// No existía: cualquier frontend en otro origen quedaba bloqueado por el
// navegador. Los orígenes se configuran, nunca se abre con AllowAnyOrigin
// porque la API usa credenciales.
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:OrigenesPermitidos").Get<string[]>() ?? [];

const string PoliticaCors = "FrontendPermitido";

builder.Services.AddCors(options =>
{
    options.AddPolicy(PoliticaCors, policy =>
    {
        if (origenesPermitidos.Length > 0)
        {
            policy.WithOrigins(origenesPermitidos)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// ---------- Autenticación JWT ----------
var jwtOptions = builder.Configuration.GetSection(JwtOptions.Seccion).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Falta la sección de configuración 'Jwt'.");

if (string.IsNullOrWhiteSpace(jwtOptions.ClaveSecreta))
    throw new InvalidOperationException(
        "Falta configurar Jwt:ClaveSecreta. Usá user-secrets en desarrollo o " +
        "la variable de entorno Jwt__ClaveSecreta en producción.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;

    // En producción se exige HTTPS para transportar el token.
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtOptions.Emisor,

        // Antes estaba en false y los tokens se emitían sin audiencia: un token
        // firmado con la misma clave por cualquier otro sistema era aceptado.
        ValidateAudience = true,
        ValidAudience = jwtOptions.Audiencia,

        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.ClaveSecreta)),

        // El default de 5 minutos deja vivo un token ya vencido. Para una app
        // que mueve dinero, 30 segundos de tolerancia de reloj es suficiente.
        ClockSkew = TimeSpan.FromSeconds(30),

        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PoliticasDeAutorizacion.SoloAdministradores, policy =>
        policy.RequireRole(PoliticasDeAutorizacion.RolAdministrador));
});

// ---------- Límites de tasa ----------
// No había ninguno: login abierto a fuerza bruta y registro capaz de drenar el
// ETH de la tesorería a razón de 0.005 por cuenta.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", contexto =>
        RateLimitPartition.GetFixedWindowLimiter(
            ClaveDeParticion(contexto),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("registro", contexto =>
        RateLimitPartition.GetFixedWindowLimiter(
            ClaveDeParticion(contexto),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromHours(1)
            }));

    options.AddPolicy("operaciones", contexto =>
        RateLimitPartition.GetFixedWindowLimiter(
            ClaveDeParticion(contexto),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

// Comprobaciones que cruzan secciones de configuración: que la clave maestra y
// la del JWT sean distintas, y que ninguna sea la que quedó publicada en el
// repositorio original.
ValidacionDeConfiguracion.ValidarAlArrancar(app.Services, app.Configuration);

// Migraciones al arrancar. Antes había que correr `dotnet ef database update` a
// mano, y por eso la base SQLite terminó versionada en el repositorio.
await AplicarMigracionesAsync(app);

// ---------------------------------------------------------------------------
// Pipeline HTTP — el orden importa
// ---------------------------------------------------------------------------

app.UseMiddleware<ManejadorGlobalDeExcepciones>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.DocumentTitle = "CryptoExchangeGT API");
}
else
{
    // HSTS solo en producción: en desarrollo fijaría el navegador a HTTPS en
    // localhost y complicaría el trabajo del equipo de frontend.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors(PoliticaCors);
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (contexto, informe) =>
    {
        contexto.Response.ContentType = "application/json";
        await contexto.Response.WriteAsJsonAsync(new
        {
            estado = informe.Status.ToString(),
            duracionMs = informe.TotalDuration.TotalMilliseconds,
            verificaciones = informe.Entries.ToDictionary(
                e => e.Key,
                e => new { estado = e.Value.Status.ToString(), e.Value.Description })
        });
    }
}).AllowAnonymous();

app.Run();


// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

// Particiona el límite de tasa por usuario si hay token, y por IP si no. Sin
// esto, todos los clientes compartirían un único cupo global y bastaría un
// cliente ruidoso para bloquear a todos los demás.
static string ClaveDeParticion(HttpContext contexto) =>
    contexto.User.FindFirst("sub")?.Value
    ?? contexto.Connection.RemoteIpAddress?.ToString()
    ?? "desconocido";

static async Task AplicarMigracionesAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var contexto = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        var pendientes = (await contexto.Database.GetPendingMigrationsAsync()).ToList();

        if (pendientes.Count > 0)
        {
            logger.LogInformation("Aplicando {Cantidad} migraciones pendientes: {Migraciones}",
                pendientes.Count, string.Join(", ", pendientes));

            await contexto.Database.MigrateAsync();
        }

        // Resuelve el problema del primer administrador: el registro siempre
        // crea clientes y ningún endpoint otorga el rol.
        await PromotorDeAdministradores.PromoverAsync(contexto, app.Configuration, logger);
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "No se pudieron aplicar las migraciones. La aplicación no puede arrancar.");
        throw;
    }
}

static void ConfigurarSwagger(Swashbuckle.AspNetCore.SwaggerGen.SwaggerGenOptions options)
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CryptoExchangeGT API",
        Version = "v1",
        Description = "Wallet cripto custodial con conversión a quetzales."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pegá solo el token, sin el prefijo 'Bearer'."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Los comentarios XML de los controladores se muestran en Swagger.
    var archivoXml = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var rutaXml = Path.Combine(AppContext.BaseDirectory, archivoXml);

    if (File.Exists(rutaXml))
        options.IncludeXmlComments(rutaXml);
}

// Necesario para que el proyecto de tests pueda referenciar Program con
// WebApplicationFactory.
public partial class Program { }
