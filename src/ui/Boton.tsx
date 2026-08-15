import React from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from './T';
import { Presionable } from './Presionable';
import { color, elevation, radius, TOQUE_MIN } from './tokens';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

/**
 * Un solo CTA sólido por vista. El secundario va en contorno.
 * El acento es tinta — el marigold está reservado a la pieza firma.
 */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando,
  deshabilitado,
  icono,
  style,
  compacto,
}: {
  titulo: string;
  onPress?: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compacto?: boolean;
}) {
  const inactivo = deshabilitado || cargando;

  const fondo: Record<Variante, ViewStyle> = {
    primario: { backgroundColor: color.tinta, ...(!inactivo ? elevation.tinta : null) },
    secundario: { backgroundColor: color.papelAlto, borderWidth: 1, borderColor: color.trazoFuerte },
    peligro: { backgroundColor: color.saleTenue, borderWidth: 1, borderColor: color.sale },
    fantasma: { backgroundColor: 'transparent' },
  };

  const texto: Record<Variante, string> = {
    primario: color.sobreTinta,
    secundario: color.grafito,
    peligro: color.sale,
    fantasma: color.tinta,
  };

  return (
    <Presionable
      onPress={inactivo ? undefined : onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={[styles.base, compacto && styles.compacto, fondo[variante], inactivo && styles.inactivo, style]}
    >
      {cargando ? (
        <ActivityIndicator color={texto[variante]} />
      ) : (
        <View style={styles.fila}>
          {icono}
          <T v="boton" color={texto[variante]}>
            {titulo}
          </T>
        </View>
      )}
    </Presionable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  compacto: { height: TOQUE_MIN, paddingHorizontal: 18 },
  inactivo: { opacity: 0.4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
