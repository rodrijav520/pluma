import { Platform } from 'react-native';

/**
 * Pluma — tokens "Tinta y papel"
 * Fuente de verdad de diseño: DESIGN.md
 *
 * Pluma escribe: el acento es tinta, el fondo es papel, las superficies se
 * apilan como hojas. El vidrio aparece solo donde algo se superpone.
 */

export const color = {
  // Papel — fondos
  papel: '#F2F4F7',
  papelAlto: '#FFFFFF',
  papelHundido: '#E8EBF0',

  // Tinta — acento único de marca
  tinta: '#2B3A8F',
  tintaProfunda: '#1E2A6B',
  tintaTenue: 'rgba(43,58,143,0.10)',
  tintaBorde: 'rgba(43,58,143,0.24)',
  sobreTinta: '#FFFFFF',

  // Texto
  grafito: '#141821',
  lapiz: '#5A6376',
  lapizTenue: '#8A92A3',

  // Bordes
  trazo: 'rgba(20,24,33,0.10)',
  trazoFuerte: 'rgba(20,24,33,0.16)',

  // Semánticos — solo datos, nunca decoración
  entra: '#0E9F6E',
  sale: '#D64560',
  espera: '#B4770E',
  entraTenue: 'rgba(14,159,110,0.12)',
  saleTenue: 'rgba(214,69,96,0.12)',
  esperaTenue: 'rgba(180,119,14,0.14)',

  /** RESERVADO a la pieza firma (deslizador) y al momento "te llegó". Nada más. */
  marigold: '#F2A93B',
  marigoldTenue: 'rgba(242,169,59,0.18)',

  overlay: 'rgba(20,24,33,0.45)',
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  pantalla: 20,
} as const;

export const radius = {
  s: 10,
  m: 14,
  hoja: 22,
  sheet: 28,
  pill: 999,
} as const;

export const font = {
  /** Bricolage habla: títulos, wordmark. */
  voz: 'BricolageGrotesque_700Bold',
  vozMed: 'BricolageGrotesque_600SemiBold',
  /** Inter cuenta: todo número, dato y etiqueta. */
  cifra: 'Inter_400Regular',
  cifraMed: 'Inter_500Medium',
  cifraSemi: 'Inter_600SemiBold',
  cifraBold: 'Inter_700Bold',
} as const;

/** Cifras de ancho fijo: el saldo no baila cuando se actualiza. */
const tabular = { fontVariant: ['tabular-nums'] as const };

export const type = {
  // Saldo — las dos monedas con el mismo peso visual
  saldoMayor: {
    fontFamily: font.cifraBold,
    fontSize: 52,
    letterSpacing: -1.5,
    color: color.grafito,
    ...tabular,
  },
  saldoMenor: {
    fontFamily: font.cifraSemi,
    fontSize: 34,
    letterSpacing: -0.8,
    color: color.lapiz,
    ...tabular,
  },

  // Voz — Bricolage
  h1: { fontFamily: font.voz, fontSize: 28, letterSpacing: -0.6, color: color.grafito },
  h2: { fontFamily: font.vozMed, fontSize: 20, letterSpacing: -0.3, color: color.grafito },

  // Cifra — Inter
  /**
   * Dato con presencia de título. Existe porque una línea como "1 USD = Q 7.63"
   * es una cifra, no una voz: en Bricolage la cola de la Q se lee como subrayado
   * y además rompería la regla del sistema.
   */
  datoDestacado: {
    fontFamily: font.cifraSemi,
    fontSize: 21,
    letterSpacing: -0.3,
    color: color.grafito,
    ...tabular,
  },
  cuerpo: { fontFamily: font.cifra, fontSize: 15, lineHeight: 22, color: color.lapiz },
  cuerpoFuerte: { fontFamily: font.cifraSemi, fontSize: 15, lineHeight: 22, color: color.grafito },
  dato: { fontFamily: font.cifraSemi, fontSize: 15, color: color.grafito, ...tabular },
  datoSuave: { fontFamily: font.cifra, fontSize: 13, color: color.lapiz, ...tabular },
  small: { fontFamily: font.cifra, fontSize: 13, lineHeight: 18, color: color.lapiz },
  etiqueta: {
    fontFamily: font.cifraSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: color.lapizTenue,
  },
  boton: { fontFamily: font.cifraSemi, fontSize: 16, letterSpacing: 0.1 },
} as const;

export const motion = {
  rapido: 180,
  base: 240,
  suave: 320,
  /** cubic-bezier(0.16, 1, 0.3, 1) — Expo.out */
  easing: [0.16, 1, 0.3, 1] as const,
  spring: { damping: 20, stiffness: 90, mass: 1 },
  pressScale: 0.97,
  staggerMs: 40,
} as const;

/** Hojas apiladas: sombra suave y baja, nunca resplandor de color. */
export const elevation = {
  hoja: {
    shadowColor: '#141821',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hojaAlta: {
    shadowColor: '#141821',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  tinta: {
    shadowColor: color.tinta,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** Área táctil mínima accesible. */
export const TOQUE_MIN = 44;

/**
 * Vidrio solo donde algo se superpone: encabezado al hacer scroll, barra de
 * acciones sobre la lista, hojas modales. En Android el blur es costoso en
 * Expo Go, así que la superficie se vuelve casi opaca.
 */
export const glass = {
  useBlur: Platform.OS !== 'android',
  intensity: 24,
  androidFill: 'rgba(242,244,247,0.96)',
  fill: 'rgba(255,255,255,0.62)',
  borde: 'rgba(255,255,255,0.7)',
} as const;
