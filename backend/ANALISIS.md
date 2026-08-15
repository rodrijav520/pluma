# Análisis de CryptoExchangeGT

Revisión del repositorio [dummy2004/CryptoExchangeGT](https://github.com/dummy2004/CryptoExchangeGT)
tal como estaba en el commit `3dd9781` ("Backend terminado, JWT fix, tesoreria,
gas sponsorship, endpoints probados en sepolia").

El proyecto se compiló y se ejecutó completo para verificar los hallazgos. Todo lo
que dice "verificado" abajo se reprodujo corriendo la API, no es lectura de código.

> **Estado: los 12 hallazgos ya están corregidos en este repositorio.**
> Este documento describe el código **original**, tal como se encontró, y se
> mantiene como registro de la revisión. Lo que se cambió y cómo está en
> [`CAMBIOS.md`](CAMBIOS.md).
>
> Una excepción importante: el hallazgo #1 está mitigado en código, pero **la
> rotación de la clave maestra, la clave JWT y la wallet de tesorería sigue
> pendiente** y es una acción manual. La clave comprometida sigue en el
> historial de git del repositorio original.

---

## Resumen

Es un backend de wallet custodial en ASP.NET Core 8, **sin frontend**. La
arquitectura está bien hecha: Clean Architecture de verdad, con el dominio
aislado, interfaces en `Application` e implementaciones en `Infrastructure`.
Compila sin un solo warning y los endpoints funcionan.

Pero **no está listo para manejar dinero real**. Hay dos fallas críticas que
permiten vaciar la tesorería, y varias de integridad transaccional que hacen que
el saldo de un usuario pueda desaparecer o duplicarse.

Todo corre sobre **Sepolia (testnet)**, así que hoy no hay pérdida económica real.

| # | Severidad | Hallazgo |
|---|---|---|
| 1 | 🔴 Crítico | Clave maestra AES y llave de tesorería publicadas en el repo |
| 2 | 🔴 Crítico | `/depositar` acredita quetzales sin ningún pago |
| 3 | 🟠 Alto | `/comprar` debita GTQ antes de la transferencia, sin reversa |
| 4 | 🟠 Alto | Nunca se verifica que la transacción on-chain haya tenido éxito |
| 5 | 🟠 Alto | Ninguna transacción llega jamás a `Completada` |
| 6 | 🟠 Alto | Carrera en los saldos: doble gasto con requests concurrentes |
| 7 | 🟠 Alto | `/registro` regala 0.005 ETH sin límite |
| 8 | 🟡 Medio | Tasa de cambio con fallback silencioso a 7.75 |
| 9 | 🟡 Medio | Sin validación de entrada (password vacío aceptado) |
| 10 | 🟡 Medio | Sin CORS: ningún frontend puede consumir la API |
| 11 | 🟡 Medio | Dirección destino sin validar |
| 12 | 🔵 Bajo | Sin rate limiting, gas sponsorship silencioso, sin tests |

---

## 1. 🔴 Clave maestra AES y llave de tesorería publicadas

`src/CryptoExchangeGT.API/appsettings.json` está versionado en un repositorio
público y contiene, **en el mismo archivo**:

```jsonc
"Tesoreria": {
  "LlavePrivadaCifrada": "R97vR2rs…[96 chars]"   // el texto cifrado
},
"Seguridad": {
  "ClaveMaestraBase64": "s2g1Gsqu…[32 bytes]"    // y la llave que lo descifra
},
"Jwt": {
  "ClaveSecreta": "s2g1Gsqu…[32 bytes]"          // exactamente la misma clave
}
```

> Los valores van truncados a propósito en este documento. Los completos siguen
> visibles en el repositorio original y en su historial de git.

Cifrar la llave de tesorería y publicar al lado la clave que la descifra deja el
cifrado sin ningún efecto. Cualquiera que clone el repo obtiene la llave privada
de la tesorería.

Y hay tres problemas encadenados:

**a) La clave maestra descifra también las wallets de todos los usuarios.**
`AesEncriptacionService` usa esa única clave para cifrar cada llave privada
custodial. El archivo `cryptoexchangegt.db` también está versionado, con 2
usuarios y 2 wallets reales adentro (verificado). Es decir: la base y la llave
para abrirla, ambas en el mismo repo público.

**b) `Jwt:ClaveSecreta` es idéntica a la clave maestra.** Con ese valor cualquiera
firma un JWT válido con el `sub` que quiera y actúa como cualquier usuario, sin
password. Además, reutilizar la misma clave para dos propósitos criptográficos
distintos es un error por sí solo.

