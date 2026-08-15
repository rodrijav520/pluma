using CryptoExchangeGT.Domain.Exceptions;

namespace CryptoExchangeGT.Domain.Entities;

public class WalletCustodia
{
    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string DireccionPublica { get; private set; } = null!;
    public string LlavePrivadaCifrada { get; private set; } = null!;
    public decimal SaldoCriptoCacheado { get; private set; }

    /// <summary>
    /// Si la tesorería ya le transfirió el ETH inicial para pagar gas. Antes el
    /// fallo del patrocinio se tragaba en silencio y no quedaba forma de saber
    /// qué wallets habían quedado sin fondos para operar.
    /// </summary>
    public bool GasPatrocinado { get; private set; }

    public DateTime FechaCreacion { get; private set; }
    public DateTime FechaUltimaSincronizacion { get; private set; }

    /// <summary>Token de concurrencia optimista. Ver Usuario.Version.</summary>
    public Guid Version { get; private set; }

    private WalletCustodia() { }

    public static WalletCustodia Crear(Guid usuarioId, string direccionPublica, string llavePrivadaCifrada)
    {
        if (string.IsNullOrWhiteSpace(direccionPublica))
            throw new ReglaDeNegocioException("La dirección pública es obligatoria.");

        if (string.IsNullOrWhiteSpace(llavePrivadaCifrada))
            throw new ReglaDeNegocioException("La llave privada cifrada es obligatoria.");

        return new WalletCustodia
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            DireccionPublica = direccionPublica,
            LlavePrivadaCifrada = llavePrivadaCifrada,
            SaldoCriptoCacheado = 0m,
            GasPatrocinado = false,
            FechaCreacion = DateTime.UtcNow,
            FechaUltimaSincronizacion = DateTime.UtcNow,
            Version = Guid.NewGuid()
        };
    }

    public void ActualizarSaldoCacheado(decimal nuevoSaldo)
    {
        if (nuevoSaldo < 0)
            throw new ReglaDeNegocioException("El saldo no puede ser negativo.");

        SaldoCriptoCacheado = nuevoSaldo;
        FechaUltimaSincronizacion = DateTime.UtcNow;
        Version = Guid.NewGuid();
    }

    public void MarcarGasPatrocinado()
    {
        GasPatrocinado = true;
        Version = Guid.NewGuid();
    }
}
