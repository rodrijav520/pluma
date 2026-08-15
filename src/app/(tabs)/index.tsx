import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  Repeat,
  Search,
  Wallet,
} from 'lucide-react-native';
import { T } from '../../ui/T';
import { Hoja } from '../../ui/Hoja';
import { Aviso } from '../../ui/Avisos';
import { Avatar } from '../../ui/Avatar';
import { AccionRapida, IconoRedondo } from '../../ui/AccionRapida';
import { FilaActivo } from '../../ui/FilaActivo';
import { FilaTx } from '../../ui/FilaTx';
import { Presionable } from '../../ui/Presionable';
import { Esqueleto } from '../../ui/Esqueleto';
import { useSaldo } from '../../hooks/use-saldo';
import { useSesion } from '../../state/sesion';
import { useToast } from '../../state/toast';
import { api, type TransaccionResponse } from '../../core/api';
import { cripto, dolares, quetzales } from '../../core/format';
import { color, degradado, hitSlop, radius, space } from '../../ui/tokens';

const OCULTO = '••••••';

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const { saldo, cargando, refrescando, error, refrescar } = useSaldo();
  const nombre = useSesion((s) => s.usuario?.nombreCompleto ?? '');
  const avisar = useToast((s) => s.avisar);

  const [visible, setVisible] = useState(true);
  const [recientes, setRecientes] = useState<TransaccionResponse[]>([]);

  const cargarRecientes = useCallback(async () => {
    const token = useSesion.getState().tokenVigente();
    if (!token) return;
    try {
      const r = await api.historial(token, 1, 3);
      setRecientes(r.transacciones);
    } catch {
      // El historial es secundario en esta pantalla: si falla, no se estorba
      // al saldo, que es lo que la persona vino a ver.
    }
  }, []);

  useEffect(() => {
    cargarRecientes();
  }, [cargarRecientes, saldo?.saldoGTQ, saldo?.saldoCripto]);

  const tasa = saldo?.tasaCambio ?? 0;
  const totalGTQ = (saldo?.saldoGTQ ?? 0) + (saldo?.equivalenteGTQ ?? 0);
  const totalUSD = tasa > 0 ? totalGTQ / tasa : 0;

  return (
    <View style={styles.raiz}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              refrescar();
              cargarRecientes();
            }}
            tintColor={color.tinta}
            colors={[color.tinta]}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* ---------- Encabezado en degradado ---------- */}
        <LinearGradient
          colors={degradado.marca}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + space.m }]}
        >
          <View style={styles.filaPersona}>
            <Avatar nombre={nombre} tamano={46} borde />
            <View style={styles.saludo}>
              <T v="small" color={color.sobreDegradadoSuave}>
                {saludo()} 👋
              </T>
              <T v="h2" color={color.sobreDegradado} numberOfLines={1}>
                {nombre || 'Bienvenida'}
              </T>
            </View>
            <IconoRedondo
              Icono={Search}
              etiqueta="Buscar en tus movimientos"
              onPress={() => router.push('/actividad')}
            />
            <IconoRedondo
              Icono={Bell}
              etiqueta="Notificaciones"
              punto={recientes.some((t) => t.estado === 'Confirmando')}
              onPress={() =>
                avisar(
                  recientes.some((t) => t.estado === 'Confirmando')
                    ? 'Tenés una operación confirmándose en la red.'
                    : 'No tenés avisos nuevos.',
                  'info',
                )
              }
            />
          </View>

          <View style={styles.bloqueSaldo}>
            <Presionable
              onPress={() => setVisible((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
              accessibilityState={{ expanded: visible }}
              hitSlop={hitSlop}
              style={styles.filaEtiqueta}
            >
              <T v="etiqueta" color={color.sobreDegradadoTenue}>
                Tu saldo total
              </T>
              {visible ? (
                <Eye size={15} color={color.sobreDegradadoTenue} strokeWidth={2} />
              ) : (
                <EyeOff size={15} color={color.sobreDegradadoTenue} strokeWidth={2} />
              )}
            </Presionable>

            {cargando && !saldo ? (
              <View style={{ gap: space.s, marginTop: space.s }}>
                <Esqueleto ancho={220} alto={52} radio={radius.m} />
                <Esqueleto ancho={140} alto={28} radio={radius.s} />
              </View>
            ) : (
              <>
                {/* Las dos monedas con el mismo cuidado: es la tesis del producto.
                    El ajuste de tamaño no es cosmético: "Q 1,234,567.89" a 52 px
                    se sale de una pantalla de 375. */}
                <T
                  v="saldoMayor"
                  color={color.sobreDegradado}
                  style={styles.montoMayor}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {visible ? quetzales(totalGTQ) : OCULTO}
                </T>
                <T
                  v="saldoMenor"
                  color={color.sobreDegradadoSuave}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {visible ? dolares(totalUSD) : OCULTO}
                </T>
              </>
            )}

            {tasa > 0 ? (
              <View style={styles.chipTasa}>
                <T v="small" color={color.sobreDegradado}>
                  1 USD = {quetzales(tasa)}
                </T>
              </View>
            ) : null}
          </View>

          <View style={styles.acciones}>
            <AccionRapida
              Icono={ArrowDownToLine}
              etiqueta="Recibir"
              onPress={() => router.push('/recibir')}
            />
            <AccionRapida
              Icono={Wallet}
              etiqueta="Comprar"
              onPress={() => router.push('/comprar')}
            />
            <AccionRapida
              Icono={ArrowUpRight}
              etiqueta="Enviar"
              onPress={() => router.push('/enviar')}
            />
            <AccionRapida
              Icono={Repeat}
              etiqueta="Cambiar"
              destacada
              onPress={() => router.push('/cambiar')}
            />
          </View>
        </LinearGradient>

        {/* ---------- Hoja de contenido, sube sobre el degradado ---------- */}
        <View style={styles.lamina}>
          {error ? <Aviso tono="error" texto={error} /> : null}

          <T v="etiqueta" style={styles.seccion}>
            Tus activos
          </T>
          <Hoja style={styles.hojaLista}>
            {cargando && !saldo ? (
              <View style={{ gap: space.m, paddingVertical: space.s }}>
                <Esqueleto alto={42} />
                <Esqueleto alto={42} />
              </View>
            ) : (
              <>
                <FilaActivo
                  sigla="Q"
                  nombre="Quetzales"
                  monto={visible ? quetzales(saldo?.saldoGTQ ?? 0) : OCULTO}
                  equivalente={
                    tasa > 0 ? `≈ ${dolares((saldo?.saldoGTQ ?? 0) / tasa)}` : 'Listo para usar'
                  }
                  tonos={degradado.quetzal}
                />
                <View style={styles.divisor} />
                <FilaActivo
                  sigla="$"
                  nombre="Dólares digitales"
                  monto={visible ? `${cripto(saldo?.saldoCripto ?? 0)} USDT` : OCULTO}
                  equivalente={`≈ ${quetzales(saldo?.equivalenteGTQ ?? 0)}`}
                  tonos={degradado.dolar}
                  aviso={saldo && !saldo.saldoCriptoEnLinea ? 'Último dato conocido' : undefined}
                />
              </>
            )}
          </Hoja>

          {tasa > 0 ? <TasaHonesta tasa={tasa} /> : null}

          <View style={styles.filaSeccion}>
            <T v="etiqueta">Movimientos recientes</T>
            {recientes.length > 0 ? (
              <Presionable
                onPress={() => router.push('/actividad')}
                accessibilityRole="button"
                accessibilityLabel="Ver toda tu actividad"
                hitSlop={hitSlop}
                style={styles.verTodo}
              >
                <T v="small" color={color.tinta}>
                  Ver todo
                </T>
              </Presionable>
            ) : null}
          </View>

          <Hoja style={styles.hojaLista}>
            {recientes.length === 0 ? (
              <T v="small" style={styles.vacio}>
                Todavía no hay movimientos. Cuando cobres o cambies, aparecen acá.
              </T>
            ) : (
              recientes.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 ? <View style={styles.divisor} /> : null}
                  <FilaTx tx={tx} />
                </View>
              ))
            )}
          </Hoja>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * La tasa, dicha en voz alta.
 *
 * No se inventa la tasa exacta de un banco: se nombra el rango real que
 * documenta la investigación (2%–5% de margen escondido) y se muestra qué
 * significa en quetzales sobre esta tasa.
 */
