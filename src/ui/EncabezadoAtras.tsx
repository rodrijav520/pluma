import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Presionable } from './Presionable';
import { T } from './T';
import { color, radius, space, TOQUE_MIN } from './tokens';

/** Encabezado de pantalla apilada: volver + título opcional. */
export function EncabezadoAtras({
  titulo,
  derecha,
  onAtras,
}: {
  titulo?: string;
  derecha?: React.ReactNode;
  onAtras?: () => void;
}) {
  function atras() {
    if (onAtras) return onAtras();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.raiz}>
      <Presionable
        onPress={atras}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={styles.boton}
      >
        <ChevronLeft size={22} color={color.grafito} strokeWidth={2.2} />
      </Presionable>

      {titulo ? (
        <T v="h2" numberOfLines={1} style={styles.titulo}>
          {titulo}
        </T>
      ) : (
        <View style={styles.titulo} />
      )}

      <View style={styles.derecha}>{derecha}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: TOQUE_MIN },
  boton: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.papelAlto,
    borderWidth: 1,
    borderColor: color.trazo,
  },
  titulo: { flex: 1 },
  derecha: { minWidth: TOQUE_MIN, alignItems: 'flex-end' },
});
