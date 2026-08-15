import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Pantalla } from '../ui/Pantalla';
import { Hoja } from '../ui/Hoja';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Pluma } from '../ui/Pluma';
import { color, space } from '../ui/tokens';

/**
 * Portada.
 *
 * En vez de un carrusel de tres láminas genéricas, se abre con el número que
 * duele: cuánto se queda un banco de una remesa o un pago de cliente. Es el
 * dato más característico del problema y no necesita adorno.
 */
export default function Bienvenida() {
  return (
    <Pantalla scroll={false} style={styles.raiz}>
      <View style={styles.marca}>
        <Pluma alto={44} />
        <T v="h2">Pluma</T>
      </View>

      <View style={styles.centro}>
        <T v="h1" style={styles.titulo}>
          De cada $500 que te mandan, un banco se queda hasta $40.
        </T>
        <T v="cuerpo" style={styles.bajada}>
          Pluma cobra en dólares digitales y te los pasa a quetzales con la tasa a la vista. Sin
          margen escondido, sin esperar cinco días.
        </T>

        <Hoja style={styles.comparacion}>
          <Fila etiqueta="Banco tradicional" valor="hasta 8%" tono={color.sale} />
          <View style={styles.divisor} />
          <Fila etiqueta="Tasa que ves en Pluma" valor="la del mercado" tono={color.entra} />
        </Hoja>
      </View>

      <View style={styles.acciones}>
        <Boton titulo="Crear mi cuenta" onPress={() => router.push('/crear-cuenta')} />
        <Boton
          titulo="Ya tengo cuenta"
          variante="fantasma"
          onPress={() => router.push('/entrar')}
        />
      </View>
    </Pantalla>
  );
}

function Fila({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: string }) {
  return (
    <View style={styles.fila}>
      <T v="cuerpo">{etiqueta}</T>
      <T v="dato" color={tono}>
        {valor}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { justifyContent: 'space-between' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  centro: { flex: 1, justifyContent: 'center', gap: space.l },
  titulo: { fontSize: 34, lineHeight: 40 },
  bajada: { fontSize: 16, lineHeight: 24 },
  comparacion: { marginTop: space.s, gap: space.m },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divisor: { height: 1, backgroundColor: color.trazo },
  acciones: { gap: space.s },
});