function TasaHonesta({ tasa }: { tasa: number }) {
  const conMargen = tasa * 0.95;
  const perdidaEn500 = 500 * tasa - 500 * conMargen;

  return (
    <Hoja style={styles.tasa}>
      {/* Texto normal, no otra etiqueta en versalitas: cuatro de esas en una
          sola pantalla dejan de jerarquizar y se vuelven ruido. */}
      <View style={styles.tasaEncabezado}>
        <View style={styles.tasaPunto} />
        <T v="cuerpoFuerte">Lo que no te cobramos</T>
      </View>
      <T v="datoDestacado" numberOfLines={1}>
        {quetzales(perdidaEn500)} en cada $500
      </T>
      <View style={styles.divisor} />
      <T v="small">
        Tu tasa es {quetzales(tasa)} por dólar. Con el margen que suele cobrar un banco (2%–5%), ese
        mismo dólar te quedaría cerca de {quetzales(conMargen)}.
      </T>
    </Hoja>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: color.papel },

  hero: {
    paddingHorizontal: space.pantalla,
    paddingBottom: space.xxl + space.l,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  saludo: { flex: 1, gap: 1, marginLeft: space.xs },

  bloqueSaldo: { marginTop: space.xxl },
  filaEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    alignSelf: 'flex-start',
    paddingVertical: space.s,
  },
  verTodo: { paddingVertical: space.xs, paddingHorizontal: space.xs },
  montoMayor: { marginTop: space.s },
  chipTasa: {
    alignSelf: 'flex-start',
    marginTop: space.m,
    paddingHorizontal: space.m,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.vidrioClaro,
    borderWidth: 1,
    borderColor: color.vidrioClaroBorde,
  },

  acciones: { flexDirection: 'row', gap: space.s, marginTop: space.xxl },

  // Sube sobre el degradado: la hoja se monta encima, no queda pegada.
  lamina: { paddingHorizontal: space.pantalla, marginTop: -space.xl, gap: space.m },
  seccion: { marginTop: space.s },
  filaSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.s,
  },
  hojaLista: { paddingVertical: space.xs },
  divisor: { height: 1, backgroundColor: color.trazo },
  vacio: { paddingVertical: space.m },

  tasa: { gap: space.s, marginTop: space.s },
  tasaEncabezado: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  tasaPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.entra },
});
