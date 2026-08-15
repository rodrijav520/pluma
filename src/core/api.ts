import Constants from 'expo-constants';

/**
 * Cliente de la API CryptoExchangeGT (ASP.NET Core 8).
 *
 * Contrato: backend/src/CryptoExchangeGT.API/Controllers
 * Los errores llegan como ProblemDetails (RFC 7807).
 */

const PUERTO_API = 5142;

/**
 * En Expo Go la app corre en el teléfono, así que "localhost" es el teléfono,
 * no la PC. El host real se deduce del propio servidor de Expo: `hostUri` trae
 * la IP de LAN desde la que se cargó el bundle.
 */
function resolverBaseUrl(): string {
  const desdeEnv = process.env.EXPO_PUBLIC_API_URL;
  if (desdeEnv) return desdeEnv.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${PUERTO_API}`;

  return `http://localhost:${PUERTO_API}`;
}

export const BASE_URL = resolverBaseUrl();

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

/** ProblemDetails tal como lo emite el ManejadorGlobalDeExcepciones del backend. */
type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export class ErrorApi extends Error {
  readonly status: number;
  readonly detalle?: string;
  readonly traceId?: string;
  /** Errores de validación por campo, cuando ASP.NET devuelve ValidationProblemDetails. */
  readonly porCampo?: Record<string, string[]>;

  constructor(status: number, mensaje: string, extra?: Partial<ProblemDetails>) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.detalle = extra?.detail;
    this.traceId = extra?.traceId;
    this.porCampo = extra?.errors;
  }

  /** ¿Vale la pena que el usuario reintente tal cual? */
  get esReintentable() {
    return this.status === 409 || this.status === 503 || this.status === 0;
  }

  get esSesionVencida() {
    return this.status === 401;
  }
}

/**
 * Mensaje que ve el usuario. No pide disculpas y nunca es vago: dice qué pasó
 * y qué hacer. Si el backend mandó un detalle útil, ese gana.
 */
function mensajeDeUsuario(status: number, problema: ProblemDetails | null): string {
  const primerCampo = problema?.errors && Object.values(problema.errors)[0]?.[0];
  if (primerCampo) return primerCampo;
  if (problema?.detail) return problema.detail;

  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
    case 400:
      return 'Los datos no son válidos. Revisá lo que escribiste.';
    case 401:
      return 'Tu sesión venció. Volvé a iniciar sesión.';
    case 403:
      return 'Esta acción requiere permisos de administrador.';
    case 404:
      return 'No encontramos lo que buscabas.';
    case 409:
      return 'Otra operación tuya se estaba procesando al mismo tiempo. Intentá de nuevo.';
    case 429:
      return 'Demasiados intentos seguidos. Esperá un minuto antes de volver a intentar.';
    case 502:
      return 'La red blockchain rechazó la operación. Tu saldo no se movió.';
    case 503:
      return 'Un servicio externo no está disponible. Intentá en unos minutos.';
    default:
      return `Algo falló del lado del servidor (${status}).`;
  }
}

// ---------------------------------------------------------------------------
// Transporte
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 20000;

type Opciones = {
  metodo?: 'GET' | 'POST';
  cuerpo?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, token, signal } = opciones;

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => control.abort(), { once: true });

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo ? { 'Content-Type': 'application/json' } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch {
    throw new ErrorApi(0, mensajeDeUsuario(0, null));
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const problema = (datos ?? null) as ProblemDetails | null;
    throw new ErrorApi(respuesta.status, mensajeDeUsuario(respuesta.status, problema), problema ?? undefined);
  }

  return datos as T;
}

// ---------------------------------------------------------------------------
// Tipos del contrato — espejo de Application/DTOs
// ---------------------------------------------------------------------------

export type RegistroResponse = {
  usuarioId: string;
  email: string;
  walletDireccionPublica: string;
  /** false = la cuenta existe pero no puede operar hasta que se reintente el gas. */
  gasPatrocinado: boolean;
};

export type LoginResponse = {
  token: string;
  usuarioId: string;
  nombreCompleto: string;
  rol: string;
};

export type SaldoResponse = {
  saldoGTQ: number;
  saldoCripto: number;
  direccionWallet: string;
  equivalenteGTQ: number;
  tasaCambio: number;
  /** false = saldoCripto es el último valor cacheado, no el actual. Hay que avisarlo. */
  saldoCriptoEnLinea: boolean;
};

export type EstadoTx = 'Pendiente' | 'Confirmando' | 'Completada' | 'Fallida';

export type TransaccionResponse = {
  id: string;
  tipo: string;
  estado: EstadoTx;
  montoCripto: number;
  montoGTQ: number;
  tasaCambioUsada: number;
  direccionDestino: string | null;
  hashBlockchain: string | null;
  motivoFallo: string | null;
  fechaCreacion: string;
  fechaConfirmacion: string | null;
};

export type HistorialResponse = {
  transacciones: TransaccionResponse[];
  pagina: number;
  tamanioPagina: number;
  totalRegistros: number;
  totalPaginas: number;
};

export type ComprarResponse = {
  transaccionId: string;
  montoCriptoRecibido: number;
  tasaCambioUsada: number;
  hashBlockchain: string;
  /** Siempre "Confirmando". Nunca mostrar "listo" con esta respuesta. */
  estado: EstadoTx;
};

export type ConvertirResponse = {
  transaccionId: string;
  /** Todavía NO acreditado. Se acredita cuando el worker confirma on-chain. */
  montoGTQAAcreditar: number;
  tasaCambioUsada: number;
  hashBlockchain: string;
  estado: EstadoTx;
};

export type EnviarResponse = {
  transaccionId: string;
  hashBlockchain: string;
  estado: EstadoTx;
};

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const api = {
  registro: (nombreCompleto: string, email: string, password: string) =>
    pedir<RegistroResponse>('/api/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombreCompleto, email, password },
    }),

  login: (email: string, password: string) =>
    pedir<LoginResponse>('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    }),

  saldo: (token: string, signal?: AbortSignal) =>
    pedir<SaldoResponse>('/api/transacciones/saldo', { token, signal }),

  historial: (token: string, pagina = 1, tamanioPagina = 20, signal?: AbortSignal) =>
    pedir<HistorialResponse>(
      `/api/transacciones/historial?pagina=${pagina}&tamanioPagina=${tamanioPagina}`,
      { token, signal },
    ),

  comprar: (token: string, montoGTQ: number) =>
    pedir<ComprarResponse>('/api/transacciones/comprar', {
      metodo: 'POST',
      token,
      cuerpo: { montoGTQ },
    }),

  convertirAGtq: (token: string, montoCripto: number) =>
    pedir<ConvertirResponse>('/api/transacciones/convertir-a-gtq', {
      metodo: 'POST',
      token,
      cuerpo: { montoCripto },
    }),

  enviarExterno: (token: string, montoCripto: number, direccionDestino: string) =>
    pedir<EnviarResponse>('/api/transacciones/enviar-externo', {
      metodo: 'POST',
      token,
      cuerpo: { montoCripto, direccionDestino },
    }),

  salud: () => pedir<{ estado: string }>('/health'),
};
