import { Platform } from 'react-native';

/**
 * Las animaciones de entrada/salida de Reanimated dependen de rAF; en web
 * (solo superficie de demo) un tab en segundo plano las congela y deja
 * overlays fantasma. En nativo — el target real — van completas.
 */
export function soloNativo<T>(anim: T): T | undefined {
  return Platform.OS === 'web' ? undefined : anim;
}

export const esWeb = Platform.OS === 'web';
