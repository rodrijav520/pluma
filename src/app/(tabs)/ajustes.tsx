import React, { useState } from 'react';
import { Linking, Platform, Share, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import {
  ChevronRight,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  FileSpreadsheet,
  Fingerprint,
  KeyRound,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { Pantalla } from '../../ui/Pantalla';
import { T, Mono } from '../../ui/T';
import { Glass } from '../../ui/Glass';
import { Presionable } from '../../ui/Presionable';
import { Insignia, Seccion } from '../../ui/Insignia';
import { Campo } from '../../ui/Campo';
import { color, space } from '../../ui/tokens';
import { useApp } from '../../state/app';
import { useChain } from '../../state/chain';
import { useCobros } from '../../state/cobros';
import { useLearn } from '../../state/learn';
import { useToast } from '../../state/toast';
import { borrarTodo, setBiometria } from '../../core/wallet';
import { addrUrl } from '../../core/chain';
import { fmtFechaHora, shortAddr, unitsToUsd } from '../../core/format';
import { useFx } from '../../state/fx';

function Fila({
  icono,
  titulo,
  detalle,
  onPress,
  derecha,
  peligro,
  ultima,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle?: string;
  onPress?: () => void;
  derecha?: React.ReactNode;
  peligro?: boolean;
  ultima?: boolean;
}) {
  return (
    <Presionable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={titulo}
      style={[styles.fila, !ultima && styles.conBorde]}
    >
      <View style={[styles.icono, peligro && { backgroundColor: 'rgba(255,77,94,0.10)' }]}>{icono}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyStrong" color={peligro ? color.pecho : color.pluma}>
          {titulo}
        </T>
        {detalle ? <T v="small">{detalle}</T> : null}
      </View>
      {derecha ?? (onPress ? <ChevronRight size={17} color={color.plumaTenue} /> : null)}
    </Presionable>
  );
}

export default function Ajustes() {
  const router = useRouter();
  const avisar = useToast((s) => s.avisar);
  const { address, nombre, setNombre, bioActiva, setBioActiva, resetear } = useApp();
  const { txs, limpiar: limpiarChain } = useChain();
  const rate = useFx((s) => s.rate);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(0);

  const copiarDireccion = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    avisar('Dirección copiada', 'ok');
  };

  const exportarCsv = async () => {
    if (txs.length === 0) {
      avisar('Todavía no hay movimientos que exportar', 'info');
      return;
    }
    const filas = [
      'fecha,tipo,usd,quetzales_aprox,concepto,contraparte,hash',
      ...txs.map((t) => {
        const usd = unitsToUsd(BigInt(t.units));
        const gtq = (usd * (t.gtqRate ?? rate)).toFixed(2);
        return `${fmtFechaHora(t.ts)},${t.dir === 'in' ? 'recibido' : 'enviado'},${usd.toFixed(2)},${gtq},"${t.concepto ?? ''}",${t.otra},${t.hash}`;
      }),
    ].join('\n');
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(filas);
      avisar('CSV copiado al portapapeles', 'ok');
    } else {
      await Share.share({ message: filas, title: 'Movimientos Pluma (CSV)' });
    }
  };

  const alternarBio = async (v: boolean) => {
    if (v) {
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirmá que sos vos' });
      if (!res.success) return;
    }
    await setBiometria(v);
    setBioActiva(v);
  };

  const borrarWallet = async () => {
    if (confirmandoBorrado === 0) {
      setConfirmandoBorrado(1);
      avisar('¿Segurísimo? Sin tu frase en papel, tu dinero se pierde. Tocá otra vez para confirmar.', 'error');
      setTimeout(() => setConfirmandoBorrado(0), 6000);
      return;
    }
    await borrarTodo();
    limpiarChain();
    useCobros.getState().limpiar();
    useLearn.getState().limpiar();
    resetear();
    router.replace('/bienvenida');
  };

  return (
    <Pantalla pieEspacio={110}>
      <View style={styles.encabezado}>
        <T v="h1">Ajustes</T>
        <Insignia texto="Testnet" tinte={color.cacao} />
      </View>

      <Seccion titulo="Perfil" />
      <Glass style={{ padding: space.l, gap: space.l }}>
        <Campo
          etiqueta="Tu nombre (para el saludo)"
          valor={nombre}
          onCambio={setNombre}
          placeholder="¿Cómo te decimos?"
          autoCapitalizar="words"
        />
        <Presionable onPress={copiarDireccion} accessibilityRole="button" accessibilityLabel="Copiar dirección" style={styles.direccion}>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="eyebrow">Tu dirección · Red Base</T>
            <Mono size={14}>{shortAddr(address, 8)}</Mono>
          </View>
          <Copy size={17} color={color.plumaSuave} />
        </Presionable>
      </Glass>

      <View style={{ marginTop: space.xxl }}>
        <Seccion titulo="Seguridad" />
        <Glass style={{ paddingHorizontal: space.l }}>
          <Fila
            icono={<KeyRound size={19} color={color.pluma} strokeWidth={1.8} />}
            titulo="Ver mi frase semilla"
            detalle="Requiere PIN o biometría"
            onPress={() => router.push('/frase')}
          />
          <Fila
            icono={<Fingerprint size={19} color={color.pluma} strokeWidth={1.8} />}
            titulo="Biometría"
            detalle="Face ID / huella para confirmar"
            derecha={
              <Switch
                value={bioActiva}
                onValueChange={alternarBio}
                trackColor={{ true: color.jadeProfundo, false: color.musgo }}
                thumbColor={color.pluma}
              />
            }
            ultima
          />
        </Glass>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <Seccion titulo="Herramientas" />
        <Glass style={{ paddingHorizontal: space.l }}>
          <Fila
            icono={<Droplets size={19} color={color.pluma} strokeWidth={1.8} />}
            titulo="Fondear con dinero de prueba"
            detalle="Faucets de USDC y gas (testnet)"
            onPress={() => router.push('/fondear')}
          />
          <Fila
            icono={<FileSpreadsheet size={19} color={color.pluma} strokeWidth={1.8} />}
            titulo="Exportar movimientos (CSV)"
            detalle="Para tu contador o la SAT"
            onPress={exportarCsv}
          />
          <Fila
            icono={<ExternalLink size={19} color={color.pluma} strokeWidth={1.8} />}
            titulo="Ver mi cuenta en el explorador"
            detalle="Cada transacción es pública y verificable"
            onPress={() => address && Linking.openURL(addrUrl(address))}
            ultima
          />
        </Glass>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <Seccion titulo="Zona delicada" />
        <Glass style={{ paddingHorizontal: space.l, borderColor: 'rgba(255,77,94,0.25)' }}>
          <Fila
            peligro
            icono={<Trash2 size={19} color={color.pecho} strokeWidth={1.8} />}
            titulo={confirmandoBorrado ? 'Tocá otra vez para borrar TODO' : 'Borrar wallet de este teléfono'}
            detalle="Solo tu frase en papel podrá recuperar tu dinero"
            onPress={borrarWallet}
            ultima
          />
        </Glass>
      </View>

      <View style={{ marginTop: space.xxl, gap: 4, alignItems: 'center' }}>
        <T v="small">Pluma v1.0 · proyecto educativo universitario</T>
        <T v="small" centrado style={{ maxWidth: 300 }}>
          Corre en Base Sepolia (testnet): el dinero es de prueba. No es un servicio financiero.
        </T>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.l,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  conBorde: { borderBottomWidth: 1, borderBottomColor: color.borde },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,253,245,0.05)',
  },
  direccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.03)',
  },
});