**c) Borrar el archivo no arregla nada.** La clave está en los **tres** commits del
historial (`d341cdf`, `844d90a`, `3dd9781`). Aunque se borre hoy, sigue siendo
recuperable con `git show`.

### Qué hacer

1. **Rotar todo**, no basta con borrar: generar clave maestra nueva, clave JWT
   nueva (distinta), y **mover los fondos de la tesorería a una wallet nueva**.
2. Re-cifrar las llaves custodiales existentes con la clave nueva (script de
   migración: descifrar con la vieja, cifrar con la nueva).
3. Sacar los secretos del repo → `dotnet user-secrets` en local, variables de
   entorno o un vault en el servidor.
4. Sacar `*.db` del control de versiones.
5. Para producción, la llave de tesorería no debería vivir descifrable en el
   proceso: lo correcto es un HSM o un KMS (AWS KMS, Azure Key Vault) que firme
   sin exponer la llave.

> En esta copia ya quité los secretos de `appsettings.json` y agregué `*.db` al
> `.gitignore`. El historial del repo original sigue expuesto — eso solo lo
> arregla la rotación.

---

## 2. 🔴 `/depositar` acredita quetzales sin ningún pago

`DepositarGtqUseCase` hace exactamente esto:

```csharp
usuario.AcreditarGTQ(request.Monto);
await _usuarioRepository.ActualizarAsync(usuario);
```

No hay pasarela de pago, ni verificación bancaria, ni un estado "pendiente de
confirmación". Cualquier usuario autenticado se acredita el monto que quiera.

**Verificado en ejecución:** dos llamadas a `/api/transacciones/depositar` con
montos arbitrarios dejaron la cuenta en **Q 1,049,999.00**, sin mover un centavo.

```bash
curl -X POST .../api/transacciones/depositar -H "Authorization: Bearer $TOKEN" \
     -d '{"monto":999999}'
→ {"mensaje":"Depósito realizado."}
```

Lo grave es lo que viene después: ese saldo inventado se usa en `/comprar`, que
**sí** transfiere USDT real desde la tesorería. La cadena completa es:
*cuenta gratis → saldo infinito → cripto real fuera de la tesorería*.

### Qué hacer

El endpoint no debería existir en su forma actual. El depósito tiene que nacer de
un webhook de la pasarela de pago (o de una conciliación bancaria), no de una
llamada del cliente. Mientras tanto, dejarlo detrás de un rol de administrador y
fuera del build de producción.

---

## 3. 🟠 `/comprar` debita GTQ antes de la transferencia, sin reversa

En `ComprarCriptoUseCase`, el orden es:

```csharp
usuario.DebitarGTQ(request.MontoGTQ);      // 1. se le quita el saldo
await _transaccionRepository.GuardarAsync(transaccion);
await _usuarioRepository.ActualizarAsync(usuario);   // 2. se persiste

var hash = await _cryptoWalletService.EnviarTransaccionAsync(...);  // 3. puede tronar
```

No hay `try/catch` alrededor del paso 3. Si el RPC falla, si la tesorería no tiene
saldo, o si el gas no alcanza, la excepción sube al controlador y devuelve un 400
— pero **el débito ya se guardó**. El usuario pierde los quetzales, la transacción
queda en `Pendiente` para siempre y nadie la revierte.

`Transaccion.MarcarComoFallida()` existe en el dominio y **nunca se llama desde
ningún lado**.

### Qué hacer

Envolver el envío en `try/catch`: en el catch, marcar la transacción como
`Fallida` y devolver el saldo con `AcreditarGTQ`. Idealmente el débito y el
registro de la transacción van en una misma transacción de base de datos, y la
parte on-chain se maneja como paso asíncrono compensable.

---

## 4. 🟠 Nunca se verifica que la transacción on-chain haya tenido éxito

`EthereumWalletService.EnviarTransaccionAsync` espera el recibo pero ignora su
estado:

```csharp
var recibo = await funcionTransfer.SendTransactionAndWaitForReceiptAsync(...);
return recibo.TransactionHash;   // nunca mira recibo.Status
```

