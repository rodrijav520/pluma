import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calculator, Check, ChevronRight, Lock } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Pluma } from '../../ui/Pluma';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space } from '../../ui/tokens';
import { LECCIONES, NIVELES } from '../../content/lecciones';
import { useLearn } from '../../state/learn';

export default function Aprender() {
  const router = useRouter();
  const completadas = useLearn((s) => s.completadas);
  const hechas = Object.keys(completadas).length;
  const progreso = hechas / LECCIONES.length;

  const nivelActual =
    ([4, 3, 2, 1] as const).find((n) =>
      LECCIONES.filter((l) => l.nivel < n).every((l) => completadas[l.id]),
    ) ?? 1;

  return (
    <Pantalla pieEspacio={110}>
      <T v="h1">Escuela Cripto</T>
      <T v="bodyLg" style={{ marginTop: 4, marginBottom: space.l }}>
        De cero a cobrar con confianza. En chapín y sin humo.
      </T>

      {/* Tu pluma crece con cada lección */}
      <Glass style={styles.progreso}>
        <Pluma alto={120} progreso={progreso} />
        <View style={{ flex: 1, gap: 6 }}>
          <T v="eyebrow">Tu pluma</T>
          <Mono size={26} weight="bold">
            {hechas}
            <Mono size={16} color={color.plumaSuave}>
              {' '}
              / {LECCIONES.length} lecciones
            </Mono>
          </Mono>
          <T v="small">
            Nivel {NIVELES[nivelActual].nombre} · {NIVELES[nivelActual].lema}
          </T>
        </View>
      </Glass>

      {/* Simulador */}
      <Presionable
        onPress={() => router.push('/simulador')}
        accessibilityRole="button"
        accessibilityLabel="Abrir simulador de ahorro"
        style={{ marginTop: space.m }}
      >
        <Glass relleno="rgba(45,227,155,0.08)" style={styles.simulador}>
          <View style={styles.iconoSim}>
            <Calculator size={20} color={color.jade} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="bodyStrong">¿Cuánto perdés al año?</T>
            <T v="small">Compará PayPal y el banco contra dólares digitales.</T>
          </View>
          <ChevronRight size={18} color={color.plumaTenue} />
        </Glass>
      </Presionable>

      {/* Niveles */}
      {([1, 2, 3, 4] as const).map((nivel) => {
        const lecciones = LECCIONES.filter((l) => l.nivel === nivel);
        const bloqueado = nivel > nivelActual;
        return (
          <View key={nivel} style={{ marginTop: space.xxl }}>
            <View style={styles.filaNivel}>
              <T v="eyebrow" color={bloqueado ? color.plumaTenue : color.cacao}>
                Nivel {nivel} · {NIVELES[nivel].nombre}
              </T>
              {bloqueado && <Lock size={13} color={color.plumaTenue} />}
            </View>
            <Glass style={{ paddingHorizontal: space.l }}>
              {lecciones.map((l, i) => {
                const hecha = !!completadas[l.id];
                return (
                  <Presionable
                    key={l.id}
                    onPress={() =>
                      bloqueado
                        ? undefined
                        : router.push({ pathname: '/leccion/[id]', params: { id: l.id } })
                    }
                    disabled={bloqueado}
                    accessibilityRole="button"
                    accessibilityLabel={l.titulo}
                    style={[
                      styles.filaLeccion,
                      i < lecciones.length - 1 && styles.conBorde,
                      bloqueado && { opacity: 0.45 },
                    ]}
                  >
                    <View style={[styles.check, hecha && styles.checkHecha]}>
                      {hecha && <Check size={13} color={color.sobreJade} strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T v="bodyStrong">{l.titulo}</T>
                      <T v="small" numberOfLines={1}>
                        {l.resumen}
                      </T>
                    </View>
                    <ChevronRight size={17} color={color.plumaTenue} />
                  </Presionable>
                );
              })}
            </Glass>
          </View>
        );
      })}

      <T v="small" centrado style={{ marginTop: space.xxl, maxWidth: 300, alignSelf: 'center' }}>
        Contenido educativo — no es asesoría financiera ni fiscal. Para tu caso, un contador de
        confianza vale oro.
      </T>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  progreso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.l,
    padding: space.xl,
  },
  simulador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.m,
    borderColor: color.bordeJade,
  },
  iconoSim: {
    width: 42,
    height: 42,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,227,155,0.12)',
  },
  filaNivel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filaLeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  conBorde: { borderBottomWidth: 1, borderBottomColor: color.borde },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: color.bordeLuz,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHecha: { backgroundColor: color.jade, borderColor: color.jade },
});
