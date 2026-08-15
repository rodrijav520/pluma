using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Domain.Interfaces;
using CryptoExchangeGT.Infrastructure.BackgroundServices;
using CryptoExchangeGT.Infrastructure.Blockchain;
using CryptoExchangeGT.Infrastructure.Configuration;
using CryptoExchangeGT.Infrastructure.ExternalServices;
using CryptoExchangeGT.Infrastructure.Persistence;
using CryptoExchangeGT.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CryptoExchangeGT.Infrastructure;

/// <summary>
/// Registro de dependencias de Infrastructure y Application.
///
/// Antes todo esto vivía suelto en Program.cs. Moverlo acá deja el arranque
/// legible y agrupa en un solo lugar las decisiones de composición.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AgregarInfraestructura(
        this IServiceCollection services, IConfiguration configuration)
    {
        AgregarOpciones(services, configuration);

        services.AddDbContext<AppDbContext>(options =>
        {
            var cadena = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "Falta configurar ConnectionStrings:DefaultConnection.");

            options.UseSqlite(cadena);
        });

        services.AddScoped<IUnidadDeTrabajo, UnidadDeTrabajo>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IWalletCustodiaRepository, WalletCustodiaRepository>();
        services.AddScoped<ITransaccionRepository, TransaccionRepository>();

        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtGenerator, JwtGenerator>();
        services.AddScoped<ITesoreriaProvider, TesoreriaProvider>();

        services.AddSingleton<IEncriptacionService>(sp =>
        {
            var opciones = sp.GetRequiredService<IOptions<SeguridadOptions>>().Value;
            return new AesEncriptacionService(opciones.ClaveMaestraBase64);
        });

        services.AddSingleton<ICryptoWalletService>(sp =>
        {
            var opciones = sp.GetRequiredService<IOptions<BlockchainOptions>>().Value;
            var logger = sp.GetRequiredService<ILogger<EthereumWalletService>>();
            return new EthereumWalletService(opciones, logger);
        });

        // Timeout explícito: sin él, un proveedor colgado dejaría la request
        // esperando los 100 segundos por defecto de HttpClient.
        services.AddHttpClient<ITasaCambioProvider, TasaCambioProvider>(cliente =>
        {
            cliente.Timeout = TimeSpan.FromSeconds(10);
            cliente.DefaultRequestHeaders.Add("User-Agent", "CryptoExchangeGT/1.0");
        });

        AgregarCasosDeUso(services);

        services.AddHostedService<ConfirmacionTransaccionesWorker>();

        return services;
    }

    private static void AgregarCasosDeUso(IServiceCollection services)
    {
        services.AddScoped<RegistrarUsuarioUseCase>();
        services.AddScoped<LoginUseCase>();
        services.AddScoped<ComprarCriptoUseCase>();
        services.AddScoped<ConvertirCriptoAGtqUseCase>();
        services.AddScoped<EnviarAWalletExternaUseCase>();
        services.AddScoped<DepositarGtqUseCase>();
        services.AddScoped<ConsultarSaldoUseCase>();
        services.AddScoped<ObtenerHistorialUseCase>();
        services.AddScoped<ConfirmarTransaccionesUseCase>();
    }

    /// <summary>
    /// ValidateDataAnnotations + ValidateOnStart hace que una configuración
    /// inválida rompa el arranque con un mensaje claro, en vez de fallar horas
    /// después en medio de una operación con dinero.
    /// </summary>
    private static void AgregarOpciones(IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<BlockchainOptions>()
            .Bind(configuration.GetSection(BlockchainOptions.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<TesoreriaOptions>()
            .Bind(configuration.GetSection(TesoreriaOptions.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<SeguridadOptions>()
            .Bind(configuration.GetSection(SeguridadOptions.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<ConfirmacionOptions>()
            .Bind(configuration.GetSection(ConfirmacionOptions.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();
    }
}
