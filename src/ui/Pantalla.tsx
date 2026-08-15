import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { color, space } from './tokens';

function Orbe({
  size,
  tinte,
  opacidad,
  style,
  duracion,
}: {
  size: number;
  tinte: string;
  opacidad: number;
  style: StyleProp<ViewStyle>;
  duracion: number;
}) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    // En web la deriva continua castiga el compositor; el glow estático conserva el 99% del efecto.
    if (reduce || Platform.OS === 'web') return;
    t.value = withRepeat(withTiming(1, { duration: duracion, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, duracion, t]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * 26 }, { translateY: t.value * 18 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[style, anim]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={tinte} stopOpacity={opacidad} />
            <Stop offset="100%" stopColor={tinte} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

/** Niebla ambiental del bosque: máx. 2 orbes por pantalla (docs/diseno.md). */
export function Ambiente() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Orbe
        size={420}
        tinte={color.jade}
        opacidad={0.09}
        duracion={16000}
        style={{ position: 'absolute', top: -140, left: -120 }}
      />
      <Orbe
        size={380}
        tinte={color.cielo}
        opacidad={0.06}
        duracion={19000}
        style={{ position: 'absolute', top: 240, right: -170 }}
      />
    </View>
  );
}

/**
 * Contenedor base de pantalla: fondo noche + niebla + safe areas.
 * `scroll` envuelve el contenido en ScrollView con padding estándar.
 */
export function Pantalla({
  children,
  scroll = true,
  sinAmbiente,
  style,
  refrescando,
  onRefrescar,
  pieEspacio = space.xxxl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  sinAmbiente?: boolean;
  style?: StyleProp<ViewStyle>;
  refrescando?: boolean;
  onRefrescar?: () => void;
  pieEspacio?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.raiz}>
      {!sinAmbiente && <Ambiente />}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            {
              paddingTop: insets.top + space.m,
              paddingBottom: insets.bottom + pieEspacio,
              paddingHorizontal: space.pantalla,
            },
            style,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefrescar ? (
              <RefreshControl
                refreshing={!!refrescando}
                onRefresh={onRefrescar}
                tintColor={color.jade}
                colors={[color.jade]}
                progressBackgroundColor={color.bruma}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            {
              flex: 1,
              paddingTop: insets.top + space.m,
              paddingBottom: insets.bottom + space.l,
              paddingHorizontal: space.pantalla,
            },
            style,
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: color.noche },
});
