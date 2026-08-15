import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, elevation, radius, space } from './tokens';

/**
 * Hoja de papel: la superficie base del sistema.
 *
 * Pluma escribe sobre papel, así que las superficies se apilan como hojas
 * opacas con sombra suave — no flotan como tarjetas de vidrio. El vidrio se
 * reserva para donde algo realmente se superpone (ver Glass).
 */
export function Hoja({
  children,
  style,
  radio = radius.hoja,
  alta,
  plana,
  relleno,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radio?: number;
  /** Sombra más marcada: para lo que está por encima del resto. */
  alta?: boolean;
  /** Sin sombra: para hojas embebidas dentro de otra hoja. */
  plana?: boolean;
  relleno?: string;
}) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radio, backgroundColor: relleno ?? color.papelAlto },
        plana ? null : alta ? elevation.hojaAlta : elevation.hoja,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: color.trazo,
    padding: space.l,
  },
});
