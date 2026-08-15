import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Lock } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T } from '../../ui/T';
import { Hoja } from '../../ui/Hoja';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space, TOQUE_MIN } from '../../ui/tokens';
import { LECCIONES, NIVELES } from '../../content/lecciones';
import { useLearn } from '../../state/learn';

export default function Aprender() {
  const router = useRouter();
  const completadas = useLearn((s) => s.completadas);
  const hechas = Object.keys(completadas).length;
  const progreso = LECCIONES.length ? hechas / LECCIONES.length : 0;

  const nivelActual =
    ([4, 3, 2, 1] as const).find((n) =>
      LECCIONES.filter((l) => l.nivel < n).every((l) => completadas[l.id]),
    ) ?? 1;

  return (
    <Pantalla pieEspacio={110}>
      <T v="h1">Escuela Cripto</T>
      <T v="cuerpo" style={styles.bajada}>
        De cero a cobrar con confianza. En chapín y sin humo.
      </T>

      <Hoja style={styles.progreso}>
        <View style={styles.progresoFila}>
          <View style={{ flex: 1 }}>
            <T v="etiqueta">Tu avance</T>
            <T v="dato" style={styles.progresoNumero}>
              {hechas} de {LECCIONES.length} lecciones
            </T>
          </View>
          <T v="small">
            Nivel {nivelActual} · {NIVELES[nivelActual].nombre}
          </T>
        </View>
        <View
          style={styles.barra}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: LECCIONES.length, now: hechas }}
        >
          <View style={[styles.barraLlena, { width: `${Math.round(progreso * 100)}%` }]} />
        </View>
      </Hoja>

      {([1, 2, 3, 4] as const).map((nivel) => {
        const lecciones = LECCIONES.filter((l) => l.nivel === nivel);
        if (lecciones.length === 0) return null;
        const bloqueado = nivel > nivelActual;

        return (
          <View key={nivel} style={styles.bloque}>
            <View style={styles.filaNivel}>
              <T v="etiqueta" color={bloqueado ? color.lapizTenue : color.tinta}>
                Nivel {nivel} · {NIVELES[nivel].nombre}
              </T>
              {bloqueado ? <Lock size={13} color={color.lapizTenue} /> : null}
            </View>

            <Hoja style={styles.lista}>
              {lecciones.map((l, i) => {
                const hecha = !!completadas[l.id];
                return (
                  <Presionable
                    key={l.id}
                    onPress={
                      bloqueado
                        ? undefined
                        : () => router.push({ pathname: '/leccion/[id]', params: { id: l.id } })
                    }
                    disabled={bloqueado}
                    accessibilityRole="button"
                    accessibilityLabel={l.titulo}
                    accessibilityState={{ disabled: bloqueado }}
                    style={[
                      styles.filaLeccion,
                      i < lecciones.length - 1 && styles.conBorde,
                      bloqueado && styles.bloqueada,
                    ]}
                  >
                    <View style={[styles.check, hecha && styles.checkHecha]}>
                      {hecha ? <Check size={13} color={color.sobreTinta} strokeWidth={3} /> : null}
                    </View>
                    <View style={styles.textoLeccion}>
                      <T v="cuerpoFuerte">{l.titulo}</T>
                      <T v="small" numberOfLines={1}>
                        {l.resumen}
                      </T>
                    </View>
                    <ChevronRight size={17} color={color.lapizTenue} />
                  </Presionable>
                );
              })}
            </Hoja>
          </View>
        );
      })}

      <T v="small" centrado style={styles.nota}>
        Contenido educativo — no es asesoría financiera ni fiscal. Para tu caso, un contador de
        confianza vale oro.
      </T>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bajada: { marginTop: space.xs, marginBottom: space.l, fontSize: 16, lineHeight: 24 },
  progreso: { gap: space.m },
  progresoFila: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
  progresoNumero: { marginTop: 2 },
  barra: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.papelHundido,
    overflow: 'hidden',
  },
  barraLlena: { height: '100%', backgroundColor: color.tinta, borderRadius: radius.pill },
  bloque: { marginTop: space.xxl },
  filaNivel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.s },
  lista: { paddingVertical: 0 },
  filaLeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingVertical: 14,
    minHeight: TOQUE_MIN,
  },
  bloqueada: { opacity: 0.45 },
  conBorde: { borderBottomWidth: 1, borderBottomColor: color.trazo },
  textoLeccion: { flex: 1, gap: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: color.trazoFuerte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHecha: { backgroundColor: color.tinta, borderColor: color.tinta },
  nota: { marginTop: space.xxl, maxWidth: 300, alignSelf: 'center' },
});
