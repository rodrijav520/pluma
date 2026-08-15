using CryptoExchangeGT.Domain.Entities;

namespace CryptoExchangeGT.Application.Interfaces;

public interface IJwtGenerator
{
    string GenerarToken(Usuario usuario);
}