/** Formateo de montos, fechas y direcciones. USDC usa 6 decimales. */

export const USDC_DECIMALS = 6;

export function unitsToUsd(units: bigint): number {
  return Number(units) / 10 ** USDC_DECIMALS;
}

export function usdToUnits(usd: number): bigint {
  return BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
}

const nfUsd = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfGtq = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfRate = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtUsd(n: number): string {
  return `$${nfUsd.format(n)}`;
}

export function fmtGtq(n: number): string {
  return `Q${nfGtq.format(n)}`;
}

export function fmtRate(n: number): string {
  return `Q${nfRate.format(n)}`;
}

export function fmtUnitsUsd(units: bigint): string {
  return fmtUsd(unitsToUsd(units));
}

export function shortAddr(addr?: string | null, chars = 4): string {
  if (!addr) return '—';
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function shortHash(hash?: string | null): string {
  if (!hash) return '—';
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fmtDia(ts: number): string {
  const d = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 86400000);
  const mismo = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (mismo(d, hoy)) return 'Hoy';
  if (mismo(d, ayer)) return 'Ayer';
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function fmtHora(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export function fmtFechaHora(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${fmtHora(ts)}`;
}

/** Parsea entrada del usuario tipo "1,250.50" o "1250,5" a número. */
export function parseMonto(raw: string): number {
  const limpio = raw.replace(/\s/g, '').replace(/,/g, '.');
  const partes = limpio.split('.');
  const normal = partes.length > 2 ? `${partes.slice(0, -1).join('')}.${partes.at(-1)}` : limpio;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
