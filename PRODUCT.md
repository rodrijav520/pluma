# PRODUCT.md — Pluma

**Qué es:** wallet móvil **custodial** de dólares digitales (USDT) con conversión a quetzales, para freelancers guatemaltecos: cobrar al extranjero, ver todo en las dos monedas, pasar a quetzales con la tasa a la vista, y aprender cripto sin miedo (Escuela Cripto en voseo chapín). Proyecto universitario (gestión de proyectos); MVP corre en testnet Sepolia.

**Usuario primario:** freelancer guatemalteco 20–35 (diseño/dev/marketing), alfabetización digital alta, cripto-curioso pero desconfiado. Escena: revisa su teléfono de noche o entre entregas, luz baja, quiere saber "¿ya me pagaron y cuánto es en quetzales?" en 3 segundos.

**Register:** product (el diseño sirve a la tarea: confianza + claridad + velocidad). Momentos brand: portada y Escuela.

**Trabajo #1 del usuario:** ver cuánto tiene en quetzales y pasar dólares digitales a quetzales sin perder en el cambio. Todo lo demás es soporte.

**Voz:** chapín cálido y directo (voseo), cero cripto-jerga sin explicar, "dólares digitales" antes que "cripto". Serio en seguridad y errores: nunca decir "listo" antes de que la red confirme.

**Sistema visual:** "Tinta y papel" — fuente de verdad en [DESIGN.md](DESIGN.md). Acento índigo (tinta) en degradado a violeta para el encabezado de saldo; papel claro para el contenido; marigold reservado a la pieza firma. Tipografía: Bricolage habla (títulos), Inter cuenta (todo número, tabular).

**Arquitectura:** app Expo + backend propio en `backend/` (ASP.NET Core 8, Clean Architecture, SQLite, Nethereum). El servidor guarda las llaves cifradas con AES-256-GCM; el cliente no tiene lógica on-chain.

**Restricciones:** Expo Go compatible (sin dev-build), 100% gratis, offline-tolerante (Guatemala), accesibilidad AA verificada por contraste medido, español primero, aviso de testnet honesto.

**No hacer:** trading ni especulación, multi-moneda especulativa, dark patterns de fees, púrpura-rosa AI, layouts de tarjetas idénticas infinitas, decir "completado" cuando el backend responde "confirmando".

**Historia:** el producto nació no-custodial (frase semilla, viem, Base Sepolia). Esa versión vive en la rama `no-custodial` y el tag `v1-no-custodial`. Se rotó a custodial para integrar el backend CryptoExchangeGT, que es lo que aporta la conversión real a quetzales.
