import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { type } from './tokens';

type Variante = keyof typeof type;

/** Texto con las variantes tipográficas del sistema. */
export function T({
  v = 'body',
  style,
  color,
  centrado,
  ...rest
}: TextProps & { v?: Variante; color?: string; centrado?: boolean }) {
  const base = type[v] as TextStyle;
  const esTitulo = v === 'hero' || v === 'h1' || v === 'h2';
  return (
    <Text
      accessibilityRole={esTitulo ? 'header' : undefined}
      {...rest}
      style={[
        base,
        color ? { color } : null,
        centrado ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}

/** Números tabulares (montos, hashes, horas). */
export function Mono({
  size = 15,
  weight = 'med',
  style,
  color,
  ...rest
}: TextProps & { size?: number; weight?: 'med' | 'bold'; color?: string }) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: weight === 'bold' ? 'SpaceGrotesk_700Bold' : 'SpaceGrotesk_500Medium',
          fontSize: size,
          fontVariant: ['tabular-nums'],
          color: color ?? '#EAF6EF',
        },
        style,
      ]}
    />
  );
}
