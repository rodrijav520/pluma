import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Presionable } from '../ui/Presionable';
import { color, radius, space } from '../ui/tokens';
import { parseQrPago } from '../core/qr';
import { useScan } from '../state/scan';
import { useToast } from '../state/toast';

export default function Escanear() {
  const router = useRouter();
  const avisar = useToast((s) => s.avisar);
  const setResultado = useScan((s) => s.setResultado);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [invalido, setInvalido] = useState(false);
  const bloqueado = useRef(false);

  if (Platform.OS === 'web') {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.l }}>
        <T v="h2">El escáner vive en tu teléfono</T>
        <T v="body">En la web de demostración, pegá la dirección directamente en Enviar.</T>
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  if (!permiso) return <Pantalla scroll={false}>{null}</Pantalla>;

  if (!permiso.granted) {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.l }}>
        <T v="h2">Permiso de cámara</T>
        <T v="body">
          Solo usamos la cámara para leer códigos QR de pago. Nunca fotos ni video.
        </T>
        <Boton titulo="Permitir cámara" onPress={pedirPermiso} />
        <Boton titulo="Volver" variante="fantasma" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.noche }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (bloqueado.current) return;
          const parsed = parseQrPago(data);
          if (!parsed) {
            if (!invalido) {
              setInvalido(true);
              avisar('Ese QR no parece un pago válido de la red Base.', 'error');
              setTimeout(() => setInvalido(false), 1600);
            }
            return;
          }
          bloqueado.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setResultado(parsed);
          router.back();
        }}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <Presionable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar escáner"
          style={styles.cerrar}
        >
          <X size={22} color="#FFFFFF" />
        </Presionable>
        <View style={[styles.marco, invalido && { borderColor: color.pecho }]} />
        <T v="body" centrado color="#FFFFFF" style={styles.pista}>
          Apuntá al QR del cobro o de la dirección
        </T>
      </View>
    </View>
  );
}

const MARCO = 240;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrar: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marco: {
    width: MARCO,
    height: MARCO,
    borderRadius: radius.card,
    borderWidth: 3,
    borderColor: color.jade,
  },
  pista: {
    position: 'absolute',
    bottom: 90,
    left: 40,
    right: 40,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
  },
});
