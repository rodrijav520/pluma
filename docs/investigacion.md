# Investigación de mercado — Wallet cripto para Guatemala
**Proyecto:** Pluma (nombre de trabajo) · **Fecha:** 18 de julio de 2026 · **Curso:** Gestión de Proyectos de Ingeniería

---

## 1. Resumen ejecutivo

El dinero que cruza la frontera hacia Guatemala pierde entre **3% y 8%** en comisiones y tipo de cambio, y tarda hasta 5 días. El flujo es gigantesco y crece: **US$12,219 millones en remesas solo en el primer semestre de 2026** (+7% interanual), con proyección de cierre de **US$26,806 millones (~20% del PIB)**. Del otro lado, el freelancer guatemalteco que cobra en dólares paga entre 2% (Recurrente cripto) y ~8% (PayPal) por recibir su propio dinero.

La competencia local (OSMO, Lulubit) es **custodial y generalista**; la internacional (Binance P2P) es **intimidante para no-expertos**; las soluciones de remesas (Félix Pago) no atienden al freelancer. **Nadie en Guatemala combina: wallet no-custodial + enfoque freelancer + links de cobro + educación cripto en español chapín.** Ese es el hueco que Pluma ataca.

Regulatoriamente el momento es ideal para un proyecto académico: el **Decreto 15-2026** (publicado 17-jun-2026, vigente desde septiembre 2026) incorpora por primera vez a los Proveedores de Servicios de Activos Virtuales (PSAV) como personas obligadas, con reglamento pendiente — diseñar "compliance-first" hoy es una ventaja, no un parche.

---

## 2. El mercado

### 2.1 Remesas (contexto macro — mercado secundario / fase 2)

| Dato | Valor | Fuente |
|---|---|---|
| Remesas S1-2026 | **US$12,219 M** (récord, +7% = +US$851 M) | Banguat vía Publinews/Infobae |
| Proyección cierre 2026 | **US$26,806 M** (~Q205 mil millones, +5%) | Banguat |
| Peso en la economía | **~20% del PIB** (20.7% del ingreso adicional) | CIEN / Infobae |
| Hogares receptores | **~1.7 millones** | CIEN |
| Guatemaltecos en EE. UU. | **~3 millones** | Publinews |
| Crecimiento acumulado 2015→2026 | **+319%** (líder regional) | Infobae |

**Costo del canal tradicional:** transferencias bancarias US→GT cuestan $25–40 y tardan 1–5 días; los canales "sin comisión" esconden un margen cambiario de 2–5%. Un canal digital eficiente cuesta ~$3.50 por transacción → **hasta ~$300/año de ahorro** para quien envía $400/mes.

### 2.2 Freelancers (usuario primario)

