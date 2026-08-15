import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { soloNativo } from '../../ui/anim';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Droplets,
  QrCode,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Pluma } from '../../ui/Pluma';
import { Presionable } from '../../ui/Presionable';
import { Esqueleto } from '../../ui/Esqueleto';
import { EstadoVacio } from '../../ui/EstadoVacio';
import { FilaTx } from '../../ui/FilaTx';
import { Seccion } from '../../ui/Insignia';
import { color, radius, space } from '../../ui/tokens';
import { useApp } from '../../state/app';
import { useChain } from '../../state/chain';
import { useCobros } from '../../state/cobros';
import { useFx } from '../../state/fx';
import { useLearn } from '../../state/learn';
import { fmtGtq, fmtHora, fmtRate, fmtUnitsUsd, fmtUsd, fmtDia, unitsToUsd } from '../../core/format';

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function AccionRapida({
  icono,
  etiqueta,
  onPress,
  destacada,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  onPress: () => void;
  destacada?: boolean;
}) {
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={{ flex: 1 }}
    >
      <Glass
        radio={radius.m}
        relleno={destacada ? 'rgba(45,227,155,0.14)' : undefined}
        style={[styles.accion, destacada && { borderColor: color.bordeJade }]}
      >
        {icono}
        <T v="bodyStrong" style={{ fontSize: 13 }} color={destacada ? color.jade : color.pluma}>
          {etiqueta}
        </T>
      </Glass>
    </Presionable>
  );
}

