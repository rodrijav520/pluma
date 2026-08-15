import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GraduationCap, History, Home, QrCode, Settings2 } from 'lucide-react-native';
import { Glass } from './Glass';
import { Presionable } from './Presionable';
import { T } from './T';
import { color, elevation, radius } from './tokens';

const ICONOS: Record<string, { icono: typeof Home; etiqueta: string }> = {
  index: { icono: Home, etiqueta: 'Inicio' },
  actividad: { icono: History, etiqueta: 'Actividad' },
  aprender: { icono: GraduationCap, etiqueta: 'Aprender' },
  ajustes: { icono: Settings2, etiqueta: 'Ajustes' },
};

// Tipos mínimos del tab bar (evita depender de @react-navigation/bottom-tabs directo)
type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    // Firmas laxas a propósito: react-navigation las tipa con genéricos por evento
    // y aquí solo necesitamos tabPress/navigate.
    emit: (e: any) => any;
    navigate: (name: any) => void;
  };
};

/** Tab bar flotante de vidrio con la acción central: Cobrar (la pluma). */
export function BarraTabs({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rutas = state.routes.filter((r) => ICONOS[r.name]);
  const mitad = Math.ceil(rutas.length / 2);

  const Item = ({ ruta }: { ruta: TabRoute }) => {
    const activa = state.index === state.routes.indexOf(ruta);
    const { icono: Icono, etiqueta } = ICONOS[ruta.name];
    return (
      <Presionable
        haptic={false}
        onPress={() => {
          const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
          if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name);
        }}
        accessibilityRole="tab"
        accessibilityLabel={etiqueta}
        accessibilityState={{ selected: activa }}
        style={styles.item}
      >
        <Icono size={22} color={activa ? color.jade : color.plumaTenue} strokeWidth={activa ? 2.2 : 1.8} />
        <T
          v="small"
          style={{ fontSize: 10, lineHeight: 12 }}
          color={activa ? color.jade : color.plumaTenue}
        >
          {etiqueta}
        </T>
      </Presionable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 12) }]}>
      <Glass radio={radius.pill} style={styles.barra}>
        {rutas.slice(0, mitad).map((r) => (
          <Item key={r.key} ruta={r} />
        ))}
        <View style={styles.hueco} />
        {rutas.slice(mitad).map((r) => (
          <Item key={r.key} ruta={r} />
        ))}
      </Glass>

      <Presionable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          router.push('/cobrar');
        }}
        accessibilityRole="button"
        accessibilityLabel="Cobrar"
        style={styles.fab}
      >
        <QrCode size={24} color={color.sobreJade} strokeWidth={2.2} />
      </Presionable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    paddingHorizontal: 10,
    width: '100%',
    ...elevation.suave,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  hueco: { width: 64 },
  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.jade,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: color.noche,
    ...elevation.jadeGlow,
  },
});
