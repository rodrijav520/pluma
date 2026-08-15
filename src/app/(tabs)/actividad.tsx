import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pantalla } from '../../ui/Pantalla';
import { T } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Presionable } from '../../ui/Presionable';
import { EstadoVacio } from '../../ui/EstadoVacio';
import { Esqueleto } from '../../ui/Esqueleto';
import { FilaTx } from '../../ui/FilaTx';
import { color, radius, space } from '../../ui/tokens';
import { useChain } from '../../state/chain';
import { useFx } from '../../state/fx';
import { fmtDia } from '../../core/format';

const FILTROS = [
  { id: 'todo', etiqueta: 'Todo' },
  { id: 'in', etiqueta: 'Recibido' },
  { id: 'out', etiqueta: 'Enviado' },
] as const;

export default function Actividad() {
  const router = useRouter();
  const { txs, cargando, actualizado } = useChain();
  const rate = useFx((s) => s.rate);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todo');

  const filtradas = useMemo(
    () => (filtro === 'todo' ? txs : txs.filter((t) => t.dir === filtro)),
    [txs, filtro],
  );

  const grupos = useMemo(() => {
    const g: { dia: string; items: typeof filtradas }[] = [];
    for (const tx of filtradas) {
      const dia = fmtDia(tx.ts);
      const ultimo = g.at(-1);
      if (ultimo && ultimo.dia === dia) ultimo.items.push(tx);
      else g.push({ dia, items: [tx] });
    }
    return g;
  }, [filtradas]);

  return (
    <Pantalla pieEspacio={110}>
      <T v="h1" style={{ marginBottom: space.l }}>
        Actividad
      </T>

      <View style={styles.filtros}>
        {FILTROS.map((f) => {
          const activa = filtro === f.id;
          return (
            <Presionable
              key={f.id}
              onPress={() => setFiltro(f.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              style={[styles.filtro, activa && styles.filtroActivo]}
            >
              <T v="bodyStrong" style={{ fontSize: 13 }} color={activa ? color.sobreJade : color.plumaSuave}>
                {f.etiqueta}
              </T>
            </Presionable>
          );
        })}
      </View>

      {actualizado == null && cargando ? (
        <View style={{ gap: 14, marginTop: space.l }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Esqueleto key={i} alto={56} />
          ))}
        </View>
      ) : filtradas.length === 0 ? (
        <EstadoVacio
          titulo={filtro === 'todo' ? 'Todavía no hay movimientos' : 'Nada por aquí'}
          detalle={
            filtro === 'todo'
              ? 'Cuando cobrés o envíes dólares digitales, todo queda registrado aquí con su equivalente en quetzales.'
              : 'Con otro filtro seguro aparece algo.'
          }
          accion={filtro === 'todo' ? 'Crear un cobro' : undefined}
          onAccion={filtro === 'todo' ? () => router.push('/cobrar') : undefined}
        />
      ) : (
        <Glass style={{ paddingHorizontal: space.l, paddingVertical: 4, marginTop: space.l }}>
          {grupos.map((g, gi) => (
            <View key={g.dia}>
              <T v="small" style={{ marginTop: 12, marginBottom: 2 }}>
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
              {gi < grupos.length - 1 && <View style={styles.separador} />}
            </View>
          ))}
        </Glass>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  filtros: { flexDirection: 'row', gap: 8 },
  filtro: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
  },
  filtroActivo: {
    backgroundColor: color.jade,
    borderColor: color.jade,
  },
  separador: { height: 1, backgroundColor: color.borde, marginVertical: 6 },
});
