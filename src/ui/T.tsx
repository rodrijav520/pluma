import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { type } from './tokens';

type Variante = keyof typeof type;

/**
 * Texto del sistema.
 *
 * Regla dura: Bricolage habla (h1, h2), Inter cuenta (todo lo demás).
 * No se pasa `fontFamily` por fuera — si hace falta un rol nuevo, se agrega
 * a `type` en tokens.ts.
 */
export function T({
  v = 'cuerpo',
  style,
  color,
  centrado,
  ...rest
}: TextProps & { v?: Variante; color?: string; centrado?: boolean }) {
  const base = type[v] as TextStyle;
  const esTitulo = v === 'h1' || v === 'h2';
  return (
    <Text
      accessibilityRole={esTitulo ? 'header' : undefined}
      {...rest}
      style={[base, color ? { color } : null, centrado ? { textAlign: 'center' } : null, style]}
    />
  );
}
