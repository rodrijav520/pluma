using System.IdentityModel.Tokens.Jwt;
using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.UseCases;
using CryptoExchangeGT.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CryptoExchangeGT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
[EnableRateLimiting("operaciones")]
public class TransaccionesController : ControllerBase
{
    private readonly ComprarCriptoUseCase _comprarCriptoUseCase;
    private readonly EnviarAWalletExternaUseCase _enviarAWalletExternaUseCase;
    private readonly ConvertirCriptoAGtqUseCase _convertirCriptoAGtqUseCase;
    private readonly DepositarGtqUseCase _depositarGtqUseCase;
    private readonly ConsultarSaldoUseCase _consultarSaldoUseCase;
    private readonly ObtenerHistorialUseCase _obtenerHistorialUseCase;

    public TransaccionesController(
        ComprarCriptoUseCase comprarCriptoUseCase,
        EnviarAWalletExternaUseCase enviarAWalletExternaUseCase,
        ConvertirCriptoAGtqUseCase convertirCriptoAGtqUseCase,
        DepositarGtqUseCase depositarGtqUseCase,
        ConsultarSaldoUseCase consultarSaldoUseCase,
        ObtenerHistorialUseCase obtenerHistorialUseCase)
    {
        _comprarCriptoUseCase = comprarCriptoUseCase;
        _enviarAWalletExternaUseCase = enviarAWalletExternaUseCase;
        _convertirCriptoAGtqUseCase = convertirCriptoAGtqUseCase;
        _depositarGtqUseCase = depositarGtqUseCase;
        _consultarSaldoUseCase = consultarSaldoUseCase;
        _obtenerHistorialUseCase = obtenerHistorialUseCase;
    }

    /// <summary>
    /// Id del usuario según el claim `sub` del token.
    ///
    /// Esta es la pieza que cierra el IDOR: el id nunca sale del body, que es
    /// atacante-controlado. Los DTOs de request ya ni siquiera tienen el campo.
    /// </summary>
    private Guid UsuarioIdDelToken
    {
        get
        {
            var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
                        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (claim is null || !Guid.TryParse(claim.Value, out var usuarioId))
                throw new UnauthorizedAccessException("Token inválido.");

            return usuarioId;
        }
    }

    /// <summary>Compra cripto con saldo en quetzales.</summary>
    [HttpPost("comprar")]
    [ProducesResponseType(typeof(ComprarCriptoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Comprar([FromBody] ComprarCriptoRequest request, CancellationToken ct)
        => Ok(await _comprarCriptoUseCase.EjecutarAsync(UsuarioIdDelToken, request, ct));

    /// <summary>Envía cripto a una dirección externa. Irreversible.</summary>
    [HttpPost("enviar-externo")]
    [ProducesResponseType(typeof(EnviarAWalletExternaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> EnviarAWalletExterna(
        [FromBody] EnviarAWalletExternaRequest request, CancellationToken ct)
        => Ok(await _enviarAWalletExternaUseCase.EjecutarAsync(UsuarioIdDelToken, request, ct));

    /// <summary>
    /// Convierte cripto a quetzales. El saldo se acredita cuando la transacción
    /// se confirma on-chain, no al momento de la solicitud.
    /// </summary>
    [HttpPost("convertir-a-gtq")]
    [ProducesResponseType(typeof(ConvertirCriptoAGtqResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> ConvertirAGtq(
        [FromBody] ConvertirCriptoAGtqRequest request, CancellationToken ct)
        => Ok(await _convertirCriptoAGtqUseCase.EjecutarAsync(UsuarioIdDelToken, request, ct));

    /// <summary>Saldo en quetzales y en cripto del usuario autenticado.</summary>
    [HttpGet("saldo")]
    [ProducesResponseType(typeof(SaldoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerSaldo(CancellationToken ct)
        => Ok(await _consultarSaldoUseCase.EjecutarAsync(UsuarioIdDelToken, ct));

    /// <summary>Historial de transacciones, paginado.</summary>
    [HttpGet("historial")]
    [ProducesResponseType(typeof(HistorialResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerHistorial(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanioPagina = ObtenerHistorialUseCase.TamanioPaginaPorDefecto,
        CancellationToken ct = default)
        => Ok(await _obtenerHistorialUseCase.EjecutarAsync(UsuarioIdDelToken, pagina, tamanioPagina, ct));

    /// <summary>
    /// Acredita quetzales a un usuario. Solo administradores.
    /// </summary>
    /// <remarks>
    /// Antes cualquier usuario autenticado podía llamarlo sobre su propia cuenta
    /// y acreditarse saldo ilimitado sin ningún pago. Ahora exige rol de
    /// administrador, no permite auto-acreditarse, y la referencia externa del
    /// pago es única para que el mismo depósito no se registre dos veces.
    ///
    /// Sigue siendo un mecanismo manual de respaldo: lo correcto es que el
    /// depósito lo dispare el webhook de la pasarela de pago.
    /// </remarks>
    [HttpPost("depositar")]
    [Authorize(Policy = PoliticasDeAutorizacion.SoloAdministradores)]
    [ProducesResponseType(typeof(DepositarGtqResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Depositar([FromBody] DepositarGtqRequest request, CancellationToken ct)
        => Ok(await _depositarGtqUseCase.EjecutarAsync(UsuarioIdDelToken, request, ct));
}

public static class PoliticasDeAutorizacion
{
    public const string SoloAdministradores = "SoloAdministradores";

    public static string RolAdministrador => RolUsuario.Administrador.ToString();
}
