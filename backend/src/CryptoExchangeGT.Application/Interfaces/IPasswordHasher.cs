namespace CryptoExchangeGT.Application.Interfaces;

public interface IPasswordHasher
{
    string Hashear(string passwordPlano);
    bool Verificar(string passwordPlano, string hashGuardado);
}