/**
 * E2E: flujo completo de creación de wallet (bienvenida → frase → quiz → PIN → Inicio).
 * Verifica generación BIP-39, validación del quiz, guardado de PIN y derivación de dirección.
 * Uso: PLUMA_BASE=http://localhost:8082 node scripts/e2e-crear.mjs <carpetaShots>
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CANDIDATOS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const exe = CANDIDATOS.find(existsSync);
const BASE = process.env.PLUMA_BASE ?? 'http://localhost:8082';
const salida = process.argv[2] ?? 'shots';
mkdirSync(salida, { recursive: true });

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const clickTexto = async (texto) => {
  const ok = await page.evaluate((t) => {
    const nodos = [...document.querySelectorAll('div,span,button')];
    const n = nodos.find((el) => el.textContent?.trim() === t && el.offsetParent);
    if (!n) return false;
    n.click();
    return true;
  }, texto);
  if (!ok) throw new Error(`No se encontró: "${texto}"`);
};

await page.goto(`${BASE}/crear/frase`, { waitUntil: 'networkidle2', timeout: 120_000 });
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}/crear/frase`, { waitUntil: 'networkidle2', timeout: 120_000 });
await esperar(2600);

// 1) Revelar y leer las 12 palabras
await page.evaluate(() => {
  const btn = document.querySelector('[aria-label="Mostrar frase"]');
  if (btn) btn.click();
});
await esperar(400);
const palabras = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('div')]
    .map((d) => d.textContent?.trim() ?? '')
    .filter((t) => /^\d{1,2}[a-z]+$/.test(t.replace(/\s/g, '')));
  // chips vienen como "1palabra" (número + palabra pegados en textContent)
  return chips.slice(0, 12).map((t) => t.replace(/^\d+\s*/, '').trim());
});
if (palabras.length !== 12) throw new Error(`Se esperaban 12 palabras, hay ${palabras.length}`);
console.log('✓ 12 palabras generadas');
await page.screenshot({ path: join(salida, 'e2e-frase.png') });

await clickTexto('Ya las guardé en papel');
await esperar(1200);

// 2) Quiz: elegir la palabra correcta según el índice pedido
const retos = await page.evaluate(() => {
  const labels = [...document.querySelectorAll('div')]
    .map((d) => d.textContent?.trim() ?? '')
    .filter((t) => /^Palabra #\d+$/.test(t));
  return [...new Set(labels)].map((l) => Number(l.replace('Palabra #', '')));
});
if (retos.length !== 2) throw new Error(`Se esperaban 2 retos, hay ${retos.length}`);
for (const idx of retos) {
  const correcta = palabras[idx - 1];
  await clickTexto(correcta);
  await esperar(250);
}
console.log('✓ Quiz respondido:', retos.map((i) => `#${i}`).join(', '));
await page.screenshot({ path: join(salida, 'e2e-verificar.png') });
await clickTexto('Confirmar');
await esperar(1200);

// 3) PIN: 6 dígitos dos veces
const marcarPin = async () => {
  for (const d of ['2', '0', '2', '6', '0', '7']) {
    await page.evaluate((dig) => {
      const el = [...document.querySelectorAll('[aria-label]')].find(
        (n) => n.getAttribute('aria-label') === dig && n.offsetParent,
      );
      el?.click();
    }, d);
    await esperar(140);
  }
};
await marcarPin();
await esperar(700);
await marcarPin();
await esperar(2500);
await page.screenshot({ path: join(salida, 'e2e-final.png') });

// 4) Verificación: ¿quedó wallet creada y derivada?
const estado = await page.evaluate(() => {
  const app = JSON.parse(localStorage.getItem('pluma.app') ?? '{}');
  return {
    address: app?.state?.address ?? null,
    onboarded: app?.state?.onboarded ?? false,
    pinSet: app?.state?.pinSet ?? false,
    mnemonicGuardada: !!localStorage.getItem('pluma.mnemonic'),
    url: location.pathname,
  };
});
console.log('Estado final:', JSON.stringify(estado));
if (!estado.address || !estado.onboarded || !estado.pinSet || !estado.mnemonicGuardada) {
  throw new Error('El flujo no terminó completo');
}
console.log(`✓ Wallet creada: ${estado.address}`);
await browser.close();
