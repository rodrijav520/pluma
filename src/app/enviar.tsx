import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { isAddress, type Address } from 'viem';
import { ClipboardPaste, Fuel, ScanLine, X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T, Mono } from '../ui/T';
import { Glass } from '../ui/Glass';
import { Boton } from '../ui/Boton';
import { Campo } from '../ui/Campo';
import { Pluma } from '../ui/Pluma';
import { PinPad } from '../ui/PinPad';
import { EntradaMonto } from '../ui/EntradaMonto';
import { Presionable } from '../ui/Presionable';
import { color, hitSlop, radius, space } from '../ui/tokens';
import { leerFrase, verificarPin } from '../core/wallet';
import { sendUsdc, waitForTx, txUrl } from '../core/chain';
import { fmtGtq, fmtUsd, shortAddr, usdToUnits, unitsToUsd } from '../core/format';
import { useApp } from '../state/app';
import { useChain } from '../state/chain';
import { useFx } from '../state/fx';
import { useScan } from '../state/scan';
import { useToast } from '../state/toast';

type Paso = 'form' | 'auth' | 'enviando' | 'listo';

export default function Enviar() {
  const router = useRouter();
  const avisar = useToast((s) => s.avisar);
  const { address, bioActiva } = useApp();
  const { usdc, gas, agregarPendiente, resolverPendiente, refrescar } = useChain();
  const rate = useFx((s) => s.rate);
  const escaneado = useScan((s) => s.resultado);
  const consumir = useScan((s) => s.consumir);

  const [paso, setPaso] = useState<Paso>('form');
  const [dest, setDest] = useState('');
  const [errorDest, setErrorDest] = useState<string | null>(null);
  const [usd, setUsd] = useState(0);
  const [montoKey, setMontoKey] = useState(0);
  const [usdInicial, setUsdInicial] = useState<number | undefined>(undefined);
  const [concepto, setConcepto] = useState('');
  const [pinError, setPinError] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    if (escaneado) {
      setDest(escaneado.address);
      setErrorDest(null);
      if (escaneado.usd && escaneado.usd > 0) {
        setUsd(escaneado.usd);
        setUsdInicial(escaneado.usd);
        setMontoKey((k) => k + 1);
      }
      consumir();
    }
  }, [escaneado, consumir]);

  const saldoUsd = unitsToUsd(BigInt(usdc));
  const sinGas = BigInt(gas) === 0n;

  const validar = (): boolean => {
    if (!isAddress(dest.trim())) {
      setErrorDest('Esa dirección no es válida. Revisá que empiece con 0x y esté completa.');
      return false;
    }
    if (dest.trim().toLowerCase() === address?.toLowerCase()) {
      setErrorDest('Esa es tu propia dirección — no hace falta enviarte a vos mismo.');
      return false;
    }
    if (usd <= 0) return false;
    if (usd > saldoUsd) {
      avisar(`Solo tenés ${fmtUsd(saldoUsd)} disponibles.`, 'error');
      return false;
    }
    return true;
  };

  const ejecutarEnvio = async () => {
    setPaso('enviando');
    try {
      const frase = await leerFrase();
      if (!frase) throw new Error('No se encontró la frase en este teléfono.');
      const unidades = usdToUnits(usd);
      const h = await sendUsdc(frase, dest.trim() as Address, unidades);
      setHash(h);
      agregarPendiente({
        hash: h,
        dir: 'out',
        units: unidades.toString(),
        otra: dest.trim(),
        ts: Date.now(),
        block: '0',
        status: 'pendiente',
        concepto: concepto.trim() || undefined,
        gtqRate: rate,
      });
      setPaso('listo');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      waitForTx(h)
        .then((r) => {
          resolverPendiente(h, r === 'ok');
          if (address) refrescar(address, useApp.getState().bloqueCreacion, rate);
        })
        .catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setPaso('form');
      if (/insufficient funds|gas/i.test(msg)) {
        avisar('Te falta gas de prueba para la red. Abrí Fondear y conseguilo gratis.', 'error');
      } else {
        avisar('No se pudo enviar. Revisá tu conexión y probá de nuevo.', 'error');
      }
    }
  };

  const autenticar = async () => {
    if (!validar()) return;
    if (sinGas) {
      avisar('Necesitás una pizca de gas de prueba (gratis) para enviar.', 'error');
      return;
    }
    if (bioActiva && Platform.OS !== 'web') {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enviar ${fmtUsd(usd)}`,
        cancelLabel: 'Usar PIN',
      });
      if (res.success) {
        ejecutarEnvio();
        return;
      }
    }
    setPaso('auth');
  };

  // ── Vistas por paso ──
  if (paso === 'listo') {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', alignItems: 'center', gap: space.l }}>
        <Pluma alto={130} animada />
        <Mono size={34} weight="bold">
          −{fmtUsd(usd)}
        </Mono>
        <T v="bodyLg" centrado>
          Tu envío va volando a {shortAddr(dest)}.
        </T>
        {hash && (
          <T v="small" onPress={() => Linking.openURL(txUrl(hash))}>
            Ver en el explorador →
          </T>
        )}
        <Boton titulo="Listo" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: space.l }} />
      </Pantalla>
    );
  }

  if (paso === 'enviando') {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', alignItems: 'center', gap: space.l }}>
        <Pluma alto={110} animada opacidad={0.8} />
        <T v="h2">Firmando y enviando…</T>
        <T v="body" centrado>
          Tu teléfono firma la transacción con TUS llaves. Nadie más puede.
        </T>
      </Pantalla>
    );
  }

  if (paso === 'auth') {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.xxl }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T v="h2">Confirmá con tu PIN</T>
          <T v="body">
            Enviar {fmtUsd(usd)} a {shortAddr(dest)}
          </T>
        </View>
        <PinPad
          error={pinError}
          onCambio={() => setPinError(false)}
          onCompleto={async (pin) => {
            const ok = await verificarPin(pin);
            if (!ok) {
              setPinError(true);
              return;
            }
            ejecutarEnvio();
          }}
        />
        <Boton titulo="Cancelar" variante="fantasma" onPress={() => setPaso('form')} />
      </Pantalla>
    );
  }

  return (
    <Pantalla scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.encabezado}>
          <T v="h1">Enviar</T>
          <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ padding: 8 }}>
            <X size={22} color={color.plumaSuave} />
          </Presionable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.xl, paddingVertical: space.l }}>
          <Campo
            etiqueta="¿A quién?"
            valor={dest}
            onCambio={(v) => {
              setDest(v);
              setErrorDest(null);
            }}
            placeholder="Dirección 0x…"
            autoCapitalizar="none"
            error={errorDest}
            ayuda="Solo direcciones de la red Base. Verificá los primeros y últimos caracteres."
            derecha={
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Presionable
                  onPress={async () => {
                    const v = await Clipboard.getStringAsync();
                    if (v) {
                      setDest(v.trim());
                      setErrorDest(null);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Pegar dirección"
                  hitSlop={hitSlop}
                  style={styles.iconoCampo}
                >
                  <ClipboardPaste size={17} color={color.plumaSuave} />
                </Presionable>
                {Platform.OS !== 'web' && (
                  <Presionable
                    onPress={() => router.push('/escanear')}
                    accessibilityRole="button"
                    accessibilityLabel="Escanear QR"
                    hitSlop={hitSlop}
                    style={styles.iconoCampo}
                  >
                    <ScanLine size={17} color={color.jade} />
                  </Presionable>
                )}
              </View>
            }
          />

          <View style={{ paddingVertical: space.s }}>
            <EntradaMonto key={montoKey} inicialUsd={usdInicial} onUsd={setUsd} autoFoco={false} />
            <T v="small" centrado style={{ marginTop: 8 }}>
              Disponible: {fmtUsd(saldoUsd)}
            </T>
          </View>

          <Campo
            etiqueta="Concepto (opcional)"
            valor={concepto}
            onCambio={setConcepto}
            placeholder="¿Para qué es?"
          />

          {sinGas && (
            <Presionable onPress={() => router.push('/fondear')} accessibilityRole="button" accessibilityLabel="Conseguir gas de prueba">
              <Glass radio={radius.m} relleno="rgba(233,188,90,0.08)" style={styles.avisoGas}>
                <Fuel size={18} color={color.cacao} />
                <T v="body" color={color.pluma} style={{ flex: 1 }}>
                  Te falta <T v="bodyStrong">gas de prueba</T> (gratis) para poder enviar. Tocá aquí
                  para conseguirlo.
                </T>
              </Glass>
            </Presionable>
          )}

          <Glass radio={radius.m} style={styles.resumen}>
            <View style={styles.filaResumen}>
              <T v="small">Recibirá</T>
              <Mono size={14}>{fmtUsd(usd)} USDC</Mono>
            </View>
            <View style={styles.filaResumen}>
              <T v="small">Equivale a</T>
              <Mono size={14}>{fmtGtq(usd * rate)}</Mono>
            </View>
            <View style={styles.filaResumen}>
              <T v="small">Comisión de red (Base)</T>
              <Mono size={14} color={color.jade}>
                menos de Q0.10
              </Mono>
            </View>
          </Glass>
        </ScrollView>

        <Boton
          titulo="Revisar y enviar"
          onPress={autenticar}
          deshabilitado={usd <= 0 || dest.trim().length === 0}
        />
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconoCampo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,253,245,0.06)',
  },
  avisoGas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: space.m,
    borderColor: 'rgba(233,188,90,0.3)',
  },
  resumen: { padding: space.l, gap: 10 },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
