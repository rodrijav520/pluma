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
import { Deslizador } from '../ui/Deslizador';
import { useSaldo } from '../hooks/use-saldo';
import { useSesion } from '../state/sesion';
import { api, ErrorApi, type ConvertirResponse } from '../core/api';
import { cripto, quetzales } from '../core/format';
import { color, space } from '../ui/tokens';

/**
 * Cambiar dólares digitales a quetzales.
 *
 * Es la operación que da sentido al producto, así que acá vive la pieza firma:
 * el gesto de deslizar ES la conversión.
 */
export default function Cambiar() {
  const { saldo } = useSaldo();
  const salir = useSesion((s) => s.salir);

  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<ConvertirResponse | null>(null);

  const numero = Number(monto || 0);
  const tasa = saldo?.tasaCambio ?? 0;
  const disponible = saldo?.saldoCripto ?? 0;
  const recibe = numero * tasa;

  const problema =
    numero <= 0
      ? null
      : numero > disponible
        ? `Solo tenés ${cripto(disponible)} USDT disponibles.`
        : null;

  const puede = numero > 0 && !problema && !enviando && tasa > 0;

  async function cambiar() {
    if (!puede) return;
    const token = useSesion.getState().tokenVigente();
    if (!token) return salir();

    setEnviando(true);
    setError(null);
    try {
      setHecho(await api.convertirAGtq(token, numero));
    } catch (e) {
      if (e instanceof ErrorApi && e.esSesionVencida) return salir();
      setError(e instanceof ErrorApi ? e.message : 'No se pudo hacer el cambio.');
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <Pantalla scroll={false}>
        <EncabezadoAtras titulo="Cambio enviado" />
        <View style={styles.resultado}>
          <View style={styles.marcaEspera}>
            <Clock size={30} color={color.espera} strokeWidth={2} />
          </View>
          <T v="h1" centrado>
            Se acreditan al confirmarse
          </T>
          {/* MontoGTQAAcreditar todavía NO está en el saldo. Decirlo evita que la
              persona crea que el dinero ya está y se pregunte por qué no aparece. */}
          <T v="cuerpo" centrado style={styles.resultadoTexto}>
            {quetzales(hecho.montoGTQAAcreditar)} entran a tu saldo cuando la red confirme el
            cambio. Todavía no están disponibles.
          </T>
          <Hoja style={styles.detalle}>
            <Fila etiqueta="Entregaste" valor={`${cripto(numero)} USDT`} />
            <View style={styles.divisor} />
            <Fila etiqueta="Vas a recibir" valor={quetzales(hecho.montoGTQAAcreditar)} />
            <View style={styles.divisor} />
            <Fila etiqueta="Tasa aplicada" valor={`1 USD = ${quetzales(hecho.tasaCambioUsada)}`} />
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
      <EncabezadoAtras titulo="Cambiar a quetzales" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cuerpo}
      >
        <View style={styles.centro}>
          <T v="cuerpo">¿Cuántos dólares digitales querés pasar a quetzales?</T>

          {error ? <Aviso tono="error" texto={error} /> : null}

          <EntradaMonto
            simbolo="$"
            valor={monto}
            onCambio={setMonto}
            equivalente={numero > 0 && tasa > 0 ? `≈ ${quetzales(recibe)}` : undefined}
            disponible={`Disponible ${cripto(disponible)} USDT`}
            onMaximo={disponible > 0 ? () => setMonto(String(disponible)) : undefined}
            error={problema}
          />

          {tasa > 0 ? (
            <Hoja style={styles.tasa}>
              <Fila etiqueta="Tasa de hoy" valor={`1 USD = ${quetzales(tasa)}`} />
            </Hoja>
          ) : null}
        </View>

        <View style={styles.pie}>
          <Deslizador
            textoInicial={numero > 0 ? `$ ${cripto(numero)}` : '$ 0'}
            textoFinal={quetzales(recibe)}
            onConfirmar={cambiar}
            cargando={enviando}
            deshabilitado={!puede}
          />
        </View>
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
  pie: { gap: space.m },
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
