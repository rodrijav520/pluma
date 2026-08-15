/**
 * Tipo de cambio USD→GTQ.
 * Fuente primaria: open.er-api.com (gratis, sin API key, CORS abierto).
 * El Banguat publica el TC de referencia oficial (SOAP), documentado para fase 2.
 * Siempre hay un valor de respaldo para que la demo funcione offline.
 */

export const TC_RESPALDO = 7.7;

export type Fx = {
  rate: number;
  ts: number | null; // null = valor de respaldo, no en vivo
  fuente: 'live' | 'cache' | 'respaldo';
};

export async function fetchTipoCambio(): Promise<{ rate: number; ts: number }> {
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), 10_000);
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { result: string; rates?: Record<string, number> };
    const gtq = data.rates?.GTQ;
    if (data.result !== 'success' || !gtq || gtq < 5 || gtq > 12) {
      throw new Error('respuesta inválida');
    }
    return { rate: gtq, ts: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}
