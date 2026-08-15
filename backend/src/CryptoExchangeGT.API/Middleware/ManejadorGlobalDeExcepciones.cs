using System.Net;
using CryptoExchangeGT.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace CryptoExchangeGT.API.Middleware;

/// <summary>
/// Traduce excepciones de dominio a respuestas HTTP.
///
/// Antes cada acción de cada controlador repetía el mismo bloque
/// try/catch(InvalidOperationException)/catch(ArgumentException). Eso tenía dos
/// problemas: duplicaba la lógica en siete endpoints, y cualquier excepción no
/// contemplada se escapaba como un 500 con el stack trace completo.
///
/// Las respuestas usan ProblemDetails (RFC 7807), que es el formato estándar
/// que un frontend puede consumir de forma uniforme.
/// </summary>
public class ManejadorGlobalDeExcepciones : IMiddleware
{
    private readonly ILogger<ManejadorGlobalDeExcepciones> _logger;
    private readonly IHostEnvironment _entorno;

    public ManejadorGlobalDeExcepciones(
        ILogger<ManejadorGlobalDeExcepciones> logger, IHostEnvironment entorno)
    {
        _logger = logger;
        _entorno = entorno;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await ManejarAsync(context, ex);
        }
    }

    private async Task ManejarAsync(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted)
        {
            // Ya se envió parte de la respuesta; no se puede reescribir el
            // status. Solo queda dejar constancia.
            _logger.LogError(ex, "Excepción después de iniciada la respuesta en {Ruta}",
                context.Request.Path);
            return;
        }

        var (status, titulo, detalle) = Clasificar(ex);

        // Los errores del cliente (4xx) son ruido a nivel Error: se registran
        // como advertencia. Los 5xx sí son problemas nuestros.
        if (status >= 500)
            _logger.LogError(ex, "Error no controlado en {Metodo} {Ruta}",
                context.Request.Method, context.Request.Path);
        else
            _logger.LogWarning("{Titulo} en {Metodo} {Ruta}: {Detalle}",
                titulo, context.Request.Method, context.Request.Path, detalle);

        var problema = new ProblemDetails
        {
            Status = status,
            Title = titulo,
            Detail = detalle,
            Instance = context.Request.Path
        };

        // El identificador permite cruzar lo que vio el usuario con el log del
        // servidor sin exponerle nada del error interno.
        problema.Extensions["traceId"] = context.TraceIdentifier;

        if (ex is TransaccionBlockchainFallidaException blockchain &&
            !string.IsNullOrEmpty(blockchain.HashTransaccion))
        {
            problema.Extensions["hashTransaccion"] = blockchain.HashTransaccion;
        }

        // El stack trace solo en desarrollo: en producción le daría a un
        // atacante el mapa interno de la aplicación.
        if (_entorno.IsDevelopment() && status >= 500)
            problema.Extensions["excepcion"] = ex.ToString();

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problema);
    }

    private static (int status, string titulo, string detalle) Clasificar(Exception ex) => ex switch
    {
        CredencialesInvalidasException e =>
            ((int)HttpStatusCode.Unauthorized, "Credenciales inválidas", e.Message),

        RecursoNoEncontradoException e =>
            ((int)HttpStatusCode.NotFound, "Recurso no encontrado", e.Message),

        SaldoInsuficienteException e =>
            ((int)HttpStatusCode.BadRequest, "Saldo insuficiente", e.Message),

        ConflictoDeConcurrenciaException e =>
            ((int)HttpStatusCode.Conflict, "Conflicto de concurrencia", e.Message),

        ServicioExternoNoDisponibleException e =>
            ((int)HttpStatusCode.ServiceUnavailable, "Servicio no disponible", e.Message),

        TransaccionBlockchainFallidaException e =>
            ((int)HttpStatusCode.BadGateway, "Transacción rechazada por la blockchain", e.Message),

        ReglaDeNegocioException e =>
            ((int)HttpStatusCode.BadRequest, "Solicitud inválida", e.Message),

        UnauthorizedAccessException =>
            ((int)HttpStatusCode.Unauthorized, "No autorizado", "El token no es válido."),

        OperationCanceledException =>
            (499, "Solicitud cancelada", "El cliente canceló la solicitud."),

        // Cualquier otra cosa es un fallo nuestro y el detalle no sale al cliente.
        _ => ((int)HttpStatusCode.InternalServerError, "Error interno",
              "Ocurrió un error procesando la solicitud. Si persiste, reportá el traceId.")
    };
}
