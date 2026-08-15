import React, { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Fingerprint } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { PinPad } from '../ui/PinPad';
import { color, space } from '../ui/tokens';
import { getFraseTemp, setFraseTemp } from '../core/setup-temp';
import { direccionDeFrase, guardarFrase, guardarPin, setBiometria } from '../core/wallet';
import { getBlockNumber } from '../core/chain';
import { useApp } from '../state/app';
import { useToast } from '../state/toast';

type Fase = 'crear' | 'confirmar' | 'bio';

export default function Pin() {
  const router = useRouter();
  const avisar = useToast((s) => s.avisar);
  const { setWallet, setPinSet, setBioActiva } = useApp();
  const [fase, setFase] = useState<Fase>('crear');
  const [primero, setPrimero] = useState('');
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const finalizando = useRef(false);

  const frase = getFraseTemp();
  if (!frase && !finalizando.current) {
    router.replace('/bienvenida');
    return null;
  }

  const finalizar = async () => {
    finalizando.current = true;
    setFraseTemp(null);
    avisar('¡Tu pluma está lista! Bienvenido a bordo.', 'ok');
    router.dismissAll?.();
    router.replace('/(tabs)');
  };

  const guardarTodo = async (pin: string) => {
    if (!frase) return;
    setGuardando(true);
    try {
      await guardarPin(pin);
      await guardarFrase(frase);
      const address = direccionDeFrase(frase);
      const bloque = await getBlockNumber().catch(() => null);
      setWallet(address, bloque);
      setPinSet(true);
      if (Platform.OS !== 'web') {
        const [hw, enrolado] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (hw && enrolado) {
          setFase('bio');
          setGuardando(false);
          return;
        }
      }
      await finalizar();
    } catch {
      avisar('No se pudo guardar de forma segura. Probá de nuevo.', 'error');
      setGuardando(false);
      setFase('crear');
      setPrimero('');
    }
  };

  const alCompletar = (pin: string) => {
    setError(false);
    if (fase === 'crear') {
      setPrimero(pin);
      setFase('confirmar');
    } else if (fase === 'confirmar') {
      if (pin !== primero) {
        setError(true);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setFase('crear');
        setPrimero('');
        return;
      }
      guardarTodo(pin);
    }
  };

  if (fase === 'bio') {
    return (
      <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.xxl }}>
        <View style={{ alignItems: 'center', gap: space.l }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(45,227,155,0.12)',
              borderWidth: 1,
              borderColor: color.bordeJade,
            }}
          >
            <Fingerprint size={40} color={color.jade} strokeWidth={1.6} />
          </View>
          <T v="h1" centrado>
            ¿Entrar con tu huella?
          </T>
          <T v="bodyLg" centrado style={{ maxWidth: 300 }}>
            Usá Face ID o tu huella para confirmar envíos y ver tu frase, sin escribir el PIN cada
            vez.
          </T>
        </View>
        <View style={{ gap: 10 }}>
          <Boton
            titulo="Sí, activar biometría"
            cargando={guardando}
            onPress={async () => {
              setGuardando(true);
              const res = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmá que sos vos',
                cancelLabel: 'Cancelar',
              });
              if (res.success) {
                await setBiometria(true);
                setBioActiva(true);
              }
              await finalizar();
            }}
          />
          <Boton titulo="Ahora no" variante="fantasma" onPress={finalizar} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla scroll={false} style={{ justifyContent: 'center', gap: space.xxxl }}>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <T v="eyebrow">Paso 3 de 3</T>
        <T v="h1" centrado>
          {fase === 'crear' ? 'Creá tu PIN' : 'Repetí tu PIN'}
        </T>
        <T v="body" centrado>
          {error
            ? 'No coincidieron. Empecemos de nuevo.'
            : 'Seis dígitos que protegen la app en este teléfono.'}
        </T>
      </View>
      <PinPad onCompleto={alCompletar} error={error} onCambio={() => setError(false)} />
    </Pantalla>
  );
}
