import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color } from './tokens';

/**
 * La marca: una pluma que a la vez es punta de escribir.
 *
 * El nombre significa las dos cosas — pluma de quetzal y pluma de escribir — y
 * el trazo tiene que sostener la ambigüedad: barbas de pluma sobre un tallo que
 * termina en punta.
 */
export function Pluma({
  alto = 40,
  tono = color.tinta,
  acento = color.marigold,
  style,
}: {
  alto?: number;
  tono?: string;
  acento?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const ancho = alto * 0.62;
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Pluma">
      <Svg width={ancho} height={alto} viewBox="0 0 62 100" fill="none">
        {/* Tallo: de la punta abajo hasta el extremo arriba */}
        <Path
          d="M14 94 C 26 72, 38 46, 44 8"
          stroke={tono}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Barbas del lado ancho */}
        <Path
          d="M44 8 C 58 26, 54 52, 34 66 C 30 50, 34 28, 44 8 Z"
          fill={tono}
          opacity={0.9}
        />
        {/* Barbas del lado angosto */}
        <Path
          d="M44 8 C 28 22, 20 44, 22 62 C 32 52, 40 32, 44 8 Z"
          fill={tono}
          opacity={0.45}
        />
        {/* La punta que escribe */}
        <Path d="M14 94 L 10 99" stroke={acento} strokeWidth={5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
