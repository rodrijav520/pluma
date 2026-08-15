import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Clock3, XCircle } from 'lucide-react-native';
import { T, Mono } from './T';
import { Presionable } from './Presionable';
import { color, radius } from './tokens';
import { fmtGtq, fmtUnitsUsd, shortAddr, unitsToUsd, fmtHora } from '../core/format';
import type { Tx } from '../state/chain';

export function FilaTx({ tx, rate, onPress }: { tx: Tx; rate: number; onPress?: () => void }) {
  const entra = tx.dir === 'in';
  const usd = unitsToUsd(BigInt(tx.units));
  const gtq = usd * (tx.gtqRate ?? rate);

  const Icono = tx.status === 'fallo' ? XCircle : tx.status === 'pendiente' ? Clock3 : entra ? ArrowDownLeft : ArrowUpRight;
  const tinte = tx.status === 'fallo' ? color.pecho : tx.status === 'pendiente' ? color.cacao : entra ? color.jade : color.plumaSuave;

  const titulo =
    tx.concepto ??
    (tx.status === 'pendiente' ? 'Enviando…' : entra ? 'Cobro recibido' : 'Enviado');

  return (
    <Presionable onPress={onPress} style={styles.fila} accessibilityRole="button" accessibilityLabel={`${titulo}, ${fmtUnitsUsd(BigInt(tx.units))}`}>
      <View style={[styles.icono, { backgroundColor: `${tinte}1A`, borderColor: `${tinte}33` }]}>
        <Icono size={19} color={tinte} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyStrong" numberOfLines={1}>
          {titulo}
        </T>
        <T v="small">
          {shortAddr(tx.otra)} · {fmtHora(tx.ts)}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Mono size={16} color={entra ? color.jade : color.pluma}>
          {entra ? '+' : '−'}
          {fmtUnitsUsd(BigInt(tx.units))}
        </Mono>
        <T v="small">≈ {fmtGtq(gtq)}</T>
      </View>
    </Presionable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
