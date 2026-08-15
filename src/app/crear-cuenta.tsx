import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Pantalla } from '../ui/Pantalla';
import { T } from '../ui/T';
import { Campo } from '../ui/Campo';
import { Boton } from '../ui/Boton';
import { Aviso } from '../ui/Avisos';
import { EncabezadoAtras } from '../ui/EncabezadoAtras';
import { useSesion } from '../state/sesion';
import { useToast } from '../state/toast';
import { validarEmail, validarNombre, validarPassword } from '../core/password';
import { space } from '../ui/tokens';

export default function CrearCuenta() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [tocado, setTocado] = useState(false);

  const registrar = useSesion((s) => s.registrar);
  const cargando = useSesion((s) => s.cargando);
  const error = useSesion((s) => s.error);
  const limpiarError = useSesion((s) => s.limpiarError);
  const avisar = useToast((s) => s.avisar);

  const errNombre = tocado ? validarNombre(nombre) : null;
  const errEmail = tocado ? validarEmail(email) : null;
  const errPassword = tocado ? validarPassword(password) : null;

  const valido = !validarNombre(nombre) && !validarEmail(email) && !validarPassword(password);

  async function enviar() {
    setTocado(true);
    if (!valido || cargando) return;

    try {
      const { gasPatrocinado } = await registrar(nombre, email, password);

      // El backend es explícito: si la tesorería no pudo adelantar el gas, la
      // cuenta existe pero no puede operar. Decirlo es mejor que dejar que la
      // primera operación falle sin explicación.
      if (!gasPatrocinado) {
        avisar(
          'Tu cuenta quedó creada, pero todavía no puede operar: falta que se acredite el gas de red.',
          'espera',
        );
      }
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
        <ScrollView
          contentContainerStyle={styles.centro}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <T v="h1">Creá tu cuenta</T>
          <T v="cuerpo">
            Con tu correo y una contraseña. Te abrimos una billetera y quedás listo para cobrar.
          </T>

          {error ? <Aviso tono="error" texto={error} /> : null}

          <Campo
            etiqueta="Nombre completo"
            valor={nombre}
            onCambio={(v) => {
              setNombre(v);
              if (error) limpiarError();
            }}
            placeholder="Ana López"
            error={errNombre}
            autoCapitalizar="words"
            autoComplete="name"
            returnKeyType="next"
          />

          <Campo
            etiqueta="Correo"
            valor={email}
            onCambio={(v) => {
              setEmail(v);
              if (error) limpiarError();
            }}
            placeholder="vos@ejemplo.gt"
            error={errEmail}
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
            placeholder="Al menos 10 caracteres"
            error={errPassword}
            ayuda="Mínimo 10 caracteres, con al menos una letra y un número."
            seguro={!verPassword}
            autoCapitalizar="none"
            autoComplete="new-password"
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
        </ScrollView>

        <View style={styles.acciones}>
          <Boton titulo="Crear cuenta" onPress={enviar} cargando={cargando} />
          <Boton
            titulo="Ya tengo cuenta"
            variante="fantasma"
            onPress={() => router.replace('/entrar')}
          />
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, justifyContent: 'space-between' },
  centro: { gap: space.l, paddingTop: space.xl, paddingBottom: space.l },
  acciones: { gap: space.s, paddingBottom: space.l },
});
