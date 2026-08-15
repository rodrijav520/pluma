import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle2, CloudOff, Info, XCircle } from 'lucide-react-native';
import { soloNativo } from './anim';
import { useToast } from '../state/toast';
import { T } from './T';
import { Glass } from './Glass';
import { color, radius, space } from './tokens';

/** Host global de toasts + banner offline. Vive en el layout raíz. */
export function Avisos() {
  const toasts = useToast((s) => s.toasts);
  const online = useToast((s) => s.online);
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      {!online && (
        <Animated.View entering={soloNativo(FadeInUp.duration(240))} exiting={soloNativo(FadeOutUp.duration(180))}>
          <Glass radio={radius.m} relleno="rgba(233,188,90,0.10)" style={styles.aviso}>
            <CloudOff size={16} color={color.cacao} strokeWidth={2} />
            <T v="small" color={color.cacao} style={{ flex: 1 }}>
              Sin conexión — mostrando lo último que vimos
            </T>
          </Glass>
        </Animated.View>
      )}
      {toasts.map((t) => {
        const Icono = t.tipo === 'ok' ? CheckCircle2 : t.tipo === 'error' ? XCircle : Info;
        const tinte = t.tipo === 'ok' ? color.jade : t.tipo === 'error' ? color.pecho : color.plumaSuave;
        return (
          <Animated.View key={t.id} entering={soloNativo(FadeInUp.duration(240))} exiting={soloNativo(FadeOutUp.duration(180))}>
            <Glass radio={radius.m} style={styles.aviso}>
              <Icono size={16} color={tinte} strokeWidth={2} />
              <T v="body" color={color.pluma} style={{ flex: 1 }} numberOfLines={2}>
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
    gap: 8,
    zIndex: 100,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
