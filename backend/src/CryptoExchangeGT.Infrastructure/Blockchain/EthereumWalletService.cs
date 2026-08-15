using System.Numerics;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using CryptoExchangeGT.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Nethereum.Hex.HexTypes;
using Nethereum.Util;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;

namespace CryptoExchangeGT.Infrastructure.Blockchain;

public class EthereumWalletService : ICryptoWalletService
{
    private readonly BlockchainOptions _opciones;
    private readonly ILogger<EthereumWalletService> _logger;

    /// <summary>Dirección a la que enviar fondos equivale a quemarlos.</summary>
    private const string DireccionCero = "0x0000000000000000000000000000000000000000";

    // ABI mínimo del estándar ERC-20: solo las funciones que necesitamos usar.
    private const string AbiErc20Minimo = @"[
        {'constant':true,'inputs':[{'name':'_owner','type':'address'}],'name':'balanceOf','outputs':[{'name':'balance','type':'uint256'}],'type':'function'},
        {'constant':false,'inputs':[{'name':'_to','type':'address'},{'name':'_value','type':'uint256'}],'name':'transfer','outputs':[{'name':'','type':'bool'}],'type':'function'}
    ]";

    public EthereumWalletService(BlockchainOptions opciones, ILogger<EthereumWalletService> logger)
    {
        _opciones = opciones;
        _logger = logger;
    }

    public (string direccionPublica, string llavePrivada) GenerarWallet()
    {
        var ecKey = Nethereum.Signer.EthECKey.GenerateKey();
        return (ecKey.GetPublicAddress(), ecKey.GetPrivateKey());
    }

    /// <summary>
    /// Antes solo se comprobaba que la cadena no estuviera vacía, así que una
    /// dirección mal escrita llegaba hasta el envío. En blockchain eso significa
    /// perder los fondos sin posibilidad de reversa.
    /// </summary>
    public bool EsDireccionValida(string direccion)
    {
        if (string.IsNullOrWhiteSpace(direccion))
            return false;

        var util = new AddressUtil();

        if (!util.IsValidEthereumAddressHexFormat(direccion))
            return false;

        if (string.Equals(direccion, DireccionCero, StringComparison.OrdinalIgnoreCase))
            return false;

        // Enviar el token a su propio contrato es otra forma habitual de perder
        // fondos: la mayoría de los ERC-20 no tienen manera de recuperarlos.
        if (string.Equals(direccion, _opciones.DireccionContratoToken, StringComparison.OrdinalIgnoreCase))
            return false;

        // Si viene con mayúsculas y minúsculas mezcladas, es un checksum EIP-55
        // y tiene que ser válido. Todo-minúsculas o todo-mayúsculas se acepta,
        // porque en ese caso no hay checksum que verificar.
        var sinPrefijo = direccion[2..];
        var tieneMezcla = sinPrefijo.Any(char.IsUpper) && sinPrefijo.Any(char.IsLower);

        if (tieneMezcla && !util.IsChecksumAddress(direccion))
            return false;

        return true;
    }

    public async Task<decimal> ConsultarSaldoAsync(string direccionPublica, CancellationToken ct = default)
    {
        var web3 = CrearWeb3();
        var contrato = web3.Eth.GetContract(AbiErc20Minimo, _opciones.DireccionContratoToken);
        var funcionBalanceOf = contrato.GetFunction("balanceOf");

        BigInteger saldo = await funcionBalanceOf.CallAsync<BigInteger>(direccionPublica);
        return ConvertirDeUnidadMinima(saldo);
    }

    public async Task<decimal> ConsultarSaldoEthAsync(string direccionPublica, CancellationToken ct = default)
    {
        var web3 = CrearWeb3();
        var saldo = await web3.Eth.GetBalance.SendRequestAsync(direccionPublica);
        return Web3.Convert.FromWei(saldo.Value);
    }

    public async Task<string> EnviarTransaccionAsync(
        string llavePrivadaOrigen, string direccionDestino, decimal monto, CancellationToken ct = default)
    {
        if (!EsDireccionValida(direccionDestino))
            throw new ReglaDeNegocioException($"La dirección destino '{direccionDestino}' no es válida.");

        var montoEnUnidadMinima = ConvertirAUnidadMinima(monto);

        if (montoEnUnidadMinima <= 0)
            throw new ReglaDeNegocioException(
                $"El monto {monto} es menor que la unidad mínima del token ({_opciones.DecimalesToken} decimales).");

        var cuenta = new Account(llavePrivadaOrigen, _opciones.ChainId);
        var web3 = new Web3(cuenta, _opciones.RpcUrl);
        var contrato = web3.Eth.GetContract(AbiErc20Minimo, _opciones.DireccionContratoToken);
        var funcionTransfer = contrato.GetFunction("transfer");

        // Los llamados a contratos necesitan más gas que el default de 21000.
        var gasLimite = new HexBigInteger(_opciones.GasLimiteTransferencia);

        Nethereum.RPC.Eth.DTOs.TransactionReceipt recibo;
        try
        {
            recibo = await funcionTransfer.SendTransactionAndWaitForReceiptAsync(
                cuenta.Address, gasLimite, null, null, direccionDestino, montoEnUnidadMinima);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo al transmitir la transferencia de {Monto} a {Destino}",
                monto, direccionDestino);
            throw new TransaccionBlockchainFallidaException(
                "No se pudo transmitir la transacción a la blockchain.", ex);
        }

        // La corrección clave: antes se devolvía recibo.TransactionHash sin
        // mirar el estado. Una transacción que revierte en la EVM también genera
        // recibo, y se contabilizaba como exitosa.
        if (recibo.Status is null || recibo.Status.Value != 1)
        {
            _logger.LogError(
                "La transferencia {Hash} revirtió en la blockchain (Status = {Status}).",
                recibo.TransactionHash, recibo.Status?.Value.ToString() ?? "null");

            throw new TransaccionBlockchainFallidaException(
                "La transacción revirtió en la blockchain.", recibo.TransactionHash);
        }

        return recibo.TransactionHash;
    }

    public async Task<string> EnviarEthNativoAsync(
        string llavePrivadaOrigen, string direccionDestino, decimal montoEth, CancellationToken ct = default)
    {
        if (!EsDireccionValida(direccionDestino))
            throw new ReglaDeNegocioException($"La dirección destino '{direccionDestino}' no es válida.");

        var cuenta = new Account(llavePrivadaOrigen, _opciones.ChainId);
        var web3 = new Web3(cuenta, _opciones.RpcUrl);

        // A diferencia de EnviarTransaccionAsync, esto es una transferencia
        // nativa de ETH: no involucra ningún contrato.
        var servicioTransferencia = web3.Eth.GetEtherTransferService();

        Nethereum.RPC.Eth.DTOs.TransactionReceipt recibo;
        try
        {
            recibo = await servicioTransferencia.TransferEtherAndWaitForReceiptAsync(
                direccionDestino, montoEth);
        }
        catch (Exception ex)
        {
            throw new TransaccionBlockchainFallidaException(
                "No se pudo transmitir la transferencia de ETH.", ex);
        }

        if (recibo.Status is null || recibo.Status.Value != 1)
            throw new TransaccionBlockchainFallidaException(
                "La transferencia de ETH revirtió en la blockchain.", recibo.TransactionHash);

        return recibo.TransactionHash;
    }

    public async Task<EstadoOnChain> ConsultarEstadoAsync(
        string hashTransaccion, CancellationToken ct = default)
    {
        var web3 = CrearWeb3();
        var recibo = await web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(hashTransaccion);

        if (recibo is null)
            return EstadoOnChain.Pendiente; // todavía en el mempool

        return recibo.Status is not null && recibo.Status.Value == 1
            ? EstadoOnChain.Exitosa
            : EstadoOnChain.Revertida;
    }

    private Web3 CrearWeb3() => new(_opciones.RpcUrl);

    /// <summary>
    /// Convierte a la unidad mínima del token con aritmética decimal exacta.
    ///
    /// La versión anterior hacía <c>new BigInteger(monto * (decimal)Math.Pow(10, 6))</c>:
    /// el constructor de BigInteger trunca hacia cero, así que cada operación
    /// perdía la fracción sobrante en silencio. Acá el truncado es explícito y
    /// el factor se calcula con potencias enteras, sin pasar por double.
    /// </summary>
    private BigInteger ConvertirAUnidadMinima(decimal monto)
    {
        var factor = FactorEscala();
        var escalado = decimal.Truncate(monto * factor);
        return new BigInteger(escalado);
    }

    private decimal ConvertirDeUnidadMinima(BigInteger valor) => (decimal)valor / FactorEscala();

    private decimal FactorEscala()
    {
        decimal factor = 1m;
        for (var i = 0; i < _opciones.DecimalesToken; i++)
            factor *= 10m;
        return factor;
    }
}
