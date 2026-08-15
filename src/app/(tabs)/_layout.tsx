import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { BarraTabs } from '../../ui/BarraTabs';
import { useSesion } from '../../state/sesion';

export default function TabsLayout() {
  const usuario = useSesion((s) => s.usuario);

  // Nadie llega al área privada sin sesión, aunque entre por deep link.
  if (!usuario) return <Redirect href="/bienvenida" />;

  return (
    <Tabs
      tabBar={(props) => <BarraTabs {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="actividad" options={{ title: 'Actividad' }} />
      <Tabs.Screen name="aprender" options={{ title: 'Aprender' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
