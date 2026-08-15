# CryptoExchangeGT

Backend de una wallet cripto custodial con conversión a quetzales (GTQ), en
**ASP.NET Core 8** con Clean Architecture.

Copia corregida de [dummy2004/CryptoExchangeGT](https://github.com/dummy2004/CryptoExchangeGT).
La revisión encontró 12 problemas, dos de ellos críticos; el detalle está en
[`ANALISIS.md`](ANALISIS.md) y lo que se cambió, en [`CAMBIOS.md`](CAMBIOS.md).

> **Esto es solo el backend.** No hay frontend. La única interfaz visual es
> Swagger UI, que ASP.NET genera a partir de los controladores.

> ⚠️ **Antes de usar esto con dinero real:** la clave maestra del repositorio
> original sigue en su historial de git y debe considerarse comprometida. Hay que
> **rotar la clave maestra, la clave JWT y la wallet de tesorería**. El código ya
> no arranca si detecta la clave filtrada, pero la rotación es manual.

---

## Arquitectura

```
CryptoExchangeGT.API              → Controllers, middleware, Swagger, JWT, rate limiting
        ↓
CryptoExchangeGT.Application      → UseCases, DTOs, Interfaces (puertos)
        ↓
CryptoExchangeGT.Domain           → Entities, Enums, Exceptions (sin dependencias externas)
        ↑
CryptoExchangeGT.Infrastructure   → EF Core, Nethereum, BCrypt, AES-GCM, worker de confirmación
```

`Infrastructure` implementa las interfaces que declara `Application`. El dominio
no conoce a nadie.

| Entidad | Qué guarda |
|---|---|
| `Usuario` | Nombre, email, hash BCrypt, saldo GTQ, rol, token de concurrencia |
| `WalletCustodia` | Dirección pública, llave privada cifrada (AES-256-GCM), 1 por usuario |
| `Transaccion` | Tipo, estado, montos, tasa usada, hash on-chain, motivo de fallo, referencia externa |

### Ciclo de vida de una transacción

```
Pendiente ──transmitida──> Confirmando ──recibo Status=1──> Completada
                                │
                                └────────recibo Status=0──> Fallida (+ reembolso)
```

El paso de `Confirmando` en adelante lo hace `ConfirmacionTransaccionesWorker`,
no el request del usuario. Los quetzales de una conversión se acreditan al
confirmarse, no al transmitirse.

---

## Endpoints

Base `/api`. Todo lo de `Transacciones` requiere `Authorization: Bearer {token}`.

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/registro` | Crea usuario + wallet custodial + patrocinio de gas |
| `POST` | `/api/auth/login` | Devuelve JWT (60 min) |
| `GET` | `/api/transacciones/saldo` | Saldo GTQ y cripto |
| `GET` | `/api/transacciones/historial` | Historial paginado |
| `POST` | `/api/transacciones/comprar` | GTQ → USDT desde la tesorería |
| `POST` | `/api/transacciones/convertir-a-gtq` | USDT → GTQ, se acredita al confirmarse |
| `POST` | `/api/transacciones/enviar-externo` | Envía USDT a una dirección externa |
| `POST` | `/api/transacciones/depositar` | Acredita GTQ. **Solo administradores** |
| `GET` | `/health` | Estado del servicio y de la base |

Los errores usan [ProblemDetails](https://www.rfc-editor.org/rfc/rfc7807):

```json
{
  "title": "Saldo insuficiente",
  "status": 400,
  "detail": "Saldo insuficiente en GTQ.",
  "instance": "/api/transacciones/comprar",
  "traceId": "0HNNL27A6CTBQ:00000001"
}
```

| Código | Cuándo |
|---|---|
| 400 | Regla de negocio o validación |
| 401 | Sin token, token vencido o credenciales incorrectas |
| 403 | Falta el rol requerido |
| 409 | Conflicto de concurrencia — se puede reintentar |
| 429 | Límite de tasa superado |
| 502 | La blockchain rechazó la transacción |
| 503 | Un servicio externo no está disponible |

---

## Stack

| Componente | Elección |
|---|---|
| Framework | ASP.NET Core 8 (net8.0) |
| Base de datos | SQLite vía EF Core 8 |
| Blockchain | Nethereum.Web3 6.1.0 |
| Red | Ethereum **Sepolia** (testnet), chain id 11155111 |
| Token | ERC-20 en `0x1c7D...7238`, 6 decimales |
| Contraseñas | BCrypt, factor de trabajo 12 |
| Llaves privadas | AES-256-GCM (cifrado autenticado) |
| Auth | JWT HS256 con emisor y audiencia validados |
| Tasa de cambio | `open.er-api.com`, con caché y sin fallback silencioso |
| Tests | xUnit + NSubstitute + SQLite en memoria — 75 pruebas |

---

## Cómo levantarlo

### 1. Requisitos

- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0)

### 2. Generar las credenciales

`appsettings.json` no trae secretos a propósito. Se generan con la utilidad
incluida:

```bash
# Dos claves DISTINTAS: la app no arranca si coinciden
MAESTRA=$(dotnet run --project tools/CryptoExchangeGT.Cifrador -- generar-clave)
JWT=$(dotnet run --project tools/CryptoExchangeGT.Cifrador -- generar-clave)

# Cifrar la llave privada de la tesorería con la clave maestra.
# El valor se pide por entrada estándar, no por argumento: los argumentos
# quedan en el historial del shell y son visibles en la lista de procesos.
dotnet run --project tools/CryptoExchangeGT.Cifrador -- cifrar "$MAESTRA"
```

### 3. Configurar

En desarrollo, con user-secrets:

```bash
cd src/CryptoExchangeGT.API
dotnet user-secrets set "Seguridad:ClaveMaestraBase64" "$MAESTRA"
dotnet user-secrets set "Jwt:ClaveSecreta"             "$JWT"
dotnet user-secrets set "Tesoreria:DireccionPublica"   "0x..."
dotnet user-secrets set "Tesoreria:LlavePrivadaCifrada" "<salida del paso anterior>"
```

En un servidor, con variables de entorno (doble guion bajo separa niveles):

```bash
export Seguridad__ClaveMaestraBase64="..."
export Jwt__ClaveSecreta="..."
export Tesoreria__DireccionPublica="0x..."
export Tesoreria__LlavePrivadaCifrada="..."
```

Si falta alguna, la app no arranca y dice cuál.

### 4. Correr

```bash
dotnet run --project src/CryptoExchangeGT.API
```

Las migraciones se aplican solas al arrancar. Abrir
**<http://localhost:5142/swagger>**.

### 5. Crear el primer administrador

`/depositar` exige rol de administrador, el registro siempre crea clientes, y
ningún endpoint otorga el rol — a propósito: un usuario capaz de dárselo a sí
mismo podría después acreditarse saldo.

Se otorga por configuración. El usuario debe registrarse normalmente primero:

```bash
export Administracion__EmailsAdministradores__0="admin@tuempresa.gt"
```

Al arrancar, la app lo promueve y lo deja registrado en el log.

### 6. Probar el flujo

```bash
curl -X POST http://localhost:5142/api/auth/registro \
  -H 'Content-Type: application/json' \
  -d '{"nombreCompleto":"Ana","email":"ana@demo.gt","password":"Quetzal2026seguro"}'

TOKEN=$(curl -s -X POST http://localhost:5142/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@demo.gt","password":"Quetzal2026seguro"}' | jq -r .token)

curl http://localhost:5142/api/transacciones/saldo -H "Authorization: Bearer $TOKEN"
```

> `registro` intenta mandar ETH real de Sepolia desde la tesorería. Si no tiene
> fondos, el usuario se crea igual y la respuesta trae `gasPatrocinado: false`.

---

## Tests

```bash
dotnet test
```

75 pruebas. Las de persistencia usan **SQLite real, no el proveedor InMemory de
EF**: InMemory no soporta transacciones ni aplica tokens de concurrencia, así que
los tests de doble gasto pasarían sin probar nada.

Cubren, entre otras cosas, los escenarios exactos de los hallazgos críticos:

- un cliente no puede acreditarse saldo, y un admin no puede acreditarse a sí mismo;
- la misma referencia de pago no se acredita dos veces;
- si la blockchain falla, el saldo vuelve a la cuenta del usuario;
- una conversión revertida on-chain no acredita quetzales;
- dos débitos simultáneos del mismo saldo no pueden ambos tener éxito;
- alterar un texto cifrado hace fallar el descifrado (AES-GCM).

---

## Configuración

| Clave | Para qué | Dónde |
|---|---|---|
| `Seguridad:ClaveMaestraBase64` | AES-256 de las llaves de custodia | secreto |
| `Jwt:ClaveSecreta` | Firma de tokens. **Distinta de la anterior** | secreto |
| `Tesoreria:DireccionPublica` | Wallet de la casa | secreto |
| `Tesoreria:LlavePrivadaCifrada` | Su llave, cifrada | secreto |
| `Administracion:EmailsAdministradores` | Quiénes son admin | config |
| `Cors:OrigenesPermitidos` | Orígenes del frontend | config |
| `Confirmacion:IntervaloSegundos` | Cada cuánto corre el worker | config |
| `Blockchain:ChainId` | Red. 11155111 = Sepolia | config |

---

## Qué falta

- **Frontend.** No existe; hay que construirlo desde cero. La API ya tiene CORS,
  endpoint de saldo, historial paginado y errores en formato estándar, que es lo
  que hacía falta para poder empezar.
- **Pasarela de pago real** detrás de `/depositar`. Hoy sigue siendo una
  acreditación manual de administrador, no un webhook de la pasarela.
- **Rotación de las llaves comprometidas** y re-cifrado de las llaves custodiales
  existentes.
- **HSM o KMS** para la llave de tesorería. Hoy se descifra en memoria del
  proceso; lo correcto en producción es que firme un servicio que nunca la
  exponga (AWS KMS, Azure Key Vault).
- **Detección de depósitos entrantes** (`RecepcionExterna` está en el enum pero
  nada la usa).
- **Base de datos de producción.** SQLite sirve para desarrollo; con varias
  instancias hace falta PostgreSQL.
