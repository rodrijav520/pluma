import React from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from './T';
import { Presionable } from './Presionable';
import { color, elevation, radius } from './tokens';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

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
    primario: { backgroundColor: color.jade, ...(!inactivo ? elevation.jadeGlow : null) },
    secundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.bordeLuz },
    peligro: { backgroundColor: 'rgba(255,77,94,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,94,0.4)' },
    fantasma: { backgroundColor: 'transparent' },
  };
  const texto: Record<Variante, string> = {
    primario: color.sobreJade,
    secundario: color.pluma,
    peligro: color.pecho,
    fantasma: color.plumaSuave,
  };

  return (
    <Presionable
      onPress={inactivo ? undefined : onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={[
        styles.base,
        compacto && styles.compacto,
        fondo[variante],
        inactivo && { opacity: 0.45 },
        style,
      ]}
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
  compacto: { height: 44, paddingHorizontal: 18 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
