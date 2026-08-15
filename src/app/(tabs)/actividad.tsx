import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { Hoja } from '../../ui/Hoja';
import { T } from '../../ui/T';
import { FilaTx } from '../../ui/FilaTx';
import { Aviso } from '../../ui/Avisos';
import { Boton } from '../../ui/Boton';
import { Esqueleto } from '../../ui/Esqueleto';
import { EstadoVacio } from '../../ui/EstadoVacio';
import { api, ErrorApi, type TransaccionResponse } from '../../core/api';
import { useSesion } from '../../state/sesion';
import { color, space } from '../../ui/tokens';

const POR_PAGINA = 20;

export default function Actividad() {
  const salir = useSesion((s) => s.salir);

  const [items, setItems] = useState<TransaccionResponse[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (p: number, modo: 'inicial' | 'refresco' | 'mas') => {
      const token = useSesion.getState().tokenVigente();
      if (!token) {
        await salir();
        return;
      }

      if (modo === 'inicial') setCargando(true);
      if (modo === 'refresco') setRefrescando(true);
      if (modo === 'mas') setCargandoMas(true);
      setError(null);

      try {
        const r = await api.historial(token, p, POR_PAGINA);
        setItems((prev) => (modo === 'mas' ? [...prev, ...r.transacciones] : r.transacciones));
        setPagina(r.pagina);
        setTotalPaginas(Math.max(r.totalPaginas, 1));
      } catch (e) {
        if (e instanceof ErrorApi && e.esSesionVencida) {
          await salir();
          return;
        }
        setError(e instanceof ErrorApi ? e.message : 'No se pudo cargar tu actividad.');
      } finally {
        setCargando(false);
        setRefrescando(false);
        setCargandoMas(false);
      }
    },
    [salir],
  );

  useEffect(() => {
    cargar(1, 'inicial');
  }, [cargar]);

  const hayMas = pagina < totalPaginas;

  return (
    <Pantalla
      refrescando={refrescando}
      onRefrescar={() => cargar(1, 'refresco')}
      pieEspacio={110}
    >
      <T v="h1" style={styles.titulo}>
        Actividad
      </T>

      {error ? <Aviso tono="error" texto={error} /> : null}

      {cargando ? (
        <View style={{ gap: space.m }}>
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} alto={64} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EstadoVacio
          icono={<Receipt size={28} color={color.lapiz} strokeWidth={1.8} />}
          titulo="Todavía no hay movimientos"
          texto="Acá vas a ver cada compra, cambio y envío, con lo que entra y lo que sale en las dos monedas."
          accion={{ titulo: 'Comprar con quetzales', onPress: () => router.push('/comprar') }}
        />
      ) : (
        <>
          <Hoja style={styles.lista}>
            {items.map((tx, i) => (
              <View key={tx.id}>
                {i > 0 ? <View style={styles.divisor} /> : null}
                <FilaTx tx={tx} />
              </View>
            ))}
          </Hoja>

          {hayMas ? (
            cargandoMas ? (
              <ActivityIndicator color={color.tinta} style={styles.mas} />
            ) : (
              <Boton
                titulo="Ver más"
                variante="secundario"
                onPress={() => cargar(pagina + 1, 'mas')}
                style={styles.mas}
              />
            )
          ) : (
            <T v="small" centrado style={styles.fin}>
              No hay más movimientos.
            </T>
          )}
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  titulo: { marginBottom: space.l },
  lista: { paddingVertical: space.xs },
  divisor: { height: 1, backgroundColor: color.trazo },
  mas: { marginTop: space.l },
  fin: { marginTop: space.l },
});
