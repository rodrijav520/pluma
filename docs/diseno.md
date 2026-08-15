# Pluma — Sistema de diseño
Dirección de arte "**Bosque nuboso**": el hábitat del quetzal como material de interfaz. Dark-first, glass sutil, una firma memorable.

## 0. Registro y anti-genérico

- **Registro:** B2C con carácter — premium calmo, cercano en voseo chapín. Conversión = confianza (el usuario deja PayPal si *confía*).
- El look "negro + un acento verde ácido" es un default de IA. Pluma se separa con: fondo **verde-bosque atmosférico** (nunca negro neutro ni #000 puro), **dos temperaturas** de acento (jade + carmesí del pecho del quetzal), luz de dosel consistente desde arriba, y una firma orgánica (la pluma) en un mundo de fintech geométricas.
- Prohibido: secciones blancas apiladas, cards idénticas infinitas, un CTA por card, gradientes púrpura-rosa "AI", emojis como íconos.

## 1. Tokens

### Color (nombrados, con intención)
| Token | Hex | Rol |
|---|---|---|
| `noche` | `#0B1210` | Fondo base — verde-negro del bosque de noche (nunca #000: OLED smear) |
| `bruma` | `#121D18` | Superficie elevada 1 (cards sólidas) |
| `musgo` | `#1A2822` | Superficie 2 / bordes de campo |
| `niebla` | `rgba(236,253,245,0.06)` | Relleno glass |
| `jade` | `#2DE39B` | Primario — acción, saldo positivo, éxito |
| `jadeProfundo` | `#17B87C` | Presionado / gradiente base |
| `cielo` | `#3FA9F5` | Punta de la iridiscencia (nunca solo) |
| `pecho` | `#FF4D5E` | Carmesí del quetzal — peligro/alertas + micro-momentos de marca |
| `cacao` | `#E9BC5A` | Recompensas y progreso de Aprender (el cacao también fue moneda) |
| `pluma` | `#EAF6EF` | Texto primario (blanco-menta suave) |
| `plumaSuave` | `rgba(234,246,239,0.64)` | Texto secundario |
| `plumaTenue` | `rgba(234,246,239,0.40)` | Texto terciario / placeholders |
| `borde` | `rgba(234,246,239,0.08)` | Bordes glass |
| `bordeLuz` | `rgba(255,255,255,0.14)` | Borde superior de glass (luz de dosel) |

**Gradiente firma "iridiscencia"**: `jade → #27C9B8 → cielo` (el plumaje real del quetzal verde→teal→azul). Solo en: pluma SVG, FAB Cobrar, aro de progreso. Nunca en fondos completos.

**Luz ambiental**: 2 orbes radiales por pantalla máx — jade al 8% arriba-izquierda, cielo al 5% derecha-media; deriva lenta 14–18 s (se apaga con reduced motion).

### Contraste (verificado)
- `pluma` sobre `noche`: ~16:1 ✓ AAA · `plumaSuave` sobre `noche`: ~10:1 ✓ · `jade` sobre `noche`: ~10.5:1 ✓ · texto `noche` sobre botón `jade`: ~8.9:1 ✓ AAA · `pecho` sobre `noche`: ~5.5:1 ✓ AA · `cacao` sobre `noche`: ~9.8:1 ✓.

### Tipografía
| Rol | Fuente | Uso |
|---|---|---|
| Display / números héroe | **Space Grotesk 700** | Balance (40–44 pt, tracking -1), montos, títulos de pantalla |
| Subdisplay | Space Grotesk 500 | Títulos de card, botones (16–17 pt) |
| Cuerpo | **Inter 400/500** | 15–16 pt, line-height 1.5 |
| Etiqueta/eyebrow | Inter 600, 11 pt, +8% tracking, MAYÚSCULAS | "TIPO DE CAMBIO HOY", "COBRO PENDIENTE" |
| Datos | Space Grotesk con `tabular-nums` | Todo número alineable (montos, fechas, hash) |

### Espaciado, forma y elevación
- Grid 4 pt; padding de pantalla 20; gap de secciones 28; gap de items 12.
- Radios: glass cards 24 · elementos internos 16 · pills/botones 999 · sheets 28 arriba.
- Glass: fill `niebla` + borde 1 px `borde` + borde superior `bordeLuz` (luz siempre desde arriba = dosel del bosque) + blur 20 (BlurView; en iOS 26 Liquid Glass nativo vía expo-glass-effect; Android fallback fill `bruma` al 92%).
- Botón primario: alto 56, pill, fondo `jade`, texto `noche` (Space Grotesk 500), sombra jade 24% radio 20.
- Un primario + un secundario (outline `borde`) máximo por pantalla.

### Movimiento (tokens)
- Duraciones: `rapido` 180 ms · `base` 240 ms · `suave` 320 ms. Salidas ≈ 70% de entradas.
- Easing: `Bezier(0.16, 1, 0.3, 1)` (entradas), springs damping 20 / stiffness 90 (sheets).
- Press: scale 0.97 + haptic Light. Éxitos: haptic Success + pluma que se dibuja (600 ms, una vez).
- Stagger listas: 40 ms/item, máx 6 items.
- `useReducedMotion` → sin orbes, sin stagger, transiciones fade simples.

## 2. La firma: LA PLUMA

Una sola pieza memorable, usada con disciplina en 4 lugares (y en ninguno más):
1. **Balance héroe**: arco de pluma iridiscente barriendo detrás del monto (SVG, opacidad 35%).
2. **Progreso de Aprender**: la pluma se dibuja (stroke-dashoffset) a medida que completás lecciones — tu pluma "crece".
3. **Momento de éxito**: al confirmarse un cobro/envío, la pluma se traza y deriva hacia arriba una vez.
4. **Ícono de la app**: pluma-“P” sobre `noche` con punta `pecho` (como el ave real).

Narrativa: *las plumas de quetzal eran moneda maya; mandar tu link de cobro = "mandá tu pluma".* El copy y el objeto visual cuentan la misma historia.

## 3. Anatomías clave (wireframe)

```
INICIO                          COBRAR (sheet)                 APRENDER
┌──────────────────────┐        ┌──────────────────────┐       ┌──────────────────────┐
│ HOLA, ANDREA    [⚙]  │        │ ══ Cobrá con tu pluma│       │ TU PLUMA · nivel 2   │
│ TU PISTO             │        │  Q 3,800  ⇄  $500    │       │ (pluma 40% dibujada) │
│ Q 11,431.20     ~pluma~       │  [teclado numérico]  │       │ ┌─ Semilla ── ✓✓✓ ─┐ │
│ $ 1,480.53 USDC ≈    │        │  Concepto: Logo Kib' │       │ ├─ Milpa ─── ✓•• ─┤ │
│ TC HOY Q7.72 · 09:41 │        │  [ Generar cobro ]   │       │ ├─ Cosecha ─ ••• ─┤ │
│ (Cobrar)(Enviar)(Rec)│        ├──────────────────────┤       │ └─ Vuelo ─── 🔒 ──┘ │
│ COBROS PENDIENTES    │        │ ┌────── QR ───────┐  │       │ SIMULADOR DE AHORRO  │
│ [Q1,900 · web Kib']→ │        │ │  + dirección     │  │       │ "¿Cuánto perdés     │
│ MOVIMIENTOS          │        │ │  [WhatsApp ES/EN]│  │       │  al año?"           │
│ HOY                  │        │ └─────────────────┘  │       └──────────────────────┘
│ ↓ Cobro pagado +$500 │        └──────────────────────┘
│ ↑ Enviado    −$120   │
└──────────────────────┘
Tab bar: pill glass flotante · Inicio · Actividad · [● Cobrar] · Aprender · Ajustes
```

## 4. Nivel 2 — referencias: replica/adapta
(Detalle completo en [investigacion.md](investigacion.md) §7.1) — A: dark premium + balance héroe + tab flotante (adaptamos lime→jade). B: jerarquía Payvia y agrupación por día. C: tono lúdico SOLO en Aprender + banner de recompensa accionable. D: claridad de red y dirección copiable con advertencia.

## 5. Voz y copy
- Voseo chapín cálido y directo: "Tu pisto, tus llaves", "Mandá tu pluma", "¡Cayó tu cobro!", "Sin clavos: nadie más tiene tus llaves".
- Registro serio donde importa: seguridad, legal, errores (claros, con causa + salida, sin disculpas vacías).
- Bilingüe funcional: el texto que se comparte al cliente extranjero sale en inglés.
- Nunca "cripto-bro": no "to the moon", no jerga sin explicar; USDC se llama "dólares digitales" primero.

## 6. Estados obligatorios por pantalla
Carga (skeleton shimmer 1.4 s loop) · Vacío (ilustración + 1 acción: "Tu primer cobro te espera") · Error (causa + botón reintentar) · Offline (banner persistente "Sin conexión — mostrando lo último que vimos") · Éxito (pluma + haptic). Badge permanente "TESTNET" en Ajustes y Fondear (honestidad de demo).
