import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { Hoja } from '../ui/Hoja';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Aviso } from '../ui/Avisos';
import { EncabezadoAtras } from '../ui/EncabezadoAtras';
import { EntradaMonto } from '../ui/EntradaMonto';
import { useSaldo } from '../hooks/use-saldo';
import { useSesion } from '../state/sesion';
import { api, ErrorApi, type ComprarResponse } from '../core/api';
import { cripto, dolares, quetzales } from '../core/format';
import { color, space } from '../ui/tokens';

const MIN_GTQ = 1;
const MAX_GTQ = 1_000_000;

export default function Comprar() {
  const { saldo } = useSaldo();
  const salir = useSesion((s) => s.salir);

  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<ComprarResponse | null>(null);

  const numero = Number(monto || 0);
  const tasa = saldo?.tasaCambio ?? 0;
  const disponible = saldo?.saldoGTQ ?? 0;
  const recibe = tasa > 0 ? numero / tasa : 0;

  const problema =
    numero <= 0
      ? null
      : numero < MIN_GTQ
        ? `El mínimo es ${quetzales(MIN_GTQ)}.`
        : numero > MAX_GTQ
          ? `El máximo es ${quetzales(MAX_GTQ)}.`
          : numero > disponible
            ? `Solo tenés ${quetzales(disponible)} disponibles.`
            : null;

  const puede = numero > 0 && !problema && !enviando && tasa > 0;

  async function comprar() {
    if (!puede) return;
    const token = useSesion.getState().tokenVigente();
    if (!token) return salir();

    setEnviando(true);
    setError(null);
    try {
      setHecho(await api.comprar(token, numero));
    } catch (e) {
      if (e instanceof ErrorApi && e.esSesionVencida) return salir();
      setError(e instanceof ErrorApi ? e.message : 'No se pudo completar la compra.');
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <Pantalla scroll={false}>
        <EncabezadoAtras titulo="Compra enviada" />
        <View style={styles.resultado}>
          <View style={styles.marcaEspera}>
            <Clock size={30} color={color.espera} strokeWidth={2} />
          </View>
          <T v="h1" centrado>
            Confirmando en la red
          </T>
          {/* El backend siempre responde "Confirmando": decir "listo" acá sería mentir. */}
          <T v="cuerpo" centrado style={styles.resultadoTexto}>
            Compraste {cripto(hecho.montoCriptoRecibido)} USDT a {quetzales(hecho.tasaCambioUsada)}{' '}
            por dólar. Aparecen en tu saldo cuando la red confirme la operación — suele tomar menos
            de un minuto.
          </T>
          <Hoja style={styles.detalle}>
            <Fila etiqueta="Pagaste" valor={quetzales(numero)} />
            <View style={styles.divisor} />
            <Fila etiqueta="Recibís" valor={`${cripto(hecho.montoCriptoRecibido)} USDT`} />
            <View style={styles.divisor} />
            <Fila etiqueta="Estado" valor={hecho.estado} tono={color.espera} />
          </Hoja>
        </View>
        <Boton titulo="Entendido" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  return (
    <Pantalla scroll={false}>
      <EncabezadoAtras titulo="Comprar" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cuerpo}
      >
        <View style={styles.centro}>
          <T v="cuerpo">¿Cuántos quetzales querés pasar a dólares digitales?</T>

          {error ? <Aviso tono="error" texto={error} /> : null}

          <EntradaMonto
            simbolo="Q"
            valor={monto}
            onCambio={setMonto}
            equivalente={numero > 0 && tasa > 0 ? `≈ ${dolares(recibe)}` : undefined}
            disponible={`Disponible ${quetzales(disponible)}`}
            onMaximo={disponible > 0 ? () => setMonto(String(disponible)) : undefined}
            error={problema}
          />

          {tasa > 0 ? (
            <Hoja style={styles.tasa}>
              <Fila etiqueta="Tasa de hoy" valor={`1 USD = ${quetzales(tasa)}`} />
            </Hoja>
          ) : null}
        </View>

        <Boton
          titulo="Comprar"
          onPress={comprar}
          cargando={enviando}
          deshabilitado={!puede}
        />
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

function Fila({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: string }) {
  return (
    <View style={styles.fila}>
      <T v="cuerpo">{etiqueta}</T>
      <T v="dato" color={tono}>
        {valor}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, justifyContent: 'space-between', paddingBottom: space.l },
  centro: { gap: space.l, paddingTop: space.xl },
  tasa: { marginTop: space.s },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m },
  divisor: { height: 1, backgroundColor: color.trazo, marginVertical: space.m },
  resultado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.m },
  marcaEspera: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.esperaTenue,
  },
  resultadoTexto: { maxWidth: 320 },
  detalle: { alignSelf: 'stretch', marginTop: space.l },
});
