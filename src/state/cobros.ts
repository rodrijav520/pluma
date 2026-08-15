import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tx } from './chain';

export type Cobro = {
  id: string;
  /** unidades USDC (string) */
  units: string;
  concepto: string;
  cliente?: string;
  creadoEn: number;
  /** bloque aproximado al crear (solo pagos posteriores cuentan) */
  bloqueCreacion: string | null;
  status: 'pendiente' | 'pagado' | 'archivado';
  pagoHash?: string;
  pagadoEn?: number;
  gtqRateAlCrear?: number;
};

type CobrosState = {
  items: Cobro[];
  crear: (c: Omit<Cobro, 'id' | 'creadoEn' | 'status'>) => Cobro;
  /** Cruza cobros pendientes con transferencias entrantes confirmadas. */
  reconciliar: (txs: Tx[]) => void;
  archivar: (id: string) => void;
  limpiar: () => void;
};

export const useCobros = create<CobrosState>()(
  persist(
    (set, get) => ({
      items: [],

      crear: (c) => {
        const nuevo: Cobro = {
          ...c,
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          creadoEn: Date.now(),
          status: 'pendiente',
        };
        set((s) => ({ items: [nuevo, ...s.items] }));
        return nuevo;
      },

      reconciliar: (txs) => {
        const { items } = get();
        if (!items.some((c) => c.status === 'pendiente')) return;

        const usados = new Set(items.filter((c) => c.pagoHash).map((c) => c.pagoHash));
        const entrantes = txs
          .filter((t) => t.dir === 'in' && t.status === 'ok' && !usados.has(t.hash))
          .sort((a, b) => a.ts - b.ts);

        let cambio = false;
        const actualizados = items.map((c) => {
          if (c.status !== 'pendiente') return c;
          const match = entrantes.find((t) => {
            if (usados.has(t.hash)) return false;
            if (BigInt(t.units) < BigInt(c.units)) return false;
            if (c.bloqueCreacion && BigInt(t.block) < BigInt(c.bloqueCreacion)) return false;
            return t.ts >= c.creadoEn - 5 * 60_000;
          });
          if (!match) return c;
          usados.add(match.hash);
          cambio = true;
          return { ...c, status: 'pagado' as const, pagoHash: match.hash, pagadoEn: match.ts };
        });

        if (cambio) set({ items: actualizados });
      },

      archivar: (id) =>
        set((s) => ({
          items: s.items.map((c) => (c.id === id ? { ...c, status: 'archivado' as const } : c)),
        })),

      limpiar: () => set({ items: [] }),
    }),
    { name: 'pluma.cobros', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
