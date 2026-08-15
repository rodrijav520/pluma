/**
 * Escuela Cripto de Pluma — micro-lecciones de ~1 minuto en contexto guatemalteco.
 * Educación = adquisición: la barrera #1 de adopción es la confianza (investigación §8).
 * Disclaimer general: contenido educativo, no es asesoría financiera ni fiscal.
 */

export type Leccion = {
  id: string;
  nivel: 1 | 2 | 3 | 4;
  titulo: string;
  resumen: string;
  cartas: string[];
  quiz: { pregunta: string; opciones: string[]; correcta: number; porQue: string }[];
};

export const NIVELES: Record<number, { nombre: string; lema: string }> = {
  1: { nombre: 'Semilla', lema: 'Lo básico, sin humo' },
  2: { nombre: 'Milpa', lema: 'Cuidá lo tuyo' },
  3: { nombre: 'Cosecha', lema: 'Cobrá y convertí' },
  4: { nombre: 'Vuelo', lema: 'Jugá en serio' },
};

export const LECCIONES: Leccion[] = [
  // ── NIVEL 1 · SEMILLA ─────────────────────────────────────
  {
    id: 'que-es-stablecoin',
    nivel: 1,
    titulo: '¿Qué es una stablecoin?',
    resumen: 'El dólar digital que no sube ni baja como Bitcoin.',
    cartas: [
      'Una stablecoin es un dólar en versión digital: 1 USDC vale $1, hoy, mañana y el otro año. No es para "invertir y hacerse rico" — es para mover y guardar valor sin sustos.',
      'Detrás de cada USDC hay un dólar real (o su equivalente) guardado en reservas auditadas por la empresa Circle. Por eso no "sube ni baja": es un recibo digital de un dólar.',
      'En Latinoamérica, más del 90% del movimiento cripto ya es en stablecoins. La gente no está especulando: está protegiendo su pisto y mandándolo más barato.',
      'En Pluma solo usamos USDC. Nada de monedas raras, nada de apuestas. Dólares digitales, punto.',
    ],
    quiz: [
      {
        pregunta: 'Si hoy tenés 100 USDC, ¿cuánto valen mañana?',
        opciones: ['Depende del mercado cripto', 'Unos $100, esa es la gracia', 'Nada, se vencen'],
        correcta: 1,
        porQue: 'USDC está diseñada para valer siempre $1: es un dólar digital, no una apuesta.',
      },
      {
        pregunta: '¿Para qué sirve mejor una stablecoin?',
        opciones: ['Volverse millonario rápido', 'Mover y guardar dólares sin volatilidad', 'Minar con la compu'],
        correcta: 1,
        porQue: 'Su función es ser estable: mover valor y ahorrar en dólares, no especular.',
      },
      {
        pregunta: '¿Qué respalda a USDC?',
        opciones: ['Nada, pura fe', 'Reservas de dólares auditadas', 'El gobierno de Guatemala'],
        correcta: 1,
        porQue: 'Circle publica auditorías de las reservas que respaldan cada USDC emitido.',
      },
    ],
  },
  {
    id: 'por-que-no-bitcoin',
    nivel: 1,
    titulo: '¿Y por qué no cobrar en Bitcoin?',
    resumen: 'Bitcoin es ahorro voluntario; tu factura no debería ser una apuesta.',
    cartas: [
      'Bitcoin puede subir 10% en una semana… o bajar 15%. Si cobrás tu factura de Q4,000 en Bitcoin, tu factura ahora es un boleto de lotería.',
      'Para cobrar tu trabajo lo que querés es certeza: facturaste $500, te llegan $500. Eso es exactamente lo que hace una stablecoin.',
      'Ojo: Bitcoin no es "malo". Como ahorro voluntario de largo plazo es otra conversación. Pero el dinero de tu renta y tus frijoles no se apuesta.',
      'Regla de Pluma: cobrás en USDC. Lo que hagás después con tus dólares, ya con vos.',
    ],
    quiz: [
      {
        pregunta: 'Facturaste $500. ¿En qué te conviene recibirlos?',
        opciones: ['Bitcoin, de repente sube', 'USDC: $500 son $500', 'La mitad y la mitad, a lo loco'],
        correcta: 1,
        porQue: 'El dinero operativo (renta, comida, ahorro de corto plazo) necesita valor estable.',
      },
      {
        pregunta: '¿Cuál es el riesgo de cobrar el sueldo en Bitcoin?',
        opciones: ['Ninguno', 'La volatilidad: puede valer menos cuando lo necesités', 'Que es ilegal en Guatemala'],
        correcta: 1,
        porQue: 'Bitcoin es volátil por diseño; no es ilegal en Guatemala, pero sí impredecible a corto plazo.',
      },
    ],
  },
  {
    id: 'custodia',
    nivel: 1,
    titulo: 'Tus llaves, tu pisto',
    resumen: 'La diferencia entre tener dinero y que alguien te lo guarde.',
    cartas: [
      'Cuando tu dinero está en un banco o en una app custodial (OSMO, Binance, PayPal…), técnicamente lo tiene la empresa y vos tenés una promesa.',
      'Si la empresa quiebra, congela cuentas o desaparece, tu saldo se va con ella. Ha pasado — hasta con gigantes como FTX en 2022.',
      'Pluma es no-custodial: las llaves de tu dinero viven cifradas en TU teléfono. Nosotros no podemos tocarlo, congelarlo ni perderlo. Ni aunque quisiéramos.',
      'El quetzal no vive en jaula. Tu pisto tampoco. Esa es la diferencia de fondo entre Pluma y todo lo demás que hay en Guate.',
    ],
    quiz: [
      {
        pregunta: '"No-custodial" significa que…',
        opciones: ['Nadie cuida nada, sálvese quien pueda', 'Las llaves del dinero las tenés VOS, no la empresa', 'No hay comisiones'],
        correcta: 1,
        porQue: 'Custodia = quién controla las llaves. En Pluma, solo vos.',
      },
      {
        pregunta: 'Si Pluma desapareciera mañana, ¿qué pasa con tus USDC?',
        opciones: ['Se pierden', 'Siguen siendo tuyos: con tu frase los recuperás en cualquier wallet', 'Los hereda el banco'],
        correcta: 1,
        porQue: 'Tus fondos viven en la blockchain, no en nuestros servidores. Tu frase semilla los recupera donde sea.',
      },
      {
        pregunta: '¿Qué pasó con FTX en 2022?',
        opciones: ['Nada, sigue operando igual', 'Era custodial, quebró y la gente perdió su dinero', 'Se volvió banco'],
        correcta: 1,
        porQue: 'FTX custodiaba los fondos de sus usuarios. Cuando colapsó, los saldos quedaron atrapados.',
      },
    ],
  },

  // ── NIVEL 2 · MILPA ───────────────────────────────────────
  {
    id: 'frase-semilla',
    nivel: 2,
    titulo: 'Las 12 palabras sagradas',
    resumen: 'Tu frase semilla ES tu cuenta. Perderla es perder todo.',
    cartas: [
      'Tu frase semilla son 12 palabras en orden. De ellas se derivan matemáticamente tus llaves. Quien tenga esas palabras, tiene tu dinero. Punto.',
      'Escribilas en papel (sí, papel) y guardalas donde guardarías Q10,000 en efectivo. Nada de screenshots, nada de WhatsApp, nada de notas en el teléfono.',
      'NADIE legítimo te va a pedir tu frase jamás: ni Pluma, ni "soporte técnico", ni un asesor. El que te la pida, te está robando. Cortá ahí.',
      'Si cambiás de teléfono o lo perdés: instalás Pluma (o cualquier wallet), escribís tus 12 palabras, y tu pisto aparece. Esa es la magia — y la responsabilidad.',
    ],
    quiz: [
      {
        pregunta: '¿Dónde guardás tu frase semilla?',
        opciones: ['Screenshot en el celular', 'En papel, en un lugar seguro', 'Se la mando a mi cuate por si acaso'],
        correcta: 1,
        porQue: 'Todo lo digital puede hackearse o filtrarse. Papel + lugar seguro es el estándar.',
      },
      {
        pregunta: 'Te escribe "Soporte Pluma" pidiendo tus 12 palabras para "verificar tu cuenta"…',
        opciones: ['Se las doy, es soporte oficial', 'Es estafa segura: nadie legítimo las pide', 'Le doy solo 6'],
        correcta: 1,
        porQue: 'Regla de oro sin excepciones: quien pide tu frase, te está robando.',
      },
      {
        pregunta: 'Perdiste el teléfono. ¿Y tus USDC?',
        opciones: ['Se perdieron con el teléfono', 'Con mi frase los recupero en otro dispositivo', 'Llamo al banco'],
        correcta: 1,
        porQue: 'El dinero vive en la blockchain; la frase es la llave para volverlo a abrir donde sea.',
      },
    ],
  },
  {
    id: 'redes-y-comisiones',
    nivel: 2,
    titulo: 'Redes: el DPI de tu dinero',
    resumen: 'USDC viaja por varias redes. Confundirlas cuesta caro.',
    cartas: [
      'USDC existe en varias redes (Ethereum, Base, Polygon, Solana…). Pensalo como carreteras distintas: mismo carro, distinta ruta y distinto peaje.',
      'Pluma usa Base: una red rápida y baratísima (mandar USDC cuesta menos de $0.01, contra $25–40 de un wire bancario).',
      'La regla vital: enviá siempre por la MISMA red que espera quien recibe. Si mandás por la red equivocada, el dinero se puede perder sin vuelta atrás.',
      'Por eso en Pluma la red se muestra clarito en cada dirección y cada QR. Si algo no cuadra, la app te frena antes de que la regués.',
    ],
    quiz: [
      {
        pregunta: '¿Qué red usa Pluma y por qué?',
        opciones: ['La más famosa', 'Base: rápida y con comisiones de centavos', 'Ninguna, es magia'],
        correcta: 1,
        porQue: 'Base (L2 de Coinbase) procesa transferencias de USDC en segundos por menos de un centavo.',
      },
      {
        pregunta: 'Tu cliente te va a pagar USDC. ¿Qué le confirmás SIEMPRE?',
        opciones: ['Su signo zodiacal', 'La red por la que va a enviar', 'Nada, todas funcionan igual'],
        correcta: 1,
        porQue: 'Red equivocada = riesgo de pérdida total. Confirmar la red es el hábito #1.',
      },
    ],
  },
  {
    id: 'enviar-recibir',
    nivel: 2,
    titulo: 'Enviar y recibir sin miedo',
    resumen: 'Direcciones, QRs y el hábito de verificar.',
    cartas: [
      'Tu dirección (0x…) es como tu número de cuenta: podés compartirla sin miedo. Lo secreto es tu frase, nunca tu dirección.',
      'Al enviar, verificá los primeros 6 y últimos 4 caracteres de la dirección destino. Hay virus que cambian direcciones copiadas — el QR es más seguro que copiar y pegar.',
      'Las transacciones en blockchain no tienen "cancelar". Antes de confirmar, Pluma te muestra todo clarito; después de confirmar, ya viajó.',
      'Primera vez con alguien nuevo? Mandá $1 de prueba. Cuando confirme que llegó, mandás el resto. Costumbre de pro.',
    ],
    quiz: [
      {
        pregunta: '¿Qué SÍ podés compartir tranquilo?',
        opciones: ['Tu frase de 12 palabras', 'Tu dirección pública (0x…)', 'Tu PIN'],
        correcta: 1,
        porQue: 'La dirección es pública por diseño, como tu número de cuenta. Frase y PIN, jamás.',
      },
      {
        pregunta: 'Vas a mandar $800 a una dirección nueva. ¿Movida inteligente?',
        opciones: ['Mandar todo de un solo', 'Enviar $1 de prueba primero', 'Escribir la dirección a mano'],
        correcta: 1,
        porQue: 'La transferencia de prueba cuesta centavos y elimina el riesgo de dirección equivocada.',
      },
    ],
  },

  // ── NIVEL 3 · COSECHA ─────────────────────────────────────
  {
    id: 'de-usdc-a-quetzales',
    nivel: 3,
    titulo: 'De USDC a quetzales',
    resumen: 'Las rutas para aterrizar tus dólares digitales en Guate.',
    cartas: [
      'Tener dólares digitales está bueno… hasta que hay que pagar la renta en quetzales. Estas son las rutas reales hoy:',
      'Ruta 1 — Apps locales (OSMO, Lulubit): depositás USDC (¡verificá la red que aceptan!), vendés, y retirás quetzales a tu banco. Cobran spread/comisión: compará siempre.',
      'Ruta 2 — Exchange local OTC (Coincaex): para montos más grandes, tratás directo con una empresa guatemalteca. Ruta 3 — P2P (Binance): mejor tasa posible, pero es para usuarios avanzados: hay riesgo de contraparte.',
      'Estrategia Pluma: mantené en USDC lo que podás (tu colchón en dólares) y convertí a GTQ solo lo del mes. Así el tipo de cambio juega a tu favor, no en contra.',
    ],
    quiz: [
      {
        pregunta: '¿Cuál es la estrategia inteligente de conversión?',
        opciones: ['Convertir todo a GTQ de inmediato', 'Convertir solo lo que necesitás y ahorrar en USD', 'Nunca convertir nada'],
        correcta: 1,
        porQue: 'Mantener ahorro en dólares digitales te protege y reduce comisiones de ida y vuelta.',
      },
      {
        pregunta: 'El P2P de Binance da buena tasa, pero…',
        opciones: ['Es ilegal', 'Tiene riesgo de contraparte: es para avanzados', 'Solo funciona de noche'],
        correcta: 1,
        porQue: 'En P2P tratás con desconocidos; con reputación y escrow ayuda, pero exige colmillo.',
      },
    ],
  },
  {
    id: 'cobrar-al-extranjero',
    nivel: 3,
    titulo: 'Cobrale al mundo con un link',
    resumen: 'Tu pluma: la factura que se paga en minutos.',
    cartas: [
      'El flujo Pluma: creás un cobro (monto + concepto), te genera un QR y un link, se lo mandás a tu cliente por WhatsApp o correo — en inglés si querés — y listo.',
      'Tu cliente paga desde CUALQUIER wallet del mundo (Coinbase, MetaMask, otra Pluma…). No necesita cuenta en Guatemala ni saber qué es un quetzal.',
      'Comparación honesta del costo de recibir $500: PayPal ~Q300 · wire bancario ~Q230 + días de espera · Pluma: centavos de red. Hacé la cuenta al año.',
      'Profesionalismo: poné concepto claro en cada cobro ("Diseño de marca — 50% anticipo"). Tu historial queda ordenado y exportable para tu contador.',
    ],
    quiz: [
      {
        pregunta: '¿Qué necesita tu cliente gringo para pagarte por Pluma?',
        opciones: ['Cuenta en un banco de Guatemala', 'Cualquier wallet con USDC — nada más', 'Hablar español'],
        correcta: 1,
        porQue: 'El link/QR funciona con cualquier wallet estándar del mundo. Cero fricción para el que paga.',
      },
      {
        pregunta: 'Recibir $500, ¿dónde duele menos?',
        opciones: ['PayPal (~8%)', 'Wire bancario ($25–40 + días)', 'USDC directo (centavos, minutos)'],
        correcta: 2,
        porQue: 'La transferencia on-chain en Base cuesta menos de $0.01 y llega en segundos.',
      },
    ],
  },
  {
    id: 'estafas',
    nivel: 3,
    titulo: 'Olé las estafas a leguas',
    resumen: 'Los cuentos clásicos y cómo cortarlos de un solo.',
    cartas: [
      '"Invertí conmigo, te doy 10% al mes garantizado" — NO EXISTE. Rendimiento garantizado alto = pirámide. Así cayeron miles en Guate con esquemas tipo Forex/cripto.',
      '"Soy de soporte, dame tu frase/instalá esta app para ayudarte" — soporte real NUNCA pide frases ni control remoto de tu teléfono.',
      'Links parecidos (plurna.app, 0smo…) que imitan apps reales para robarte: entrá siempre desde la app oficial, no desde links de mensajes.',
      'El amor por WhatsApp que a las 2 semanas te enseña "su plataforma de inversión": es el cuento del pig butchering. Cortá y reportá.',
      'Regla madre: si te apuran, si suena demasiado bueno, o si piden tu frase — es estafa. Las tres, sin excepción.',
    ],
    quiz: [
      {
        pregunta: '"Te garantizo 10% mensual con cripto"…',
        opciones: ['Suena razonable', 'Pirámide/estafa: el rendimiento garantizado no existe', 'Solo si es mi primo'],
        correcta: 1,
        porQue: 'Nadie puede garantizar rendimientos altos. Es la bandera roja #1 universal.',
      },
      {
        pregunta: '¿Cuál de estas es SIEMPRE estafa?',
        opciones: ['Pedirte tu dirección pública', 'Pedirte tu frase semilla', 'Pedirte una factura'],
        correcta: 1,
        porQue: 'La frase da control total de tu dinero. Nadie legítimo la necesita.',
      },
      {
        pregunta: 'Un "match" que conocés hace 2 semanas te invita a su plataforma de inversión…',
        opciones: ['Qué romántico', 'Pig butchering: cortar y reportar', 'Invierto poquito para probar'],
        correcta: 1,
        porQue: 'Es el guion exacto de la estafa romántica-financiera más común del mundo ahora mismo.',
      },
    ],
  },

  // ── NIVEL 4 · VUELO ───────────────────────────────────────
  {
    id: 'regulacion-gt',
    nivel: 4,
    titulo: 'La ley y tu pisto digital',
    resumen: 'Qué dice Guatemala sobre cripto (y qué viene con el Decreto 15-2026).',
    cartas: [
      'En Guatemala las criptos NO son moneda de curso legal (solo el quetzal lo es), pero tampoco son ilegales: usarlas, tenerlas y aceptarlas es lícito.',
      'Lo nuevo: el Decreto 15-2026 (ley antilavado, vigente desde septiembre 2026) mete a los Proveedores de Servicios de Activos Virtuales como "personas obligadas": deberán aplicar KYC y reportar operaciones sospechosas.',
      '¿Y vos como usuario? Tranquilo: la carga regulatoria cae sobre las empresas (exchanges, apps de conversión). A vos te toca lo de siempre: declarar tus ingresos.',
      'Ventaja de una wallet no-custodial: tus llaves son tuyas; usás servicios regulados solo cuando convertís a quetzales. Transparencia sin entregar el control.',
    ],
    quiz: [
      {
        pregunta: '¿Es legal aceptar USDC por tu trabajo en Guatemala?',
        opciones: ['No, está prohibido', 'Sí: no es moneda de curso legal, pero es lícito aceptarla', 'Solo con permiso del Banguat'],
        correcta: 1,
        porQue: 'No hay prohibición; simplemente nadie está obligado a aceptarlas (eso es "curso legal").',
      },
      {
        pregunta: 'El Decreto 15-2026 obliga principalmente a…',
        opciones: ['Todos los usuarios de cripto', 'Las empresas proveedoras de servicios de activos virtuales', 'Los turistas'],
        correcta: 1,
        porQue: 'La ley convierte a los PSAV en "personas obligadas" del régimen antilavado.',
      },
    ],
  },
  {
    id: 'sat-freelancer',
    nivel: 4,
    titulo: 'SAT sin sustos (freelancer edition)',
    resumen: 'Factura electrónica y el régimen que te conviene conocer.',
    cartas: [
      'Freelancear en serio en Guate = facturar. Con el RTU activo y FEL (Factura Electrónica en Línea) emitís facturas desde el portal de la SAT, gratis.',
      'El régimen de Pequeño Contribuyente es el favorito para empezar: pagás 5% sobre lo facturado (con techo anual) y la contabilidad es sencilla.',
      'Tus cobros en USDC también se declaran: son ingresos por tu trabajo, en su equivalente en quetzales. Pluma te da el historial con equivalente GTQ para tu contador.',
      'Esto es educación general, no asesoría fiscal: cada caso es distinto — una consulta con un contador vale cada centavo. Lo importante: formalizarte te abre clientes más grandes.',
    ],
    quiz: [
      {
        pregunta: '¿Qué es FEL?',
        opciones: ['Una cripto guatemalteca', 'Factura Electrónica en Línea de la SAT', 'Un banco'],
        correcta: 1,
        porQue: 'FEL es el sistema oficial y gratuito de facturación electrónica de la SAT.',
      },
      {
        pregunta: 'Tus ingresos en USDC…',
        opciones: ['No existen para la SAT', 'Se declaran como ingresos, en su equivalente en quetzales', 'Pagan doble impuesto'],
        correcta: 1,
        porQue: 'Un ingreso es un ingreso sin importar el riel. Pluma te guarda el equivalente GTQ de cada cobro.',
      },
    ],
  },
  {
    id: 'colchon-dolares',
    nivel: 4,
    titulo: 'Tu colchón en dólares',
    resumen: 'El hábito que separa al freelancer estable del que vive al día.',
    cartas: [
      'El ingreso freelance es irregular: meses buenísimos y meses flojos. El colchón (3 meses de gastos) es lo que convierte el sube-y-baja en tranquilidad.',
      'Guardarlo en dólares digitales tiene doble gracia: te protege si el quetzal se mueve, y no lo tenés "a la mano" para gastártelo un fin de semana.',
      'Método simple: de cada cobro, apartá un porcentaje fijo (10–20%) ANTES de convertir a quetzales. Se llama pagarte a vos primero.',
      'Meta del nivel Vuelo: que tu pluma no solo cobre — que construya. Freelancer con colchón negocia mejor, elige clientes y duerme rico.',
    ],
    quiz: [
      {
        pregunta: '¿De qué tamaño es un buen colchón de emergencia?',
        opciones: ['Una semana de gastos', 'Unos 3 meses de gastos', 'No se necesita'],
        correcta: 1,
        porQue: 'Tres meses cubre la mayoría de baches de ingresos de un freelancer.',
      },
      {
        pregunta: '"Pagarte a vos primero" significa…',
        opciones: ['Gastar primero y ahorrar lo que sobre', 'Apartar un % fijo de cada cobro antes de gastar', 'Cobrar por adelantado siempre'],
        correcta: 1,
        porQue: 'Automatizar el apartado ANTES de gastar es el único método que sobrevive a la vida real.',
      },
    ],
  },
];

export function leccionPorId(id: string): Leccion | undefined {
  return LECCIONES.find((l) => l.id === id);
}
