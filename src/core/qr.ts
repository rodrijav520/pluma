import { isAddress } from 'viem';
import { unitsToUsd } from './format';

/**
 * Interpreta el contenido de un QR de pago:
 * - dirección cruda: 0xabc…
 * - EIP-681 transfer de token: ethereum:0xTOKEN@84532/transfer?address=0xDEST&uint256=25000000
 * - EIP-681 simple: ethereum:0xDEST@84532
 */
export function parseQrPago(data: string): { address: string; usd?: number } | null {
  const s = data.trim();

  if (isAddress(s)) return { address: s };

  if (s.toLowerCase().startsWith('ethereum:')) {
    const sinEsquema = s.slice('ethereum:'.length);
    const [ruta, query = ''] = sinEsquema.split('?');
    const params = new URLSearchParams(query);

    if (ruta.includes('/transfer')) {
      const dest = params.get('address');
      const unidades = params.get('uint256');
      if (dest && isAddress(dest)) {
        return {
          address: dest,
          usd: unidades && /^\d+$/.test(unidades) ? unitsToUsd(BigInt(unidades)) : undefined,
        };
      }
      return null;
    }

    const objetivo = ruta.split('@')[0].split('/')[0];
    if (isAddress(objetivo)) return { address: objetivo };
  }

  return null;
}
