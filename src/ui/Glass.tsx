import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { esWeb } from './anim';
import { color, glass, radius } from './tokens';

/**
 * Superficie de vidrio del sistema. Luz de dosel: el borde superior siempre
 * es más claro (la luz viene de arriba en el bosque nuboso).
 * iOS/web: blur real · Android: superficie translúcida sólida (rendimiento en Expo Go).
 */
export function Glass({
  children,
  style,
  radio = radius.card,
  relleno,
  sinLuz,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radio?: number;
  /** override del fill (p. ej. jade translúcido para banners) */
  relleno?: string;
  sinLuz?: boolean;
}) {
  const contenido = (
    <>
      {!sinLuz && <View style={[styles.luz, { borderRadius: 1 }]} />}
      {children}
    </>
  );

  if (glass.useBlur) {
    // Web: la capa de blur va con zIndex -1 para que los SVG hermanos no caigan
    // bajo el backdrop-filter; los hijos quedan directos y el layout no cambia.
    return (
      <View style={[styles.marco, { borderRadius: radio }, esWeb && { zIndex: 0 }, style]}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, esWeb && ({ zIndex: -1 } as object)]}
        >
          <BlurView intensity={glass.intensity} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: relleno ?? glass.fill }]} />
        </View>
        {contenido}
      </View>
    );
  }

  return (
    <View
      style={[styles.marco, { borderRadius: radio, backgroundColor: relleno ?? glass.androidFill }, style]}
    >
      {contenido}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderWidth: 1,
    borderColor: color.borde,
    overflow: 'hidden',
  },
  luz: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: color.bordeLuz,
  },
});
