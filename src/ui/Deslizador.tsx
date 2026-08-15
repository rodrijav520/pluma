import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { T } from './T';
import { Boton } from './Boton';
import { color, motion, radius, space, TOQUE_MIN } from './tokens';

const ALTO = 60;
const PULGAR = 52;
const MARGEN = (ALTO - PULGAR) / 2;
/** Fracción del riel a partir de la cual se considera confirmado. */
const UMBRAL = 0.85;

/**
 * Pieza firma: "Deslizá para confirmar".
 *
 * El gesto ES la operación, no una animación encima de ella. Mientras la pluma
 * viaja, el texto pasa de lo que entregás a lo que recibís, y detrás queda un
 * trazo de tinta marigold — el único lugar del sistema donde ese color aparece.
 *
 * Accesibilidad: si el sistema pide movimiento reducido, o si `soloBoton` está
 * activo, se ofrece un botón equivalente. Nadie queda sin poder confirmar.
 */
export function Deslizador({
  textoInicial,
  textoFinal,
  onConfirmar,
  cargando,
  deshabilitado,
  soloBoton,
}: {
  /** Lo que entregás. Ej: "$ 120.00" */
  textoInicial: string;
  /** Lo que recibís. Ej: "Q 930.00" */
  textoFinal: string;
  onConfirmar: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  soloBoton?: boolean;
}) {
  const reduce = useReducedMotion();
  const [ancho, setAncho] = useState(0);
  const x = useSharedValue(0);
  const inactivo = !!deshabilitado || !!cargando;

  const recorrido = Math.max(ancho - PULGAR - MARGEN * 2, 1);

  const confirmar = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    onConfirmar();
  }, [onConfirmar]);

  const soltar = useCallback(
    (llego: boolean) => {
      if (llego) confirmar();
    },
    [confirmar],
  );

  const pan = Gesture.Pan()
    .enabled(!inactivo && ancho > 0)
    .onChange((e) => {
      x.value = Math.min(Math.max(x.value + e.changeX, 0), recorrido);
    })
    .onEnd(() => {
      const llego = x.value / recorrido >= UMBRAL;
      if (llego) {
        x.value = withTiming(recorrido, { duration: motion.rapido });
      } else {
        x.value = withSpring(0, motion.spring);
      }
      runOnJS(soltar)(llego);
    });

  const pulgarAnim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const trazoAnim = useAnimatedStyle(() => ({
    width: x.value + PULGAR,
  }));

  const inicialAnim = useAnimatedStyle(() => ({
    opacity: interpolate(x.value / recorrido, [0, 0.5], [1, 0], 'clamp'),
  }));

  const finalAnim = useAnimatedStyle(() => ({
    opacity: interpolate(x.value / recorrido, [0.45, 0.95], [0, 1], 'clamp'),
  }));

  // Camino accesible: mismo resultado, sin gesto.
  if (reduce || soloBoton) {
    return (
      <Boton
        titulo={cargando ? 'Confirmando…' : `Confirmar · ${textoFinal}`}
        onPress={confirmar}
        cargando={cargando}
        deshabilitado={deshabilitado}
      />
    );
  }

  return (
    <View
      style={[styles.riel, inactivo && styles.inactivo]}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityLabel={`Deslizá para confirmar. Entregás ${textoInicial}, recibís ${textoFinal}.`}
      accessibilityHint="Deslizá el control de izquierda a derecha para confirmar."
    >
      {/* Trazo de tinta que queda detrás de la pluma */}
      <Animated.View style={[styles.trazo, trazoAnim]} pointerEvents="none" />

      <View style={styles.etiquetas} pointerEvents="none">
        <Animated.View style={[styles.etiquetaCapa, inicialAnim]}>
          <T v="boton" color={color.lapiz}>
            Deslizá · {textoInicial}
          </T>
        </Animated.View>
        <Animated.View style={[styles.etiquetaCapa, finalAnim]}>
          <T v="boton" color={color.grafito}>
            Recibís {textoFinal}
          </T>
        </Animated.View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.pulgar, pulgarAnim]}>
          {cargando ? (
            <ActivityIndicator color={color.sobreTinta} size="small" />
          ) : (
            <PlumaMarca />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** La pluma: trazo simple que sugiere una punta escribiendo hacia la derecha. */
function PlumaMarca() {
  return (
    <View style={styles.marca}>
      <View style={styles.marcaTallo} />
      <View style={styles.marcaPunta} />
    </View>
  );
}

const styles = StyleSheet.create({
  riel: {
    height: ALTO,
    borderRadius: radius.pill,
    backgroundColor: color.papelHundido,
    borderWidth: 1,
    borderColor: color.trazo,
    justifyContent: 'center',
    padding: MARGEN,
    overflow: 'hidden',
  },
  inactivo: { opacity: 0.45 },
  trazo: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: color.marigoldTenue,
    borderRadius: radius.pill,
  },
  etiquetas: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  etiquetaCapa: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pulgar: {
    width: PULGAR,
    height: PULGAR,
    minWidth: TOQUE_MIN,
    minHeight: TOQUE_MIN,
    borderRadius: radius.pill,
    backgroundColor: color.tinta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marca: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  marcaTallo: {
    position: 'absolute',
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: color.marigold,
  },
  marcaPunta: {
    position: 'absolute',
    right: 1,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: color.marigold,
    transform: [{ rotate: '45deg' }],
  },
});
