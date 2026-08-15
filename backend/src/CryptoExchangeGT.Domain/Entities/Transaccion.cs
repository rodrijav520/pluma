using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Domain.Entities;

public class Transaccion
{
    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public TipoTransaccion Tipo { get; private set; }
    public EstadoTransaccion Estado { get; private set; }
    public decimal MontoCripto { get; private set; }
    public decimal MontoGTQ { get; private set; }
    public decimal TasaCambioUsada { get; private set; }
    public string? DireccionDestino { get; private set; }
    public string? HashBlockchain { get; private set; }

    /// <summary>
    /// Por qué falló, cuando el estado es Fallida. Antes no se guardaba nada y
    /// una transacción fallida era indistinguible de otra.
    /// </summary>
    public string? MotivoFallo { get; private set; }

    /// <summary>
    /// Identificador de la operación en el sistema externo que la originó
    /// (referencia bancaria, id de la pasarela de pago). Es único: es lo que
    /// impide que el mismo depósito se acredite dos veces.
    /// </summary>
    public string? ReferenciaExterna { get; private set; }

    /// <summary>
    /// Si la operación ya devolvió los fondos al usuario. Evita que un
    /// reintento del worker de confirmación reembolse dos veces la misma
    /// transacción fallida.
    /// </summary>
    public bool Compensada { get; private set; }

    public DateTime FechaCreacion { get; private set; }
    public DateTime? FechaConfirmacion { get; private set; }

    /// <summary>Token de concurrencia optimista. Ver Usuario.Version.</summary>
    public Guid Version { get; private set; }

    private Transaccion() { }

    private static Transaccion Nueva(Guid usuarioId, TipoTransaccion tipo) => new()
    {
        Id = Guid.NewGuid(),
        UsuarioId = usuarioId,
        Tipo = tipo,
        Estado = EstadoTransaccion.Pendiente,
        FechaCreacion = DateTime.UtcNow,
        Version = Guid.NewGuid()
    };

    public static Transaccion CrearCompra(Guid usuarioId, decimal montoCripto, decimal montoGTQ, decimal tasaCambio)
    {
        ValidarMontoPositivo(montoCripto, "monto en cripto");
        ValidarMontoPositivo(montoGTQ, "monto en GTQ");
        ValidarMontoPositivo(tasaCambio, "tasa de cambio");

        var t = Nueva(usuarioId, TipoTransaccion.Compra);
        t.MontoCripto = montoCripto;
        t.MontoGTQ = montoGTQ;
        t.TasaCambioUsada = tasaCambio;
        return t;
    }

    public static Transaccion CrearConversionAGtq(Guid usuarioId, decimal montoCripto, decimal montoGTQ, decimal tasaCambio)
    {
        ValidarMontoPositivo(montoCripto, "monto en cripto");
        ValidarMontoPositivo(montoGTQ, "monto en GTQ");
        ValidarMontoPositivo(tasaCambio, "tasa de cambio");

        var t = Nueva(usuarioId, TipoTransaccion.ConversionAGTQ);
        t.MontoCripto = montoCripto;
        t.MontoGTQ = montoGTQ;
        t.TasaCambioUsada = tasaCambio;
        return t;
    }

    public static Transaccion CrearEnvioExterno(Guid usuarioId, decimal montoCripto, string direccionDestino)
    {
        ValidarMontoPositivo(montoCripto, "monto en cripto");

        if (string.IsNullOrWhiteSpace(direccionDestino))
            throw new ReglaDeNegocioException("Debe indicar una dirección destino.");

        var t = Nueva(usuarioId, TipoTransaccion.EnvioExterno);
        t.MontoCripto = montoCripto;
        t.DireccionDestino = direccionDestino;
        return t;
    }

    /// <summary>
    /// Depósito de quetzales. Nace ya completado porque no pasa por la
    /// blockchain, pero queda registrado para auditoría con la referencia del
    /// sistema externo que lo originó.
    /// </summary>
    public static Transaccion CrearDepositoGtq(Guid usuarioId, decimal montoGTQ, string referenciaExterna)
    {
        ValidarMontoPositivo(montoGTQ, "monto en GTQ");

        if (string.IsNullOrWhiteSpace(referenciaExterna))
            throw new ReglaDeNegocioException("El depósito requiere una referencia externa.");

        var t = Nueva(usuarioId, TipoTransaccion.DepositoGTQ);
        t.MontoGTQ = montoGTQ;
        t.ReferenciaExterna = referenciaExterna.Trim();
        t.Estado = EstadoTransaccion.Completada;
        t.FechaConfirmacion = DateTime.UtcNow;
        return t;
    }

    public void MarcarComoEnviadaABlockchain(string hashBlockchain)
    {
        if (string.IsNullOrWhiteSpace(hashBlockchain))
            throw new ReglaDeNegocioException("El hash de la transacción es obligatorio.");

        if (Estado != EstadoTransaccion.Pendiente)
            throw new ReglaDeNegocioException($"No se puede enviar una transacción en estado {Estado}.");

        HashBlockchain = hashBlockchain;
        Estado = EstadoTransaccion.Confirmando;
        Version = Guid.NewGuid();
    }

    public void MarcarComoCompletada()
    {
        if (Estado == EstadoTransaccion.Completada)
            return; // idempotente: el worker puede reprocesar la misma transacción

        if (Estado != EstadoTransaccion.Confirmando)
            throw new ReglaDeNegocioException($"No se puede completar una transacción en estado {Estado}.");

        Estado = EstadoTransaccion.Completada;
        FechaConfirmacion = DateTime.UtcNow;
        Version = Guid.NewGuid();
    }

    public void MarcarComoFallida(string motivo)
    {
        if (Estado == EstadoTransaccion.Fallida)
            return; // idempotente

        if (Estado == EstadoTransaccion.Completada)
            throw new ReglaDeNegocioException("No se puede marcar como fallida una transacción ya completada.");

        Estado = EstadoTransaccion.Fallida;
        MotivoFallo = Recortar(motivo, 500);
        Version = Guid.NewGuid();
    }

    /// <summary>
    /// Marca que los fondos ya se devolvieron al usuario. Devuelve false si ya
    /// estaba compensada, para que quien llama no reembolse dos veces.
    /// </summary>
    public bool MarcarComoCompensada()
    {
        if (Compensada)
            return false;

        Compensada = true;
        Version = Guid.NewGuid();
        return true;
    }

    private static void ValidarMontoPositivo(decimal monto, string nombre)
    {
        if (monto <= 0)
            throw new ReglaDeNegocioException($"El {nombre} debe ser mayor que cero.");
    }

    private static string Recortar(string texto, int largoMaximo) =>
        string.IsNullOrEmpty(texto) || texto.Length <= largoMaximo
            ? texto
            : texto[..largoMaximo];
}
