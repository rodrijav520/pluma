using CryptoExchangeGT.Application.DTOs;
using CryptoExchangeGT.Application.Interfaces;
using CryptoExchangeGT.Application.Seguridad;
using CryptoExchangeGT.Domain.Entities;
using CryptoExchangeGT.Domain.Exceptions;
using CryptoExchangeGT.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace CryptoExchangeGT.Application.UseCases;

public class RegistrarUsuarioUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IWalletCustodiaRepository _walletRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICryptoWalletService _cryptoWalletService;
    private readonly IEncriptacionService _encriptacionService;
    private readonly ITesoreriaProvider _tesoreriaProvider;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private readonly ILogger<RegistrarUsuarioUseCase> _logger;

    /// <summary>
    /// ETH que la tesorería adelanta a cada wallet nueva para que pueda pagar
    /// el gas de sus primeras operaciones.
    /// </summary>
    private const decimal MontoGasInicial = 0.005m;

    public RegistrarUsuarioUseCase(
        IUsuarioRepository usuarioRepository,
        IWalletCustodiaRepository walletRepository,
        IPasswordHasher passwordHasher,
        ICryptoWalletService cryptoWalletService,
        IEncriptacionService encriptacionService,
        ITesoreriaProvider tesoreriaProvider,
        IUnidadDeTrabajo unidadDeTrabajo,
        ILogger<RegistrarUsuarioUseCase> logger)
    {
        _usuarioRepository = usuarioRepository;
        _walletRepository = walletRepository;
        _passwordHasher = passwordHasher;
        _cryptoWalletService = cryptoWalletService;
        _encriptacionService = encriptacionService;
        _tesoreriaProvider = tesoreriaProvider;
        _unidadDeTrabajo = unidadDeTrabajo;
        _logger = logger;
    }

    public async Task<RegistroResponse> EjecutarAsync(RegistroRequest request, CancellationToken ct = default)
    {
        PoliticaDeContrasenia.Validar(request.Password);

        var email = Usuario.NormalizarEmail(request.Email);

        if (await _usuarioRepository.ExisteEmailAsync(email, ct))
            throw new ReglaDeNegocioException("Ya existe un usuario con ese email.");

        var passwordHash = _passwordHasher.Hashear(request.Password);
        var usuario = Usuario.Crear(request.NombreCompleto, email, passwordHash);

        var (direccionPublica, llavePrivada) = _cryptoWalletService.GenerarWallet();
        var wallet = WalletCustodia.Crear(
            usuario.Id, direccionPublica, _encriptacionService.Cifrar(llavePrivada));

        // Usuario y wallet se crean juntos o no se crea ninguno. Antes eran dos
        // escrituras separadas: si la segunda fallaba quedaba un usuario sin
        // wallet, que después rompía todos los endpoints de transacciones.
        await using (var tx = await _unidadDeTrabajo.IniciarTransaccionAsync(ct))
        {
            _usuarioRepository.Agregar(usuario);
            _walletRepository.Agregar(wallet);

            await _unidadDeTrabajo.GuardarCambiosAsync(ct);
            await tx.ConfirmarAsync(ct);
        }

        _logger.LogInformation("Usuario {UsuarioId} registrado con wallet {Direccion}",
            usuario.Id, direccionPublica);

        var gasPatrocinado = await PatrocinarGasAsync(wallet, ct);

        return new RegistroResponse
        {
            UsuarioId = usuario.Id,
            Email = usuario.Email,
            WalletDireccionPublica = wallet.DireccionPublica,
            GasPatrocinado = gasPatrocinado
        };
    }

    /// <summary>
    /// Adelanta ETH para gas. Es deliberadamente no bloqueante: si falla, el
    /// registro se mantiene y la wallet queda marcada como no patrocinada, para
    /// que un proceso administrativo pueda reintentarlo.
    ///
    /// La diferencia con la versión anterior es que antes el fallo se tragaba
    /// con un `catch { }` vacío: nadie se enteraba, y no quedaba forma de saber
    /// qué wallets habían quedado sin gas.
    /// </summary>
    private async Task<bool> PatrocinarGasAsync(WalletCustodia wallet, CancellationToken ct)
    {
        try
        {
            var hash = await _cryptoWalletService.EnviarEthNativoAsync(
                _tesoreriaProvider.ObtenerLlavePrivadaDescifrada(),
                wallet.DireccionPublica,
                MontoGasInicial,
                ct);

            wallet.MarcarGasPatrocinado();
            _walletRepository.Actualizar(wallet);
            await _unidadDeTrabajo.GuardarCambiosAsync(ct);

            _logger.LogInformation(
                "Gas patrocinado para {Direccion}: {Monto} ETH, hash {Hash}",
                wallet.DireccionPublica, MontoGasInicial, hash);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "No se pudo patrocinar gas para la wallet {Direccion} del usuario {UsuarioId}. " +
                "La wallet queda operativa pero sin fondos para pagar gas; " +
                "requiere reintento administrativo.",
                wallet.DireccionPublica, wallet.UsuarioId);

            return false;
        }
    }
}
