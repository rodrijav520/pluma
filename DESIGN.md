# Pluma — Dirección de arte

> **v2 — "Tinta y papel".** Modelo custodial, paleta clara, glass con propósito.
> La v1 (oscura, no-custodial) se conserva en la rama `no-custodial`.

---

## 0. De dónde sale el nombre

**Pluma** significa dos cosas a la vez, y las dos son el producto:

- **Pluma de quetzal** — el ave nacional, y el nombre de la moneda.
- **Pluma de escribir** — la herramienta del freelancer. Con ella firmás, cobrás, facturás.

Todo el sistema visual sale de la segunda: **Pluma escribe.** El acento de la marca
es **tinta**, el fondo es **papel**, y las superficies se apilan como hojas.

Esto no es decoración: define por qué el acento es índigo y no el verde obvio de
"app cripto", y por qué las tarjetas se comportan como hojas y no como *cards*.

---

## 1. La tesis: el tipo de cambio, dicho en voz alta

El problema del brief no es que mover dinero sea lento. Es que **te cobran sin que
te des cuenta**: entre 2% y 5% escondido en el tipo de cambio.

Casi toda app fintech muestra la moneda local como un subtítulo gris debajo del
monto en dólares. Eso repite el problema: la conversión es letra chica.

En Pluma la conversión **es el héroe**:

- El saldo se muestra en **quetzales y dólares con el mismo peso tipográfico**.
- La tasa que se te está aplicando es visible, en vivo, junto al saldo.
- Cada fila del historial muestra **las dos monedas**, siempre.

El freelancer guatemalteco vive en dos monedas. La interfaz también.

---

## 2. Color

Un acento, gastado en un solo lugar. Cada color tiene un trabajo.

| Token | Hex | Trabajo |
|---|---|---|
| `papel` | `#F2F4F7` | Fondo. Claro y frío, no crema. |
| `papelAlto` | `#FFFFFF` | Hojas elevadas, superficies de contenido. |
| `tinta` | `#2B3A8F` | **Acento único.** Marca, CTA primario, foco. |
| `tintaProfunda` | `#1E2A6B` | Estado presionado del acento. |
| `grafito` | `#141821` | Texto principal. Casi negro, cálido. |
| `lapiz` | `#5A6376` | Texto secundario, etiquetas. |
| `trazo` | `rgba(20,24,33,0.10)` | Bordes, divisores. |

**Colores semánticos** — solo datos, nunca decoración:

| Token | Hex | Trabajo |
|---|---|---|
| `entra` | `#0E9F6E` | Dinero que entra. Solo en el libro mayor. |
| `sale` | `#D64560` | Dinero que sale. Solo en el libro mayor. |
| `espera` | `#B4770E` | Estado *Confirmando*. |

**El acento reservado:**

| Token | Hex | Trabajo |
|---|---|---|
| `marigold` | `#F2A93B` | **Solo la pieza firma.** El relleno del deslizador y el momento "te llegó". Nada más. |

> Regla de Chanel: el marigold es el único accesorio. Si aparece en un tercer
> lugar, se quita de ahí.

---

## 3. Tipografía

Dos familias con una regla que se puede decir en una frase:

> **Bricolage habla. Inter cuenta.**

| Rol | Familia | Por qué |
|---|---|---|
| Voz — títulos, wordmark | **Bricolage Grotesque** | Tiene carácter propio y casi nadie la usa en fintech. Da calidez sin volverse infantil. |
| Cifra — todo número, fila de datos, etiqueta | **Inter**, `tabular-nums` | Cifras de ancho fijo: el saldo no baila cuando se actualiza. Impecable con acentos y ñ. |

Ninguna palabra que sea un número se pone en Bricolage. Ningún título se pone en
Inter. La regla no tiene excepciones y por eso se nota.

### Escala

