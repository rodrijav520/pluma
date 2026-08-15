import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { color, glass } from './tokens';

/**
 * Vidrio: SOLO donde algo se superpone a algo — encabezado sobre contenido que
 * hace scroll, barra de acciones sobre la lista, hojas modales.
 *
 * Volver todo una tarjeta de vidrio es el tic de "glassmorphism de IA". Si no
 * hay superposición real, usá `Hoja`.
 *
 * En Android el blur es costoso en Expo Go, así que la superficie se vuelve
 * casi opaca en vez de difuminar.
 */
export function Glass({
  children,
  style,
  radio = 0,
  relleno,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radio?: number;
  relleno?: string;
}) {
  if (glass.useBlur) {
    return (
      <View style={[styles.marco, { borderRadius: radio }, style]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <BlurView intensity={glass.intensity} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: relleno ?? glass.fill }]} />
        </View>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.marco,
        { borderRadius: radio, backgroundColor: relleno ?? glass.androidFill },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: { overflow: 'hidden', borderColor: color.trazo },
});
