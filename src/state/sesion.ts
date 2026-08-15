import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api, ErrorApi, type LoginResponse } from '../core/api';

/**
 * Sesión custodial. El JWT vive 60 minutos (Jwt:ExpiracionMinutos) y se guarda
 * en el almacén seguro del sistema — Keychain en iOS, Keystore en Android.
 *
 * expo-secure-store no existe en web, así que ahí se cae a localStorage. Es
 * menos seguro y por eso la web es solo para desarrollo, nunca para producción.
 */

const CLAVE = 'pluma.sesion';

type Guardado = {
  token: string;
  usuarioId: string;
  nombreCompleto: string;
  rol: string;
  /** epoch ms en que el token deja de servir. */
  venceEn: number;
};

const almacen = {
  async leer(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(CLAVE) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(CLAVE);
  },
  async escribir(valor: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(CLAVE, valor);
      } catch {
        /* almacenamiento no disponible */
      }
      return;
    }
    await SecureStore.setItemAsync(CLAVE, valor);
  },
  async borrar() {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(CLAVE);
      } catch {
        /* almacenamiento no disponible */
      }
      return;
    }
    await SecureStore.deleteItemAsync(CLAVE);
  },
};

/** El backend emite tokens de 60 min; se renueva con margen para no cortar una operación. */
const VIDA_TOKEN_MS = 60 * 60 * 1000;
const MARGEN_MS = 60 * 1000;

type EstadoSesion = {
  /** null = todavía no sabemos; se resuelve al restaurar. */
  usuario: Guardado | null;
  cargando: boolean;
  /** true cuando ya se intentó restaurar desde el almacén. */
  listo: boolean;
  error: string | null;

  restaurar: () => Promise<void>;
  registrar: (nombre: string, email: string, password: string) => Promise<{ gasPatrocinado: boolean }>;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
  limpiarError: () => void;
  /** Token vigente, o null si venció. Las pantallas nunca leen `usuario.token` directo. */
  tokenVigente: () => string | null;
};

function desdeLogin(r: LoginResponse): Guardado {
  return {
    token: r.token,
    usuarioId: r.usuarioId,
    nombreCompleto: r.nombreCompleto,
    rol: r.rol,
    venceEn: Date.now() + VIDA_TOKEN_MS,
  };
}

export const useSesion = create<EstadoSesion>((set, get) => ({
  usuario: null,
  cargando: false,
  listo: false,
  error: null,

  async restaurar() {
    try {
      const crudo = await almacen.leer();
      if (!crudo) return set({ listo: true });

      const guardado = JSON.parse(crudo) as Guardado;
      if (Date.now() >= guardado.venceEn - MARGEN_MS) {
        await almacen.borrar();
        return set({ usuario: null, listo: true });
      }
      set({ usuario: guardado, listo: true });
    } catch {
      await almacen.borrar();
      set({ usuario: null, listo: true });
    }
  },

  async registrar(nombre, email, password) {
    set({ cargando: true, error: null });
    try {
      const alta = await api.registro(nombre.trim(), email.trim(), password);
      // El registro no devuelve token: se inicia sesión enseguida con las mismas
      // credenciales para que el usuario no tenga que escribirlas dos veces.
      const login = await api.login(email.trim(), password);
      const guardado = desdeLogin(login);
      await almacen.escribir(JSON.stringify(guardado));
      set({ usuario: guardado, cargando: false });
      return { gasPatrocinado: alta.gasPatrocinado };
    } catch (e) {
      const mensaje = e instanceof ErrorApi ? e.message : 'No se pudo crear la cuenta.';
      set({ cargando: false, error: mensaje });
      throw e;
    }
  },

  async entrar(email, password) {
    set({ cargando: true, error: null });
    try {
      const login = await api.login(email.trim(), password);
      const guardado = desdeLogin(login);
      await almacen.escribir(JSON.stringify(guardado));
      set({ usuario: guardado, cargando: false });
    } catch (e) {
      const mensaje = e instanceof ErrorApi ? e.message : 'No se pudo iniciar sesión.';
      set({ cargando: false, error: mensaje });
      throw e;
    }
  },

  async salir() {
    await almacen.borrar();
    set({ usuario: null, error: null });
  },

  limpiarError() {
    set({ error: null });
  },

  tokenVigente() {
    const u = get().usuario;
    if (!u) return null;
    if (Date.now() >= u.venceEn - MARGEN_MS) return null;
    return u.token;
  },
}));
