import { create } from 'zustand';

export type ToastTipo = 'ok' | 'error' | 'info';

type Toast = { id: number; texto: string; tipo: ToastTipo };

type ToastState = {
  toasts: Toast[];
  online: boolean;
  avisar: (texto: string, tipo?: ToastTipo) => void;
  quitar: (id: number) => void;
  setOnline: (v: boolean) => void;
};

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  online: true,
  avisar: (texto, tipo = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, texto, tipo }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800);
  },
  quitar: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setOnline: (v) => set({ online: v }),
}));
