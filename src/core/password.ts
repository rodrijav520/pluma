/**
 * Espejo de backend/src/CryptoExchangeGT.Application/Seguridad/PoliticaDeContrasenia.cs
 *
 * Se valida acá también para que la persona vea el problema mientras escribe,
 * no después de un viaje al servidor. El backend sigue siendo la autoridad:
 * esto es cortesía, no seguridad.
 */

export const LARGO_MINIMO = 10;
export const LARGO_MAXIMO_BYTES = 72;

const PROHIBIDAS = new Set([
  '123456',
  '123456789',
  '12345678',
  'password',
  'qwerty',
  'abc123',
  '111111',
  '1234567',
  'iloveyou',
  '000000',
  '1234567890',
  'admin',
  'contrasena',
  'contraseña',
  'qwerty123',
  '1q2w3e4r',
  '123123',
  'password1',
  'guatemala',
]);

function bytes(texto: string): number {
  // El backend cuenta bytes UTF-8; una ñ o una tilde ocupa dos.
  return new TextEncoder().encode(texto).length;
}

/** Devuelve el problema a mostrar, o null si la contraseña sirve. */
export function validarPassword(password: string): string | null {
  if (!password.trim()) return 'Escribí una contraseña.';

  if (password.length < LARGO_MINIMO)
    return `Te faltan ${LARGO_MINIMO - password.length} caracteres — el mínimo es ${LARGO_MINIMO}.`;

  if (bytes(password) > LARGO_MAXIMO_BYTES)
    return `La contraseña no puede pasar de ${LARGO_MAXIMO_BYTES} bytes.`;

  const tieneLetra = /\p{L}/u.test(password);
  const tieneDigito = /\p{Nd}/u.test(password);
  if (!tieneLetra || !tieneDigito) return 'Combiná al menos una letra y un número.';

  if (PROHIBIDAS.has(password.trim().toLowerCase()))
    return 'Esa contraseña aparece en listas públicas de contraseñas filtradas. Elegí otra.';

  return null;
}

/** Formato de correo, solo para avisar antes de enviar. */
export function validarEmail(email: string): string | null {
  const limpio = email.trim();
  if (!limpio) return 'Escribí tu correo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return 'Ese correo no tiene un formato válido.';
  return null;
}

export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (limpio.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (limpio.length > 200) return 'El nombre no puede pasar de 200 caracteres.';
  return null;
}
