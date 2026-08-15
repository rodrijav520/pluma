/**
 * Formato de moneda.
 *
 * El freelancer guatemalteco vive en dos monedas, así que las dos se muestran
 * siempre y con el mismo cuidado. Nada de "moneda local" como letra chica.
 */

const gtq = new Intl.NumberFormat('es-GT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Q 3,847.20 */
export function quetzales(monto: number, conSigno = false): string {
  const signo = conSigno && monto > 0 ? '+' : monto < 0 ? '−' : '';
  return `${signo}Q ${gtq.format(Math.abs(monto))}`;
}

/** $ 496.41 */
export function dolares(monto: number, conSigno = false): string {
  const signo = conSigno && monto > 0 ? '+' : monto < 0 ? '−' : '';
  return `${signo}$ ${usd.format(Math.abs(monto))}`;
}

/**
 * Cripto con hasta 6 decimales — el token del backend tiene 6
 * (Blockchain:DecimalesToken). Se recortan los ceros de la derecha para que
 * "12.500000" se lea "12.5".
 */
export function cripto(monto: number): string {
  const texto = monto.toFixed(6).replace(/\.?0+$/, '');
  return texto === '' || texto === '-' ? '0' : texto;
}

/** 0x1c7D…7238 — nunca se muestra una dirección completa en una fila. */
export function direccionCorta(direccion: string): string {
  if (direccion.length <= 12) return direccion;
  return `${direccion.slice(0, 6)}…${direccion.slice(-4)}`;
}

/** "hoy 10:42" · "ayer 18:05" · "12 ago 09:30" */
export function fechaRelativa(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const hora = fecha.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const hoy = new Date();
  const mismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (mismoDia(fecha, hoy)) return `hoy ${hora}`;

  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (mismoDia(fecha, ayer)) return `ayer ${hora}`;

  const dia = fecha.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
  return `${dia} ${hora}`;
}
