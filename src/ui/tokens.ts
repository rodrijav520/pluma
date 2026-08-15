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

  // Identidad de cada activo. Son colores de DATO: cada uno nombra una cosa
  // concreta, no decoran. El quetzal es verde jade; el dólar digital, el teal
  // de Tether.
  quetzal: '#12A594',
  quetzalTenue: 'rgba(18,165,148,0.14)',
  dolar: '#3B82F6',
  dolarTenue: 'rgba(59,130,246,0.14)',

  // Sobre el degradado del encabezado el texto es claro.
  //
  // Las opacidades no son estéticas, salen del contraste medido contra los dos
  // extremos del degradado: a 0.46 la etiqueta de 11 px daba 3.43:1 y no pasaba
  // AA. A 0.62 da 4.93:1 sobre el extremo oscuro y 4.6:1 sobre el claro.
  sobreDegradado: '#FFFFFF',
  sobreDegradadoSuave: 'rgba(255,255,255,0.78)',
  sobreDegradadoTenue: 'rgba(255,255,255,0.62)',
  vidrioClaro: 'rgba(255,255,255,0.16)',
  vidrioClaroBorde: 'rgba(255,255,255,0.28)',

  overlay: 'rgba(20,24,33,0.45)',
} as const;

/**
 * Degradados. El de marca va índigo → violeta: la tinta no es plana, se
 * profundiza. Se usa en el encabezado de inicio y en nada más, para que siga
 * significando "acá está tu dinero".
 */
export const degradado = {
  // El extremo claro se oscureció de #6D3FA0 a #5A3490: con el anterior, las
  // etiquetas de 12 px de las acciones quedaban en 4.45:1, apenas por debajo
  // del mínimo AA.
  marca: ['#2B3A8F', '#43349C', '#5A3490'] as const,
  marcaSuave: ['rgba(43,58,143,0.10)', 'rgba(109,63,160,0.04)'] as const,
  quetzal: ['#12A594', '#0E8C7E'] as const,
  dolar: ['#3B82F6', '#2563EB'] as const,
  /** Acción destacada sobre el degradado: papel, para que resalte contra el vidrio. */
  destacado: ['#FFFFFF', '#EEF1FF'] as const,
} as const;

/** Paleta para avatares por inicial. Estable: la misma persona, el mismo color. */
export const AVATAR_TONOS = [
  ['#2B3A8F', '#6D3FA0'],
  ['#12A594', '#0E8C7E'],
  ['#D9563F', '#B23A28'],
  ['#3B82F6', '#2563EB'],
  ['#B4770E', '#8A5A0A'],
  ['#7C3AED', '#5B21B6'],
] as const;

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