Una transacción que revierte en la EVM **también genera recibo**, con
`Status == 0`. El código la trata como exitosa.

El impacto más caro está en `ConvertirCriptoAGtqUseCase`: acredita los quetzales
al usuario después de "enviar" el USDT a la tesorería. Si esa transferencia
revirtió, el usuario se queda con su cripto **y** con los quetzales acreditados.

El método `EstaConfirmadaAsync` ya hace la comprobación correcta
(`recibo.Status.Value == 1`)... pero no lo invoca nadie.

### Qué hacer

Verificar `recibo.Status.Value == 1` dentro de `EnviarTransaccionAsync` y lanzar
si es 0. Y acreditar el saldo solo después de esa verificación.

---

## 5. 🟠 Ninguna transacción llega jamás a `Completada`

`MarcarComoCompletada()` no se llama desde ningún punto del código. No hay
`BackgroundService`, ni job, ni endpoint que cierre el ciclo.

**Verificado en la propia base de datos versionada por tu amigo:** las 7
transacciones que hay están todas en `Pendiente` o `Confirmando`. Cero en
`Completada`.

```
Tipo=Compra        Estado=Pendiente     2 transacciones
Tipo=Compra        Estado=Confirmando   1
Tipo=ConversionAGTQ Estado=Pendiente    1
...
```

El campo `Estado` es decorativo, y `FechaConfirmacion` siempre queda en `null`.

### Qué hacer

Un `BackgroundService` que cada N segundos tome las transacciones en
`Confirmando`, llame a `EstaConfirmadaAsync(hash)` y las cierre como `Completada`
o `Fallida`.

---

## 6. 🟠 Carrera en los saldos: doble gasto con requests concurrentes

No hay bloqueo optimista (`RowVersion`/`ConcurrencyToken`) sobre `Usuario.SaldoGTQ`
ni transacción de base de datos que envuelva las operaciones.

Dos `/comprar` simultáneos con Q100 sobre un saldo de Q100 leen ambos el mismo
saldo, ambos pasan la validación de `DebitarGTQ`, y ambos guardan. El segundo
`Update` pisa al primero: el usuario compra Q200 de cripto con Q100.

Además, dentro de cada caso de uso hay varios `SaveChangesAsync` separados
(guardar transacción, actualizar usuario, actualizar wallet), sin atomicidad
entre ellos.

### Qué hacer

Agregar `[Timestamp]`/`IsConcurrencyToken()` sobre el saldo y manejar
`DbUpdateConcurrencyException`, o envolver el caso de uso en una transacción
explícita con el nivel de aislamiento adecuado.

---

## 7. 🟠 `/registro` regala 0.005 ETH sin límite

`RegistrarUsuarioUseCase` manda `MontoGasInicial = 0.005m` ETH desde la tesorería a
cada wallet nueva. El endpoint es público y sin rate limiting: registrar cuentas
en bucle drena el ETH de la tesorería. A 0.005 ETH por cuenta, mil registros son
5 ETH.

### Qué hacer

Rate limiting por IP, verificación de email antes de patrocinar el gas, y un tope
diario global de gas sponsorship.

---

## 8. 🟡 Tasa de cambio con fallback silencioso a 7.75

`TasaCambioProvider` consulta `open.er-api.com` y, ante cualquier error, devuelve
`7.75` sin avisar:

```csharp
catch { return TasaRespaldo; }   // 7.75m fijo
```

Si la API externa se cae y el tipo de cambio real es 7.85, todas las compras se
liquidan a un precio favorable al usuario y en contra de la casa. Es una ventana
de arbitraje que se abre justo cuando nadie está mirando. Tampoco hay caché: cada
operación pega a la API externa.

### Qué hacer

Ante fallo, rechazar la operación en vez de inventar un precio. Si se quiere
resiliencia, cachear la última tasa buena con marca de tiempo y rechazar si está
vencida.

---

## 9. 🟡 Sin validación de entrada

Los DTOs no tienen `[Required]`, `[Range]` ni `[EmailAddress]`, y los
controladores no revisan `ModelState`.

**Verificado:** un registro con `"password": ""` se acepta, y después se puede
iniciar sesión con password vacío y obtener un JWT válido.

```bash
curl -X POST .../api/auth/registro -d '{"nombreCompleto":"Test","email":"vacio@demo.gt","password":""}'
→ 200 OK
curl -X POST .../api/auth/login -d '{"email":"vacio@demo.gt","password":""}'
→ 200 OK, token emitido
```

