import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T, Mono } from '../ui/T';
import { Glass } from '../ui/Glass';
import { Presionable } from '../ui/Presionable';
import { color, radius, space } from '../ui/tokens';
import { fmtGtq, fmtUsd } from '../core/format';
import { useFx } from '../state/fx';

const MONTOS = [250, 500, 1000, 2500] as const;

/**
 * Costo anual de recibir `mensual` USD, 12 veces al año, por canal.
 * Fuentes de las tasas: docs/investigacion.md §2.2 (PayPal ~8% efectivo,
 * wire $30 + ~3% FX, Payoneer ~3% con conversión, Pluma modelado ~1%).
 */
function costoAnual(mensual: number) {
  return [
    { nombre: 'PayPal', detalle: '~8% entre comisión y cambio', anual: mensual * 12 * 0.08 },
    { nombre: 'Banco (wire)', detalle: '$30 fijos + ~3% de cambio', anual: (30 + mensual * 0.03) * 12 },
    { nombre: 'Payoneer', detalle: '~3% con conversión a GTQ', anual: mensual * 12 * 0.03 },
    { nombre: 'Pluma', detalle: '~1% modelado, red incluida', anual: mensual * 12 * 0.01 },
  ].sort((a, b) => b.anual - a.anual);
}

export default function Simulador() {
  const router = useRouter();
  const rate = useFx((s) => s.rate);
  const [mensual, setMensual] = useState<number>(500);

  const filas = costoAnual(mensual);
  const peor = filas[0].anual;
  const pluma = filas.find((f) => f.nombre === 'Pluma')!;
  const ahorro = (peor - pluma.anual) * rate;

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <T v="h1">¿Cuánto perdés al año?</T>
        <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ padding: 8 }}>
          <X size={22} color={color.plumaSuave} />
        </Presionable>
      </View>
      <T v="body" style={{ marginTop: 4 }}>
        Elegí cuánto cobrás al mes del extranjero y mirá el costo anual de cada canal.
      </T>

      <View style={styles.chips}>
        {MONTOS.map((m) => {
          const activa = mensual === m;
          return (
            <Presionable
              key={m}
              onPress={() => setMensual(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              style={[styles.chip, activa && styles.chipActiva]}
            >
              <Mono size={15} color={activa ? color.sobreJade : color.pluma}>
                ${m}
              </Mono>
            </Presionable>
          );
        })}
      </View>

      <Glass style={{ padding: space.xl, gap: space.l }}>
        <T v="eyebrow">Costo anual por canal (recibiendo {fmtUsd(mensual)}/mes)</T>
        {filas.map((f) => {
          const esPluma = f.nombre === 'Pluma';
          const ancho = peor > 0 ? Math.max((f.anual / peor) * 100, 4) : 4;
          return (
            <View key={f.nombre} style={{ gap: 6 }}>
              <View style={styles.filaEtiqueta}>
                <T v="bodyStrong" color={esPluma ? color.jade : color.pluma}>
                  {f.nombre}
                </T>
                <Mono size={15} color={esPluma ? color.jade : color.pluma}>
                  {fmtGtq(f.anual * rate)}
                </Mono>
              </View>
              <View style={styles.pista}>
                <View
                  style={[
                    styles.barra,
                    { width: `${ancho}%` },
                    esPluma
                      ? { backgroundColor: color.jade }
                      : { backgroundColor: 'rgba(236,253,245,0.16)' },
                  ]}
                />
              </View>
              <T v="small">{f.detalle}</T>
            </View>
          );
        })}
      </Glass>

      <Glass relleno="rgba(45,227,155,0.10)" style={styles.veredicto}>
        <T v="eyebrow" color={color.jade}>
          Tu ahorro anual con Pluma
        </T>
        <Mono size={34} weight="bold" color={color.jade}>
          {fmtGtq(ahorro)}
        </Mono>
        <T v="body" color={color.pluma}>
          frente al canal más caro — como recibir{' '}
          {mensual > 0 ? `${(ahorro / (mensual * rate)).toFixed(1)} cobros mensuales` : 'un cobro'}{' '}
          extra al año, gratis.
        </T>
      </Glass>

      <T v="small" style={{ marginTop: space.m }}>
        Tasas de referencia documentadas en la investigación del proyecto (jul 2026). El costo de
        Pluma es el objetivo modelado del estudio financiero.
      </T>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', gap: 8, marginVertical: space.xl },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
  },
  chipActiva: { backgroundColor: color.jade, borderColor: color.jade },
  filaEtiqueta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pista: { height: 10, borderRadius: 5, backgroundColor: 'rgba(236,253,245,0.04)', overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 5 },
  veredicto: { padding: space.xl, gap: 6, marginTop: space.l, borderColor: color.bordeJade },
});