- No existe un censo público confiable de freelancers guatemaltecos; el PNUD (Working Paper #54, 2025) documenta el crecimiento del **empleo en plataformas digitales en Guatemala** y su relación con la informalidad — nuestra encuesta primaria será el dato duro del Estudio de Mercado (ver `encuesta-freelancers.md`).
- Lo que sí está documentado es el **costo de cobrar**:

| Canal | Costo real para el freelancer GT | Tiempo |
|---|---|---|
| PayPal | 5.4% + fijo + conversión ~3-4% → **~8% total**, retiro complicado sin cuenta US | 1–3 días |
| Payoneer | 1% (USD) + **hasta 2–3% conversión** al retirar a banco GT | 1–2 días |
| Wire bancario | **$25–40 fijos** + margen cambiario 2–5% | 2–5 días |
| Recurrente (tarjeta) | 4.5% + fijo | 24 h a banco |
| Recurrente (USDT/USDC) | **2%** | minutos |
| Binance P2P | 0% comisión oficial, pero **spread P2P + riesgo de contraparte + UX experta** | minutos–horas |
| Stablecoin directa (USDC on-chain L2) | **< $0.01 de red** + off-ramp | **segundos–minutos** |

### 2.3 Adopción cripto en la región

- LatAm creció **63% interanual** en valor cripto recibido (Chainalysis 2025), una de las regiones de mayor crecimiento global.
- **Las stablecoins ya son >90% de la actividad cripto de la región** — la gente no especula, se protege y transfiere valor. Esto valida el enfoque 100% stablecoin (USDC) de Pluma.
- En Guatemala las criptos **no son moneda de curso legal ni están prohibidas**; los exchanges internacionales (Binance, OKX, Bybit…) operan sin restricción práctica.

---

## 3. Competencia

### 3.1 Tabla comparativa

| Jugador | Tipo | Custodia | Enfoque | Costo típico | Educación | Debilidad clave |
|---|---|---|---|---|---|---|
| **OSMO** (GT) | Wallet + cuenta global | **Custodial** (fondos 1:1 en bancos) | Generalista LATAM: tarjeta, BTC desde $1, GTQ/USD | Envíos entre usuarios gratis; spread en compra/venta; USDC **solo red Polygon** | Mínima | No es para cobrar a clientes; custodial; sin foco freelancer |
| **Lulubit** (PA/GT/CR) | Exchange app | **Custodial** | Inversión: 30+ criptos, cuenta remunerada 7% USDT | Depósitos/retiros GTQ gratis; fee de compra/venta variable "se muestra al confirmar" | Básica (blog) | Es un exchange, no una herramienta de cobro; rendimiento 7% implica riesgo de contraparte |
| **Félix Pago** | Remesas por WhatsApp | Custodial (rieles Bitso/Stellar/USDC) | Remesas US→MX/GT/HN; alianza con **Bantrab** | **$2.99 fijo** por envío | No | Solo remesas entrantes; el receptor no maneja dólares digitales |
| **Recurrente** (GT) | Pasarela de pagos | N/A (liquida a banco) | Negocios/freelancers formales | 4.5% tarjeta / **2% USDT-USDC** | Blog útil | No es wallet: el freelancer no guarda ni mueve USD; requiere formalización completa |
| **Binance P2P** | Exchange global | Custodial | Traders / usuarios avanzados | 0% oficial + spread P2P | Academia (genérica, no GT) | Intimidante; riesgo de contraparte P2P; congelamientos; sin GTQ nativo |
| **Coincaex** (GT) | Exchange local OTC | Custodial | Compra/venta BTC-USDT con GTQ | Spread OTC | No | Volumen/manual; sin producto freelancer |
| **Payoneer / PayPal** | Fintech tradicional | Custodial | Freelancer global | 1–3% / ~8% | No | Caros, lentos, sin GTQ mental model |
| **Bancos + remesadoras** | Tradicional | Custodial | Todo público | $25–40 + 2–5% FX | No | El status quo que todos padecen |

### 3.2 Lectura estratégica

1. **OSMO ya validó el mercado** (primera app guatemalteca para comprar Bitcoin, hoy "cuenta global para latinos" con tarjeta) — pero pivoteó a neobanco custodial generalista. Compite contra bancos, no contra la fricción del freelancer.
2. **Recurrente validó el "link de pago"** como patrón mental que el guatemalteco entiende, y su tarifa de 2% en USDT/USDC nos da el **precio a vencer**.
3. **Félix validó la stablecoin como riel invisible** ($2.99 flat, liquidación en segundos vía USDC/Stellar) — pero el usuario nunca toca los dólares digitales; pierde la opción de ahorrar en USD.
4. **Nadie educa.** La "academia" de Binance es genérica y en español neutro; OSMO y Lulubit tienen blogs de soporte. No existe educación cripto **en contexto guatemalteco** (SAT, FEL, bancos locales, estafas comunes locales).
5. **Nadie es no-custodial.** Todos los jugadores locales custodian fondos → dependés de que la empresa no quiebre, no congele, no desaparezca. El Decreto 15-2026 además les cae con todo el peso de "persona obligada"; una wallet no-custodial bien diseñada tiene una posición regulatoria más liviana (el usuario controla sus llaves) — aunque el off-ramp siempre requerirá aliados regulados.

**El hueco:** *wallet no-custodial, freelancer-first, con links de cobro, todo pensado en quetzales y con educación chapina integrada.*

---

## 4. Usuario

### 4.1 Primario: el freelancer guatemalteco (decisión del curso)

**Persona:** "Andrea, 26, diseñadora UX en Quetzaltenango. Cobra $600–1,500/mes de 2-3 clientes en EE. UU. y España vía Upwork/directo. Alfabetización digital alta, cripto-curiosa pero desconfiada ('¿y si me estafan?'). Su dolor: PayPal se come ~Q400 al mes, el banco le pide papeleo para recibir wires, y no sabe cuánto le llegará realmente por el tipo de cambio."

- **Sensibilidad:** velocidad, trazabilidad, y saber *exactamente* cuánto recibe en quetzales.
- **Dónde está:** Discord, LinkedIn, universidades, comunidades (Workana/Upwork GT).
- **Por qué primario:** 100% digital (sin red física de agentes), fácil de entrevistar para el Estudio de Mercado, ciclo de adopción corto.

### 4.2 Secundario (fase 2): receptor de remesas

Frecuencia mensual, alfabetización variable, sensible al monto en efectivo. Requiere red de retiro física (la parte con layout/capacidad/logística para el estudio técnico-industrial). Se menciona en evaluación de expansión, no diluye la encuesta.

---

## 5. Regulación (riesgo a declarar en el acta de constitución)

- **Decreto 15-2026** — *Ley Integral para la Prevención y Represión del Lavado de Dinero u Otros Activos y el Financiamiento del Terrorismo*: aprobado con 147 votos, **publicado en el Diario de Centro América el 17-jun-2026**, **vigencia 3 meses después (septiembre 2026)**, **reglamento en 6 meses**. Deroga los Decretos 67-2001 y 58-2005.
- Incorpora como **personas obligadas** a los **Proveedores de Servicios de Activos Virtuales (PSAV)**, además de notarios, inmobiliarias y profesionales jurídico-contables.
- **Implicación para Pluma:** las reglas finas de KYC/reporte **aún no están escritas** (reglamento pendiente) → riesgo declarado. Estrategia: (a) KYC/AML por diseño desde el día 1, (b) arquitectura no-custodial (el usuario firma sus transacciones; Pluma nunca toca fondos), (c) el off-ramp GTQ se hace vía **aliados ya regulados** (modelo OSMO: "opera a través de subsidiarias y aliados regulados en cada jurisdicción"), (d) trazabilidad exportable de cada transacción (CSV para SAT/contador).
- Contexto: cripto no es moneda de curso legal en Guatemala (Ley de Bancos no las contempla); Banguat/SIB han emitido advertencias informativas, sin prohibición.

---

## 6. Higgsfield — mejores prácticas (para los assets de diseño)

Hallazgos de documentación oficial y comunidad:

1. **Modelo insignia: Soul 2.0** — modelo de imagen "high-aesthetic", pensado para que el resultado se sienta "fotografiado, no generado". Ideal para heros/onboarding con look editorial.
2. **Presets > prompts complejos:** Higgsfield recomienda partir de sus +20 presets curados y dejar que Soul maneje el resto, en vez de sobre-promptear.
3. **Prompts ≤ 75 palabras**, estructurados: *sujeto → escenario → outfit/props → iluminación → sensación de lente → paleta → mood*. La comunidad usa fórmulas tipo MCSLA y el framework DISCIPLINE (hay hasta un skill de Claude en GitHub con 20 sub-skills para Higgsfield).
4. **Soul ID** para consistencia de personaje entre generaciones (mascota educativa): fotos de referencia variadas, bien iluminadas, al menos una de cuerpo completo.
5. **Nuestra aplicación:** pocos assets, alto impacto — ilustraciones de onboarding y educación en un solo estilo (paleta de marca en el prompt, iluminación direccional como palanca #1), mini-plan de costos antes de generar (ver plan, sección assets). Los íconos y elementos vectoriales del UI **no** se generan con IA: se construyen en SVG para nitidez y coherencia.

---

## 7. Diseño — referencias y tendencias

### 7.1 Análisis de las 4 referencias del cliente (qué se replica / qué se adapta)

| Referencia | Qué replicamos | Qué adaptamos/descartamos |
|---|---|---|
| **A. Wallet dark + verde neón (pixel NFTs)** | Dark-first premium; balance como héroe tipográfico; acento neón único de alto contraste; tab bar flotante | El lime ácido → verde jade quetzal; descartamos NFTs (fuera de alcance) |
| **B. Payvia (azul ultramar, globo 3D)** | Jerarquía impecable: saludo → balance → quick actions → contactos → transacciones agrupadas por día; onboarding con Login/Register claros | El azul corporativo y el look "banco global" → identidad guatemalteca propia |
| **C. "Meet your crypto wallet" (nubes/colinas)** | Tono amable y lúdico para educación; banner de recompensa accionable ("Activá X y ganás Y") | El estilo inflable/candy → nuestra iconografía de plumas; lo lúdico vive solo en Aprender |
| **D. Deposit screen USDT multi-red** | Claridad de red (badges TRC20/ETH…), dirección copiable en un tap, advertencia explícita "enviar otra red = pérdida" | Multi-red completa → MVP en una sola red (Base) con el patrón visual listo para escalar |

### 7.2 Tendencias 2026 relevantes (investigación propia)

- **Dark-first como flujo de trabajo profesional** (el tema oscuro se diseña primero; +80% de usuarios móviles mantienen dark mode activo).
- **Glassmorphism sutil**: capas translúcidas con profundidad real, sin blur pesado; **orbes de gradiente ambiental** flotando detrás del UI para dar vida al vidrio.
- **Acentos neón sobre mínimo oscuro** en fintech/cripto: contraste entre highlight vibrante y tipografía contenida.
- **iOS 26 Liquid Glass**: Apple normalizó el vidrio como material nativo (Expo ya lo expone via `expo-glass-effect`) → el glass design deja de ser tendencia web y se vuelve material de plataforma. Pluma lo usa nativo en iOS y lo emula con blur en Android/web.
- Patrones de wallets reales (Mobbin/UI8): onboarding de 3 pantallas con value props, fila de quick actions bajo el balance, historial agrupado por fecha, sheets modales para enviar/recibir.

---

## 8. Conclusiones → decisiones de producto

1. **Usuario primario freelancer**, remesas como fase 2 (confirma la sugerencia del curso).
2. **Stablecoin-first (USDC), una sola red L2 (Base)** — >90% de la actividad regional ya es stablecoin; multi-red es fase 2 con el patrón visual de la referencia D.
3. **El diferenciador es el combo**, no una feature: no-custodial + link de cobro estilo Recurrente + todo en mentalidad GTQ + **Escuela Cripto chapina** (nadie educa en contexto local).
4. **Precio a vencer: 2%** (Recurrente USDT). Meta de take rate < 1% construida desde el costo de red (< $0.01 en Base) en el Estudio Financiero.
5. **Compliance-first** ante el Decreto 15-2026: no-custodial + off-ramp con aliados regulados + trazabilidad exportable.
6. **Diseño dark-first con glass sutil e identidad quetzal** (jade + iridiscencia), assets Higgsfield puntuales con presets Soul y prompts ≤75 palabras.

---

## 9. Fuentes

**Mercado y remesas**
- [Publinews — Remesas rompen récord en el primer semestre](https://www.publinews.gt/noticias/2026/07/08/remesas-rompen-record-en-guatemala-durante-el-primer-semestre/)
- [Infobae — Las remesas a Guatemala crecen un 7% en el primer semestre de 2026](https://www.infobae.com/america/agencias/2026/07/07/las-remesas-a-guatemala-crecen-un-7-en-el-primer-semestre-de-2026/)
- [Infobae — Guatemala lidera el crecimiento regional de remesas (+319% desde 2015)](https://www.infobae.com/guatemala/2026/07/09/guatemala-lidera-el-crecimiento-regional-de-remesas-con-un-alza-acumulada-de-319-desde-2015/)
- [CIEN — Remesas récord: éxito aparente, fragilidad real](https://cien.org.gt/index.php/remesas-record-exito-aparente-fragilidad-real/)
- [IberoNews — Remesas superan los US$12 mil millones en seis meses](https://iberonewsla.com/remesas-guatemala-inversion-productiva-primer-semestre-2026/)
- [Chainalysis — 2025 LATAM Crypto Adoption](https://www.chainalysis.com/blog/latin-america-crypto-adoption-2025/)
- [Chainalysis — 2025 Global Adoption Index](https://www.chainalysis.com/blog/2025-global-crypto-adoption-index/)
- [PNUD — Empleo en plataformas digitales: caso Guatemala (WP #54)](https://www.undp.org/sites/g/files/zskgke326/files/2025-12/undplac-wp54_caso-guatemala.pdf)

**Competencia**
- [OSMO — sitio oficial](https://www.osmowallet.com/) · [OSMO — USDC en OSMO](https://ayuda.osmowallet.com/es/articles/9949087-usdc-en-osmo) · [OSMO — cómo usar en Guatemala](https://ayuda.osmowallet.com/es/articles/8098383-como-usar-osmo-que-puedo-hacer-guatemala)
- [LatamFintech — Osmo aterriza en Costa Rica](https://www.latamfintech.co/articles/osmo-fintech-guatemalteca-de-transferencias-con-criptos-aterriza-en-costa-rica-para-mejorar-los-servicios-financieros-en-el-pais)
- [Guatemala.com — Osmo, la primera app para comprar Bitcoin hecha en Guatemala](https://www.guatemala.com/noticias/sociedad/osmo-primera-app-comprar-bitcoin-hecha-guatemala.html)
- [Lulubit — sitio oficial](https://www.lulubit.app/) · [Lulubit — costos y comisiones](https://ayuda.lulubit.app/es/articles/6871874-costos-y-comisiones-de-lulubit)
- [LatamFintech — Lulubit lanza cuenta remunerada en Panamá y Guatemala](https://www.latamfintech.co/articles/lulubit-la-app-de-criptomonedas-lanzo-una-cuenta-remunerada-y-virtual-para-potenciar-las-finanzas-de-sus-usuarios-en-panama-y-guatemala)
- [Félix — Send money to Guatemala via WhatsApp](https://www.felixpago.com/en/send-money/guatemala) · [Stellar — caso Félix + Bitso](https://stellar.org/case-studies/felix-bitso) · [Global66 — Félix Pago: qué es y cómo funciona](https://www.global66.com/blog/felixpago/)
- [NewsInAmerica — Bantrab y Félix Pago lanzan remesas por WhatsApp](https://newsinamerica.com/pdcc/noticias/gerenciales/2025/bantrab-y-felix-pago-lanzan-una-nueva-forma-de-enviar-remesas-desde-whatsapp-en-segundos/)
- [Recurrente — recibir pagos con dólares digitales (USDC/USDT)](https://ayuda.recurrente.com/es/articles/12662529-recibir-pagos-con-dolares-digitales-usdc-y-usdt) · [Recurrente — guía de pagos para freelancers](https://www.recurrente.com/blog/pagos-freelancers-guatemala)
- [ComparaLatam — Payoneer Guatemala: opiniones y comisiones](https://comparalatam.com/gt/transferencia/payoneer.html) · [ComparaLatam — exchanges crypto Guatemala 2026](https://comparalatam.com/gt/crypto/)
- [P2P Army — tasas USDT/GTQ en Binance P2P](https://p2p.army/es-mx/p2p/prices/binance?fiatUnit=GTQ) · [Coincaex](https://coincaex.com/)
- [Deel — mejores métodos de pago para freelancers 2026](https://www.deel.com/es/blog/mejores-metodos-de-pago-a-freelancers/)

**Regulación**
- [Congreso — Nueva ley "antilavado" unifica marco jurídico](https://www.congreso.gob.gt/noticias_congreso/16188/2026/4)
- [Prensa Libre — Nueva ley antilavado amplía controles a criptomonedas](https://www.prensalibre.com/economia/nueva-ley-antilavado-amplia-controles-a-criptomonedas-profesionales-inmobiliarias-y-empresas/)
- [La Hora — plazos de vigencia y reglamento](https://lahora.gt/lh-economia/esmith/2026/06/09/ley-antilavado-en-guatemala-reglamento-debe-estar-listo-en-seis-meses/) · [La Hora — oficialización en el Diario de Centro América](https://lahora.gt/nacionales/ralvarado/2026/06/17/oficializan-en-el-diario-oficial-el-decreto-15-2026-ley-contra-el-lavado-de-dinero-y-terrorismo-now/)
- [LexLatin — qué cambia para empresas y entidades financieras](https://lexlatin.com/reportajes/ley-antilavado-guatemala-2026-cambios-empresas-entidades-financieras)
- [BLP Legal — análisis del Decreto 15-2026](https://blplegal.com/es/guatemala-nueva-ley-integral-contra-el-lavado-de-dinero-y-financiamiento-del-terrorismo/)

**Higgsfield y diseño**
- [Higgsfield — Soul 2.0](https://higgsfield.ai/soul-intro) · [Higgsfield — Soul ID: character consistency](https://higgsfield.ai/blog/Soul-ID-AI-Character-Consistency)
- [GitHub — higgsfield-ai-prompt-skill (MCSLA, DISCIPLINE, 20 sub-skills)](https://github.com/OSideMedia/higgsfield-ai-prompt-skill)
- [Chase Jarvis — How to use Higgsfield Soul for creative pros](https://chasejarvis.com/blog/higgsfield-soul/)
- [Medium — Dark Glassmorphism: the aesthetic that will define UI in 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Lucky Graphics — UI Design Trends 2026](https://lucky.graphics/learn/ui-design-trends-2026/) · [Outcrowd — Fintech Design Trends 2026](https://www.outcrowd.io/blog/fintech-design-trends-2026)
