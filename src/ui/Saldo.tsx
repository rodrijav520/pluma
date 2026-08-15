import React from 'react';
import { StyleSheet, View } from 'react-native';
import { T } from './T';
import { color, radius, space } from './tokens';
import { dolares, quetzales } from '../core/format';

/**
 * El saldo, que es la tesis del producto.
 *
 * Casi toda app fintech pone la moneda local como subtítulo gris. Eso repite el
 * problema que Pluma quiere resolver: la conversión como letra chica. Acá las
 * dos monedas tienen el mismo peso visual y la tasa aplicada está a la vista.
 */
export function Saldo({
  saldoGTQ,
  equivalenteGTQ,
  saldoCripto,
  tasaCambio,
  enLinea,
}: {
  saldoGTQ: number;
  equivalenteGTQ: number;
  saldoCripto: number;
  tasaCambio: number;
  /** false = saldoCripto es el último dato conocido, no el actual. */
  enLinea: boolean;
}) {
  const totalGTQ = saldoGTQ + equivalenteGTQ;
  const totalUSD = tasaCambio > 0 ? totalGTQ / tasaCambio : 0;

  return (
    <View style={styles.raiz}>
      <T v="etiqueta">Tu saldo</T>

      <T v="saldoMayor" style={styles.mayor} accessibilityLabel={`Saldo ${quetzales(totalGTQ)}`}>
        {quetzales(totalGTQ)}
      </T>
      <T v="saldoMenor" style={styles.menor}>
        {dolares(totalUSD)}
      </T>

      <View style={styles.desglose}>
        <Parte etiqueta="En quetzales" valor={quetzales(saldoGTQ)} />
        <View style={styles.separador} />
        <Parte
          etiqueta="En dólares digitales"
          valor={`${saldoCripto.toFixed(2)} USDT`}
          aviso={!enLinea ? 'último dato conocido' : undefined}
        />
      </View>
    </View>
  );
}

function Parte({ etiqueta, valor, aviso }: { etiqueta: string; valor: string; aviso?: string }) {
  return (
    <View style={styles.parte}>
      {/* Alto fijo: una etiqueta de dos líneas junto a otra de una desalinearía
          los montos, que es justo lo que la persona viene a comparar. */}
      <T v="etiqueta" style={styles.parteEtiqueta}>
        {etiqueta}
      </T>
      <T v="dato" style={styles.parteValor}>
        {valor}
      </T>
      {aviso ? (
        <T v="datoSuave" color={color.espera} style={styles.aviso}>
          {aviso}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: space.xs },
  mayor: { marginTop: space.s },
  menor: { marginTop: -space.xs },
  desglose: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: space.l,
    paddingTop: space.l,
    borderTopWidth: 1,
    borderTopColor: color.trazo,
  },
  parte: { flex: 1, gap: space.xs },
  parteEtiqueta: { minHeight: 28 },
  parteValor: { marginTop: 2 },
  separador: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: color.trazo,
    marginHorizontal: space.l,
    borderRadius: radius.s,
  },
  aviso: { marginTop: 2 },
});
