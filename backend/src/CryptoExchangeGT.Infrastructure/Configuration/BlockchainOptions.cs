using System.ComponentModel.DataAnnotations;

namespace CryptoExchangeGT.Infrastructure.Configuration;

public class BlockchainOptions
{
    public const string Seccion = "Blockchain";

    [Required(ErrorMessage = "Blockchain:RpcUrl es obligatorio.")]
    [Url(ErrorMessage = "Blockchain:RpcUrl debe ser una URL válida.")]
    public string RpcUrl { get; set; } = string.Empty;

    [Required(ErrorMessage = "Blockchain:DireccionContratoToken es obligatorio.")]
    [RegularExpression("^0x[a-fA-F0-9]{40}$",
        ErrorMessage = "Blockchain:DireccionContratoToken no tiene formato Ethereum válido.")]
    public string DireccionContratoToken { get; set; } = string.Empty;

    /// <summary>
    /// Decimales del token. USDT usa 6, no los 18 de ETH. Antes estaba fijo en
    /// una constante del servicio: cambiar de token obligaba a recompilar.
    /// </summary>
    [Range(0, 18, ErrorMessage = "Blockchain:DecimalesToken debe estar entre 0 y 18.")]
    public int DecimalesToken { get; set; } = 6;

    /// <summary>
    /// Id de la cadena. Firmar con el chain id correcto (EIP-155) evita que una
    /// transacción firmada para testnet pueda reproducirse en mainnet.
    /// 11155111 = Sepolia, 1 = Ethereum mainnet.
    /// </summary>
    [Range(1, long.MaxValue, ErrorMessage = "Blockchain:ChainId debe ser positivo.")]
    public long ChainId { get; set; } = 11155111;

    /// <summary>Límite de gas para transferencias ERC-20; 21000 solo alcanza para envíos nativos.</summary>
    [Range(21_000, 1_000_000)]
    public int GasLimiteTransferencia { get; set; } = 100_000;
}
