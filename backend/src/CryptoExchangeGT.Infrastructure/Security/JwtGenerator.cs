using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CryptoExchangeGT.Infrastructure.Security;

public class JwtGenerator : IJwtGenerator
{
    private readonly JwtOptions _opciones;

    public JwtGenerator(IOptions<JwtOptions> opciones)
    {
        _opciones = opciones.Value;
    }

    public string GenerarToken(Usuario usuario)
    {
        var ahora = DateTime.UtcNow;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(ahora).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),

            // El rol viaja en el token para que las políticas de autorización lo
            // resuelvan sin ir a la base en cada request. Los casos de uso que
            // mueven dinero igual lo revalidan contra la base, porque un rol
            // revocado sigue vivo en tokens ya emitidos hasta que expiren.
            new(ClaimTypes.Role, usuario.Rol.ToString())
        };

        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.ClaveSecreta));
        var credenciales = new SigningCredentials(clave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opciones.Emisor,
            audience: _opciones.Audiencia,   // antes no se emitía audiencia y la validación estaba apagada
            claims: claims,
            notBefore: ahora,
            expires: ahora.AddMinutes(_opciones.ExpiracionMinutos),
            signingCredentials: credenciales);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
