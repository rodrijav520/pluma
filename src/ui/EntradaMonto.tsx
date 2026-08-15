import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import { T, Mono } from './T';
import { Presionable } from './Presionable';
import { color } from './tokens';
import { fmtGtq, fmtUsd, parseMonto } from '../core/format';
import { useFx } from '../state/fx';

/**
 * Entrada de monto con mentalidad quetzal: escribís en GTQ o USD y siempre
 * ves la conversión. Reporta el valor en USD (la moneda del riel).
 */
export function EntradaMonto({
  onUsd,
  autoFoco = true,
  inicialUsd,
}: {
  onUsd: (usd: number) => void;
  autoFoco?: boolean;
  /** pre-llenado (p. ej. desde un QR escaneado); arranca en modo USD */
  inicialUsd?: number;
}) {
  const rate = useFx((s) => s.rate);
  const [texto, setTexto] = useState(() => (inicialUsd && inicialUsd > 0 ? inicialUsd.toFixed(2) : ''));
  const [moneda, setMoneda] = useState<'GTQ' | 'USD'>(inicialUsd && inicialUsd > 0 ? 'USD' : 'GTQ');

  const bruto = parseMonto(texto);
  const usd = moneda === 'USD' ? bruto : rate > 0 ? bruto / rate : 0;

  const cambiar = (v: string) => {
    if (!/^[\d.,\s]*$/.test(v)) return;
    setTexto(v);
    const n = parseMonto(v);
    onUsd(moneda === 'USD' ? n : rate > 0 ? n / rate : 0);
  };

  const alternar = () => {
    const nueva = moneda === 'GTQ' ? 'USD' : 'GTQ';
    // conserva el valor: convierte el texto actual a la otra moneda
    if (bruto > 0) {
      const convertido = nueva === 'USD' ? bruto / rate : bruto * rate;
      setTexto(convertido.toFixed(2));
    }
    setMoneda(nueva);
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.fila}>
        <Mono size={30} weight="bold" color={color.plumaSuave}>
          {moneda === 'GTQ' ? 'Q' : '$'}
        </Mono>
        <TextInput
          value={texto}
          onChangeText={cambiar}
          placeholder="0.00"
          placeholderTextColor={color.plumaTenue}
          keyboardType="decimal-pad"
          autoFocus={autoFoco}
          accessibilityLabel={`Monto en ${moneda}`}
          style={[styles.input, { outlineStyle: 'none' } as object]}
          maxLength={12}
        />
      </View>
      <Presionable
        onPress={alternar}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar a ${moneda === 'GTQ' ? 'dólares' : 'quetzales'}`}
        style={styles.toggle}
      >
        <ArrowUpDown size={13} color={color.jade} />
        <T v="small" color={color.jade}>
          {moneda === 'GTQ'
            ? `≈ ${fmtUsd(usd)} USDC`
            : `≈ ${fmtGtq(bruto * rate)} quetzales`}
        </T>
      </Presionable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 10 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 46,
    letterSpacing: -1,
    color: color.pluma,
    minWidth: 140,
    maxWidth: 250,
    flexGrow: 0,
    flexShrink: 1,
    textAlign: 'center',
    padding: 0,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.bordeJade,
    backgroundColor: 'rgba(45,227,155,0.08)',
  },
});
