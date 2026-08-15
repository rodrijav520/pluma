import React from 'react';
import { View } from 'react-native';
import { T } from './T';
import { Boton } from './Boton';
import { Pluma } from './Pluma';
import { space } from './tokens';

/** Un vacío es una invitación a actuar: pluma + mensaje + UNA acción. */
export function EstadoVacio({
  titulo,
  detalle,
  accion,
  onAccion,
}: {
  titulo: string;
  detalle?: string;
  accion?: string;
  onAccion?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, gap: space.l }}>
      <Pluma alto={96} opacidad={0.5} rotacion={14} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <T v="h2" centrado>
          {titulo}
        </T>
        {detalle ? (
          <T v="body" centrado style={{ maxWidth: 280 }}>
            {detalle}
          </T>
        ) : null}
      </View>
      {accion && onAccion ? <Boton titulo={accion} onPress={onAccion} compacto /> : null}
    </View>
  );
}
