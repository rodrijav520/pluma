import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './T';
import { color, radius, AVATAR_TONOS } from './tokens';

/** Iniciales del nombre: "Ana López" → "AL", "Ana" → "A". */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Suma estable de códigos: la misma persona siempre recibe el mismo tono. */
function tonoDe(nombre: string) {
  let suma = 0;
  for (let i = 0; i < nombre.length; i++) suma = (suma + nombre.charCodeAt(i)) % 997;
  return AVATAR_TONOS[suma % AVATAR_TONOS.length];
}

export function Avatar({
  nombre,
  tamano = 44,
  insignia,
  borde,
}: {
  nombre: string;
  tamano?: number;
  /** Número que aparece en el punto de la esquina (notificaciones sin leer). */
  insignia?: number;
  /** Aro claro alrededor: para cuando va sobre el degradado. */
  borde?: boolean;
}) {
  const tono = tonoDe(nombre || '?');
  const texto = iniciales(nombre || '?');

  return (
    <View>
      <LinearGradient
        colors={tono}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.circulo,
          { width: tamano, height: tamano, borderRadius: tamano / 2 },
          borde && styles.borde,
        ]}
        accessible
        accessibilityLabel={`Foto de perfil de ${nombre}`}
      >
        <T
          v="dato"
          color={color.sobreDegradado}
          style={{ fontSize: tamano * 0.36, lineHeight: tamano * 0.44 }}
        >
          {texto}
        </T>
      </LinearGradient>

      {insignia && insignia > 0 ? (
        <View style={styles.insignia}>
          <T v="small" color={color.sobreTinta} style={styles.insigniaTexto}>
            {insignia > 9 ? '9+' : insignia}
          </T>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  borde: { borderWidth: 2, borderColor: color.vidrioClaroBorde },
  insignia: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    backgroundColor: color.sale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.papelAlto,
  },
  insigniaTexto: { fontSize: 10, lineHeight: 13 },
});
