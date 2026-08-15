import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Address, Hash } from 'viem';
import {
  fetchTransfers,
  getBlockNumber,
  getGasBalance,
  getUsdcBalance,
} from '../core/chain';

export type Tx = {
  hash: string;
  dir: 'in' | 'out';
  /** unidades de USDC (6 decimales) como string */
  units: string;
  otra: string; // la otra dirección
  ts: number;
  block: string;
  status: 'pendiente' | 'ok' | 'fallo';
  concepto?: string;
  /** TC GTQ al momento de registrarse (para "equivalente cuando llegó") */
  gtqRate?: number;
};

/** Ventana inicial de escaneo si no conocemos el bloque de creación (~1 día de Base) */
const VENTANA_INICIAL = 45_000n;
const BLOQUE_SEG = 2; // Base produce ~1 bloque cada 2 s

type ChainState = {
  usdc: string; // unidades como string
  gas: string; // wei como string
  txs: Tx[];
  ultimoEscaneo: string | null;
  cargando: boolean;
  errorRed: boolean;
  actualizado: number | null;
  refrescar: (address: Address, bloqueCreacion?: string | null, gtqRate?: number) => Promise<void>;
  agregarPendiente: (tx: Tx) => void;
  resolverPendiente: (hash: Hash, ok: boolean, block?: bigint) => void;
  limpiar: () => void;
};

export const useChain = create<ChainState>()(
  persist(
    (set, get) => ({
      usdc: '0',
      gas: '0',
      txs: [],
      ultimoEscaneo: null,
      cargando: false,
      errorRed: false,
      actualizado: null,

      refrescar: async (address, bloqueCreacion, gtqRate) => {
        if (get().cargando) return;
        set({ cargando: true });
        try {
          const [usdc, gas, actual] = await Promise.all([
            getUsdcBalance(address),
            getGasBalance(address),
            getBlockNumber(),
          ]);

          let desde: bigint;
          const previo = get().ultimoEscaneo;
          if (previo) {
            desde = BigInt(previo) + 1n;
          } else if (bloqueCreacion) {
            desde = BigInt(bloqueCreacion);
          } else {
            desde = actual > VENTANA_INICIAL ? actual - VENTANA_INICIAL : 0n;
          }

          let nuevos: Tx[] = [];
          let escaneadoHasta = previo ? BigInt(previo) : desde - 1n;

          if (desde <= actual) {
            const { transfers, scannedTo } = await fetchTransfers(address, desde, actual);
            escaneadoHasta = scannedTo;
            const me = address.toLowerCase();
            const ahora = Date.now();
            nuevos = transfers.map((t) => {
              const saliente = t.from.toLowerCase() === me;
              const edadMs = Number(actual - t.blockNumber) * BLOQUE_SEG * 1000;
              return {
                hash: t.hash,
                dir: saliente ? ('out' as const) : ('in' as const),
                units: t.value.toString(),
                otra: saliente ? t.to : t.from,
                ts: ahora - edadMs,
                block: t.blockNumber.toString(),
                status: 'ok' as const,
                gtqRate,
              };
            });
          }

          set((s) => {
            const porHash = new Map<string, Tx>();
            for (const tx of s.txs) porHash.set(tx.hash, tx);
            for (const tx of nuevos) {
              const existente = porHash.get(tx.hash);
              // conserva concepto/ts/gtqRate de un pendiente que ahora se confirma
              porHash.set(tx.hash, existente ? { ...tx, ...{ concepto: existente.concepto, ts: existente.ts, gtqRate: existente.gtqRate ?? tx.gtqRate }, status: 'ok' } : tx);
            }
            const lista = [...porHash.values()].sort((a, b) => b.ts - a.ts).slice(0, 200);
            return {
              usdc: usdc.toString(),
              gas: gas.toString(),
              txs: lista,
              ultimoEscaneo: escaneadoHasta.toString(),
              cargando: false,
              errorRed: false,
              actualizado: Date.now(),
            };
          });
        } catch {
          set({ cargando: false, errorRed: true });
        }
      },

      agregarPendiente: (tx) => set((s) => ({ txs: [tx, ...s.txs] })),

      resolverPendiente: (hash, ok, block) =>
        set((s) => ({
          txs: s.txs.map((t) =>
            t.hash === hash
              ? { ...t, status: ok ? 'ok' : 'fallo', block: block ? block.toString() : t.block }
              : t,
          ),
        })),

      limpiar: () =>
        set({ usdc: '0', gas: '0', txs: [], ultimoEscaneo: null, actualizado: null, errorRed: false }),
    }),
    {
      name: 'pluma.chain',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ usdc: s.usdc, gas: s.gas, txs: s.txs, ultimoEscaneo: s.ultimoEscaneo, actualizado: s.actualizado }),
    },
  ),
);
