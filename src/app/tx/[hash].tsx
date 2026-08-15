import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Copy } from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Boton } from '../../ui/Boton';
import { Insignia } from '../../ui/Insignia';
import { Presionable } from '../../ui/Presionable';
import { color, space } from '../../ui/tokens';
import { useChain } from '../../state/chain';
import { useFx } from '../../state/fx';
import { useToast } from '../../state/toast';
import { txUrl } from '../../core/chain';
import { fmtFechaHora, fmtGtq, fmtUnitsUsd, shortHash, unitsToUsd } from '../../core/format';

function FilaDato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={styles.filaDato}>
      <T v="small">{etiqueta}</T>
      {children}
    </View>
  );
}

export default function DetalleTx() {
  const router = useRouter();
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const tx = useChain((s) => s.txs.find((t) => t.hash === hash));
  const rate = useFx((s) => s.rate);
  const avisar = useToast((s) => s.avisar);

  if (!tx) {
    return (
      <Pantalla>
        <T v="h2">No encontramos esa transacción</T>
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </Pantalla>
    );
  }

  const entra = tx.dir === 'in';
  const usd = unitsToUsd(BigInt(tx.units));
  const gtq = usd * (tx.gtqRate ?? rate);
  const Icono = entra ? ArrowDownLeft : ArrowUpRight;

  return (
    <Pantalla>
      <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" style={styles.volver}>
        <ArrowLeft size={20} color={color.plumaSuave} />
        <T v="body">Actividad</T>
      </Presionable>

      <Glass style={styles.tarjeta}>
        <View style={[styles.icono, { backgroundColor: entra ? 'rgba(45,227,155,0.12)' : 'rgba(236,253,245,0.06)' }]}>
          <Icono size={26} color={entra ? color.jade : color.pluma} strokeWidth={2} />
        </View>
        <Mono size={36} weight="bold" color={entra ? color.jade : color.pluma}>
          {entra ? '+' : '−'}
          {fmtUnitsUsd(BigInt(tx.units))}
        </Mono>
        <T v="body">≈ {fmtGtq(gtq)} al momento</T>
        <Insignia
          texto={tx.status === 'ok' ? 'Confirmada' : tx.status === 'pendiente' ? 'En camino' : 'Falló'}
          tinte={tx.status === 'ok' ? color.jade : tx.status === 'pendiente' ? color.cacao : color.pecho}
        />
      </Glass>

      <Glass style={{ padding: space.l, gap: 14, marginTop: space.l }}>
        {tx.concepto ? (
          <FilaDato etiqueta="Concepto">
            <T v="bodyStrong">{tx.concepto}</T>
          </FilaDato>
        ) : null}
        <FilaDato etiqueta={entra ? 'De' : 'Para'}>
          <Presionable
            onPress={async () => {
              await Clipboard.setStringAsync(tx.otra);
              avisar('Dirección copiada', 'ok');
            }}
            accessibilityRole="button"
            accessibilityLabel="Copiar dirección"
            style={styles.copiable}
          >
            <Mono size={13}>{shortHash(tx.otra)}</Mono>
            <Copy size={13} color={color.plumaTenue} />
          </Presionable>
        </FilaDato>
        <FilaDato etiqueta="Fecha">
          <Mono size={13}>{fmtFechaHora(tx.ts)}</Mono>
        </FilaDato>
        <FilaDato etiqueta="Red">
          <T v="bodyStrong">Base Sepolia · testnet</T>
        </FilaDato>
        <FilaDato etiqueta="Hash">
          <Presionable
            onPress={async () => {
              await Clipboard.setStringAsync(tx.hash);
              avisar('Hash copiado', 'ok');
            }}
            accessibilityRole="button"
            accessibilityLabel="Copiar hash"
            style={styles.copiable}
          >
            <Mono size={13}>{shortHash(tx.hash)}</Mono>
            <Copy size={13} color={color.plumaTenue} />
          </Presionable>
        </FilaDato>
      </Glass>

      <Boton
        titulo="Ver en el explorador"
        variante="secundario"
        onPress={() => Linking.openURL(txUrl(tx.hash))}
        style={{ marginTop: space.l }}
      />
      <T v="small" centrado style={{ marginTop: space.m }}>
        Cada transacción es pública y verificable por cualquiera. Eso es la trazabilidad.
      </T>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.l, alignSelf: 'flex-start' },
  tarjeta: { padding: space.xl, alignItems: 'center', gap: 8 },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  filaDato: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  copiable: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
