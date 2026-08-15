using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Enums;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

/// <summary>
/// Cierra el ciclo de vida de las transacciones transmitidas a la blockchain.
///
/// Esta pieza no existía. <c>MarcarComoCompletada()</c> nunca se llamaba desde
/// ningún lado y <c>EstaConfirmadaAsync</c> era código muerto, así que toda
/// transacción quedaba en "Confirmando" para siempre y el campo Estado era
/// puramente decorativo.
///
/// Acá también se acredita el saldo de las conversiones a GTQ: el usuario recibe
/// sus quetzales cuando la transferencia se confirma on-chain, no cuando se
/// transmite. Es la diferencia entre pagar por algo que ocurrió y pagar por algo
/// que todavía puede revertir.
/// </summary>
public class ConfirmarTransaccionesUseCase
{
    private readonly ITransaccionRepository _transaccionRepository;
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<ConfirmarTransaccionesUseCase> _logger;

    public ConfirmarTransaccionesUseCase(
        ITransaccionRepository transaccionRepository,
        IUsuarioRepository usuarioRepository,
        ICryptoWalletService cryptoWalletService,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<ConfirmarTransaccionesUseCase> logger)
    {
        _transaccionRepository = transaccionRepository;
        _usuarioRepository = usuarioRepository;
        _cryptoWalletService = cryptoWalletService;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    /// <summary>Revisa un lote de transacciones y devuelve cuántas cambiaron de estado.</summary>
    public async Task<int> EjecutarAsync(int limiteLote = 50, CancellationToken ct = default)
    {
        var pendientes = await _transaccionRepository.ObtenerPorEstadoAsync(
            EstadoTransaccion.Confirmando, limiteLote, ct);

        if (pendientes.Count == 0)
            return 0;

        var procesadas = 0;

        foreach (var transaccion in pendientes)
        {
            ct.ThrowIfCancellationRequested();

            if (string.IsNullOrWhiteSpace(transaccion.HashBlockchain))
            {
                // No debería pasar: el estado Confirmando solo se alcanza con un
                // hash asignado. Si pasa, hay un dato corrupto que hay que ver.
                _logger.LogError(
                    "La transacción {TransaccionId} está en Confirmando sin hash. Requiere revisión.",
                    transaccion.Id);
                continue;
            }

            try
            {
                var estado = await _cryptoWalletService.ConsultarEstadoAsync(
                    transaccion.HashBlockchain, ct);

                switch (estado)
                {
                    case EstadoOnChain.Pendiente:
                        // Todavía en el mempool. Se revisa en la próxima pasada.
                        continue;

                    case EstadoOnChain.Exitosa:
                        await CompletarAsync(transaccion, ct);
                        procesadas++;
                        break;

                    case EstadoOnChain.Revertida:
                        await RevertirAsync(transaccion, ct);
                        procesadas++;
                        break;
                }
            }
            catch (Exception ex)
            {
                // Un fallo consultando una transacción no debe detener el lote:
                // las demás se siguen procesando y esta se reintenta luego.
                _logger.LogError(ex,
                    "Error al verificar la transacción {TransaccionId} (hash {Hash}).",
                    transaccion.Id, transaccion.HashBlockchain);
            }
        }

        return procesadas;
    }

    private async Task CompletarAsync(Transaccion transaccion, CancellationToken ct)
    {
        await using var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct);

        transaccion.MarcarComoCompletada();

        // La conversión a GTQ es la única que acredita saldo al confirmarse: la
        // compra ya debitó al usuario y el envío externo no toca quetzales.
        if (transaccion.Tipo == TipoTransaccion.ConversionAGTQ && transaccion.MarcarComoCompensada())
        {
            var usuario = await _usuarioRepository.ObtenerPorIdAsync(transaccion.UsuarioId, ct);

            if (usuario is null)
            {
                _logger.LogCritical(
                    "La conversión {TransaccionId} se confirmó pero el usuario {UsuarioId} no existe. " +
                    "No se acreditaron {Monto} GTQ.",
                    transaccion.Id, transaccion.UsuarioId, transaccion.MontoGTQ);
            }
            else
            {
                usuario.AcreditarGTQ(transaccion.MontoGTQ);
                _usuarioRepository.Actualizar(usuario);

                _logger.LogInformation(
                    "Conversión {TransaccionId} confirmada: se acreditaron {Monto} GTQ al usuario {UsuarioId}",
                    transaccion.Id, transaccion.MontoGTQ, usuario.Id);
            }
        }

        _transaccionRepository.Actualizar(transaccion);
        await _unidadDeTrabajo.GuardarCambiosAsync(ct);
        await tx.ConfirmarAsync(ct);

        _logger.LogInformation("Transacción {TransaccionId} ({Tipo}) completada.",
            transaccion.Id, transaccion.Tipo);
    }

    /// <summary>
    /// La transacción revirtió on-chain. Se marca como fallida y, si el usuario
    /// había pagado por adelantado (caso Compra), se le devuelve el saldo.
    /// </summary>
    private async Task RevertirAsync(Transaccion transaccion, CancellationToken ct)
    {
        await using var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct);

        transaccion.MarcarComoFallida("La transacción revirtió en la blockchain (recibo con Status = 0).");

        if (transaccion.Tipo == TipoTransaccion.Compra && transaccion.MarcarComoCompensada())
        {
            var usuario = await _usuarioRepository.ObtenerPorIdAsync(transaccion.UsuarioId, ct);

            if (usuario is null)
            {
                _logger.LogCritical(
                    "La compra {TransaccionId} revirtió pero el usuario {UsuarioId} no existe. " +
                    "No se reembolsaron {Monto} GTQ.",
                    transaccion.Id, transaccion.UsuarioId, transaccion.MontoGTQ);
            }
            else
            {
                usuario.AcreditarGTQ(transaccion.MontoGTQ);
                _usuarioRepository.Actualizar(usuario);

                _logger.LogWarning(
                    "Compra {TransaccionId} revirtió on-chain: se reembolsaron {Monto} GTQ al usuario {UsuarioId}",
                    transaccion.Id, transaccion.MontoGTQ, usuario.Id);
            }
        }

        _transaccionRepository.Actualizar(transaccion);
        await _unidadDeTrabajo.GuardarCambiosAsync(ct);
        await tx.ConfirmarAsync(ct);
    }
}
