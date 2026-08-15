import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './T';
import { color, radius, space, TOQUE_MIN } from './tokens';

/**
 * Fila de activo.
 *
 * Cada activo tiene UN color propio y lo conserva en toda la app, así se
 * reconoce de un vistazo sin leer. El monto en la moneda del activo va arriba;
 * su equivalente, debajo — las dos cifras siempre, como en todo el producto.
 */
export function FilaActivo({
  sigla,
  nombre,
  monto,
  equivalente,
  tonos,
  aviso,
}: {
  /** Va dentro del disco de color. Ej: "Q", "$". */
  sigla: string;
  nombre: string;
  monto: string;
  equivalente: string;
  tonos: readonly [string, string, ...string[]];
  /** Marca cuando el dato no es actual. */
  aviso?: string;
}) {
  return (
    <View style={styles.raiz}>
      <LinearGradient
        colors={tonos}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.disco}
      >
        <T v="dato" color={color.sobreDegradado} style={styles.sigla}>
          {sigla}
        </T>
      </LinearGradient>

      <View style={styles.medio}>
        <T v="cuerpoFuerte" numberOfLines={1}>
          {nombre}
        </T>
        {aviso ? (
          <T v="small" color={color.espera}>
            {aviso}
          </T>
        ) : (
          <T v="small" numberOfLines={1}>
            {equivalente}
          </T>
        )}
      </View>

      <T v="dato" numberOfLines={1}>
        {monto}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingVertical: space.m,
    minHeight: TOQUE_MIN,
  },
  disco: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigla: { fontSize: 17 },
  medio: { flex: 1, gap: 2 },
});
