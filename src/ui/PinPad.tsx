import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Delete } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { T, Mono } from './T';
import { Presionable } from './Presionable';
import { color, radius } from './tokens';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/** Teclado de PIN de 6 dígitos con feedback de error (shake). */
export function PinPad({
  onCompleto,
  error,
  onCambio,
}: {
  onCompleto: (pin: string) => void;
  error?: boolean;
  onCambio?: () => void;
}) {
  const [pin, setPin] = useState('');
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      setPin('');
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, shake]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const tocar = (t: (typeof TECLAS)[number]) => {
    onCambio?.();
    if (t === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (t === '' || pin.length >= 6) return;
    const nuevo = pin + t;
    setPin(nuevo);
    if (nuevo.length === 6) {
      onCompleto(nuevo);
      setTimeout(() => setPin(''), 350);
    }
  };

  return (
    <View style={styles.raiz}>
      <Animated.View style={[styles.puntos, anim]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.punto,
              i < pin.length && { backgroundColor: error ? color.pecho : color.jade, borderColor: 'transparent' },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {TECLAS.map((t, i) => (
          <Presionable
            key={i}
            onPress={() => tocar(t)}
            disabled={t === ''}
            accessibilityRole="button"
            accessibilityLabel={t === 'del' ? 'Borrar' : t}
            style={[styles.tecla, t === '' && { opacity: 0 }]}
          >
            {t === 'del' ? (
              <Delete size={24} color={color.plumaSuave} strokeWidth={1.8} />
            ) : (
              <Mono size={24}>{t}</Mono>
            )}
          </Presionable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 32 },
  puntos: { flexDirection: 'row', gap: 14 },
  punto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: color.bordeLuz,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 3 * 84 + 2 * 12,
    gap: 12,
    justifyContent: 'center',
  },
  tecla: {
    width: 84,
    height: 64,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,253,245,0.04)',
    borderWidth: 1,
    borderColor: color.borde,
  },
});
