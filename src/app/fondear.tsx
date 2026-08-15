import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, Droplets, ExternalLink, Fuel, X } from 'lucide-react-native';
import { Pantalla } from '../ui/Pantalla';
import { T, Mono } from '../ui/T';
import { Glass } from '../ui/Glass';
import { Insignia } from '../ui/Insignia';
import { Presionable } from '../ui/Presionable';
import { color, radius, space } from '../ui/tokens';
import { useApp } from '../state/app';
import { useToast } from '../state/toast';
import { shortAddr } from '../core/format';

const FAUCETS = [
  {
    titulo: '1 · Gas de prueba (ETH en Base Sepolia)',
    detalle: 'Una gota alcanza para cientos de envíos. Es el "combustible" de la red.',
    icono: Fuel,
    links: [
      { nombre: 'Faucet de Coinbase (CDP)', url: 'https://portal.cdp.coinbase.com/products/faucet' },
      { nombre: 'Faucet de Alchemy', url: 'https://www.alchemy.com/faucets/base-sepolia' },
    ],
  },
  {
    titulo: '2 · USDC de prueba',
    detalle: 'El faucet oficial de Circle. Elegí la red "Base Sepolia", pegá tu dirección y listo.',
    icono: Droplets,
    links: [{ nombre: 'Faucet oficial de Circle', url: 'https://faucet.circle.com' }],
  },
] as const;

export default function Fondear() {
  const router = useRouter();
  const address = useApp((s) => s.address);
  const avisar = useToast((s) => s.avisar);

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <T v="h1">Fondear</T>
        <Presionable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ padding: 8 }}>
          <X size={22} color={color.plumaSuave} />
        </Presionable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: space.l }}>
        <Insignia texto="Testnet" tinte={color.cacao} />
        <Insignia texto="Dinero de prueba · gratis" tinte={color.jade} />
      </View>

      <T v="bodyLg" style={{ marginBottom: space.xl }}>
        Esta versión académica corre en la red de prueba de Base: las transacciones son reales,
        el dinero no. Conseguí saldo gratis en 2 pasos:
      </T>

      {address && (
        <Presionable
          onPress={async () => {
            await Clipboard.setStringAsync(address);
            avisar('Dirección copiada — pegala en el faucet', 'ok');
          }}
          accessibilityRole="button"
          accessibilityLabel="Copiar mi dirección"
        >
          <Glass radio={radius.m} relleno="rgba(45,227,155,0.08)" style={styles.direccion}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="eyebrow" color={color.jade}>
                Tu dirección (tocá para copiar)
              </T>
              <Mono size={14}>{shortAddr(address, 10)}</Mono>
            </View>
            <Copy size={18} color={color.jade} />
          </Glass>
        </Presionable>
      )}

      {FAUCETS.map((f) => (
        <View key={f.titulo} style={{ marginTop: space.xl }}>
          <View style={styles.filaTitulo}>
            <f.icono size={17} color={color.plumaSuave} />
            <T v="bodyStrong">{f.titulo}</T>
          </View>
          <T v="small" style={{ marginTop: 4, marginBottom: 10 }}>
            {f.detalle}
          </T>
          <Glass style={{ paddingHorizontal: space.l }}>
            {f.links.map((l, i) => (
              <Presionable
                key={l.url}
                onPress={() => Linking.openURL(l.url)}
                accessibilityRole="link"
                accessibilityLabel={l.nombre}
                style={[styles.link, i < f.links.length - 1 && styles.conBorde]}
              >
                <T v="bodyStrong" style={{ flex: 1 }}>
                  {l.nombre}
                </T>
                <ExternalLink size={16} color={color.jade} />
              </Presionable>
            ))}
          </Glass>
        </View>
      ))}

      <T v="small" style={{ marginTop: space.xl }}>
        Consejo para la demo de clase: fondeá con anticipación — los faucets a veces se quedan
        secos. En producción este paso no existe: tu cliente simplemente te paga.
      </T>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  direccion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: space.m, borderColor: color.bordeJade },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15 },
  conBorde: { borderBottomWidth: 1, borderBottomColor: color.borde },
});