| Nivel | Tamaño | Familia |
|---|---|---|
| `saldoMayor` | 52 / -1.5 | Inter tabular |
| `saldoMenor` | 34 / -0.8 | Inter tabular |
| `h1` | 28 / -0.6 | Bricolage |
| `h2` | 20 / -0.3 | Bricolage |
| `cuerpo` | 15 / 22 | Inter |
| `dato` | 15 tabular | Inter |
| `etiqueta` | 11 / +1.2 / mayúsculas | Inter |

---

## 4. Estructura: hojas, no tarjetas

El error de "glassmorphism de IA" es volver todo una tarjeta de vidrio. Acá el
vidrio aparece **solo donde algo se superpone a algo**:

- El encabezado, cuando el contenido pasa por debajo.
- La barra de acciones inferior, sobre la lista.
- Las hojas modales.

Todo lo demás es **papel opaco con sombra suave**. Se apila, no flota.

```
┌───────────────────────────────┐
│ ◕ Ana                    ⓘ   │ ← vidrio SOLO al hacer scroll
│                               │
│ TU SALDO                      │ ← etiqueta
│                               │
│ Q 3,847.20                    │ ← 52px, tabular
│ $ 496.41                      │ ← 34px, MISMO peso visual
│                               │
│ ┌───────────────────────────┐ │
│ │ 1 USD = Q 7.75            │ │ ← la tesis, visible
│ │ un banco te daría Q 7.36  │ │ ← la comparación honesta
│ └───────────────────────────┘ │
│                               │
│  ( Cobrar ) ( Enviar ) ( ⇄ )  │ ← pill actions
│                               │
├───────────────────────────────┤ ← borde de hoja, sube sobre lo anterior
│ MOVIMIENTOS                   │
│ ↓ Upwork            +$480.00  │
│   hoy 10:42        +Q3,720.00 │ ← LAS DOS monedas, siempre
│ ↑ Cambio a quetzales          │
│   ayer              −$120.00  │
└───────────────────────────────┘
```

---

## 5. Pieza firma: "Deslizá para cambiar"

Un solo elemento memorable, y hace exactamente lo que dice.

Para confirmar una conversión no se presiona un botón: **se desliza una pluma a lo
largo de un riel**. Mientras viaja:

1. El monto escrito arriba del riel **se transforma de dólares a quetzales**.
2. Detrás de la pluma queda un **trazo de tinta marigold**, como si escribiera.
3. Al llegar al final, el trazo se cierra y el monto queda en quetzales.

El gesto **es** la conversión. No es una animación encima de la acción: es la acción.

Accesibilidad: siempre existe un botón equivalente para quien no pueda deslizar, y
con `prefers-reduced-motion` el trazo aparece sin animarse.

---

## 6. Honestidad de estados

El backend es explícito en tres puntos donde una interfaz normal mentiría. Pluma no:

| Situación | Qué dice el backend | Qué muestra Pluma |
|---|---|---|
| Compra o conversión recién hecha | `Estado: "Confirmando"` — nunca "Completada" | *"Confirmando en la red."* No se dice "listo" hasta que el worker lo confirma. |
| Conversión a quetzales | `MontoGTQAAcreditar` — todavía no está acreditado | *"Se acreditan al confirmarse."* El saldo no se sube antes de tiempo. |
| Saldo cripto sin conexión | `SaldoCriptoEnLinea: false` | Marca visible de *"último dato conocido"*. Nunca un número viejo disfrazado de actual. |
| Registro sin gas | `GasPatrocinado: false` | Aviso claro: la cuenta existe pero no puede operar todavía. |

Los errores no piden disculpas y nunca son vagos: dicen qué pasó y qué hacer.

---

## 7. Piso de calidad

- Área táctil mínima 44×44.
- Contraste AA en todo texto (grafito sobre papel = 14.8:1).
- `prefers-reduced-motion` respetado en toda animación.
- Cifras siempre `tabular-nums` — nada que baile al actualizar.
- Verificación visual real en Android e iOS antes de dar algo por terminado.
