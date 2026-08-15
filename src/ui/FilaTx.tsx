import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCcw, X } from 'lucide-react-native';
import { T } from './T';
import { color, radius, space, TOQUE_MIN } from './tokens';
import { cripto, fechaRelativa, quetzales } from '../core/format';
import type { EstadoTx, TransaccionResponse } from '../core/api';

/**
 * Fila del libro mayor.
 *
 * Muestra SIEMPRE las dos monedas. Es la aplicación consistente de la tesis:
 * quien vive entre dólares y quetzales no debería tener que hacer la cuenta de
 * cabeza en cada línea.
 */
export function FilaTx({ tx }: { tx: TransaccionResponse }) {
  const { Icono, titulo, entrante } = describir(tx);
  const pendiente = tx.estado === 'Pendiente' || tx.estado === 'Confirmando';
  const fallida = tx.estado === 'Fallida';

  const tono = fallida ? color.lapizTenue : entrante ? color.entra : color.sale;
  const signo = entrante ? 1 : -1;

  return (
    <View style={styles.raiz}>
      <View style={[styles.icono, fallida && styles.iconoFallida]}>
        <Icono size={18} color={fallida ? color.lapizTenue : color.grafito} strokeWidth={2} />
      </View>

      <View style={styles.medio}>
        <T v="cuerpoFuerte" numberOfLines={1}>
          {titulo}
        </T>
        <View style={styles.subFila}>
          <T v="small">{fechaRelativa(tx.fechaCreacion)}</T>
          {pendiente ? <Marca estado={tx.estado} /> : null}
          {fallida ? <Marca estado={tx.estado} /> : null}
        </View>
        {fallida && tx.motivoFallo ? (
          <T v="small" color={color.sale} numberOfLines={2}>
            {tx.motivoFallo}
          </T>
        ) : null}
      </View>

      <View style={styles.montos}>
        <T v="dato" color={tono} style={fallida ? styles.tachado : undefined}>
          {tx.montoCripto > 0 ? `${entrante ? '+' : '−'}${cripto(tx.montoCripto)} USDT` : '—'}
        </T>
        <T v="datoSuave" style={fallida ? styles.tachado : undefined}>
          {tx.montoGTQ > 0 ? quetzales(signo * tx.montoGTQ, true) : ''}
        </T>
      </View>
    </View>
  );
}

function Marca({ estado }: { estado: EstadoTx }) {
  const esFallida = estado === 'Fallida';
  const Icono = esFallida ? X : Clock;
  const tono = esFallida ? color.sale : color.espera;
  const fondo = esFallida ? color.saleTenue : color.esperaTenue;
  const texto = esFallida ? 'Falló' : 'Confirmando';

  return (
    <View style={[styles.marca, { backgroundColor: fondo }]}>
      <Icono size={11} color={tono} strokeWidth={2.4} />
      <T v="small" color={tono} style={styles.marcaTexto}>
        {texto}
      </T>
    </View>
  );
}

function describir(tx: TransaccionResponse): {
  Icono: typeof ArrowUpRight;
  titulo: string;
  entrante: boolean;
} {
  switch (tx.tipo) {
    case 'Compra':
      return { Icono: ArrowDownLeft, titulo: 'Compra con quetzales', entrante: true };
    case 'ConversionAGTQ':
      return { Icono: RefreshCcw, titulo: 'Cambio a quetzales', entrante: false };
    case 'EnvioExterno':
      return { Icono: ArrowUpRight, titulo: 'Envío a otra billetera', entrante: false };
    case 'DepositoGTQ':
      return { Icono: ArrowDownLeft, titulo: 'Depósito en quetzales', entrante: true };
    case 'RecepcionExterna':
      return { Icono: ArrowDownLeft, titulo: 'Pago recibido', entrante: true };
    default:
      return { Icono: RefreshCcw, titulo: tx.tipo, entrante: false };
  }
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.m,
    paddingVertical: space.m,
    minHeight: TOQUE_MIN,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.papelHundido,
  },
  iconoFallida: { opacity: 0.6 },
  medio: { flex: 1, gap: 2 },
  subFila: { flexDirection: 'row', alignItems: 'center', gap: space.s, flexWrap: 'wrap' },
  montos: { alignItems: 'flex-end', gap: 2 },
  tachado: { textDecorationLine: 'line-through' },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.s,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  marcaTexto: { fontSize: 11, lineHeight: 14 },
});
