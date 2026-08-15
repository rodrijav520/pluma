import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, RefreshCcw } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { Hoja } from '../../ui/Hoja';
import { T } from '../../ui/T';
import { Saldo } from '../../ui/Saldo';
import { Aviso } from '../../ui/Avisos';
import { Presionable } from '../../ui/Presionable';
import { Esqueleto } from '../../ui/Esqueleto';
import { Pluma } from '../../ui/Pluma';
import { useSaldo } from '../../hooks/use-saldo';
import { useSesion } from '../../state/sesion';
import { quetzales } from '../../core/format';
import { color, radius, space, TOQUE_MIN } from '../../ui/tokens';

export default function Inicio() {
  const { saldo, cargando, refrescando, error, refrescar } = useSaldo();
  const nombre = useSesion((s) => s.usuario?.nombreCompleto ?? '');
  const primerNombre = nombre.split(' ')[0];

  return (
    <Pantalla refrescando={refrescando} onRefrescar={refrescar} pieEspacio={110}>
      <View style={styles.encabezado}>
        <View>
          <T v="etiqueta">Hola</T>
          <T v="h2">{primerNombre || 'Bienvenida'}</T>
        </View>
        <Pluma alto={34} />
      </View>

      {error ? <Aviso tono="error" texto={error} /> : null}

      {cargando && !saldo ? (
        <CargandoSaldo />
      ) : saldo ? (
        <>
          <Saldo
            saldoGTQ={saldo.saldoGTQ}
            equivalenteGTQ={saldo.equivalenteGTQ}
            saldoCripto={saldo.saldoCripto}
            tasaCambio={saldo.tasaCambio}
            enLinea={saldo.saldoCriptoEnLinea}
          />

          <TasaHonesta tasa={saldo.tasaCambio} />

          <View style={styles.acciones}>
            <Accion
              Icono={ArrowDownLeft}
              etiqueta="Recibir"
              onPress={() => router.push('/recibir')}
            />
            <Accion
              Icono={RefreshCcw}
              etiqueta="Cambiar"
              destacada
              onPress={() => router.push('/cambiar')}
            />
            <Accion
              Icono={ArrowUpRight}
              etiqueta="Enviar"
              onPress={() => router.push('/enviar')}
            />
          </View>

          <Presionable onPress={() => router.push('/comprar')}>
            <Hoja style={styles.comprar}>
              <View style={{ flex: 1 }}>
                <T v="cuerpoFuerte">Comprar con quetzales</T>
                <T v="small">Pasá tu saldo en Q a dólares digitales</T>
              </View>
              <T v="dato" color={color.tinta}>
                {quetzales(saldo.saldoGTQ)}
              </T>
            </Hoja>
          </Presionable>
        </>
      ) : null}
    </Pantalla>
  );
}

/**
 * La tasa, dicha en voz alta.
 *
 * No se inventa la tasa exacta de un banco — se nombra el rango real que
 * documenta la investigación (2%–5% de margen escondido) y se muestra qué
 * significa en quetzales sobre esta tasa.
 */
function TasaHonesta({ tasa }: { tasa: number }) {
  if (!tasa) return null;
  const conMargen = tasa * 0.95;

  return (
    <Hoja style={styles.tasa}>
      {/* La tasa va en su propia línea: es el dato que el producto promete
          mostrar sin letra chica, así que no compite por ancho con su etiqueta. */}
      <T v="etiqueta">Tasa que estás recibiendo</T>
      <T v="datoDestacado" numberOfLines={1} style={styles.tasaValor}>
        1 USD = {quetzales(tasa)}
      </T>
      <View style={styles.tasaDivisor} />
      <T v="small">
        Con el margen que suele cobrar un banco (2%–5%), ese mismo dólar te quedaría cerca de{' '}
        {quetzales(conMargen)}.
      </T>
    </Hoja>
  );
}

function Accion({
  Icono,
  etiqueta,
  onPress,
  destacada,
}: {
  Icono: typeof ArrowUpRight;
  etiqueta: string;
  onPress: () => void;
  destacada?: boolean;
}) {
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={styles.accion}
    >
      <View style={[styles.accionCirculo, destacada && styles.accionCirculoDestacada]}>
        <Icono
          size={22}
          color={destacada ? color.sobreTinta : color.grafito}
          strokeWidth={2.1}
        />
      </View>
      <T v="small" color={color.grafito}>
        {etiqueta}
      </T>
    </Presionable>
  );
}

function CargandoSaldo() {
  return (
    <View style={{ gap: space.m, marginTop: space.l }}>
      <Esqueleto ancho={120} alto={14} />
      <Esqueleto ancho={230} alto={52} />
      <Esqueleto ancho={150} alto={34} />
      <Esqueleto alto={96} />
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.l,
  },
  tasa: { marginTop: space.l, gap: space.s },
  tasaValor: { marginTop: 2 },
  tasaDivisor: { height: 1, backgroundColor: color.trazo, marginVertical: space.xs },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: space.xl,
    marginBottom: space.l,
  },
  accion: { alignItems: 'center', gap: space.s, minWidth: 72 },
  accionCirculo: {
    width: 60,
    height: 60,
    minWidth: TOQUE_MIN,
    minHeight: TOQUE_MIN,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.papelAlto,
    borderWidth: 1,
    borderColor: color.trazo,
  },
  accionCirculoDestacada: { backgroundColor: color.tinta, borderColor: color.tinta },
  comprar: { flexDirection: 'row', alignItems: 'center', gap: space.m },
});
