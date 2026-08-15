# DESIGN.md — Pluma

La fuente de verdad del sistema visual vive en **[docs/diseno.md](docs/diseno.md)** (dirección "Bosque nuboso": tokens de color con contraste verificado, tipografía Space Grotesk/Inter, la pluma como firma en exactamente 4 lugares, glass con luz de dosel, tokens de motion y voz chapina).

Implementación en código:
- Tokens: [src/ui/tokens.ts](src/ui/tokens.ts)
- Primitivas: `T` (tipografía), `Glass`, `Boton`, `Presionable`, `Pantalla` (fondo + niebla), `Pluma` (firma SVG), `Esqueleto`, `Campo`, `Insignia`, `PinPad`, `BarraTabs`.

Regla de oro: nada de colores crudos en pantallas — todo sale de `tokens.ts`. Las animaciones de entrada/salida corren solo en nativo (`src/ui/anim.ts`).
