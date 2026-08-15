import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeOut } from 'react-native-reanimated';
import { soloNativo } from './anim';
import { useApp } from '../state/app';
import { verificarPin } from '../core/wallet';
import { PinPad } from './PinPad';
import { Pluma } from './Pluma';
import { T } from './T';
import { color, space } from './tokens';

/** Candado de arranque: si hay PIN, la app abre bloqueada. Biometría primero, PIN de respaldo. */
export function Candado() {
  const { pinSet, bioActiva, bloqueada, setBloqueada } = useApp();
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (bloqueada && bioActiva && Platform.OS !== 'web') {
      LocalAuthentication.authenticateAsync({
        promptMessage: 'Abrí tu Pluma',
        cancelLabel: 'Usar PIN',
      })
        .then((res) => {
          if (res.success) setBloqueada(false);
        })
        .catch(() => {});
    }
  }, [bloqueada, bioActiva, setBloqueada]);

  if (!pinSet || !bloqueada) return null;

  const enFrio = intentos >= 5;

  return (
    <Animated.View exiting={soloNativo(FadeOut.duration(240))} style={[StyleSheet.absoluteFill, styles.capa]}>
      <View style={{ alignItems: 'center', gap: space.m }}>
        <Pluma alto={84} />
        <T v="h2">Hola de nuevo</T>
        <T v="body">{enFrio ? 'Muchos intentos. Respirá y esperá un momento.' : 'Entrá con tu PIN'}</T>
      </View>
      <PinPad
        error={error}
        onCambio={() => setError(false)}
        onCompleto={async (pin) => {
          if (enFrio) return;
          const ok = await verificarPin(pin);
          if (ok) {
            setBloqueada(false);
            setIntentos(0);
          } else {
            setError(true);
            setIntentos((n) => {
              const s = n + 1;
              if (s >= 5) setTimeout(() => setIntentos(0), 30_000);
              return s;
            });
          }
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: {
    backgroundColor: color.noche,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    zIndex: 150,
  },
});
