/**
 * Portador temporal EN MEMORIA de la frase durante el onboarding.
 * Nunca pasa por parámetros de navegación ni por almacenamiento no seguro.
 */
let fraseTemp: string | null = null;

export function setFraseTemp(f: string | null) {
  fraseTemp = f;
}

export function getFraseTemp(): string | null {
  return fraseTemp;
}
