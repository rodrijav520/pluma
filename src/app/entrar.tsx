import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Campo } from '../ui/Campo';
import { Boton } from '../ui/Boton';
import { Aviso } from '../ui/Avisos';
import { EncabezadoAtras } from '../ui/EncabezadoAtras';
import { useSesion } from '../state/sesion';
import { space } from '../ui/tokens';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const entrar = useSesion((s) => s.entrar);
  const cargando = useSesion((s) => s.cargando);
  const error = useSesion((s) => s.error);
  const limpiarError = useSesion((s) => s.limpiarError);

  const puedeEnviar = email.trim().length > 0 && password.length > 0 && !cargando;

  async function enviar() {
    if (!puedeEnviar) return;
    try {
      await entrar(email, password);
      router.replace('/(tabs)');
    } catch {
      // El mensaje ya quedó en el estado de sesión.
    }
  }

  return (
    <Pantalla scroll={false}>
      <EncabezadoAtras />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cuerpo}
      >
        <View style={styles.centro}>
          <T v="h1">Entrá a tu cuenta</T>

          {error ? <Aviso tono="error" texto={error} /> : null}

          <Campo
            etiqueta="Correo"
            valor={email}
            onCambio={(v) => {
              setEmail(v);
              if (error) limpiarError();
            }}
            placeholder="vos@ejemplo.gt"
            teclado="email-address"
            autoCapitalizar="none"
            autoComplete="email"
            returnKeyType="next"
          />

          <Campo
            etiqueta="Contraseña"
            valor={password}
            onCambio={(v) => {
              setPassword(v);
              if (error) limpiarError();
            }}
            placeholder="Tu contraseña"
            seguro={!verPassword}
            autoCapitalizar="none"
            autoComplete="password"
            returnKeyType="go"
            onSubmit={enviar}
            derecha={
              <Boton
                titulo={verPassword ? 'Ocultar' : 'Ver'}
                variante="fantasma"
                compacto
                onPress={() => setVerPassword((v) => !v)}
              />
            }
          />
        </View>

        <View style={styles.acciones}>
          <Boton
            titulo="Entrar"
            onPress={enviar}
            cargando={cargando}
            deshabilitado={!puedeEnviar}
          />
          <Boton
            titulo="Crear una cuenta"
            variante="fantasma"
            onPress={() => router.replace('/crear-cuenta')}
          />
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, justifyContent: 'space-between' },
  centro: { gap: space.l, paddingTop: space.xl },
  acciones: { gap: space.s, paddingBottom: space.l },
});
