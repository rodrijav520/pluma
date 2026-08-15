import React from 'react';
import { StyleSheet, View } from 'react-native';
import { T } from './T';
import { Boton } from './Boton';
import { color, radius, space } from './tokens';

/**
 * Pantalla vacía: es una invitación a actuar, no un cartel de "no hay nada".
 * Siempre dice qué va a aparecer acá y cómo hacer que aparezca.
 */
export function EstadoVacio({
  icono,
  titulo,
  texto,
  accion,
}: {
  icono?: React.ReactNode;
  titulo: string;
  texto: string;
  accion?: { titulo: string; onPress: () => void };
}) {
  return (
    <View style={styles.raiz}>
      {icono ? <View style={styles.icono}>{icono}</View> : null}
      <T v="h2" centrado>
        {titulo}
      </T>
      <T v="cuerpo" centrado style={styles.texto}>
        {texto}
      </T>
      {accion ? (
        <Boton titulo={accion.titulo} onPress={accion.onPress} style={styles.boton} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: space.s, paddingVertical: space.xxxl },
  icono: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.papelHundido,
    marginBottom: space.s,
  },
  texto: { maxWidth: 300 },
  boton: { marginTop: space.m, alignSelf: 'stretch' },
});
