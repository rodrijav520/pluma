namespace CryptoExchangeGT.Domain.Exceptions;

/// <summary>
/// Base de todas las excepciones que representan una condición esperada del
/// negocio (a diferencia de un fallo técnico). El middleware de la API las
/// traduce a códigos HTTP sin exponer detalles internos.
/// </summary>
public abstract class ExcepcionDominio : Exception
{
    protected ExcepcionDominio(string mensaje) : base(mensaje) { }
    protected ExcepcionDominio(string mensaje, Exception inner) : base(mensaje, inner) { }
}

/// <summary>Una regla de negocio impidió completar la operación. → HTTP 400.</summary>
public class ReglaDeNegocioException : ExcepcionDominio
{
    public ReglaDeNegocioException(string mensaje) : base(mensaje) { }
}

/// <summary>
/// Credenciales incorrectas. → HTTP 401. El mensaje es deliberadamente
/// ambiguo: distinguir "email no registrado" de "contraseña incorrecta" le
/// permitiría a un atacante enumerar qué cuentas existen.
/// </summary>
public class CredencialesInvalidasException : ExcepcionDominio
{
    public CredencialesInvalidasException() : base("Email o contraseña incorrectos.") { }
}

/// <summary>El recurso solicitado no existe. → HTTP 404.</summary>
public class RecursoNoEncontradoException : ExcepcionDominio
{
    public RecursoNoEncontradoException(string mensaje) : base(mensaje) { }
}

/// <summary>Fondos insuficientes para la operación. → HTTP 400.</summary>
public class SaldoInsuficienteException : ExcepcionDominio
{
    public SaldoInsuficienteException(string mensaje) : base(mensaje) { }
}

/// <summary>
/// Otra operación modificó el mismo registro al mismo tiempo. → HTTP 409.
/// El cliente puede reintentar de forma segura.
/// </summary>
public class ConflictoDeConcurrenciaException : ExcepcionDominio
{
    public ConflictoDeConcurrenciaException(string mensaje) : base(mensaje) { }
    public ConflictoDeConcurrenciaException(string mensaje, Exception inner) : base(mensaje, inner) { }
}

/// <summary>
/// Un servicio externo del que dependemos no está disponible o devolvió algo
/// inutilizable. → HTTP 503. Nunca se sustituye por un valor inventado.
/// </summary>
public class ServicioExternoNoDisponibleException : ExcepcionDominio
{
    public ServicioExternoNoDisponibleException(string mensaje) : base(mensaje) { }
    public ServicioExternoNoDisponibleException(string mensaje, Exception inner) : base(mensaje, inner) { }
}

/// <summary>
/// La transacción se transmitió a la blockchain pero revirtió (recibo con
/// Status = 0), o no se pudo transmitir. → HTTP 502.
/// </summary>
public class TransaccionBlockchainFallidaException : ExcepcionDominio
{
    public string? HashTransaccion { get; }

    public TransaccionBlockchainFallidaException(string mensaje, string? hashTransaccion = null)
        : base(mensaje)
    {
        HashTransaccion = hashTransaccion;
    }

    public TransaccionBlockchainFallidaException(string mensaje, Exception inner)
        : base(mensaje, inner) { }
}
