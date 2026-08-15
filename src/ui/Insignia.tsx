import React from 'react';
import { StyleSheet, View } from 'react-native';
import { T } from './T';
import { color, radius, space } from './tokens';

/** Etiqueta corta de estado. El tinte lo pone quien la usa, según el dato. */
export function Insignia({
  texto,
  tinte = color.lapiz,
  fondo,
  icono,
}: {
  texto: string;
  tinte?: string;
  fondo?: string;
  icono?: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.insignia,
        { borderColor: tinte, backgroundColor: fondo ?? 'transparent' },
      ]}
    >
      {icono}
      <T v="etiqueta" color={tinte} style={styles.insigniaTexto}>
        {texto}
      </T>
    </View>
  );
}

/** Encabezado de sección: etiqueta + acción opcional a la derecha. */
export function Seccion({
  titulo,
  accion,
  onAccion,
}: {
  titulo: string;
  accion?: string;
  onAccion?: () => void;
}) {
  return (
    <View style={styles.seccion}>
      <T v="etiqueta">{titulo}</T>
      {accion ? (
        <T
          v="small"
          color={color.tinta}
          onPress={onAccion}
          suppressHighlighting
          accessibilityRole="button"
        >
          {accion}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  insigniaTexto: { letterSpacing: 0.8 },
  seccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.m,
  },
});
