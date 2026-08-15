using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

public class LoginUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtGenerator _jwtGenerator;
    private readonly ILogger<LoginUseCase> _logger;

    /// <summary>
    /// Hash de una contraseña cualquiera, usado para gastar el mismo tiempo de
    /// verificación cuando el email no existe. Sin esto, un atacante distingue
    /// "email no registrado" de "contraseña incorrecta" midiendo cuánto tarda la
    /// respuesta, porque BCrypt es deliberadamente lento y no llegar a
    /// ejecutarlo se nota.
    /// </summary>
    private static readonly string HashSenuelo =
        "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    public LoginUseCase(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        IJwtGenerator jwtGenerator,
        ILogger<LoginUseCase> logger)
    {
        _usuarioRepository = usuarioRepository;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _logger = logger;
    }

    public async Task<LoginResponse> EjecutarAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var usuario = await _usuarioRepository.ObtenerPorEmailAsync(email, ct);

        var passwordValido = usuario is null
            ? VerificarSenuelo(request.Password)
            : _passwordHasher.Verificar(request.Password, usuario.PasswordHash);

        if (usuario is null || !passwordValido)
        {
            // El mensaje es idéntico en ambos casos: decir "ese email no existe"
            // le confirmaría a un atacante qué cuentas son reales.
            _logger.LogWarning("Intento de login fallido para {Email}", email);
            throw new CredencialesInvalidasException();
        }

        var token = _jwtGenerator.GenerarToken(usuario);

        _logger.LogInformation("Login exitoso del usuario {UsuarioId}", usuario.Id);

        return new LoginResponse
        {
            Token = token,
            UsuarioId = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Rol = usuario.Rol.ToString()
        };
    }

    private bool VerificarSenuelo(string password)
    {
        _passwordHasher.Verificar(password ?? string.Empty, HashSenuelo);
        return false;
    }
}