`Usuario.Crear` valida nombre y email, pero el password nunca pasa por ninguna
regla. Los montos sí están cubiertos: `DebitarGTQ`/`AcreditarGTQ` rechazan valores
negativos o cero (verificado, devuelve 400).

### Qué hacer

Data annotations en los DTOs y una política mínima de contraseña antes de hashear.

---

## 10. 🟡 Sin CORS

`Program.cs` no llama a `AddCors` ni `UseCors`. Cualquier frontend servido en otro
origen (`localhost:3000`, el dominio de producción) va a ser bloqueado por el
navegador. Es lo primero que van a chocar al empezar la interfaz.

---

## 11. 🟡 Dirección destino sin validar

`Transaccion.CrearEnvioExterno` solo comprueba que la cadena no esté vacía. No se
valida formato EVM ni checksum, ni se descarta la dirección cero
(`0x000...000`), que quemaría los fondos de forma irreversible.

### Qué hacer

Validar con `Nethereum.Util.AddressUtil.IsValidEthereumAddressHexFormat()` y
rechazar la dirección cero y la dirección del propio contrato del token.

---

## 12. 🔵 Varios de menor severidad

- **Sin rate limiting en `/login`** → fuerza bruta libre, sin bloqueo de cuenta.
- **Gas sponsorship traga todas las excepciones** con un `catch { }` vacío y un
  `TODO`. Si falla, el usuario queda creado pero sin gas, y nadie se entera.
- **Sin tests.** El proyecto no tiene un solo test.
- **Sin endpoint de saldo.** No hay forma de consultar saldo GTQ ni saldo cripto
  sin pedir el historial completo.
- **`Program.cs` no aplica migraciones al arrancar.** Hay que correr
  `dotnet ef database update` a mano (por eso versionaron el `.db`).
- **Inconsistencia de mayúsculas en email:** `Usuario.Crear` normaliza con
  `ToLowerInvariant()` pero `ObtenerPorEmailAsync` compara con `ToLower()`, que
  depende de la cultura del servidor.
- **Precisión decimal:** `ConvertirAUnidadMinima` usa `new BigInteger(decimal)`,
  que trunca hacia cero. Se pierden fracciones por debajo del micro-USDT en cada
  operación. Conviene redondear de forma explícita y documentada.
- **Swagger solo en `Development`**, así que en producción la API queda sin
  interfaz ni documentación.

---

## Recomendación de orden de trabajo

**Antes de tocar cualquier otra cosa**

1. Rotar clave maestra, clave JWT y wallet de tesorería (#1)
2. Desactivar o proteger `/depositar` (#2)

**Antes de conectar dinero real**

3. Reversa y estados de fallo en las operaciones (#3)
4. Verificar `recibo.Status` (#4)
5. Worker de confirmación (#5)
6. Control de concurrencia en saldos (#6)
7. Rate limiting en `/registro` y `/login` (#7, #12)

**Para poder empezar el frontend**

8. CORS (#10)
9. Endpoint de consulta de saldo (#12)
10. Validación de entrada (#9, #11)

**Para sostener el proyecto**

11. Tests, empezando por los casos de uso de dinero
12. Tasa de cambio sin fallback silencioso (#8)

---

## Lo que sí está bien

Vale la pena decirlo, porque la base es aprovechable:

- **La separación en capas es correcta**, no es Clean Architecture de nombre. El
  dominio no referencia nada externo y las dependencias apuntan hacia adentro.
- **Las entidades protegen sus invariantes**: setters privados, constructores
  privados, factories estáticas. `DebitarGTQ` valida saldo suficiente dentro de la
  entidad, no en el caso de uso.
- **BCrypt para passwords**, que es la elección correcta.
- **AES con IV aleatorio por cifrado** y el IV guardado junto al texto cifrado —
  el esquema está bien implementado; el problema es dónde vive la llave, no el
  código.
- **El `UsuarioId` se toma del claim `sub` del token**, sobrescribiendo lo que
  venga en el body. Eso cierra un IDOR de libro (es el arreglo del commit
  `844d90a`).
- **Compila sin warnings** con nullable habilitado, y los comentarios en español
  explican decisiones no obvias, como por qué el gas limit es 100,000.