export default function Inicio() {
  const router = useRouter();
  const nombre = useApp((s) => s.nombre);
  const address = useApp((s) => s.address);
  const { usdc, txs, cargando, errorRed, actualizado, refrescar } = useChain();
  const cobros = useCobros((s) => s.items);
  const { rate, ts, fuente } = useFx();
  const lecciones = useLearn((s) => Object.keys(s.completadas).length);

  const usd = unitsToUsd(BigInt(usdc));
  const gtq = usd * rate;
  const primeraCarga = actualizado == null;
  const pendientes = cobros.filter((c) => c.status === 'pendiente');
  const recientes = txs.slice(0, 5);

  const grupos = useMemo(() => {
    const g: { dia: string; items: typeof recientes }[] = [];
    for (const tx of recientes) {
      const dia = fmtDia(tx.ts);
      const ultimo = g.at(-1);
      if (ultimo && ultimo.dia === dia) ultimo.items.push(tx);
      else g.push({ dia, items: [tx] });
    }
    return g;
  }, [recientes]);

  return (
    <Pantalla
      refrescando={cargando && !primeraCarga}
      onRefrescar={() => address && refrescar(address, useApp.getState().bloqueCreacion, rate)}
      pieEspacio={110}
    >
      {/* Saludo */}
      <View style={styles.filaSaludo}>
        <View>
          <T v="eyebrow">{saludo()}</T>
          <T v="h2">{nombre ? nombre : 'Tu pluma'}</T>
        </View>
        <Presionable
          onPress={() => router.push('/fondear')}
          accessibilityRole="button"
          accessibilityLabel="Fondear con dinero de prueba"
          style={styles.botonFondear}
        >
          <Droplets size={19} color={color.plumaSuave} strokeWidth={1.9} />
        </Presionable>
      </View>

      {/* Balance héroe */}
      <Animated.View entering={soloNativo(FadeInDown.duration(320))}>
        <Glass style={styles.balance}>
          <View pointerEvents="none" style={styles.plumaFondo}>
            <Pluma alto={190} opacidad={0.32} rotacion={26} conPecho={false} />
          </View>
          <T v="eyebrow">Tu pisto</T>
          {primeraCarga && cargando ? (
            <View style={{ gap: 10, marginTop: 6 }}>
              <Esqueleto ancho={210} alto={40} />
              <Esqueleto ancho={130} alto={18} />
            </View>
          ) : (
            <>
              <Mono size={42} weight="bold" style={{ letterSpacing: -1, marginTop: 2 }}>
                {fmtGtq(gtq)}
              </Mono>
              <T v="body" style={{ marginTop: 2 }}>
                {fmtUsd(usd)} <T v="small">USDC · dólares digitales</T>
              </T>
            </>
          )}

          <View style={styles.filaTc}>
            <View style={styles.chipTc}>
              <Mono size={12} color={color.plumaSuave}>
                TC {fmtRate(rate)}
              </Mono>
              <T v="small" style={{ fontSize: 11 }}>
                {fuente === 'live' && ts ? `· hoy ${fmtHora(ts)}` : fuente === 'cache' ? '· guardado' : '· referencia'}
              </T>
            </View>
            {errorRed && (
              <Presionable
                onPress={() => address && refrescar(address, useApp.getState().bloqueCreacion, rate)}
                accessibilityRole="button"
                accessibilityLabel="Reintentar actualización"
                style={styles.chipError}
              >
                <RefreshCw size={11} color={color.cacao} />
                <T v="small" style={{ fontSize: 11 }} color={color.cacao}>
                  Sin actualizar · reintentar
                </T>
              </Presionable>
            )}
          </View>
        </Glass>
      </Animated.View>

      {/* Acciones rápidas */}
      <View style={styles.acciones}>
        <AccionRapida
          destacada
          icono={<QrCode size={20} color={color.jade} strokeWidth={2} />}
          etiqueta="Cobrar"
          onPress={() => router.push('/cobrar')}
        />
        <AccionRapida
          icono={<ArrowUpRight size={20} color={color.pluma} strokeWidth={2} />}
          etiqueta="Enviar"
          onPress={() => router.push('/enviar')}
        />
        <AccionRapida
          icono={<ArrowDownToLine size={20} color={color.pluma} strokeWidth={2} />}
          etiqueta="Recibir"
          onPress={() => router.push('/recibir')}
        />
      </View>

      {/* Cobros pendientes */}
      {pendientes.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <Seccion titulo={`Cobros pendientes (${pendientes.length})`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pendientes.map((c) => (
              <Presionable
                key={c.id}
                onPress={() => router.push({ pathname: '/cobro/[id]', params: { id: c.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Cobro pendiente ${c.concepto}`}
              >
                <Glass radio={radius.m} style={styles.cardCobro}>
                  <Mono size={18}>{fmtUnitsUsd(BigInt(c.units))}</Mono>
                  <T v="small" numberOfLines={1}>
                    {c.concepto || 'Sin concepto'}
                  </T>
                  <View style={styles.puntito} />
                </Glass>
              </Presionable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Banner Escuela (patrón de recompensa accionable) */}
      {lecciones < 3 && (
        <Presionable
          onPress={() => router.push('/(tabs)/aprender')}
          accessibilityRole="button"
          accessibilityLabel="Ir a la Escuela Cripto"
          style={{ marginTop: space.xxl }}
        >
          <Glass relleno="rgba(233,188,90,0.07)" style={styles.bannerEscuela}>
            <Image
              source={require('../../../assets/ilustraciones/hero-aprende.webp')}
              style={styles.chick}
              accessibilityIgnoresInvertColors
            />
            <View style={{ flex: 1, gap: 3 }}>
              <T v="bodyStrong">
                {lecciones === 0 ? 'Ganate tu primera pluma' : 'Seguí sumando plumas'}
              </T>
              <T v="small">
                {lecciones === 0
                  ? 'Una lección de 1 minuto y salís sabiendo qué es un dólar digital.'
                  : `Llevás ${lecciones} de 12 lecciones. La siguiente te espera.`}
              </T>
            </View>
            <Sparkles size={18} color={color.cacao} />
          </Glass>
        </Presionable>
      )}

      {/* Movimientos */}
      <View style={{ marginTop: space.xxl }}>
        <Seccion
          titulo="Movimientos"
          accion={txs.length > 0 ? 'Ver todo' : undefined}
          onAccion={() => router.push('/(tabs)/actividad')}
        />
        {primeraCarga && cargando ? (
          <View style={{ gap: 14 }}>
            <Esqueleto alto={56} />
            <Esqueleto alto={56} />
            <Esqueleto alto={56} />
          </View>
        ) : recientes.length === 0 ? (
          <EstadoVacio
            titulo="Tu primer cobro te espera"
            detalle="Creá tu pluma, mandásela a tu cliente y mirá caer tu primer pago en minutos."
            accion="Crear mi primer cobro"
            onAccion={() => router.push('/cobrar')}
          />
        ) : (
          grupos.map((g) => (
            <View key={g.dia}>
              <T v="small" style={{ marginTop: 10, marginBottom: 2 }}>
                {g.dia}
              </T>
              {g.items.map((tx) => (
                <FilaTx
                  key={tx.hash}
                  tx={tx}
                  rate={rate}
                  onPress={() => router.push({ pathname: '/tx/[hash]', params: { hash: tx.hash } })}
                />
              ))}
            </View>
          ))
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  filaSaludo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.l,
  },
  botonFondear: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234,246,239,0.08)',
    backgroundColor: 'rgba(236,253,245,0.04)',
  },
  balance: {
    padding: space.xl,
    overflow: 'hidden',
  },
  plumaFondo: {
    position: 'absolute',
    right: -6,
    top: -18,
  },
  filaTc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.l,
    flexWrap: 'wrap',
  },
  chipTc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(236,253,245,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234,246,239,0.08)',
  },
  chipError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(233,188,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(233,188,90,0.3)',
  },
  acciones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: space.l,
  },
  accion: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  cardCobro: {
    padding: space.l,
    gap: 4,
    width: 150,
  },
  puntito: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: color.cacao,
  },
  bannerEscuela: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.m,
    borderColor: 'rgba(233,188,90,0.25)',
  },
  chick: {
    width: 52,
    height: 52,
    borderRadius: radius.s,
  },
});
