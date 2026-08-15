import React, { useEffect } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { esWeb } from './anim';
import { iridiscencia, color } from './tokens';

const APath = Animated.createAnimatedComponent(Path);

// Pluma de quetzal estilizada (viewBox 100×300): vena central en S suave + vano alargado.
const VANO =
  'M50 14 C74 52 78 128 60 216 C56 236 52 252 50 262 C48 252 44 236 40 216 C22 128 26 52 50 14 Z';
const RAQUIS = 'M50 16 C55 78 46 160 50 234 C51 252 50 268 50 288';
const RAQUIS_LEN = 300;
const BARBAS = [
  'M50 60 C60 56 66 52 72 44',
  'M50 100 C62 96 68 92 73 84',
  'M50 140 C61 138 67 134 71 126',
  'M50 180 C59 178 64 175 67 168',
  'M50 62 C40 58 34 52 28 44',
  'M50 102 C38 98 32 92 27 84',
  'M50 142 C39 140 33 134 29 126',
  'M50 182 C41 180 36 175 33 168',
];

/**
 * LA FIRMA. Solo se usa en: balance, progreso de Aprender, momento de éxito, ícono.
 * `progreso` (0-1): cuánta pluma se ha "dibujado" (Aprender).
 * `animada`: traza la pluma una vez al montar (éxito).
 */
export function Pluma({
  alto = 120,
  progreso,
  animada,
  opacidad = 1,
  rotacion = 0,
  conPecho = true,
}: {
  alto?: number;
  progreso?: number;
  animada?: boolean;
  opacidad?: number;
  rotacion?: number;
  conPecho?: boolean;
}) {
  const ancho = (alto * 100) / 300;
  const reduce = useReducedMotion();
  const objetivo = progreso != null ? Math.min(Math.max(progreso, 0), 1) : 1;
  const p = useSharedValue(animada && !reduce && !esWeb ? 0 : objetivo);

  useEffect(() => {
    if (esWeb || reduce) {
      p.value = objetivo;
      return;
    }
    if (animada) {
      p.value = 0;
      p.value = withDelay(
        120,
        withTiming(objetivo, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      );
    } else {
      p.value = withTiming(objetivo, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }
  }, [objetivo, animada, reduce, p]);

  const raquisProps = useAnimatedProps(() => ({
    strokeDashoffset: RAQUIS_LEN * (1 - p.value),
  }));
  const vanoProps = useAnimatedProps(() => ({
    fillOpacity: 0.16 + 0.5 * p.value,
    strokeOpacity: 0.25 + 0.55 * p.value,
  }));

  return (
    <Svg
      width={ancho}
      height={alto}
      viewBox="0 0 100 300"
      style={{ opacity: opacidad, transform: [{ rotate: `${rotacion}deg` }] }}
    >
      <Defs>
        <LinearGradient id="irid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={iridiscencia[0]} />
          <Stop offset="0.55" stopColor={iridiscencia[1]} />
          <Stop offset="1" stopColor={iridiscencia[2]} />
        </LinearGradient>
      </Defs>
      <G>
        <APath
          d={VANO}
          fill="url(#irid)"
          stroke="url(#irid)"
          strokeWidth={1.5}
          animatedProps={vanoProps}
        />
        {BARBAS.map((d, i) => (
          <Path key={i} d={d} stroke="url(#irid)" strokeWidth={1} strokeOpacity={0.35} fill="none" />
        ))}
        <APath
          d={RAQUIS}
          stroke="url(#irid)"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${RAQUIS_LEN}`}
          animatedProps={raquisProps}
        />
        {conPecho && <Path d="M50 282 C53 288 53 294 50 298 C47 294 47 288 50 282 Z" fill={color.pecho} />}
      </G>
    </Svg>
  );
}
