import React, { useEffect } from 'react';
import { type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { esWeb } from './anim';
import { color, radius } from './tokens';

/** Placeholder shimmer para estados de carga > 300 ms. */
export function Esqueleto({
  ancho = '100%',
  alto = 16,
  radio = radius.s,
  style,
}: {
  ancho?: DimensionValue;
  alto?: number;
  radio?: number;
  style?: object;
}) {
  const reduce = useReducedMotion();
  const o = useSharedValue(0.4);

  useEffect(() => {
    if (reduce || esWeb) {
      o.value = 0.5;
      return;
    }
    o.value = withRepeat(
      withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduce, o]);

  const anim = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      style={[
        { width: ancho, height: alto, borderRadius: radio, backgroundColor: color.papelHundido },
        anim,
        style,
      ]}
    />
  );
}
