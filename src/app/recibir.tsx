import React from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Copy, TriangleAlert, X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T, Mono } from '../ui/T';
import { Glass } from '../ui/Glass';
import { Boton } from '../ui/Boton';
import { Insignia } from '../ui/Insignia';
import { Presionable } from '../ui/Presionable';
import { color, radius, space } from '../ui/tokens';
import { useApp } from '../state/app';
import { useToast } from '../state/toast';

export default function Recibir() {
  const router = useRouter();
  const address = useApp((s) => s.address);
  const avisar = useToast((s) => s.avisar);

  if (!address) return null;

  const copiar = async () => {
    await Clipboard.setStringAsync(address);
    avisar('Dirección copiada', 'ok');
  };

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <T v="h1">Recibir</T>
        <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ padding: 8 }}>
          <X size={22} color={color.plumaSuave} />
        </Presionable>
      </View>
      <T v="body" style={{ marginTop: 4, marginBottom: space.xl }}>
        Compartí tu dirección o mostrá el QR. Es pública: compartirla no tiene riesgo.
      </T>

      <Glass style={styles.tarjeta}>
        <Insignia texto="USDC · Red Base" tinte={color.jade} />
        <View style={styles.qr}>
          <QRCode value={address} size={200} backgroundColor="#FFFFFF" color={color.noche} />
        </View>
        <Presionable onPress={copiar} accessibilityRole="button" accessibilityLabel="Copiar dirección" style={styles.direccion}>
          <Mono size={13} style={{ flex: 1 }} numberOfLines={2}>
            {address}
          </Mono>
          <Copy size={17} color={color.jade} />
        </Presionable>
      </Glass>

      <Glass relleno="rgba(255,77,94,0.07)" style={styles.alerta}>
        <TriangleAlert size={18} color={color.pecho} />
        <T v="body" color={color.pluma} style={{ flex: 1 }}>
          Solo aceptá <T v="bodyStrong">USDC por la red Base</T>. Si te envían por otra red, ese
          dinero se puede perder sin vuelta atrás.
        </T>
      </Glass>

      <View style={{ gap: 10, marginTop: space.xl }}>
        <Boton
          titulo="Compartir dirección"
          onPress={async () => {
            if (Platform.OS === 'web') {
              await copiar();
            } else {
              await Share.share({ message: address });
            }
          }}
        />
        <Boton titulo="¿Sin saldo? Fondear de prueba" variante="fantasma" onPress={() => router.push('/fondear')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tarjeta: { padding: space.xl, alignItems: 'center', gap: space.l },
  qr: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: radius.m },
  direccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
    alignSelf: 'stretch',
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: space.l,
    marginTop: space.l,
    borderColor: 'rgba(255,77,94,0.25)',
  },
});
