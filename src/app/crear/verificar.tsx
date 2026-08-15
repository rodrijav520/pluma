import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Boton } from '../../ui/Boton';
import { Glass } from '../../ui/Glass';
import { Presionable } from '../../ui/Presionable';
import { color, radius, space } from '../../ui/tokens';
import { getFraseTemp } from '../../core/setup-temp';
import { english } from 'viem/accounts';
import { useToast } from '../../state/toast';

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Verificar() {
  const router = useRouter();
  const avisar = useToast((s) => s.avisar);
  const frase = getFraseTemp();
  const palabras = useMemo(() => (frase ? frase.split(' ') : []), [frase]);

  const reto = useMemo(() => {
    if (palabras.length === 0) return [];
    const indices = barajar(Array.from({ length: 12 }, (_, i) => i)).slice(0, 2).sort((a, b) => a - b);
    return indices.map((idx) => {
      const correcta = palabras[idx];
      const distractores = barajar(english.filter((w) => !palabras.includes(w))).slice(0, 2);
      return { idx, opciones: barajar([correcta, ...distractores]), correcta };
    });
  }, [palabras]);

  const [elegidas, setElegidas] = useState<Record<number, string>>({});

  if (!frase) {
    router.replace('/crear/frase');
    return null;
  }

  const completo = reto.every((r) => elegidas[r.idx]);
  const correcto = reto.every((r) => elegidas[r.idx] === r.correcta);

  return (
    <Pantalla>
      <View style={{ gap: space.xxl }}>
        <View style={{ gap: 8 }}>
          <T v="eyebrow">Paso 2 de 3</T>
          <T v="h1">Comprobemos</T>
          <T v="bodyLg">Elegí la palabra correcta de tu frase. Así sabemos que sí la guardaste.</T>
        </View>

        {reto.map((r) => (
          <Glass key={r.idx} style={{ padding: space.l, gap: space.m }}>
            <T v="eyebrow">Palabra #{r.idx + 1}</T>
            <View style={styles.opciones}>
              {r.opciones.map((op) => {
                const activa = elegidas[r.idx] === op;
                return (
                  <Presionable
                    key={op}
                    onPress={() => setElegidas((e) => ({ ...e, [r.idx]: op }))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    style={[styles.opcion, activa && styles.opcionActiva]}
                  >
                    <Mono size={15} color={activa ? color.sobreJade : color.pluma}>
                      {op}
                    </Mono>
                  </Presionable>
                );
              })}
            </View>
          </Glass>
        ))}

        <Boton
          titulo="Confirmar"
          deshabilitado={!completo}
          onPress={() => {
            if (!correcto) {
              avisar('Alguna palabra no coincide. Revisá tu papel y probá de nuevo.', 'error');
              setElegidas({});
              return;
            }
            router.push('/pin');
          }}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  opciones: { flexDirection: 'row', gap: 8 },
  opcion: {
    flex: 1,
    height: 48,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: color.borde,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,253,245,0.04)',
  },
  opcionActiva: {
    backgroundColor: color.jade,
    borderColor: color.jade,
  },
});
