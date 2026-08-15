import React, { useEffect, useRef } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Copy } from 'lucide-react-native';
import { soloNativo } from '../../ui/anim';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Boton } from '../../ui/Boton';
import { Pluma } from '../../ui/Pluma';
import { Insignia } from '../../ui/Insignia';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space } from '../../ui/tokens';
import { useCobros } from '../../state/cobros';
import { useApp } from '../../state/app';
import { useToast } from '../../state/toast';
import { eip681, txUrl } from '../../core/chain';
import { fmtGtq, fmtUnitsUsd, unitsToUsd } from '../../core/format';
import { useFx } from '../../state/fx';

export default function DetalleCobro() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cobro = useCobros((s) => s.items.find((c) => c.id === id));
  const archivar = useCobros((s) => s.archivar);
  const address = useApp((s) => s.address);
  const avisar = useToast((s) => s.avisar);
  const rate = useFx((s) => s.rate);
  const statusPrevio = useRef(cobro?.status);

  useEffect(() => {
    if (statusPrevio.current === 'pendiente' && cobro?.status === 'pagado') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      avisar('¡Cayó tu cobro! Tu pluma voló de vuelta.', 'ok');
    }
    statusPrevio.current = cobro?.status;
  }, [cobro?.status, avisar]);

  if (!cobro || !address) {
    return (
      <Pantalla>
        <T v="h2">Este cobro ya no existe</T>
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </Pantalla>
    );
  }

  const usd = unitsToUsd(BigInt(cobro.units));
  const gtq = usd * (cobro.gtqRateAlCrear ?? rate);
  const uri = eip681(address, BigInt(cobro.units));
  const pagado = cobro.status === 'pagado';

  const textoES = `¡Hola! Te paso mi cobro:\n\n${fmtUnitsUsd(BigInt(cobro.units))} USDC — ${cobro.concepto}\n\nPagá desde cualquier wallet por la red BASE a esta dirección:\n${address}\n\nO escaneá el QR que te comparto. ¡Gracias! 🪶\n(Enviado con Pluma)`;
  const textoEN = `Hi! Here's my payment request:\n\n${fmtUnitsUsd(BigInt(cobro.units))} USDC — ${cobro.concepto}\n\nPlease send it on the BASE network to:\n${address}\n\nAny wallet works (Coinbase Wallet, MetaMask…). Thanks! 🪶\n(Sent with Pluma)`;

  const compartir = async (texto: string) => {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(texto);
      avisar('Mensaje copiado — pegalo donde quieras', 'ok');
    } else {
      await Share.share({ message: texto });
    }
  };

  return (
    <Pantalla>
      <Presionable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={styles.volver}
      >
        <ArrowLeft size={20} color={color.plumaSuave} />
        <T v="body">Mis cobros</T>
      </Presionable>

      <Animated.View entering={soloNativo(FadeInDown.duration(320))} style={{ gap: space.l }}>
        <Glass style={styles.tarjeta}>
          <Insignia
            texto={pagado ? 'Pagado' : 'Pendiente'}
            tinte={pagado ? color.jade : color.cacao}
          />
          <Mono size={38} weight="bold" style={{ marginTop: 10 }}>
            {fmtUnitsUsd(BigInt(cobro.units))}
          </Mono>
          <T v="body">≈ {fmtGtq(gtq)} · {cobro.concepto}</T>

          {pagado ? (
            <View style={styles.pagado}>
              <Pluma alto={110} animada />
              <T v="h2" color={color.jade}>
                ¡Cayó tu cobro!
              </T>
              {cobro.pagoHash ? (
                <T v="small" onPress={() => import('react-native').then(({ Linking }) => Linking.openURL(txUrl(cobro.pagoHash!)))}>
                  Ver la transacción en el explorador →
                </T>
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.qr}>
                <QRCode
                  value={uri}
                  size={190}
                  backgroundColor="#FFFFFF"
                  color={color.noche}
                />
              </View>
              <T v="small" centrado>
                Tu cliente lo escanea con su wallet y el pago llega directo a tu Pluma.
              </T>
            </>
          )}
        </Glass>

        {!pagado && (
          <>
            <Presionable
              onPress={async () => {
                await Clipboard.setStringAsync(address);
                avisar('Dirección copiada', 'ok');
              }}
              accessibilityRole="button"
              accessibilityLabel="Copiar dirección"
            >
              <Glass radio={radius.m} style={styles.direccion}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="eyebrow">Dirección · red Base</T>
                  <Mono size={13} numberOfLines={1}>
                    {address}
                  </Mono>
                </View>
                <Copy size={16} color={color.plumaSuave} />
              </Glass>
            </Presionable>

            <View style={{ gap: 10 }}>
              <Boton titulo="Compartir en español" onPress={() => compartir(textoES)} />
              <Boton titulo="Share in English (para tu cliente)" variante="secundario" onPress={() => compartir(textoEN)} />
              <Boton
                titulo="Archivar cobro"
                variante="fantasma"
                onPress={() => {
                  archivar(cobro.id);
                  router.back();
                }}
              />
            </View>
          </>
        )}
      </Animated.View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: space.l,
    alignSelf: 'flex-start',
  },
  tarjeta: {
    padding: space.xl,
    alignItems: 'center',
  },
  qr: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: radius.m,
    marginTop: space.l,
    marginBottom: space.m,
  },
  pagado: {
    alignItems: 'center',
    gap: 10,
    marginTop: space.l,
  },
  direccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: space.m,
  },
});
