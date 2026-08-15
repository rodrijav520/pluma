import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Boton } from '../ui/Boton';
import { Campo } from '../ui/Campo';
import { space } from '../ui/tokens';
import { validarFrase } from '../core/wallet';
import { setFraseTemp } from '../core/setup-temp';

export default function Importar() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  const importar = () => {
    const limpia = texto.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!validarFrase(limpia)) {
      setError('Esa frase no es válida. Revisá que sean 12 palabras en inglés, en orden y bien escritas.');
      return;
    }
    setFraseTemp(limpia);
    router.push('/pin');
  };

  return (
    <Pantalla>
      <View style={{ gap: space.xxl }}>
        <View style={{ gap: 8 }}>
          <T v="eyebrow">Importar wallet</T>
          <T v="h1">Traé tu pluma</T>
          <T v="bodyLg">
            Escribí tus 12 palabras separadas por espacios. Solo se guardan cifradas en este
            teléfono.
          </T>
        </View>

        <Campo
          etiqueta="Frase semilla"
          valor={texto}
          onCambio={(v) => {
            setTexto(v);
            setError(null);
          }}
          placeholder="palabra1 palabra2 palabra3 …"
          multilinea
          autoFoco
          autoCapitalizar="none"
          error={error}
          ayuda="Nunca compartás esta frase con nadie. Pluma jamás te la va a pedir."
        />

        <Boton titulo="Importar wallet" onPress={importar} deshabilitado={texto.trim().length === 0} />
      </View>
    </Pantalla>
  );
}
