/**
 * Genera el ícono de Pluma (pluma de quetzal sobre noche) en todos los tamaños
 * y optimiza las ilustraciones de Higgsfield (2048 PNG → 1024 WebP).
 * Uso: node scripts/gen-assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const NOCHE = '#0B1210';

const feather = (stroke = 'url(#irid)', fill = 'url(#irid)', conPecho = true) => `
  <g transform="translate(512 512) scale(2.55) translate(-50 -150)">
    <path d="M50 14 C74 52 78 128 60 216 C56 236 52 252 50 262 C48 252 44 236 40 216 C22 128 26 52 50 14 Z"
      fill="${fill}" fill-opacity="0.9" stroke="${stroke}" stroke-width="2"/>
    <path d="M50 60 C60 56 66 52 72 44 M50 100 C62 96 68 92 73 84 M50 140 C61 138 67 134 71 126 M50 180 C59 178 64 175 67 168"
      stroke="${NOCHE}" stroke-opacity="0.55" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M50 62 C40 58 34 52 28 44 M50 102 C38 98 32 92 27 84 M50 142 C39 140 33 134 29 126 M50 182 C41 180 36 175 33 168"
      stroke="${NOCHE}" stroke-opacity="0.55" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M50 16 C55 78 46 160 50 234 C51 252 50 268 50 288" stroke="${stroke}" stroke-width="6"
      stroke-linecap="round" fill="none"/>
    ${conPecho ? '<path d="M50 276 C55 284 55 294 50 300 C45 294 45 284 50 276 Z" fill="#FF4D5E"/>' : ''}
  </g>`;

const defs = `
  <defs>
    <linearGradient id="irid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2DE39B"/>
      <stop offset="0.55" stop-color="#27C9B8"/>
      <stop offset="1" stop-color="#3FA9F5"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="22%" r="75%">
      <stop offset="0" stop-color="#2DE39B" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#2DE39B" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

const svgIcono = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  ${defs}
  <rect width="1024" height="1024" fill="${NOCHE}"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  ${feather()}
</svg>`;

const svgForeground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  ${defs}
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)">${feather()}</g>
</svg>`;

const svgBackground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  ${defs}
  <rect width="1024" height="1024" fill="${NOCHE}"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
</svg>`;

const svgMono = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)">${feather('#FFFFFF', '#FFFFFF', false)}</g>
</svg>`;

const svgSplash = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  ${defs}
  <g transform="translate(256 256) scale(0.5) translate(-512 -512)">${feather()}</g>
</svg>`;

const out = (name) => join('assets', 'images', name);
const png = (svg, size, dest) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(dest);

mkdirSync(join('assets', 'images'), { recursive: true });

await Promise.all([
  png(svgIcono, 1024, out('icon.png')),
  png(svgForeground, 1024, out('android-icon-foreground.png')),
  png(svgBackground, 1024, out('android-icon-background.png')),
  png(svgMono, 1024, out('android-icon-monochrome.png')),
  png(svgSplash, 512, out('splash-icon.png')),
  png(svgIcono, 48, out('favicon.png')),
]);

const ilus = ['hero-cobra', 'hero-llaves', 'hero-aprende', 'vacio-pluma'];
await Promise.all(
  ilus.map((n) =>
    sharp(join('assets', 'ilustraciones', `${n}.png`))
      .resize(1024, 1024)
      .webp({ quality: 82 })
      .toFile(join('assets', 'ilustraciones', `${n}.webp`)),
  ),
);

console.log('Assets generados: ícono + adaptive + splash + favicon + 4 ilustraciones webp');
