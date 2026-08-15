import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { soloNativo } from '../ui/anim';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { color, radius, space } from '../ui/tokens';

const ANCHO = Dimensions.get('window').width;

const SLIDES = [
  {
    img: require('../../assets/ilustraciones/hero-cobra.webp'),
    titulo: 'Cobrá al mundo',
    texto:
      'Mandá tu pluma —un link de cobro— y recibí dólares digitales en minutos. No en 5 días, no perdiendo 8%.',
  },
  {
    img: require('../../assets/ilustraciones/hero-llaves.webp'),
    titulo: 'Tus llaves, tu pisto',
    texto:
      'Pluma es no-custodial: las llaves de tu dinero viven solo en tu teléfono. El quetzal no vive enjaulado.',
  },
  {
    img: require('../../assets/ilustraciones/hero-aprende.webp'),
    titulo: 'Aprendé sin miedo',
    texto:
      'La Escuela Cripto te lleva de cero a cobrar con confianza: lecciones de 1 minuto, en chapín y sin humo.',
  },
] as const;

export default function Bienvenida() {
  const router = useRouter();
  const [pagina, setPagina] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Pantalla scroll={false} style={{ paddingHorizontal: 0 }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setPagina(Math.round(e.nativeEvent.contentOffset.x / ANCHO))
          }
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: ANCHO, paddingHorizontal: space.pantalla }}>
              <Animated.View entering={soloNativo(FadeInDown.duration(320))} style={styles.slide}>
                <Image source={s.img} style={styles.imagen} accessibilityIgnoresInvertColors />
                <T v="h1" centrado>
                  {s.titulo}
                </T>
                <T v="bodyLg" centrado style={{ maxWidth: 320 }}>
                  {s.texto}
                </T>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.puntos}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.punto,
                i === pagina && { backgroundColor: color.jade, width: 22 },
              ]}
            />
          ))}
        </View>

        <View style={{ paddingHorizontal: space.pantalla, gap: 10 }}>
          {pagina < SLIDES.length - 1 ? (
            <Boton
              titulo="Siguiente"
              onPress={() =>
                scrollRef.current?.scrollTo({ x: ANCHO * (pagina + 1), animated: true })
              }
            />
          ) : (
            <Boton titulo="Crear mi wallet" onPress={() => router.push('/crear/frase')} />
          )}
          <Boton
            titulo="Ya tengo una wallet"
            variante="fantasma"
            onPress={() => router.push('/importar')}
          />
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.l,
  },
  imagen: {
    width: Math.min(ANCHO - 80, 330),
    height: Math.min(ANCHO - 80, 330),
    borderRadius: radius.card,
    marginBottom: space.s,
  },
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: space.xl,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.musgo,
  },
});
