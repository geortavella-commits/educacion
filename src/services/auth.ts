// Fachada de autenticación.
//  - Producción (y desarrollo con VITE_USAR_SUPABASE=true): Supabase Auth real.
//  - Solo desarrollo con el interruptor apagado: servicio simulado (en memoria), con cuentas de prueba.
// El simulado se carga con import dinámico dentro de `import.meta.env.DEV`: Vite lo saca del paquete de
// producción, así las cuentas y la contraseña de prueba nunca viajan a producción.
import type { ResultadoIngreso, Sesion } from './auth.tipos';
import { authSupabase } from './auth.supabase';
import { usarSupabase } from './modo';
import { olvidarInteresesEnMemoria } from './diagnostico';

export type { RolUsuario, Sesion, ResultadoIngreso, CuentaPrueba } from './auth.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./auth.simulado') : null;

const elegir = async () => {
  if (!simulado) throw new Error('Servicio de autenticación simulado no disponible');
  return (await simulado).authService;
};

export const authService = {
  iniciarSesion: (email: string, password: string): Promise<ResultadoIngreso> =>
    simulado ? elegir().then((s) => s.iniciarSesion(email, password)) : authSupabase.iniciarSesion(email, password),

  cerrarSesion: async (): Promise<void> => {
    // En un equipo compartido del aula nada del alumno anterior debe quedar en pantalla ni en memoria.
    olvidarInteresesEnMemoria();
    if (simulado) await elegir().then((s) => s.cerrarSesion());
    else await authSupabase.cerrarSesion();
  },

  obtenerSesion: (): Promise<Sesion | null> => (simulado ? elegir().then((s) => s.obtenerSesion()) : authSupabase.obtenerSesion()),

  solicitarRecuperacion: (email: string): Promise<{ ok: boolean; motivo?: 'red' }> =>
    simulado ? elegir().then((s) => s.solicitarRecuperacion(email)) : authSupabase.solicitarRecuperacion(email),

  esperarRecuperacion: (): Promise<boolean> =>
    simulado ? Promise.resolve(true) : authSupabase.esperarRecuperacion(),

  cambiarContrasena: (nueva: string): Promise<{ ok: boolean; motivo?: 'debil' | 'red' | 'sin_sesion' }> =>
    simulado ? Promise.resolve(nueva.length >= 8 ? { ok: true } : { ok: false, motivo: 'debil' as const }) : authSupabase.cambiarContrasena(nueva),

  suscribirseASesion: (callback: (s: Sesion | null) => void): (() => void) => {
    if (!simulado) return authSupabase.suscribirseASesion(callback);
    let cancelar: () => void = () => {};
    let activo = true;
    elegir().then((s) => {
      if (activo) cancelar = s.suscribirseASesion(callback);
    });
    return () => {
      activo = false;
      cancelar();
    };
  },
};

// Funciones sueltas por compatibilidad con quien las importe directamente.
export const { iniciarSesion, cerrarSesion, obtenerSesion, solicitarRecuperacion, suscribirseASesion } = authService;
