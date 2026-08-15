import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Network from 'expo-network';
import { useApp } from '../state/app';
import { useChain } from '../state/chain';
import { useCobros } from '../state/cobros';
import { useFx } from '../state/fx';
import { useToast } from '../state/toast';

const INTERVALO = 12_000;

/**
 * Orquesta el refresco de datos mientras la app está activa:
 * saldo + transferencias on-chain → reconciliación de cobros → TC.
 * También vigila la conectividad para el banner offline.
 */
export function usePolling() {
  const address = useApp((s) => s.address);
  const bloqueCreacion = useApp((s) => s.bloqueCreacion);
  const corriendo = useRef(false);

  useEffect(() => {
    if (!address) return;

    let vivo = true;

    const tick = async () => {
      if (corriendo.current || !vivo) return;
      if (AppState.currentState !== 'active' && Platform.OS !== 'web') return;
      corriendo.current = true;
      try {
        const red = await Network.getNetworkStateAsync().catch(() => null);
        const online = red?.isInternetReachable !== false && red?.isConnected !== false;
        useToast.getState().setOnline(online);
        if (online) {
          await useFx.getState().refrescar();
          await useChain.getState().refrescar(address, bloqueCreacion, useFx.getState().rate);
          useCobros.getState().reconciliar(useChain.getState().txs);
        }
      } finally {
        corriendo.current = false;
      }
    };

    tick();
    const int = setInterval(tick, INTERVALO);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') tick();
    });

    return () => {
      vivo = false;
      clearInterval(int);
      sub.remove();
    };
  }, [address, bloqueCreacion]);
}
