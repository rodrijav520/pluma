/**
 * Genera una wallet de TESTNET (Sepolia) para la tesorería de desarrollo.
 *
 * Sin valor real: es una cuenta desechable para poder levantar el backend en
 * local. La llave privada se cifra con la clave maestra (AES-256-GCM) y solo el
 * texto cifrado llega a `dotnet user-secrets`, que vive fuera del repositorio.
 *
 *   node scripts/gen-tesoreria.mjs
 *
 * Para producción esto NO sirve: la llave de tesorería debe vivir en un HSM o
 * KMS que firme sin exponerla. Ver backend/ANALISIS.md, hallazgo #1.
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const pk = generatePrivateKey();
const cuenta = privateKeyToAccount(pk);

// Una línea, separada por tabulador: dirección pública \t llave privada
process.stdout.write(`${cuenta.address}\t${pk}\n`);
