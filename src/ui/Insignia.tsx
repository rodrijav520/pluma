import React from 'react';
import { View } from 'react-native';
import { T } from './T';
import { color, radius } from './tokens';

export function Insignia({
  texto,
  tinte = color.plumaSuave,
  icono,
}: {
  texto: string;
  tinte?: string;
  icono?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: `${tinte.length === 7 ? tinte + '4D' : tinte}`,
        backgroundColor: `${tinte.length === 7 ? tinte + '14' : 'transparent'}`,
      }}
    >
      {icono}
      <T v="eyebrow" color={tinte} style={{ letterSpacing: 0.8 }}>
        {texto}
      </T>
    </View>
  );
}

/** Encabezado de sección: eyebrow + acción opcional a la derecha. */
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <T v="eyebrow">{titulo}</T>
      {accion ? (
        <T v="small" color={color.jade} onPress={onAccion} suppressHighlighting accessibilityRole="button">
          {accion}
        </T>
      ) : null}
    </View>
  );
}
