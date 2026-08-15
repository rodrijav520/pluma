# Pluma

Wallet cripto custodial con conversión a quetzales, para freelancers guatemaltecos.

App móvil en **React Native / Expo SDK 57** sobre un backend en **ASP.NET Core 8**.
Proyecto del curso de Gestión de Proyectos de Ingeniería.

---

## El problema

El dinero que cruza la frontera hacia Guatemala —una remesa familiar o el pago a un
freelancer— pierde entre **3% y 8%** de su valor en comisiones y tipo de cambio, y
puede tardar **hasta 5 días** en llegar.

Buena parte de esa pérdida es invisible: bancos y operadoras aplican un margen
cambiario de 2% a 5% que el usuario nunca ve desglosado.

## La respuesta de Pluma

**La conversión es el héroe de la interfaz, no la letra chica.**

- El saldo se muestra en **quetzales y dólares con el mismo peso tipográfico**.
- La tasa que se te aplica está a la vista, en vivo, junto al saldo.
- Cada fila del historial muestra **las dos monedas**, siempre.

El freelancer guatemalteco vive en dos monedas. La interfaz también.

---

## Estructura

```
.
├── src/                  App Expo (expo-router, TypeScript)
│   ├── app/              Rutas
│   ├── ui/               Sistema de diseño y componentes
│   ├── core/             Cliente de API, formato, validaciones
│   ├── state/            Estado global (zustand)
│   └── content/          Contenido de la Escuela Cripto
├── backend/              API ASP.NET Core 8 (Clean Architecture)
├── DESIGN.md             Dirección de arte
├── PRODUCT.md            Definición de producto
└── docs/                 Investigación de mercado y plan
```

---

## Cómo levantarlo

Hacen falta **Node 20+** y el **SDK de .NET 8**.

### 1. Backend

Los secretos no viven en el repositorio. Se generan una vez:

```bash
cd backend/src/CryptoExchangeGT.API

# Dos claves DISTINTAS: la app no arranca si coinciden
dotnet run --project ../../tools/CryptoExchangeGT.Cifrador -- generar-clave
dotnet run --project ../../tools/CryptoExchangeGT.Cifrador -- generar-clave
```

Se genera una wallet de tesorería de testnet y se cifra su llave:

```bash
node scripts/gen-tesoreria.mjs
dotnet run --project backend/tools/CryptoExchangeGT.Cifrador -- cifrar "<CLAVE_MAESTRA>"
```

Se guardan como secretos de usuario (nunca en git):

```bash
cd backend/src/CryptoExchangeGT.API
dotnet user-secrets set "Seguridad:ClaveMaestraBase64"  "<CLAVE_MAESTRA>"
dotnet user-secrets set "Jwt:ClaveSecreta"              "<CLAVE_JWT>"
dotnet user-secrets set "Tesoreria:DireccionPublica"    "0x…"
dotnet user-secrets set "Tesoreria:LlavePrivadaCifrada" "<texto cifrado>"
```

Y se levanta escuchando en toda la red, para que el teléfono lo alcance:

```bash
ASPNETCORE_URLS="http://0.0.0.0:5142" dotnet run --project backend/src/CryptoExchangeGT.API
```

Swagger queda en <http://localhost:5142/swagger>.

### 2. App

```bash
npm install
npx expo start
```

Se abre **Expo Go** en el teléfono y se escanea el QR. La app deduce sola la IP
del backend a partir del servidor de Expo; si hace falta forzarla:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.6:5142 npx expo start
```

---

## Estado

| Parte | Estado |
|---|---|
| Registro, login y sesión JWT | Funcionando |
| Saldo en doble moneda con tasa en vivo | Funcionando |
| Historial paginado | Funcionando |
| Compra, cambio a GTQ y envío externo | Requieren tesorería con fondos de testnet |
| Escuela Cripto | Funcionando |

Las operaciones on-chain necesitan que la wallet de tesorería tenga ETH de
Sepolia (para gas) y saldo del token de prueba. Sin eso, la API responde con un
error claro y el saldo del usuario no se mueve.

> **Esto opera sobre la red de pruebas Sepolia.** No es dinero real y no debe
> usarse como si lo fuera.

---

## Créditos

El backend **CryptoExchangeGT** fue desarrollado por
[@rodrijav520](https://github.com/rodrijav520), a partir de una revisión de
seguridad que encontró y corrigió 12 hallazgos —dos de ellos críticos— sobre el
proyecto original. El detalle está en [`backend/ANALISIS.md`](backend/ANALISIS.md)
y [`backend/CAMBIOS.md`](backend/CAMBIOS.md).

La app móvil y la integración se construyeron sobre ese trabajo.

La versión anterior de Pluma —no custodial, con frase semilla y llaves en el
teléfono— se conserva en la rama [`no-custodial`](../../tree/no-custodial) y en el
tag `v1-no-custodial`.
