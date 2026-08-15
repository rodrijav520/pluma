import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LearnState = {
  /** leccionId → { aciertos, total, en } */
  completadas: Record<string, { aciertos: number; total: number; en: number }>;
  completar: (id: string, aciertos: number, total: number) => void;
  plumas: () => number;
  limpiar: () => void;
};

export const useLearn = create<LearnState>()(
  persist(
    (set, get) => ({
      completadas: {},
      completar: (id, aciertos, total) =>
        set((s) => ({
          completadas: { ...s.completadas, [id]: { aciertos, total, en: Date.now() } },
        })),
      plumas: () => Object.keys(get().completadas).length,
      limpiar: () => set({ completadas: {} }),
    }),
    { name: 'pluma.learn', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
