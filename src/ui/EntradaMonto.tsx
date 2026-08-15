import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { T } from './T';
import { Presionable } from './Presionable';
import { color, font, radius, space } from './tokens';

/**
 * Entrada de monto.
 *
 * El número es el protagonista de la pantalla, así que va grande y tabular. La
 * conversión a la otra moneda se muestra en vivo debajo — nunca se le pide a la
 * persona que adivine cuánto es en lo que ella usa todos los días.
 */
export function EntradaMonto({
  simbolo,
  valor,
  onCambio,
  equivalente,
  disponible,
  onMaximo,
  error,
  autoFoco = true,
}: {
  /** "Q" o "$" */
  simbolo: string;
  valor: string;
  onCambio: (v: string) => void;
  /** Lo mismo, en la otra moneda. Ej: "≈ $ 13.10" */
  equivalente?: string;
  /** Texto de saldo disponible. Ej: "Disponible Q 500.00" */
  disponible?: string;
  onMaximo?: () => void;
  error?: string | null;
  autoFoco?: boolean;
}) {
  function limpiar(texto: string) {
    // Solo dígitos y un separador decimal; se acepta coma y se normaliza a punto.
    const normalizado = texto.replace(',', '.').replace(/[^0-9.]/g, '');
    const partes = normalizado.split('.');
    const unido = partes.length > 2 ? `${partes[0]}.${partes.slice(1).join('')}` : normalizado;
    // Máximo dos decimales para montos en moneda.
    const [entera, decimal] = unido.split('.');
    return decimal !== undefined ? `${entera}.${decimal.slice(0, 6)}` : entera;
  }

  return (
    <View style={styles.raiz}>
      <View style={styles.linea}>
        <T v="saldoMayor" color={valor ? color.grafito : color.lapizTenue}>
          {simbolo}
        </T>
        <TextInput
          value={valor}
          onChangeText={(t) => onCambio(limpiar(t))}
          placeholder="0.00"
          placeholderTextColor={color.lapizTenue}
          keyboardType="decimal-pad"
          autoFocus={autoFoco}
          accessibilityLabel="Monto"
          style={[styles.input, { outlineStyle: 'none' } as object]}
        />
      </View>

      {equivalente ? (
        <T v="saldoMenor" style={styles.equivalente}>
          {equivalente}
        </T>
      ) : null}

      <View style={styles.pie}>
        {disponible ? <T v="small">{disponible}</T> : <View />}
        {onMaximo ? (
          <Presionable
            onPress={onMaximo}
            accessibilityRole="button"
            accessibilityLabel="Usar el máximo disponible"
            style={styles.maximo}
          >
            <T v="small" color={color.tinta}>
              Usar todo
            </T>
          </Presionable>
        ) : null}
      </View>

      {error ? (
        <T v="small" color={color.sale} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: space.s },
  linea: { flexDirection: 'row', alignItems: 'baseline', gap: space.s },
  input: {
    flex: 1,
    fontFamily: font.cifraBold,
    fontSize: 52,
    letterSpacing: -1.5,
    color: color.grafito,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  equivalente: { marginTop: -space.xs },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.s,
  },
  maximo: {
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderRadius: radius.pill,
    backgroundColor: color.tintaTenue,
  },
});
