import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { T } from './T';
import { Presionable } from './Presionable';
import { color, degradado, radius, TOQUE_MIN } from './tokens';

/**
 * Acción rápida del inicio.
 *
 * Una sola de las cuatro va sólida (la que el producto quiere que uses); el
 * resto en vidrio claro sobre el degradado. Sin eso, cuatro botones idénticos
 * no le dicen nada a nadie sobre por dónde empezar.
 */
export function AccionRapida({
  Icono,
  etiqueta,
  onPress,
  destacada,
  tonos,
}: {
  Icono: LucideIcon;
  etiqueta: string;
  onPress: () => void;
  destacada?: boolean;
  /** Degradado del círculo cuando va destacada. */
  tonos?: readonly [string, string, ...string[]];
}) {
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={styles.raiz}
    >
      {destacada ? (
        <LinearGradient
          colors={tonos ?? degradado.destacado}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.circulo}
        >
          <Icono size={21} color={color.tinta} strokeWidth={2.2} />
        </LinearGradient>
      ) : (
        <View style={[styles.circulo, styles.vidrio]}>
          <Icono size={21} color={color.sobreDegradado} strokeWidth={2} />
        </View>
      )}

      <T v="small" color={color.sobreDegradadoSuave} style={styles.etiqueta}>
        {etiqueta}
      </T>
    </Presionable>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 7, flex: 1, minWidth: 64 },
  circulo: {
    width: 52,
    height: 52,
    minWidth: TOQUE_MIN,
    minHeight: TOQUE_MIN,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vidrio: {
    backgroundColor: color.vidrioClaro,
    borderWidth: 1,
    borderColor: color.vidrioClaroBorde,
  },
  etiqueta: { fontSize: 12, lineHeight: 15 },
});

/** Botón circular de icono para el encabezado (buscar, notificaciones). */
export function IconoRedondo({
  Icono,
  etiqueta,
  onPress,
  punto,
}: {
  Icono: LucideIcon;
  etiqueta: string;
  onPress?: () => void;
  /** Punto rojo de "hay algo sin leer". */
  punto?: boolean;
}) {
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={iconoStyles.boton}
    >
      <Icono size={19} color={color.sobreDegradado} strokeWidth={2} />
      {punto ? <View style={iconoStyles.punto} /> : null}
    </Presionable>
  );
}

const iconoStyles = StyleSheet.create({
  boton: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.vidrioClaro,
    borderWidth: 1,
    borderColor: color.vidrioClaroBorde,
  },
  punto: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.marigold,
  },
});
