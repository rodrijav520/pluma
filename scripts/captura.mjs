/**
 * Verificación visual: captura pantallas de Pluma (375×812 @2x) con Edge/Chrome
 * del sistema.
 *
 *   node scripts/captura.mjs <carpetaSalida> [ruta1 ruta2 …]
 *
 * Inicia sesión de verdad contra la API y guarda el token en el mismo lugar
 * donde lo guarda la app en web, para que las capturas muestren datos reales y
 * no un mock que puede mentir.
 *
 * Variables: PLUMA_BASE (app), PLUMA_API (backend), PLUMA_EMAIL, PLUMA_PASSWORD
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CANDIDATOS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
const exe = CANDIDATOS.find(existsSync);
if (!exe) {
  console.error('No se encontró Edge/Chrome.');
  process.exit(1);
}

const salida = process.argv[2] ?? 'shots';
mkdirSync(salida, { recursive: true });

const BASE = process.env.PLUMA_BASE ?? 'http://localhost:8081';
const API = process.env.PLUMA_API ?? 'http://localhost:5142';
const EMAIL = process.env.PLUMA_EMAIL ?? 'ana@demo.gt';
const PASSWORD = process.env.PLUMA_PASSWORD ?? 'Quetzal2026seguro';

const respuesta = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});

if (!respuesta.ok) {
  console.error(`No se pudo iniciar sesión (${respuesta.status}). ¿Está corriendo la API en ${API}?`);
  process.exit(1);
}

const login = await respuesta.json();
const SESION = JSON.stringify({
  token: login.token,
  usuarioId: login.usuarioId,
  nombreCompleto: login.nombreCompleto,
  rol: login.rol,
  venceEn: Date.now() + 55 * 60 * 1000,
});

// [nombre, ruta, conSesion]
const RUTAS_DEFECTO = [
  ['01-bienvenida', '/bienvenida', false],
  ['02-crear-cuenta', '/crear-cuenta', false],
  ['03-entrar', '/entrar', false],
  ['04-inicio', '/', true],
  ['05-cambiar', '/cambiar', true],
  ['06-comprar', '/comprar', true],
  ['07-enviar', '/enviar', true],
  ['08-recibir', '/recibir', true],
  ['09-actividad', '/actividad', true],
  ['10-aprender', '/aprender', true],
  ['11-ajustes', '/ajustes', true],
];

const soloRutas = process.argv.slice(3);
const rutas = soloRutas.length
  ? RUTAS_DEFECTO.filter(([n]) => soloRutas.some((s) => n.includes(s)))
  : RUTAS_DEFECTO;

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  // Edge/Chrome instalado por el sistema necesita un perfil propio y el sandbox
  // relajado para arrancar desde acá sin chocar con la sesión del usuario.
  userDataDir: join(process.env.TEMP ?? '.', 'pluma-captura-perfil'),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

// Primer load: compila el bundle si hace falta.
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 180_000 });

for (const [nombre, ruta, conSesion] of rutas) {
  await page.evaluate(
    (sesion, aplicar) => {
      localStorage.clear();
      if (aplicar) localStorage.setItem('pluma.sesion', sesion);
    },
    SESION,
    conSesion,
  );

  await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle2', timeout: 120_000 });
  // Fuentes + primer render + respuesta de saldo.
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: join(salida, `${nombre}.png`) });
  console.log(`✓ ${nombre}`);
}

await browser.close();
console.log(`Listo → ${salida}`);
