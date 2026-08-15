import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T, Mono } from '../ui/T';
import { Glass } from '../ui/Glass';
import { PinPad } from '../ui/PinPad';
import { Presionable } from '../ui/Presionable';
import { color, radius, space } from '../ui/tokens';
import { leerFrase, verificarPin } from '../core/wallet';
import { useApp } from '../state/app';

/** Ver la frase semilla: siempre detrás de re-autenticación. */
export default function VerFrase() {
  const router = useRouter();
  const bioActiva = useApp((s) => s.bioActiva);
  const [frase, setFrase] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [bioFallo, setBioFallo] = useState(false);

  useEffect(() => {
    if (bioActiva && Platform.OS !== 'web') {
      LocalAuthentication.authenticateAsync({ promptMessage: 'Ver tu frase semilla', cancelLabel: 'Usar PIN' })
        .then(async (res) => {
          if (res.success) setFrase(await leerFrase());
          else setBioFallo(true);
        })
        .catch(() => setBioFallo(true));
    }
  }, [bioActiva]);

  if (!frase) {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.xxl }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T v="h2">Confirmá que sos vos</T>
          <T v="body">Tu frase es lo más delicado que hay en esta app.</T>
        </View>
        {(!bioActiva || bioFallo || Platform.OS === 'web') && (
          <PinPad
            error={pinError}
            onCambio={() => setPinError(false)}
            onCompleto={async (pin) => {
              const ok = await verificarPin(pin);
              if (!ok) {
                setPinError(true);
                return;
              }
              setFrase(await leerFrase());
            }}
          />
        )}
        <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" style={{ alignSelf: 'center', padding: 10 }}>
          <T v="body" color={color.plumaSuave}>
            Cancelar
          </T>
        </Presionable>
      </Pantalla>
    );
  }

  const palabras = frase.split(' ');

  return (
    <Pantalla>
      <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" style={styles.volver}>
        <ArrowLeft size={20} color={color.plumaSuave} />
        <T v="body">Ajustes</T>
      </Presionable>

      <T v="h1">Tu frase semilla</T>
      <T v="body" style={{ marginTop: 4, marginBottom: space.xl }}>
        Estas 12 palabras son tu cuenta completa. Tratalas como efectivo.
      </T>

      <Glass style={{ padding: space.l }}>
        <View style={styles.grid}>
          {palabras.map((p, i) => (
            <View key={i} style={styles.chip}>
              <T v="small" color={color.plumaTenue}>
                {i + 1}
              </T>
              <Mono size={14}>{p}</Mono>
            </View>
          ))}
        </View>
      </Glass>

      <Glass relleno="rgba(255,77,94,0.08)" style={styles.alerta}>
        <ShieldAlert size={18} color={color.pecho} />
        <T v="body" color={color.pluma} style={{ flex: 1 }}>
          Nadie legítimo te va a pedir esta frase jamás. Ni "soporte", ni un asesor, ni Pluma.
          Quien la pida, te está robando.
        </T>
      </Glass>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.l, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
    minWidth: '30%',
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
