import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle2, CloudOff, Info, TriangleAlert, XCircle } from 'lucide-react-native';
import { soloNativo } from './anim';
import { useToast } from '../state/toast';
import { T } from './T';
import { Glass } from './Glass';
import { color, radius, space } from './tokens';

type Tono = 'ok' | 'error' | 'espera' | 'info';

const TONOS: Record<Tono, { tinte: string; fondo: string; Icono: typeof Info }> = {
  ok: { tinte: color.entra, fondo: color.entraTenue, Icono: CheckCircle2 },
  error: { tinte: color.sale, fondo: color.saleTenue, Icono: XCircle },
  espera: { tinte: color.espera, fondo: color.esperaTenue, Icono: TriangleAlert },
  info: { tinte: color.tinta, fondo: color.tintaTenue, Icono: Info },
};

/**
 * Aviso en línea, junto a lo que explica.
 *
 * Los errores de formulario no van en un toast que se va solo: se quedan al
 * lado del campo hasta que la persona los resuelve.
 */
export function Aviso({ tono = 'info', texto }: { tono?: Tono; texto: string }) {
  const { tinte, fondo, Icono } = TONOS[tono];
  return (
    <View
      style={[styles.enLinea, { backgroundColor: fondo, borderColor: tinte }]}
      accessibilityLiveRegion="polite"
    >
      <Icono size={18} color={tinte} strokeWidth={2} />
      <T v="cuerpo" color={color.grafito} style={styles.enLineaTexto}>
        {texto}
      </T>
    </View>
  );
}

/** Host global de toasts + banner sin conexión. Vive en el layout raíz. */
export function Avisos() {
  const toasts = useToast((s) => s.toasts);
  const online = useToast((s) => s.online);
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      {!online && (
        <Animated.View
          entering={soloNativo(FadeInUp.duration(240))}
          exiting={soloNativo(FadeOutUp.duration(180))}
        >
          <Glass radio={radius.m} relleno={color.esperaTenue} style={styles.toast}>
            <CloudOff size={16} color={color.espera} strokeWidth={2} />
            <T v="small" color={color.grafito} style={{ flex: 1 }}>
              Sin conexión — mostrando lo último que vimos
            </T>
          </Glass>
        </Animated.View>
      )}

      {toasts.map((t) => {
        const { tinte, Icono } = TONOS[(t.tipo as Tono) in TONOS ? (t.tipo as Tono) : 'info'];
        return (
          <Animated.View
            key={t.id}
            entering={soloNativo(FadeInUp.duration(240))}
            exiting={soloNativo(FadeOutUp.duration(180))}
          >
            <Glass radio={radius.m} style={styles.toast}>
              <Icono size={16} color={tinte} strokeWidth={2} />
              <T v="cuerpo" color={color.grafito} style={{ flex: 1 }} numberOfLines={3}>
                {t.texto}
              </T>
            </Glass>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: space.pantalla,
    right: space.pantalla,
    gap: space.s,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: color.trazo,
  },
  enLinea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: space.m,
    borderRadius: radius.m,
    borderWidth: 1,
  },
  enLineaTexto: { flex: 1, color: color.grafito },
});
