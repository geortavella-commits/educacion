import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';
import type { Sesion } from '@/services/auth.tipos';

/** Sesión actual: `undefined` mientras carga, `null` si no hay sesión. */
export function useSesion(): Sesion | null | undefined {
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);

  useEffect(() => {
    let activo = true;
    authService.obtenerSesion().then((s) => {
      if (activo) setSesion(s);
    });
    const cancelar = authService.suscribirseASesion((s) => {
      if (activo) setSesion(s);
    });
    return () => {
      activo = false;
      cancelar();
    };
  }, []);

  return sesion;
}

export const ETIQUETA_ROL: Record<string, string> = {
  docente: 'Docente',
  directivo: 'Directivo',
  familia: 'Familia',
  alumno: 'Alumno',
};
