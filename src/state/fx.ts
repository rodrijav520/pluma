import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTipoCambio, TC_RESPALDO } from '../core/fx';

type FxState = {
  rate: number;
  ts: number | null;
  fuente: 'live' | 'cache' | 'respaldo';
  refrescar: () => Promise<void>;
};

const SEIS_HORAS = 6 * 60 * 60 * 1000;

export const useFx = create<FxState>()(
  persist(
    (set, get) => ({
      rate: TC_RESPALDO,
      ts: null,
      fuente: 'respaldo',

      refrescar: async () => {
        const { ts } = get();
        if (ts && Date.now() - ts < SEIS_HORAS) return;
        try {
          const { rate, ts: nuevoTs } = await fetchTipoCambio();
          set({ rate, ts: nuevoTs, fuente: 'live' });
        } catch {
          // se queda el último valor conocido (cache) o el respaldo
          if (get().ts) set({ fuente: 'cache' });
        }
      },
    }),
    {
      name: 'pluma.fx',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ rate: s.rate, ts: s.ts, fuente: s.fuente }),
    },
  ),
);

/** Conversión helpers */
export const usdAGtq = (usd: number, rate: number) => usd * rate;
export const gtqAUsd = (gtq: number, rate: number) => (rate > 0 ? gtq / rate : 0);
