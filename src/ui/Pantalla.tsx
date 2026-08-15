import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from './tokens';

/**
 * Contenedor base: papel limpio + safe areas.
 *
 * Sin orbes ni gradientes ambientales. El fondo es papel y se queda quieto;
 * toda la atención tipográfica va al saldo, que es lo que la persona vino a ver.
 */
export function Pantalla({
  children,
  scroll = true,
  style,
  refrescando,
  onRefrescar,
  pieEspacio = space.xxxl,
  fondo = color.papel,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  refrescando?: boolean;
  onRefrescar?: () => void;
  pieEspacio?: number;
  fondo?: string;
}) {
  const insets = useSafeAreaInsets();

  const relleno = {
    paddingTop: insets.top + space.m,
    paddingBottom: insets.bottom + pieEspacio,
    paddingHorizontal: space.pantalla,
  };

  return (
    <View style={[styles.raiz, { backgroundColor: fondo }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[relleno, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefrescar ? (
              <RefreshControl
                refreshing={!!refrescando}
                onRefresh={onRefrescar}
                tintColor={color.tinta}
                colors={[color.tinta]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, relleno, style]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
