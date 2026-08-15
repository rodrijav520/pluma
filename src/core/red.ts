/**
 * Consultas directas a la red Sepolia.
 *
 * Van contra el RPC público, sin pasar por el backend: son datos abiertos de la
 * cadena y no necesitan sesión. Sirven para responder una pregunta concreta que
 * el backend no expone: "¿tengo gas para operar?".
 *
 * El gas es lo que cobra la red por procesar una transacción, y se paga en ETH.
 * La tesorería le adelanta un poco a cada cuenta nueva; si esa cuenta se queda
 * sin ETH, sus operaciones fallan aunque tenga saldo.
 */

const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const TIMEOUT_MS = 10000;

/** Mínimo que el backend adelanta por cuenta (RegistrarUsuarioUseCase). */
export const GAS_INICIAL_ETH = 0.005;

/** Por debajo de esto, una transferencia ERC-20 puede no alcanzar a pagarse. */
export const GAS_MINIMO_ETH = 0.0005;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: control.signal,
    });
    if (!r.ok) throw new Error(`RPC ${r.status}`);
    const j = (await r.json()) as { result?: T; error?: { message: string } };
    if (j.error) throw new Error(j.error.message);
    if (j.result === undefined) throw new Error('Respuesta vacía del RPC.');
    return j.result;
  } finally {
    clearTimeout(t);
  }
}

/** Wei (hex) → ETH. Se hace con BigInt: 1e18 no cabe en un número seguro. */
function weiAEth(hex: string): number {
  const wei = BigInt(hex);
  const entero = wei / 10n ** 18n;
  const resto = wei % 10n ** 18n;
  return Number(entero) + Number(resto) / 1e18;
}

export type EstadoRed = {
  /** ETH disponible para gas en la dirección consultada. */
  eth: number;
  /** Último bloque visto: prueba de que la red respondió ahora, no de caché. */
  bloque: number;
  /** false = no alcanza para pagar una transferencia. */
  puedeOperar: boolean;
};

export async function consultarRed(direccion: string): Promise<EstadoRed> {
  const [saldoHex, bloqueHex] = await Promise.all([
    rpc<string>('eth_getBalance', [direccion, 'latest']),
    rpc<string>('eth_blockNumber', []),
  ]);

  const eth = weiAEth(saldoHex);
  return {
    eth,
    bloque: Number(BigInt(bloqueHex)),
    puedeOperar: eth >= GAS_MINIMO_ETH,
  };
}

/** 0.005 ETH → "0.005000". Seis decimales: por debajo de eso no dice nada útil. */
export function formatoEth(eth: number): string {
  if (eth === 0) return '0';
  if (eth < 0.000001) return '< 0.000001';
  return eth.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}
