import { Redirect } from 'expo-router';
import { useSesion } from '../state/sesion';

/**
 * Portón. La sesión ya viene restaurada desde el layout raíz, así que acá solo
 * se decide a dónde entra la persona.
 */
export default function Portada() {
  const usuario = useSesion((s) => s.usuario);
  return <Redirect href={usuario ? '/(tabs)' : '/bienvenida'} />;
}
