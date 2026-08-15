import 'react-native-get-random-values';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import type { Address } from 'viem';

/**
 * Manejo de secretos. La frase semilla vive SOLO en el enclave seguro del teléfono
 * (Keychain en iOS, Keystore en Android). En web (solo demo de desarrollo) se usa
 * localStorage con advertencia: la web no es un destino de producción de Pluma.
 */

const K_MNEMONIC = 'pluma.mnemonic';
const K_PIN = 'pluma.pin'; // formato: salt:hash
const K_BIO = 'pluma.bio';

const webStore = {
  get: (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  set: (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  del: (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStore.get(key);
  return SecureStore.getItemAsync(key);
}

async function delSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore.del(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ── Frase semilla ──────────────────────────────────────────────

export function crearFrase(): string {
  return generateMnemonic(english); // 12 palabras BIP-39
}

export function validarFrase(frase: string): boolean {
  const palabras = frase.trim().toLowerCase().split(/\s+/);
  if (palabras.length !== 12 && palabras.length !== 24) return false;
  if (!palabras.every((p) => english.includes(p))) return false;
  try {
    mnemonicToAccount(palabras.join(' '));
    return true;
  } catch {
    return false;
  }
}

export function direccionDeFrase(frase: string): Address {
  return mnemonicToAccount(frase.trim().toLowerCase()).address;
}

export async function guardarFrase(frase: string): Promise<void> {
  await setSecret(K_MNEMONIC, frase.trim().toLowerCase());
}

export async function leerFrase(): Promise<string | null> {
  return getSecret(K_MNEMONIC);
}

// ── PIN ────────────────────────────────────────────────────────

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}:pluma`);
}

export async function guardarPin(pin: string): Promise<void> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const salt = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hash = await hashPin(pin, salt);
  await setSecret(K_PIN, `${salt}:${hash}`);
}

export async function verificarPin(pin: string): Promise<boolean> {
  const stored = await getSecret(K_PIN);
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const test = await hashPin(pin, salt);
  return test === hash;
}

export async function hayPin(): Promise<boolean> {
  return (await getSecret(K_PIN)) != null;
}

// ── Biometría (preferencia) ───────────────────────────────────

export async function setBiometria(activa: boolean): Promise<void> {
  await setSecret(K_BIO, activa ? '1' : '0');
}

export async function getBiometria(): Promise<boolean> {
  return (await getSecret(K_BIO)) === '1';
}

// ── Borrado total ─────────────────────────────────────────────

export async function borrarTodo(): Promise<void> {
  await Promise.all([delSecret(K_MNEMONIC), delSecret(K_PIN), delSecret(K_BIO)]);
}
