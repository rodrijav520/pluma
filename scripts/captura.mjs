/**
 * Verificación visual: captura pantallas de Pluma (web 375×812 @2x) con Edge/Chrome del sistema.
 * Uso: node scripts/captura.mjs <carpetaSalida> [ruta1 ruta2 …]
 * Si no se pasan rutas, captura el set completo con estado sembrado.
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
const ahora = Date.now();

// Estado sembrado: wallet demo (mnemonic público de pruebas de Hardhat) + datos de muestra.
const SEED = {
  'pluma.mnemonic': 'test test test test test test test test test test test junk',
  'pluma.app': JSON.stringify({
    state: {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      onboarded: true,
      pinSet: false,
      bioActiva: false,
      bloqueCreacion: null,
      nombre: 'Andrea',
    },
    version: 0,
  }),
  'pluma.chain': JSON.stringify({
    state: {
      usdc: '1480530000',
      gas: '12000000000000000',
      ultimoEscaneo: '99999999',
      actualizado: ahora - 60_000,
      txs: [
        {
          hash: '0xaaa1000000000000000000000000000000000000000000000000000000000001',
          dir: 'in',
          units: '500000000',
          otra: '0x7c3AED4f1b1a4b2E9d8C05521Cc5a1cF00De1234',
          ts: ahora - 2 * 3600_000,
          block: '99999000',
          status: 'ok',
          concepto: 'Diseño de marca — Kib Studio',
          gtqRate: 7.72,
        },
        {
          hash: '0xaaa1000000000000000000000000000000000000000000000000000000000002',
          dir: 'out',
          units: '120000000',
          otra: '0x1b9E55C2Ab0d8F3E44710a9cD3e11C0Fe0987654',
          ts: ahora - 26 * 3600_000,
          block: '99950000',
          status: 'ok',
          concepto: 'Ahorro en frío',
          gtqRate: 7.71,
        },
        {
          hash: '0xaaa1000000000000000000000000000000000000000000000000000000000003',
          dir: 'in',
          units: '980530000',
          otra: '0x9F00De11223344556677889900aAbBcCdDeEfF00',
          ts: ahora - 50 * 3600_000,
          block: '99900000',
          status: 'ok',
          concepto: 'Sprint agosto — Nimbus LLC',
          gtqRate: 7.7,
        },
      ],
    },
    version: 0,
  }),
  'pluma.cobros': JSON.stringify({
    state: {
      items: [
        {
          id: 'demo1',
          units: '190000000',
          concepto: 'Web Kib Studio — 50%',
          creadoEn: ahora - 3600_000,
          bloqueCreacion: '99999990',
          status: 'pendiente',
          gtqRateAlCrear: 7.72,
        },
      ],
    },
    version: 0,
  }),
  'pluma.learn': JSON.stringify({
    state: { completadas: { 'que-es-stablecoin': { aciertos: 3, total: 3, en: ahora - 86400000 } } },
    version: 0,
  }),
  'pluma.fx': JSON.stringify({
    state: { rate: 7.72, ts: ahora - 30 * 60_000, fuente: 'live' },
    version: 0,
  }),
};

const RUTAS_DEFECTO = [
  ['bienvenida', '/', false],
  ['home', '/', true],
  ['actividad', '/actividad', true],
  ['aprender', '/aprender', true],
  ['ajustes', '/ajustes', true],
  ['cobrar', '/cobrar', true],
  ['cobro-detalle', '/cobro/demo1', true],
  ['enviar', '/enviar', true],
  ['recibir', '/recibir', true],
  ['simulador', '/simulador', true],
  ['leccion', '/leccion/custodia', true],
  ['fondear', '/fondear', true],
];

const soloRutas = process.argv.slice(3);
const rutas = soloRutas.length
  ? RUTAS_DEFECTO.filter(([n]) => soloRutas.includes(n))
  : RUTAS_DEFECTO;

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

// Bloquea RPC/FX externos: la captura debe mostrar el estado sembrado, no la red real.
await page.setRequestInterception(true);
page.on('request', (req) => {
  const u = req.url();
  if (/sepolia|publicnode|drpc|er-api/.test(u)) req.abort().catch(() => {});
  else req.continue().catch(() => {});
});

// Primer load (compila el bundle si hace falta)
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 180_000 });

for (const [nombre, ruta, conSeed] of rutas) {
  await page.evaluate(
    (seed, aplicar) => {
      localStorage.clear();
      if (aplicar) for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
    },
    SEED,
    conSeed,
  );
  await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle2', timeout: 120_000 });
  await new Promise((r) => setTimeout(r, 2600)); // fuentes + intro + primer render
  await page.screenshot({ path: join(salida, `${nombre}.png`) });
  console.log(`✓ ${nombre}`);
}

await browser.close();
console.log(`Listo → ${salida}`);
