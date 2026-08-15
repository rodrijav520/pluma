import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Copy, Check } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { Hoja } from '../ui/Hoja';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Aviso } from '../ui/Avisos';
import { Esqueleto } from '../ui/Esqueleto';
import { EncabezadoAtras } from '../ui/EncabezadoAtras';
import { useSaldo } from '../hooks/use-saldo';
import { useToast } from '../state/toast';
import { color, space } from '../ui/tokens';

export default function Recibir() {
  const { saldo, cargando, error } = useSaldo();
  const avisar = useToast((s) => s.avisar);
  const [copiado, setCopiado] = useState(false);

  const direccion = saldo?.direccionWallet ?? '';

  async function copiar() {
    if (!direccion) return;
    await Clipboard.setStringAsync(direccion);
    setCopiado(true);
    avisar('Dirección copiada', 'ok');
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Pantalla>
      <EncabezadoAtras titulo="Recibir" />

      <View style={styles.centro}>
        <T v="cuerpo" centrado style={styles.intro}>
          Compartí esta dirección para que te paguen en dólares digitales.
        </T>

        {error ? <Aviso tono="error" texto={error} /> : null}

        <Hoja alta style={styles.tarjeta}>
          {cargando && !direccion ? (
            <Esqueleto ancho={200} alto={200} />
          ) : direccion ? (
            <View style={styles.qr}>
              <QRCode
                value={direccion}
                size={200}
                backgroundColor={color.papelAlto}
                color={color.grafito}
              />
            </View>
          ) : null}

          {direccion ? (
            <>
              <T v="etiqueta" centrado style={styles.etiqueta}>
                Tu dirección
              </T>
              <T v="datoSuave" centrado style={styles.direccion} selectable>
                {direccion}
              </T>
            </>
          ) : null}
        </Hoja>

        <Aviso
          tono="espera"
          texto="Esta dirección solo recibe USDT en la red Sepolia. Mandar otra moneda u otra red pierde los fondos."
        />
      </View>

      <Boton
        titulo={copiado ? 'Copiada' : 'Copiar dirección'}
        onPress={copiar}
        deshabilitado={!direccion}
        icono={
          copiado ? (
            <Check size={18} color={color.sobreTinta} strokeWidth={2.2} />
          ) : (
            <Copy size={18} color={color.sobreTinta} strokeWidth={2} />
          )
        }
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  centro: { gap: space.l, paddingVertical: space.xl },
  intro: { maxWidth: 320, alignSelf: 'center' },
  tarjeta: { alignItems: 'center', gap: space.m, paddingVertical: space.xl },
  qr: { padding: space.m, backgroundColor: color.papelAlto, borderRadius: 12 },
  etiqueta: { marginTop: space.s },
  direccion: { fontSize: 12, lineHeight: 18, maxWidth: 260 },
});
