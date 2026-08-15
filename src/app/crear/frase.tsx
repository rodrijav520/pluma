import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Boton } from '../../ui/Boton';
import { Glass } from '../../ui/Glass';
import { Presionable } from '../../ui/Presionable';
import { color, hitSlop, radius, space } from '../../ui/tokens';
import { crearFrase } from '../../core/wallet';
import { setFraseTemp } from '../../core/setup-temp';

export default function Frase() {
  const router = useRouter();
  const frase = useMemo(() => crearFrase(), []);
  const palabras = frase.split(' ');
  const [visible, setVisible] = useState(false);

  return (
    <Pantalla>
      <View style={{ gap: space.xxl }}>
        <View style={{ gap: 8 }}>
          <T v="eyebrow">Paso 1 de 3</T>
          <T v="h1">Tus 12 palabras</T>
          <T v="bodyLg">
            Esta frase ES tu cuenta. Con ella recuperás tu dinero en cualquier teléfono; sin ella,
            nadie —ni Pluma— puede ayudarte.
          </T>
        </View>

        <Glass style={{ padding: space.l, gap: space.m }}>
          <View style={styles.filaEncabezado}>
            <T v="eyebrow" color={color.plumaSuave}>
              Frase semilla
            </T>
            <Presionable
              onPress={() => setVisible((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Ocultar frase' : 'Mostrar frase'}
              hitSlop={hitSlop}
              style={styles.ojo}
            >
              {visible ? (
                <EyeOff size={18} color={color.plumaSuave} />
              ) : (
                <Eye size={18} color={color.plumaSuave} />
              )}
            </Presionable>
          </View>
          <View style={styles.grid}>
            {palabras.map((p, i) => (
              <View key={i} style={styles.chip}>
                <T v="small" color={color.plumaTenue}>
                  {i + 1}
                </T>
                <Mono size={14}>{visible ? p : '••••'}</Mono>
              </View>
            ))}
          </View>
        </Glass>

        <Glass relleno="rgba(255,77,94,0.08)" style={styles.alerta}>
          <ShieldAlert size={18} color={color.pecho} />
          <T v="body" color={color.pluma} style={{ flex: 1 }}>
            Escribilas en <T v="bodyStrong">papel</T>, en orden, y guardalas como si fueran
            Q10,000 en efectivo. Nada de screenshots ni WhatsApp.
          </T>
        </Glass>

        <Boton
          titulo="Ya las guardé en papel"
          onPress={() => {
            setFraseTemp(frase);
            router.push('/crear/verificar');
          }}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ojo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,253,245,0.05)',
  },
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
    gap: 10,
    padding: space.l,
    alignItems: 'flex-start',
  },
});
