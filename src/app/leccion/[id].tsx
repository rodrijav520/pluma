import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Check, X as XIcon, ArrowLeft } from 'lucide-react-native';
import { soloNativo } from '../../ui/anim';
import { Pantalla } from '../../ui/Pantalla';
import { T } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Boton } from '../../ui/Boton';
import { Pluma } from '../../ui/Pluma';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space } from '../../ui/tokens';
import { leccionPorId, NIVELES } from '../../content/lecciones';
import { useLearn } from '../../state/learn';

export default function LeccionPlayer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leccion = useMemo(() => (id ? leccionPorId(id) : undefined), [id]);
  const completar = useLearn((s) => s.completar);
  const yaHecha = useLearn((s) => (id ? !!s.completadas[id] : false));

  const [paso, setPaso] = useState(0);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [terminada, setTerminada] = useState(false);

  if (!leccion) {
    return (
      <Pantalla>
        <T v="h2">Esa lección no existe</T>
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </Pantalla>
    );
  }

  const totalPasos = leccion.cartas.length + leccion.quiz.length;
  const enQuiz = paso >= leccion.cartas.length;
  const preguntaIdx = paso - leccion.cartas.length;
  const pregunta = enQuiz && !terminada ? leccion.quiz[preguntaIdx] : null;
  const progreso = terminada ? 1 : paso / totalPasos;

  const avanzar = () => {
    if (paso + 1 >= totalPasos) {
      const total = leccion.quiz.length;
      const finales = aciertos;
      if (!yaHecha) completar(leccion.id, finales, total);
      setTerminada(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setPaso((p) => p + 1);
      setSeleccion(null);
    }
  };

  if (terminada) {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', alignItems: 'center', gap: space.l }}>
        <Pluma alto={140} animada />
        <T v="h1" centrado>
          {yaHecha ? '¡Repasada!' : '¡Ganaste una pluma!'}
        </T>
        <T v="bodyLg" centrado style={{ maxWidth: 300 }}>
          {aciertos} de {leccion.quiz.length} correctas en «{leccion.titulo}».
        </T>
        <Boton
          titulo="Seguir aprendiendo"
          onPress={() => router.back()}
          style={{ alignSelf: 'stretch', marginTop: space.l }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla scroll={false}>
      <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Salir de la lección" style={styles.volver}>
        <ArrowLeft size={20} color={color.plumaSuave} />
        <T v="small">
          Nivel {NIVELES[leccion.nivel].nombre} · {leccion.titulo}
        </T>
      </Presionable>

      {/* Barra de progreso */}
      <View style={styles.barra}>
        <View style={[styles.barraLlena, { width: `${Math.max(progreso * 100, 4)}%` }]} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {!enQuiz ? (
          <Animated.View key={paso} entering={soloNativo(FadeInRight.duration(260))}>
            <Glass style={styles.carta}>
              <T v="eyebrow">
                {paso + 1} / {leccion.cartas.length}
              </T>
              <T v="bodyLg" style={{ fontSize: 18, lineHeight: 28, color: color.pluma }}>
                {leccion.cartas[paso]}
              </T>
            </Glass>
          </Animated.View>
        ) : pregunta ? (
          <Animated.View key={paso} entering={soloNativo(FadeInRight.duration(260))} style={{ gap: space.l }}>
            <T v="eyebrow">Pregunta {preguntaIdx + 1} de {leccion.quiz.length}</T>
            <T v="h2">{pregunta.pregunta}</T>
            <View style={{ gap: 10 }}>
              {pregunta.opciones.map((op, i) => {
                const elegida = seleccion === i;
                const esCorrecta = i === pregunta.correcta;
                const revelada = seleccion != null;
                return (
                  <Presionable
                    key={i}
                    disabled={revelada}
                    onPress={() => {
                      setSeleccion(i);
                      const acerto = i === pregunta.correcta;
                      if (acerto) setAciertos((a) => a + 1);
                      if (Platform.OS !== 'web') {
                        (acerto
                          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                          : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                        ).catch(() => {});
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={op}
                    style={[
                      styles.opcion,
                      revelada && esCorrecta && styles.opcionCorrecta,
                      revelada && elegida && !esCorrecta && styles.opcionMala,
                    ]}
                  >
                    <T
                      v="bodyStrong"
                      style={{ flex: 1 }}
                      color={revelada && esCorrecta ? color.jade : revelada && elegida ? color.pecho : color.pluma}
                    >
                      {op}
                    </T>
                    {revelada && esCorrecta && <Check size={18} color={color.jade} strokeWidth={2.5} />}
                    {revelada && elegida && !esCorrecta && <XIcon size={18} color={color.pecho} strokeWidth={2.5} />}
                  </Presionable>
                );
              })}
            </View>
            {seleccion != null && (
              <Animated.View entering={soloNativo(FadeInDown.duration(240))}>
                <Glass radio={radius.m} relleno="rgba(45,227,155,0.06)" style={{ padding: space.m }}>
                  <T v="body" color={color.pluma}>
                    {pregunta.porQue}
                  </T>
                </Glass>
              </Animated.View>
            )}
          </Animated.View>
        ) : null}
      </View>

      <Boton
        titulo={
          !enQuiz
            ? paso + 1 === leccion.cartas.length
              ? 'Ir al quiz'
              : 'Siguiente'
            : paso + 1 >= totalPasos
              ? 'Terminar'
              : 'Siguiente pregunta'
        }
        deshabilitado={enQuiz && seleccion == null}
        onPress={avanzar}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  barra: {
    height: 4,
    borderRadius: 2,
    backgroundColor: color.musgo,
    marginTop: space.m,
    overflow: 'hidden',
  },
  barraLlena: { height: '100%', borderRadius: 2, backgroundColor: color.jade },
  carta: { padding: space.xl, gap: space.m },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: space.l,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
  },
  opcionCorrecta: { borderColor: color.jade, backgroundColor: 'rgba(45,227,155,0.10)' },
  opcionMala: { borderColor: color.pecho, backgroundColor: 'rgba(255,77,94,0.08)' },
});
