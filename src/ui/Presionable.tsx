import React from 'react';
import { Platform, Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { motion } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable con feedback estándar del sistema: scale 0.97 + haptic Light. */
export function Presionable({
  style,
  haptic = true,
  escala = motion.pressScale,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  escala?: number;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        s.value = withTiming(escala, { duration: 90, easing: Easing.out(Easing.quad) });
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        onPressOut?.(e);
      }}
      style={[anim, style]}
    />
  );
}
