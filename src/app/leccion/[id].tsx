import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Check, X as XIcon, ArrowLeft } from 'lucide-react-native';
import { soloNativo } from '../../ui/anim';
import { Pantalla } from '../../ui/Pantalla';
import { T } from '../../ui/T';
import { Hoja } from '../../ui/Hoja';
import { Boton } from '../../ui/Boton';
import { Pluma } from '../../ui/Pluma';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space, TOQUE_MIN } from '../../ui/tokens';
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
        <Boton
          titulo="Volver"
          variante="secundario"
          onPress={() => router.back()}
          style={{ marginTop: space.l }}
        />
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
      if (!yaHecha) completar(leccion.id, aciertos, leccion.quiz.length);
      setTerminada(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      setPaso((p) => p + 1);
      setSeleccion(null);
    }
  };

  if (terminada) {
    return (
      <Pantalla scroll={false} style={styles.fin}>
        <Pluma alto={110} />
        <T v="h1" centrado>
          {yaHecha ? 'Repasada' : 'Lección completada'}
        </T>
        <T v="cuerpo" centrado style={styles.finTexto}>
          {aciertos} de {leccion.quiz.length} correctas en «{leccion.titulo}».
        </T>
        <Boton titulo="Seguir aprendiendo" onPress={() => router.back()} style={styles.finBoton} />
      </Pantalla>
    );
  }

  return (
    <Pantalla scroll={false}>
      <Presionable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Salir de la lección"
        style={styles.volver}
      >
        <ArrowLeft size={20} color={color.lapiz} />
        <T v="small" numberOfLines={1} style={{ flex: 1 }}>
          Nivel {NIVELES[leccion.nivel].nombre} · {leccion.titulo}
        </T>
      </Presionable>

      <View
        style={styles.barra}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalPasos, now: paso }}
      >
        <View style={[styles.barraLlena, { width: `${Math.max(progreso * 100, 4)}%` }]} />
      </View>

      <View style={styles.cuerpo}>
        {!enQuiz ? (
          <Animated.View key={paso} entering={soloNativo(FadeInRight.duration(260))}>
            <Hoja style={styles.carta}>
              <T v="etiqueta">
                {paso + 1} / {leccion.cartas.length}
              </T>
              <T v="cuerpo" style={styles.cartaTexto}>
                {leccion.cartas[paso]}
              </T>
            </Hoja>
          </Animated.View>
        ) : pregunta ? (
          <Animated.View
            key={paso}
            entering={soloNativo(FadeInRight.duration(260))}
            style={{ gap: space.l }}
          >
            <T v="etiqueta">
              Pregunta {preguntaIdx + 1} de {leccion.quiz.length}
            </T>
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
                        Haptics.notificationAsync(
                          acerto
                            ? Haptics.NotificationFeedbackType.Success
                            : Haptics.NotificationFeedbackType.Error,
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
                      v="cuerpoFuerte"
                      style={{ flex: 1 }}
                      color={
                        revelada && esCorrecta
                          ? color.entra
                          : revelada && elegida
                            ? color.sale
                            : color.grafito
                      }
                    >
                      {op}
                    </T>
                    {revelada && esCorrecta ? (
                      <Check size={18} color={color.entra} strokeWidth={2.5} />
                    ) : null}
                    {revelada && elegida && !esCorrecta ? (
                      <XIcon size={18} color={color.sale} strokeWidth={2.5} />
                    ) : null}
                  </Presionable>
                );
              })}
            </View>

            {seleccion != null ? (
              <Animated.View entering={soloNativo(FadeInDown.duration(240))}>
                <Hoja plana relleno={color.tintaTenue} radio={radius.m}>
                  <T v="cuerpo" color={color.grafito}>
                    {pregunta.porQue}
                  </T>
                </Hoja>
              </Animated.View>
            ) : null}
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
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    minHeight: TOQUE_MIN,
  },
  barra: {
    height: 4,
    borderRadius: 2,
    backgroundColor: color.papelHundido,
    marginTop: space.s,
    overflow: 'hidden',
  },
  barraLlena: { height: '100%', borderRadius: 2, backgroundColor: color.tinta },
  cuerpo: { flex: 1, justifyContent: 'center' },
  carta: { padding: space.xl, gap: space.m },
  cartaTexto: { fontSize: 18, lineHeight: 28, color: color.grafito },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: space.l,
    minHeight: TOQUE_MIN,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: color.trazo,
    backgroundColor: color.papelAlto,
  },
  opcionCorrecta: { borderColor: color.entra, backgroundColor: color.entraTenue },
  opcionMala: { borderColor: color.sale, backgroundColor: color.saleTenue },
  fin: { justifyContent: 'center', alignItems: 'center', gap: space.l },
  finTexto: { maxWidth: 300 },
  finBoton: { alignSelf: 'stretch', marginTop: space.l },
});
