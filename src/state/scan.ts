import { create } from 'zustand';

/** Canal efímero entre el escáner QR y la pantalla de envío. */
type ScanState = {
  resultado: { address: string; usd?: number } | null;
  setResultado: (r: ScanState['resultado']) => void;
  consumir: () => ScanState['resultado'];
};

export const useScan = create<ScanState>((set, get) => ({
  resultado: null,
  setResultado: (resultado) => set({ resultado }),
  consumir: () => {
    const r = get().resultado;
    set({ resultado: null });
    return r;
  },
}));
