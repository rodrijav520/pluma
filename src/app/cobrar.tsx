import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Campo } from '../ui/Campo';
import { EntradaMonto } from '../ui/EntradaMonto';
import { Presionable } from '../ui/Presionable';
import { color, space } from '../ui/tokens';
import { usdToUnits } from '../core/format';
import { useCobros } from '../state/cobros';
import { useChain } from '../state/chain';
import { useFx } from '../state/fx';

/** Crear una pluma: el link de cobro que le mandás a tu cliente. */
export default function Cobrar() {
  const router = useRouter();
  const crear = useCobros((s) => s.crear);
  const ultimoEscaneo = useChain((s) => s.ultimoEscaneo);
  const rate = useFx((s) => s.rate);
  const [usd, setUsd] = useState(0);
  const [concepto, setConcepto] = useState('');
  const [errorConcepto, setErrorConcepto] = useState<string | null>(null);

  const generar = () => {
    if (concepto.trim().length === 0) {
      setErrorConcepto('Ponele un concepto: tu cliente (y tu contador) te lo van a agradecer.');
      return;
    }
    const cobro = crear({
      units: usdToUnits(usd).toString(),
      concepto: concepto.trim(),
      bloqueCreacion: ultimoEscaneo,
      gtqRateAlCrear: rate,
    });
    router.replace({ pathname: '/cobro/[id]', params: { id: cobro.id } });
  };

  return (
    <Pantalla scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T v="h1">Cobrá con tu pluma</T>
          <Presionable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={{ padding: 8 }}
          >
            <X size={22} color={color.plumaSuave} />
          </Presionable>
        </View>
        <T v="body" style={{ marginTop: 4 }}>
          Tu cliente paga desde cualquier wallet del mundo. Vos lo ves caer en minutos.
        </T>

        <View style={{ flex: 1, justifyContent: 'center', gap: space.xxl }}>
          <EntradaMonto onUsd={setUsd} />
          <Campo
            etiqueta="Concepto"
            valor={concepto}
            onCambio={(v) => {
              setConcepto(v);
              setErrorConcepto(null);
            }}
            placeholder="Diseño de logo — anticipo 50%"
            error={errorConcepto}
          />
        </View>

        <Boton titulo="Generar mi pluma" onPress={generar} deshabilitado={usd <= 0} />
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
