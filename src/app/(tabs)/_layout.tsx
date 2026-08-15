import React from 'react';
import { Tabs } from 'expo-router';
import { BarraTabs } from '../../ui/BarraTabs';
import { usePolling } from '../../hooks/use-polling';

export default function TabsLayout() {
  usePolling();

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
