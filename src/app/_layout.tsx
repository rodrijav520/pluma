import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import Animated, { FadeOut } from 'react-native-reanimated';
import { soloNativo } from '../ui/anim';
import { color } from '../ui/tokens';
import { Avisos } from '../ui/Avisos';
import { Candado } from '../ui/Candado';
import { useApp } from '../state/app';
import { Pluma } from '../ui/Pluma';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Pantalla } from '../ui/Pantalla';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Pantalla de error global: causa clara + salida (sin disculpas vacías). */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <Pantalla scroll={false} style={{ justifyContent: 'center', gap: 16 }}>
      <Pluma alto={90} opacidad={0.6} rotacion={18} />
      <T v="h1">Algo se quebró</T>
      <T v="body">
        La app tuvo un error inesperado. Tu dinero está seguro: tus llaves viven en tu teléfono,
        no en la app.
      </T>
      <T v="small" numberOfLines={3}>
        {error.message}
      </T>
      <Boton titulo="Reintentar" onPress={() => retry()} />
    </Pantalla>
  );
}

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    // Arranque en frío: si hay PIN, la app abre bloqueada.
    if (useApp.getState().pinSet) useApp.getState().setBloqueada(true);
  }, []);

  useEffect(() => {
    if (fuentesListas) {
      SplashScreen.hideAsync().catch(() => {});
      const t = setTimeout(() => setIntro(false), 1100);
      return () => clearTimeout(t);
    }
  }, [fuentesListas]);

  if (!fuentesListas) {
    return <View style={{ flex: 1, backgroundColor: color.noche }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: color.noche }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.noche },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="bienvenida" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="cobrar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="enviar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="recibir" options={{ presentation: 'modal' }} />
            <Stack.Screen name="escanear" options={{ presentation: 'modal' }} />
            <Stack.Screen name="fondear" options={{ presentation: 'modal' }} />
            <Stack.Screen name="simulador" options={{ presentation: 'modal' }} />
          </Stack>
          <Candado />
          <Avisos />

          {intro && (
            <Animated.View
              exiting={soloNativo(FadeOut.duration(400))}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.intro]}
            >
              <Pluma alto={150} animada />
              <T v="h1" style={{ marginTop: 20 }}>
                Pluma
              </T>
              <T v="small">Tu pisto, tus llaves</T>
            </Animated.View>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  intro: {
    backgroundColor: color.noche,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
});
