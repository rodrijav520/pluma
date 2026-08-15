import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Address } from 'viem';

/**
 * Estado de la app (NO sensible — la frase y el PIN viven en SecureStore).
 */

type AppState = {
  address: Address | null;
  onboarded: boolean;
  pinSet: boolean;
  bioActiva: boolean;
  bloqueada: boolean;
  /** bloque de creación de la wallet (para acotar el escaneo histórico) */
  bloqueCreacion: string | null;
  nombre: string;
  setWallet: (address: Address, bloqueCreacion: bigint | null) => void;
  setPinSet: (v: boolean) => void;
  setBioActiva: (v: boolean) => void;
  setBloqueada: (v: boolean) => void;
  setNombre: (n: string) => void;
  resetear: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      address: null,
      onboarded: false,
      pinSet: false,
      bioActiva: false,
      bloqueada: false,
      bloqueCreacion: null,
      nombre: '',
      setWallet: (address, bloqueCreacion) =>
        set({
          address,
          onboarded: true,
          bloqueCreacion: bloqueCreacion ? bloqueCreacion.toString() : null,
        }),
      setPinSet: (v) => set({ pinSet: v }),
      setBioActiva: (v) => set({ bioActiva: v }),
      setBloqueada: (v) => set({ bloqueada: v }),
      setNombre: (n) => set({ nombre: n }),
      resetear: () =>
        set({
          address: null,
          onboarded: false,
          pinSet: false,
          bioActiva: false,
          bloqueada: false,
          bloqueCreacion: null,
          nombre: '',
        }),
    }),
    {
      name: 'pluma.app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        address: s.address,
        onboarded: s.onboarded,
        pinSet: s.pinSet,
        bioActiva: s.bioActiva,
        bloqueCreacion: s.bloqueCreacion,
        nombre: s.nombre,
      }),
    },
  ),
);
