using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.UseCases;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CryptoExchangeGT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly RegistrarUsuarioUseCase _registrarUsuarioUseCase;
    private readonly LoginUseCase _loginUseCase;

    public AuthController(RegistrarUsuarioUseCase registrarUsuarioUseCase, LoginUseCase loginUseCase)
    {
        _registrarUsuarioUseCase = registrarUsuarioUseCase;
        _loginUseCase = loginUseCase;
    }

    /// <summary>
    /// Registra un usuario, le crea una wallet custodial y le adelanta ETH para gas.
    /// </summary>
    /// <remarks>
    /// Con límite de tasa estricto: cada registro le cuesta 0.005 ETH a la
    /// tesorería, así que sin límite alguien podía drenarla registrando cuentas
    /// en bucle.
    /// </remarks>
    [HttpPost("registro")]
    [EnableRateLimiting("registro")]
    [ProducesResponseType(typeof(RegistroResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Registro([FromBody] RegistroRequest request, CancellationToken ct)
    {
        var resultado = await _registrarUsuarioUseCase.EjecutarAsync(request, ct);
        return CreatedAtAction(nameof(Registro), new { id = resultado.UsuarioId }, resultado);
    }

    /// <summary>Autentica al usuario y devuelve un JWT.</summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var resultado = await _loginUseCase.EjecutarAsync(request, ct);
        return Ok(resultado);
    }
}
