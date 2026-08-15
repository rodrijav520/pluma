import { Platform } from 'react-native';

/**
 * Pluma — tokens "Bosque nuboso"
 * Fuente de verdad de diseño: docs/diseno.md
 */

export const color = {
  // Fondos (verde-bosque, nunca #000 puro)
  noche: '#0B1210',
  bruma: '#121D18',
  musgo: '#1A2822',
  nieblaFill: 'rgba(236,253,245,0.06)',
  nieblaFillFuerte: 'rgba(236,253,245,0.09)',

  // Acentos
  jade: '#2DE39B',
  jadeProfundo: '#17B87C',
  teal: '#27C9B8',
  cielo: '#3FA9F5',
  pecho: '#FF4D5E',
  cacao: '#E9BC5A',

  // Texto
  pluma: '#EAF6EF',
  plumaSuave: 'rgba(234,246,239,0.64)',
  plumaTenue: 'rgba(234,246,239,0.48)',
  sobreJade: '#08130E',

  // Bordes
  borde: 'rgba(234,246,239,0.08)',
  bordeLuz: 'rgba(255,255,255,0.14)',
  bordeJade: 'rgba(45,227,155,0.35)',

  // Semánticos
  exito: '#2DE39B',
  peligro: '#FF4D5E',
  alerta: '#E9BC5A',
  overlay: 'rgba(4,8,7,0.55)',
} as const;

/** Gradiente firma: plumaje del quetzal (verde → teal → azul). Solo pluma, FAB y progreso. */
export const iridiscencia = [color.jade, color.teal, color.cielo] as const;

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
  s: 12,
  m: 16,
  card: 24,
  sheet: 28,
  pill: 999,
} as const;

export const font = {
  display: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const type = {
  hero: { fontFamily: font.display, fontSize: 42, letterSpacing: -1, color: color.pluma },
  h1: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.5, color: color.pluma },
  h2: { fontFamily: font.displayMed, fontSize: 20, letterSpacing: -0.2, color: color.pluma },
  bodyLg: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: color.plumaSuave },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.plumaSuave },
  bodyStrong: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 22, color: color.pluma },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: color.plumaTenue },
  eyebrow: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: color.plumaTenue,
  },
  boton: { fontFamily: font.displayMed, fontSize: 16, letterSpacing: 0.2 },
  mono: { fontFamily: font.displayMed, fontVariant: ['tabular-nums'] as const },
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

export const elevation = {
  jadeGlow: {
    shadowColor: color.jade,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  suave: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** Glass: en Android el blur es costoso en Expo Go → superficie más opaca. */
export const glass = {
  useBlur: Platform.OS !== 'android',
  intensity: 18,
  androidFill: 'rgba(18,29,24,0.94)',
  fill: color.nieblaFill,
} as const;
