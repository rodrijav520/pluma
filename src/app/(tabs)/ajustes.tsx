import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, Fuel, LogOut, ShieldCheck } from 'lucide-react-native';
import { consultarRed, formatoEth, GAS_INICIAL_ETH, type EstadoRed } from '../../core/red';
import { Pantalla } from '../../ui/Pantalla';
import { Hoja } from '../../ui/Hoja';
import { T } from '../../ui/T';
import { Boton } from '../../ui/Boton';
import { Aviso } from '../../ui/Avisos';
import { Presionable } from '../../ui/Presionable';
import { useSaldo } from '../../hooks/use-saldo';
import { useSesion } from '../../state/sesion';
import { useToast } from '../../state/toast';
import { BASE_URL } from '../../core/api';
import { direccionCorta } from '../../core/format';
import { color, radius, space } from '../../ui/tokens';

export default function Ajustes() {
  const usuario = useSesion((s) => s.usuario);
  const salir = useSesion((s) => s.salir);
  const { saldo } = useSaldo();
  const avisar = useToast((s) => s.avisar);

  async function copiarDireccion() {
    if (!saldo?.direccionWallet) return;
    await Clipboard.setStringAsync(saldo.direccionWallet);
    avisar('Dirección copiada', 'ok');
  }

  async function cerrarSesion() {
    await salir();
    router.replace('/bienvenida');
  }

  return (
    <Pantalla pieEspacio={110}>
      <T v="h1" style={styles.titulo}>
        Ajustes
      </T>

      <Hoja style={styles.bloque}>
        <T v="etiqueta">Tu cuenta</T>
        <T v="h2">{usuario?.nombreCompleto ?? '—'}</T>
        <T v="small">Rol: {usuario?.rol ?? '—'}</T>
      </Hoja>

      {saldo?.direccionWallet ? (
        <Presionable onPress={copiarDireccion} accessibilityLabel="Copiar tu dirección">
          <Hoja style={styles.filaHoja}>
            <View style={styles.filaTexto}>
              <T v="etiqueta">Tu dirección</T>
              <T v="dato">{direccionCorta(saldo.direccionWallet)}</T>
            </View>
            <Copy size={18} color={color.lapiz} strokeWidth={2} />
          </Hoja>
        </Presionable>
      ) : null}

      <EstadoDeRed direccion={saldo?.direccionWallet} />

      <Hoja style={styles.bloque}>
        <View style={styles.filaTitulo}>
          <ShieldCheck size={18} color={color.tinta} strokeWidth={2} />
          <T v="cuerpoFuerte">Cómo se guarda tu dinero</T>
        </View>
        <T v="cuerpo">
          Pluma es custodial: la llave de tu billetera la guarda el servidor, cifrada con AES-256.
          Vos entrás con tu correo y contraseña, sin frase semilla que memorizar.
        </T>
        <T v="small">
          Eso significa que dependés de que el servicio siga operando. A cambio, no perdés el acceso
          si perdés el teléfono.
        </T>
      </Hoja>

      <Aviso
        tono="espera"
        texto="Versión de prueba: opera sobre la red Sepolia con dinero de testnet. No uses fondos reales."
      />

      <Hoja style={styles.bloque}>
        <T v="etiqueta">Servidor</T>
        <T v="datoSuave" selectable>
          {BASE_URL}
        </T>
      </Hoja>

      <Boton
        titulo="Cerrar sesión"
        variante="peligro"
        onPress={cerrarSesion}
        style={styles.salir}
        icono={<LogOut size={18} color={color.sale} strokeWidth={2} />}
      />
    </Pantalla>
  );
}

/**
 * Gas disponible.
 *
 * El backend no expone este dato, así que se lee directo de la cadena. Es la
 * única forma de que la persona entienda por qué una operación falla cuando su
 * saldo está bien: sin ETH no se paga la comisión de la red, y nada se mueve.
 */
function EstadoDeRed({ direccion }: { direccion?: string }) {
  const [red, setRed] = useState<EstadoRed | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);

  const consultar = useCallback(async () => {
    if (!direccion) return;
    setCargando(true);
    setFallo(false);
    try {
      setRed(await consultarRed(direccion));
    } catch {
      setFallo(true);
    } finally {
      setCargando(false);
    }
  }, [direccion]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  if (!direccion) return null;

  const proporcion = red ? Math.min(red.eth / GAS_INICIAL_ETH, 1) : 0;
  const tono = !red ? color.lapiz : red.puedeOperar ? color.entra : color.sale;

  return (
    <Hoja style={styles.bloque}>
      <View style={styles.filaTitulo}>
        <Fuel size={18} color={color.tinta} strokeWidth={2} />
        <T v="cuerpoFuerte" style={{ flex: 1 }}>
          Gas para operar
        </T>
        {cargando ? <ActivityIndicator size="small" color={color.tinta} /> : null}
      </View>

      {fallo ? (
        <T v="small" color={color.espera}>
          No se pudo leer la red. Tocá aquí para reintentar.
        </T>
      ) : red ? (
        <>
          <T v="datoDestacado">{formatoEth(red.eth)} ETH</T>

          <View style={styles.barra}>
            <View
              style={[
                styles.barraLlena,
                { width: `${Math.max(proporcion * 100, 2)}%`, backgroundColor: tono },
              ]}
            />
          </View>

          <T v="small">
            {red.puedeOperar
              ? 'Alcanza para pagar las comisiones de la red. Sepolia, bloque ' +
                red.bloque.toLocaleString('es-GT') +
                '.'
              : 'No alcanza para pagar la comisión de red. Tus operaciones van a fallar hasta que se recargue.'}
          </T>
        </>
      ) : (
        <T v="small">Consultando la red…</T>
      )}
    </Hoja>
  );
}

const styles = StyleSheet.create({
  titulo: { marginBottom: space.l },
  barra: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.papelHundido,
    overflow: 'hidden',
    marginTop: space.xs,
  },
  barraLlena: { height: '100%', borderRadius: radius.pill },
  bloque: { gap: space.s, marginBottom: space.m },
  filaHoja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    marginBottom: space.m,
    borderRadius: radius.hoja,
  },
  filaTexto: { flex: 1, gap: space.xs },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  salir: { marginTop: space.l },
});
