import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { color } from '../ui/tokens';
import { Avisos } from '../ui/Avisos';
import { Pluma } from '../ui/Pluma';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Pantalla } from '../ui/Pantalla';
import { useSesion } from '../state/sesion';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Error global: dice qué pasó y da una salida. No pide disculpas. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <Pantalla scroll={false} style={{ justifyContent: 'center', gap: 16 }}>
      <Pluma alto={72} />
      <T v="h1">Algo se quebró</T>
      <T v="cuerpo">
        La app tuvo un error inesperado. Tu saldo no se movió: las operaciones solo cambian cuando el
        servidor las confirma.
      </T>
      <T v="small" numberOfLines={4}>
        {error.message}
      </T>
      <Boton titulo="Reintentar" onPress={() => retry()} />
    </Pantalla>
  );
}

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const restaurar = useSesion((s) => s.restaurar);
  const listo = useSesion((s) => s.listo);

  useEffect(() => {
    restaurar();
  }, [restaurar]);

  useEffect(() => {
    if (fuentesListas && listo) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas, listo]);

  // Se espera a fuentes y sesión juntas: así no se ve un parpadeo de login para
  // alguien que ya tenía sesión abierta.
  if (!fuentesListas || !listo) {
    return <View style={{ flex: 1, backgroundColor: color.papel }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: color.papel }}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.papel },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="bienvenida" options={{ animation: 'fade' }} />
            <Stack.Screen name="entrar" />
            <Stack.Screen name="crear-cuenta" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="comprar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cambiar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="enviar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="recibir" options={{ presentation: 'modal' }} />
          </Stack>
          <Avisos />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
