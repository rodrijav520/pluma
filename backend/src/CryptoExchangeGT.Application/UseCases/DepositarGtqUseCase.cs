using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Acreditación manual de quetzales.
///
/// Este era el agujero más grave del sistema: cualquier usuario autenticado
/// llamaba al endpoint sobre su propia cuenta y se acreditaba el monto que
/// quisiera, sin ningún pago de por medio. Ese saldo inventado servía después
/// para comprar cripto real de la tesorería.
///
/// Tres candados nuevos:
///
///   1. Solo un administrador puede ejecutarlo, y nunca sobre su propia cuenta.
///   2. Exige la referencia del pago externo que respalda el depósito.
///   3. Esa referencia es única, así que reintentar la misma llamada no
///      acredita el monto dos veces.
///
/// Sigue siendo un mecanismo manual de respaldo. Lo correcto es que el depósito
/// nazca de un webhook de la pasarela de pago, no de una llamada de un humano.
/// </summary>
public class DepositarGtqUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly ITransaccionRepository _transaccionRepository;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<DepositarGtqUseCase> _logger;

    public DepositarGtqUseCase(
        IUsuarioRepository usuarioRepository,
        ITransaccionRepository transaccionRepository,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<DepositarGtqUseCase> logger)
    {
        _usuarioRepository = usuarioRepository;
        _transaccionRepository = transaccionRepository;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<DepositarGtqResponse> EjecutarAsync(
        Guid administradorId, DepositarGtqRequest request, CancellationToken ct = default)
    {
        var administrador = await _usuarioRepository.ObtenerPorIdAsync(administradorId, ct)
            ?? throw new RecursoNoEncontradoException("Usuario no encontrado.");

        // Doble verificación: la política de autorización ya filtró por rol en el
        // endpoint, pero el rol del token puede estar desactualizado respecto a
        // la base (un admin degradado sigue teniendo un token válido hasta que
        // expire). La fuente de verdad es la base, no el claim.
        if (!administrador.EsAdministrador)
        {
            _logger.LogWarning(
                "El usuario {UsuarioId} intentó acreditar saldo sin rol de administrador.",
                administradorId);
            throw new ReglaDeNegocioException("No tenés permiso para acreditar saldo.");
        }

        // Un administrador acreditándose a sí mismo es exactamente el abuso que
        // este caso de uso tiene que impedir.
        if (request.UsuarioDestinoId == administradorId)
            throw new ReglaDeNegocioException(
                "Un administrador no puede acreditarse saldo a sí mismo. " +
                "El depósito debe ser aprobado por otra persona.");

        var referencia = request.ReferenciaExterna.Trim();

        if (await _transaccionRepository.ExisteReferenciaExternaAsync(referencia, ct))
        {
            _logger.LogWarning(
                "Depósito rechazado: la referencia {Referencia} ya fue procesada.", referencia);
            throw new ReglaDeNegocioException(
                $"La referencia '{referencia}' ya fue acreditada. Cada pago se registra una sola vez.");
        }

        var destino = await _usuarioRepository.ObtenerPorIdAsync(request.UsuarioDestinoId, ct)
            ?? throw new RecursoNoEncontradoException("El usuario destino no existe.");

        await using var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct);

        destino.AcreditarGTQ(request.Monto);
        _usuarioRepository.Actualizar(destino);

        var transaccion = Transaccion.CrearDepositoGtq(destino.Id, request.Monto, referencia);
        _transaccionRepository.Agregar(transaccion);

        await _unidadDeTrabajo.GuardarCambiosAsync(ct);
        await tx.ConfirmarAsync(ct);

        _logger.LogInformation(
            "Depósito {TransaccionId}: el administrador {AdminId} acreditó {Monto} GTQ a {DestinoId} " +
            "con referencia {Referencia}",
            transaccion.Id, administradorId, request.Monto, destino.Id, referencia);

        return new DepositarGtqResponse
        {
            TransaccionId = transaccion.Id,
            UsuarioDestinoId = destino.Id,
            MontoAcreditado = request.Monto,
            SaldoResultante = destino.SaldoGTQ
        };
    }
}
