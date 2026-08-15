import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ClipboardPaste, Clock } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { Hoja } from '../ui/Hoja';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Campo } from '../ui/Campo';
import { Aviso } from '../ui/Avisos';
import { EncabezadoAtras } from '../ui/EncabezadoAtras';
import { EntradaMonto } from '../ui/EntradaMonto';
import { Deslizador } from '../ui/Deslizador';
import { useSaldo } from '../hooks/use-saldo';
import { useSesion } from '../state/sesion';
import { api, ErrorApi, type EnviarResponse } from '../core/api';
import { cripto, direccionCorta, quetzales } from '../core/format';
import { color, space } from '../ui/tokens';

/** Mismo patrón que valida el backend en EnviarAWalletExternaRequest. */
const DIRECCION_EVM = /^0x[a-fA-F0-9]{40}$/;
const DIRECCION_CERO = '0x0000000000000000000000000000000000000000';

export default function Enviar() {
  const { saldo } = useSaldo();
  const salir = useSesion((s) => s.salir);

  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<EnviarResponse | null>(null);

  const numero = Number(monto || 0);
  const tasa = saldo?.tasaCambio ?? 0;
  const disponible = saldo?.saldoCripto ?? 0;
  const limpio = destino.trim();

  const errDestino = !limpio
    ? null
    : !DIRECCION_EVM.test(limpio)
      ? 'Esa dirección no tiene formato válido. Debe empezar con 0x y tener 42 caracteres.'
      : limpio.toLowerCase() === DIRECCION_CERO
        ? 'Esa es la dirección cero: enviar ahí quema los fondos para siempre.'
        : limpio.toLowerCase() === saldo?.direccionWallet.toLowerCase()
          ? 'Esa es tu propia dirección.'
          : null;

  const errMonto =
    numero <= 0 ? null : numero > disponible ? `Solo tenés ${cripto(disponible)} USDT.` : null;

  const puede =
    numero > 0 && !errMonto && DIRECCION_EVM.test(limpio) && !errDestino && !enviando;

  async function pegar() {
    const texto = await Clipboard.getStringAsync();
    if (texto) setDestino(texto.trim());
  }

  async function enviar() {
    if (!puede) return;
    const token = useSesion.getState().tokenVigente();
    if (!token) return salir();

    setEnviando(true);
    setError(null);
    try {
      setHecho(await api.enviarExterno(token, numero, limpio));
    } catch (e) {
      if (e instanceof ErrorApi && e.esSesionVencida) return salir();
      setError(e instanceof ErrorApi ? e.message : 'No se pudo enviar.');
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <Pantalla scroll={false}>
        <EncabezadoAtras titulo="Envío hecho" />
        <View style={styles.resultado}>
          <View style={styles.marcaEspera}>
            <Clock size={30} color={color.espera} strokeWidth={2} />
          </View>
          <T v="h1" centrado>
            Confirmando en la red
          </T>
          <T v="cuerpo" centrado style={styles.resultadoTexto}>
            Enviaste {cripto(numero)} USDT a {direccionCorta(limpio)}. Los envíos a otra billetera
            no se pueden revertir.
          </T>
          <Hoja style={styles.detalle}>
            <Fila etiqueta="Monto" valor={`${cripto(numero)} USDT`} />
            <View style={styles.divisor} />
            <Fila etiqueta="Para" valor={direccionCorta(limpio)} />
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
      <EncabezadoAtras titulo="Enviar" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cuerpo}
      >
        <ScrollView
          contentContainerStyle={styles.centro}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <Aviso tono="error" texto={error} /> : null}

          <Aviso
            tono="espera"
            texto="Un envío a otra billetera no se puede deshacer. Revisá la dirección antes de confirmar."
          />

          <Campo
            etiqueta="Dirección de destino"
            valor={destino}
            onCambio={setDestino}
            placeholder="0x…"
            error={errDestino}
            autoCapitalizar="none"
            derecha={
              <Boton
                titulo="Pegar"
                variante="fantasma"
                compacto
                onPress={pegar}
                icono={<ClipboardPaste size={16} color={color.tinta} strokeWidth={2} />}
              />
            }
          />

          <EntradaMonto
            simbolo="$"
            valor={monto}
            onCambio={setMonto}
            autoFoco={false}
            equivalente={numero > 0 && tasa > 0 ? `≈ ${quetzales(numero * tasa)}` : undefined}
            disponible={`Disponible ${cripto(disponible)} USDT`}
            onMaximo={disponible > 0 ? () => setMonto(String(disponible)) : undefined}
            error={errMonto}
          />
        </ScrollView>

        <Deslizador
          textoInicial={numero > 0 ? `$ ${cripto(numero)}` : '$ 0'}
          textoFinal={limpio ? direccionCorta(limpio) : 'destino'}
          onConfirmar={enviar}
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
  centro: { gap: space.l, paddingTop: space.xl, paddingBottom: space.l },
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
