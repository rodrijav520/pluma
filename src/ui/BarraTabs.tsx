import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraduationCap, History, Home, Settings2 } from 'lucide-react-native';
import { Glass } from './Glass';
import { Presionable } from './Presionable';
import { T } from './T';
import { color, elevation, radius, space, TOQUE_MIN } from './tokens';

const ICONOS: Record<string, { icono: typeof Home; etiqueta: string }> = {
  index: { icono: Home, etiqueta: 'Inicio' },
  actividad: { icono: History, etiqueta: 'Actividad' },
  aprender: { icono: GraduationCap, etiqueta: 'Aprender' },
  ajustes: { icono: Settings2, etiqueta: 'Ajustes' },
};

type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    // Firmas laxas a propósito: react-navigation las tipa con genéricos por
    // evento y acá solo se usan tabPress y navigate.
    emit: (e: any) => any;
    navigate: (name: any) => void;
  };
};

/**
 * Barra inferior de vidrio.
 *
 * Sin botón flotante central: las acciones de dinero viven en la pantalla de
 * inicio, donde están junto al saldo que las explica. Un FAB acá sería un
 * cuarto lugar desde donde disparar lo mismo.
 */
export function BarraTabs({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const rutas = state.routes.filter((r) => ICONOS[r.name]);

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 12) }]}>
      <Glass radio={radius.pill} style={styles.barra}>
        {rutas.map((ruta) => {
          const activa = state.index === state.routes.indexOf(ruta);
          const { icono: Icono, etiqueta } = ICONOS[ruta.name];
          return (
            <Presionable
              key={ruta.key}
              haptic={false}
              onPress={() => {
                const evento = navigation.emit({
                  type: 'tabPress',
                  target: ruta.key,
                  canPreventDefault: true,
                });
                if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name);
              }}
              accessibilityRole="tab"
              accessibilityLabel={etiqueta}
              accessibilityState={{ selected: activa }}
              style={styles.item}
            >
              <Icono
                size={22}
                color={activa ? color.tinta : color.lapizTenue}
                strokeWidth={activa ? 2.3 : 1.8}
              />
              <T
                v="small"
                style={styles.etiqueta}
                color={activa ? color.tinta : color.lapizTenue}
              >
                {etiqueta}
              </T>
            </Presionable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: space.xl, right: space.xl, alignItems: 'center' },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: space.s,
    width: '100%',
    borderWidth: 1,
    borderColor: color.trazo,
    ...elevation.hojaAlta,
  },
  item: {
    flex: 1,
    height: '100%',
    minHeight: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  etiqueta: { fontSize: 10, lineHeight: 12 },
});
