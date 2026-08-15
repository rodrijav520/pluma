# Correcciones aplicadas

Este documento explica qué se cambió respecto al código original de
[dummy2004/CryptoExchangeGT](https://github.com/dummy2004/CryptoExchangeGT)
(commit `3dd9781`) y por qué. Los hallazgos numerados corresponden a
[`ANALISIS.md`](ANALISIS.md).

Todo lo que sigue está verificado: la solución compila sin warnings con
`TreatWarningsAsErrors`, las **75 pruebas pasan**, y los escenarios marcados
como *comprobado en ejecución* se reprodujeron llamando a la API levantada.

---

## Resumen

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| 1 | 🔴 | Secretos publicados en el repositorio | Mitigado en código — **requiere rotación manual** |
| 2 | 🔴 | `/depositar` acreditaba saldo sin pago | Corregido |
| 3 | 🟠 | Débito sin reversa ante fallo de blockchain | Corregido |
| 4 | 🟠 | No se verificaba el resultado on-chain | Corregido |
| 5 | 🟠 | Ninguna transacción llegaba a `Completada` | Corregido |
| 6 | 🟠 | Doble gasto por concurrencia | Corregido |
| 7 | 🟠 | `/registro` drenaba el gas de la tesorería | Corregido |
| 8 | 🟡 | Tasa de cambio con fallback silencioso | Corregido |
| 9 | 🟡 | Sin validación de entrada | Corregido |
| 10 | 🟡 | Sin CORS | Corregido |
| 11 | 🟡 | Dirección destino sin validar | Corregido |
| 12 | 🔵 | Rate limiting, errores silenciosos, sin tests | Corregido |

---

## 1. 🔴 Secretos publicados

**Qué pasaba.** `appsettings.json` estaba versionado en un repositorio público
con la llave privada de tesorería cifrada y, en el mismo archivo, la clave que la
descifra. Esa clave maestra también descifra las wallets de todos los usuarios, y
la base SQLite con esas wallets también estaba versionada. Encima,
`Jwt:ClaveSecreta` era idéntica a la clave maestra.

**Qué se hizo.**

- Los tres secretos salieron de `appsettings.json`. Ahora se configuran con
  user-secrets o variables de entorno.
- `*.db` está en `.gitignore`; la base ya no se versiona.
- Al arrancar se valida (`ValidacionDeConfiguracion`):
  - que la clave maestra decodifique a exactamente 32 bytes;
  - que **la clave maestra y la del JWT sean distintas**;
  - que ninguna sea la que quedó publicada en el repositorio original — se
    compara contra su SHA-256, así que la clave filtrada no se republica para
    poder detectarla;
  - se advierte en el log si algún secreto viene de un `appsettings.json`.
- Se agregó `tools/CryptoExchangeGT.Cifrador`, la utilidad que faltaba para
  generar claves y cifrar la llave de tesorería. El README pedía "la llave
  privada cifrada" sin dar ninguna forma de producirla.

**Comprobado en ejecución:**

```
clave maestra == clave JWT   → la app no arranca
clave filtrada del repo      → la app no arranca
clave de 16 bytes            → la app no arranca
```

> ⚠️ **Esto no cierra el hallazgo por sí solo.** La clave sigue en los tres
> commits del repositorio original. Hay que **rotar la clave maestra, la clave
> JWT y la wallet de tesorería**, y re-cifrar las llaves custodiales existentes.
> El código nuevo lo permite y lo exige, pero la rotación es una acción manual.

**Extra: cifrado autenticado.** `AesEncriptacionService` pasó de AES-256-CBC a
**AES-256-GCM**. CBC sin MAC es maleable: alguien con acceso de escritura a la
base podía alterar una llave cifrada y el descifrado devolvía otra cosa sin que
nada lo detectara. GCM agrega un tag de autenticación. El formato anterior se
sigue leyendo para permitir la migración; re-cifrar deja todo en GCM.

---

## 2. 🔴 `/depositar` acreditaba saldo sin pago

**Qué pasaba.** El caso de uso llamaba a `AcreditarGTQ(monto)` y guardaba. Sin
pasarela de pago ni verificación. Cualquier usuario autenticado se acreditaba lo
que quisiera, y ese saldo servía para `/comprar`, que sí saca USDT real de la
tesorería.

**Qué se hizo.** Tres candados:

1. **Solo administradores** (`[Authorize(Policy = SoloAdministradores)]`), y el
   caso de uso revalida el rol contra la base — un rol revocado sigue vivo en
   tokens ya emitidos hasta que expiren.
2. **Un administrador no puede acreditarse a sí mismo.** Era justamente el abuso
   que había que impedir.
3. **Referencia externa obligatoria y única.** Un reintento por timeout de red no
   duplica el saldo. La unicidad está en un índice de base de datos, no solo en
   la comprobación de aplicación.

Además, cada depósito queda registrado como `Transaccion` de tipo `DepositoGTQ`.
Antes no dejaba rastro alguno.

El rol de administrador se otorga por configuración
(`Administracion:EmailsAdministradores`), nunca por endpoint: un usuario capaz de
dárselo a sí mismo podría después acreditarse saldo.

**Comprobado en ejecución:**

```
cliente → depositar               → 403 Forbidden
admin  → depositar a sí mismo     → 400 "no puede acreditarse saldo a sí mismo"
admin  → depositar a un cliente   → 200, saldo Q500
admin  → misma referencia otra vez→ 400 "ya fue acreditada", saldo sigue Q500
```

---

## 3. 🟠 Débito sin reversa

**Qué pasaba.** Se debitaba el saldo, se persistía, y recién después se llamaba a
la blockchain — sin `try/catch`. Si el envío fallaba, el usuario perdía los
quetzales y la transacción quedaba `Pendiente` para siempre.
`MarcarComoFallida()` existía en el dominio y no se llamaba desde ningún lado.

**Qué se hizo.** La operación se dividió en tres fases con compensación:

1. Débito y registro de la transacción, en **una sola escritura atómica**.
2. Envío a la blockchain, **fuera de toda transacción de base de datos** — esas
   llamadas tardan decenas de segundos y bloquearían la base.
3. Confirmación del envío, o **reembolso del saldo** si el envío falló.

Si la propia compensación falla, se registra con nivel `Critical` y todo el
detalle para conciliación manual: es la peor situación posible y no puede quedar
en silencio.

Se agregó además una verificación previa de fondos de la tesorería: es más barato
rechazar la compra antes de debitar que debitar y tener que compensar.

**Comprobado en ejecución:** con la tesorería sin fondos, `/comprar` devolvió
502 con *"El saldo fue devuelto a tu cuenta"* y el saldo quedó intacto en Q500.

---

## 4. 🟠 No se verificaba el resultado on-chain

**Qué pasaba.** `EnviarTransaccionAsync` esperaba el recibo y devolvía
`recibo.TransactionHash` sin mirar `recibo.Status`. Una transacción que revierte
en la EVM también genera recibo: se contabilizaba como exitosa.

El caso caro era `/convertir-a-gtq`, que acreditaba los quetzales al transmitir.
Si la transferencia revertía, el usuario se quedaba con la cripto **y** con los
quetzales.

**Qué se hizo.**

- `EnviarTransaccionAsync` y `EnviarEthNativoAsync` verifican
  `recibo.Status.Value == 1` y lanzan `TransaccionBlockchainFallidaException` si
  no.
- `/convertir-a-gtq` **ya no acredita saldo**. La acreditación la hace el worker
  de confirmación, y solo tras verificar el recibo. La tasa queda congelada en la
  transacción, así que el usuario recibe la tasa que se le mostró aunque la
  confirmación tarde.

---

## 5. 🟠 Ninguna transacción llegaba a `Completada`

**Qué pasaba.** `MarcarComoCompletada()` no se invocaba nunca y
`EstaConfirmadaAsync` era código muerto. En la base versionada por el autor
original, las 7 transacciones estaban en `Pendiente` o `Confirmando`. El campo
`Estado` era decorativo.

**Qué se hizo.** Se agregó `ConfirmacionTransaccionesWorker`, un
`BackgroundService` que cada 30 segundos (configurable) toma un lote de
transacciones en `Confirmando` y las cierra según la blockchain:

- recibo exitoso → `Completada` (y acredita GTQ si era una conversión);
- recibo revertido → `Fallida` (y reembolsa GTQ si era una compra);
- sin recibo todavía → se deja para la próxima pasada.

Un fallo consultando una transacción no detiene el lote, y una excepción en un
ciclo no mata el worker — si escapara, el `BackgroundService` moriría en silencio
y nadie volvería a confirmar nada.

---

## 6. 🟠 Doble gasto por concurrencia

**Qué pasaba.** Sin bloqueo optimista ni transacción de base, dos `/comprar`
simultáneos leían el mismo saldo, ambos pasaban la validación y el segundo
`Update` pisaba al primero: Q200 de cripto por Q100 de saldo.

**Qué se hizo.**

- `Usuario`, `WalletCustodia` y `Transaccion` tienen una propiedad `Version`
  marcada como `IsConcurrencyToken()`. EF la incluye en el `WHERE` de cada
  `UPDATE`; si otra operación modificó la fila, el update afecta 0 filas y EF
  lanza. Se traduce a **HTTP 409**, que le dice al cliente que puede reintentar
  sin duplicar nada.
- Se introdujo `IUnidadDeTrabajo`. Antes cada repositorio hacía su propio
  `SaveChangesAsync()`, así que un caso de uso que tocaba usuario + transacción +
  wallet hacía tres escrituras independientes: si la segunda fallaba, la primera
  ya estaba aplicada.

Hay un test que reproduce exactamente el escenario de doble gasto con dos
`DbContext` concurrentes. Usa **SQLite real y no el proveedor InMemory de EF**:
InMemory no aplica tokens de concurrencia, así que el test pasaría sin probar
nada.

---

## 7. 🟠 `/registro` drenaba el gas de la tesorería

**Qué pasaba.** Cada registro enviaba 0.005 ETH desde la tesorería. Endpoint
público, sin límite: mil registros son 5 ETH.

**Qué se hizo.** Rate limiting de **3 registros por hora** por IP. El patrocinio
de gas dejó de tragar excepciones (`catch { }` con un TODO): ahora se registra el
error, la wallet queda marcada como `GasPatrocinado = false`, y la respuesta del
registro lo informa para que se pueda reintentar. Antes ese fallo era invisible.

---

## 8. 🟡 Tasa de cambio con fallback silencioso

**Qué pasaba.** Ante cualquier error, `catch { return 7.75m; }`. Si la tasa real
era 7.85, todas las compras se liquidaban contra la casa — una ventana de
arbitraje que se abría justo cuando el proveedor estaba caído.

**Qué se hizo.** Caché de 5 minutos con tolerancia de 30. Si no hay tasa fresca
ni una reciente en caché, se lanza `ServicioExternoNoDisponibleException` → **HTTP
503**. Se rechaza la operación en vez de inventar un precio. Se agregó también un
control de rango: una tasa fuera de lo plausible indica que la API cambió de
formato, y operar con ella sería peor que fallar.

---

## 9, 10, 11 🟡 Validación, CORS y direcciones

**Validación.** Los DTOs tienen data annotations y `[ApiController]` rechaza
automáticamente lo inválido con 400. Se agregó `PoliticaDeContrasenia`: mínimo 10
caracteres, letras y números, y rechazo de contraseñas de listas filtradas. El
máximo de 72 no es arbitrario — BCrypt trunca en silencio a 72 bytes.

Antes se aceptaba un registro con contraseña vacía y después se podía iniciar
sesión con ella. **Comprobado en ejecución:** ahora devuelve 400.

**CORS.** Configurado con orígenes explícitos desde `Cors:OrigenesPermitidos`.
Nunca `AllowAnyOrigin`, porque la API usa credenciales.

**Direcciones.** `EsDireccionValida` valida formato EVM, checksum EIP-55 cuando
la dirección viene con mayúsculas mezcladas, y rechaza la dirección cero y el
propio contrato del token — dos formas habituales de perder fondos sin reversa
posible.

---

## 12 🔵 Menores

- **Rate limiting**: login 5/min, registro 3/hora, operaciones 30/min,
  particionado por usuario si hay token y por IP si no.
- **Manejo de errores**: se eliminó el `try/catch` repetido en los siete
  endpoints. Un middleware traduce excepciones de dominio a
  [ProblemDetails](https://www.rfc-editor.org/rfc/rfc7807) con el código HTTP
  correcto. El stack trace solo sale en desarrollo.
- **Endpoint de saldo** (`GET /api/transacciones/saldo`): no existía; había que
  pedir el historial completo y sumar a mano.
- **Historial paginado**: antes devolvía todas las filas, sin límite, y exponía
  las entidades de dominio directamente.
- **Migraciones al arrancar**: por eso la base SQLite había terminado
  versionada. Se agregó `AppDbContextFactory` para que generar migraciones no
  exija credenciales de producción.
- **Health check** en `/health`.
- **Normalización de email**: `ToLowerInvariant()` en ambos lados. Antes la
  entidad usaba `ToLowerInvariant()` y el repositorio `ToLower()`, que depende de
  la cultura del servidor.
- **Precisión decimal**: `ConvertirAUnidadMinima` ya no pasa por `Math.Pow` con
  `double`; el truncado es explícito.
- **JWT**: se emite y valida `audience` (antes la validación estaba apagada),
  `ClockSkew` bajó de 5 minutos a 30 segundos, y el rol viaja como claim.
- **Login sin enumeración de usuarios**: cuando el email no existe se verifica
  contra un hash señuelo, para gastar el mismo tiempo. Sin eso, un atacante
  distingue "email no registrado" de "contraseña incorrecta" midiendo la latencia,
  porque BCrypt es deliberadamente lento.
- **BCrypt** con factor de trabajo explícito 12 (antes el default, 11).
- **75 tests** donde antes había cero.
- **Índices** para las consultas reales: historial por usuario y fecha, estado
  para el worker, y el índice único filtrado sobre la referencia externa.

---

## Cambios que rompen compatibilidad

Si alguien ya estaba consumiendo esta API, esto cambia:

| Antes | Ahora |
|---|---|
| Los request llevaban `usuarioId` en el body | Se toma del token; el campo ya no existe |
| `POST /depositar` con `{usuarioId, monto}` | `{usuarioDestinoId, monto, referenciaExterna}`, solo admin |
| `GET /historial` devolvía un array | Devuelve `{transacciones, pagina, totalRegistros, ...}` |
| `ConvertirCriptoAGtqResponse.MontoGTQRecibido` | `MontoGTQAAcreditar` — se acredita al confirmarse |
| Errores como `{"mensaje": "..."}` | `ProblemDetails` (RFC 7807) |
| Contraseñas sin restricción | Mínimo 10 caracteres, letras y números |
| La migración `InicialCreate` | Reemplazada por `EsquemaSeguro` |

**Sobre la migración:** el esquema cambió lo suficiente (columnas `Version`,
`Rol`, `MotivoFallo`, `ReferenciaExterna`, `Compensada`, `GasPatrocinado`, más
índices nuevos) como para que regenerar la migración desde cero fuera más limpio
que encadenar parches. Como la base anterior no debe reutilizarse —sus llaves
están cifradas con una clave comprometida— empezar con un esquema nuevo es
además lo correcto.
