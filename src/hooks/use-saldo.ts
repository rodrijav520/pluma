import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api, ErrorApi, type SaldoResponse } from '../core/api';
import { useSesion } from '../state/sesion';

/** El worker de confirmación del backend corre cada 30 s; no vale la pena pedir más seguido. */
const INTERVALO_MS = 30000;

type Estado = {
  saldo: SaldoResponse | null;
  cargando: boolean;
  refrescando: boolean;
  error: string | null;
};

/**
 * Saldo del usuario, con refresco automático mientras la app está en primer
 * plano. Si la app se va al fondo, se deja de pedir: no tiene sentido gastar
 * batería y cupo de rate limiting contra una pantalla que nadie ve.
 */
export function useSaldo() {
  const token = useSesion((s) => s.usuario?.token ?? null);
  const salir = useSesion((s) => s.salir);

  const [estado, setEstado] = useState<Estado>({
    saldo: null,
    cargando: true,
    refrescando: false,
    error: null,
  });

  const abortar = useRef<AbortController | null>(null);

  const cargar = useCallback(
    async (modo: 'inicial' | 'refresco' = 'inicial') => {
      const vigente = useSesion.getState().tokenVigente();
      if (!vigente) {
        // El token venció: sacar a la persona es más honesto que mostrar
        // pantallas vacías con un error de 401 detrás.
        await salir();
        return;
      }

      abortar.current?.abort();
      const control = new AbortController();
      abortar.current = control;

      setEstado((e) => ({
        ...e,
        cargando: modo === 'inicial' && !e.saldo,
        refrescando: modo === 'refresco',
        error: null,
      }));

      try {
        const saldo = await api.saldo(vigente, control.signal);
        setEstado({ saldo, cargando: false, refrescando: false, error: null });
      } catch (e) {
        if (control.signal.aborted) return;
        if (e instanceof ErrorApi && e.esSesionVencida) {
          await salir();
          return;
        }
        setEstado((prev) => ({
          // Se conserva el último saldo bueno: un número viejo con aviso es más
          // útil que una pantalla en blanco.
          saldo: prev.saldo,
          cargando: false,
          refrescando: false,
          error: e instanceof ErrorApi ? e.message : 'No se pudo cargar tu saldo.',
        }));
      }
    },
    [salir],
  );

  useEffect(() => {
    if (!token) return;
    cargar('inicial');

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const arrancar = () => {
      if (intervalo) return;
      intervalo = setInterval(() => cargar('refresco'), INTERVALO_MS);
    };
    const parar = () => {
      if (!intervalo) return;
      clearInterval(intervalo);
      intervalo = null;
    };

    arrancar();

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        cargar('refresco');
        arrancar();
      } else {
        parar();
      }
    });

    return () => {
      parar();
      sub.remove();
      abortar.current?.abort();
    };
  }, [token, cargar]);

  return {
    ...estado,
    refrescar: () => cargar('refresco'),
  };
}
