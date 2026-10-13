import type { AuthError, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import type { ResultadoIngreso, RolUsuario, Sesion } from './auth.tipos';

/**
 * Implementación REAL del servicio de autenticación (Supabase Auth).
 * Respeta el mismo contrato que la versión simulada de ./auth.ts, así las
 * pantallas no cambian. La barrera de seguridad verdadera es la RLS de la base:
 * esto solo decide qué pantalla mostrar.
 */

// Un usuario puede tener varias membresías (docente en una escuela, familia en otra).
// El contrato devuelve un solo rol; se elige por esta prioridad.
const PRIORIDAD: RolUsuario[] = ['directivo', 'docente', 'familia', 'alumno'];

const ESPERA_POR_DEFECTO_SEG = 60;

type Resultado<T> = { ok: true; valor: T } | { ok: false; motivo: 'red' | 'sin_acceso' };

function esErrorDeRed(error: AuthError | { message?: string; name?: string } | null | undefined): boolean {
  if (!error) return false;
  const nombre = (error as { name?: string }).name ?? '';
  const mensaje = (error.message ?? '').toLowerCase();
  return (
    nombre === 'AuthRetryableFetchError' ||
    nombre === 'AuthUnknownError' ||
    mensaje.includes('failed to fetch') ||
    mensaje.includes('fetch failed') ||
    mensaje.includes('network')
  );
}

function esLimiteDeIntentos(error: AuthError): boolean {
  return (
    error.status === 429 ||
    (error as { code?: string }).code === 'over_request_rate_limit' ||
    (error as { code?: string }).code === 'over_email_send_rate_limit'
  );
}

export function crearAuthSupabase(client: SupabaseClient) {
  async function construirSesion(usuarioId: string): Promise<Resultado<Sesion>> {
    const [membresias, perfil] = await Promise.all([
      client.from('membresias').select('rol, escuela_id').eq('usuario_id', usuarioId).eq('activa', true),
      client.from('perfiles').select('nombre_visible').eq('id', usuarioId).maybeSingle(),
    ]);

    if (membresias.error || perfil.error) {
      const e = membresias.error ?? perfil.error;
      return { ok: false, motivo: esErrorDeRed(e) ? 'red' : 'sin_acceso' };
    }
    const filas = membresias.data ?? [];
    if (filas.length === 0) return { ok: false, motivo: 'sin_acceso' };

    const elegida = [...filas].sort(
      (a, b) => PRIORIDAD.indexOf(a.rol as RolUsuario) - PRIORIDAD.indexOf(b.rol as RolUsuario)
    )[0];

    const { data: escuela } = await client.from('escuelas').select('nombre, localidad').eq('id', elegida.escuela_id).maybeSingle();

    return {
      ok: true,
      valor: {
        usuarioId,
        nombreVisible: perfil.data?.nombre_visible ?? '',
        rol: elegida.rol as RolUsuario,
        escuelaId: elegida.escuela_id as string,
        escuelaNombre: escuela ? `${escuela.nombre}${escuela.localidad ? `, ${escuela.localidad}` : ''}` : undefined,
      },
    };
  }

  async function iniciarSesion(email: string, password: string): Promise<ResultadoIngreso> {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (esLimiteDeIntentos(error)) {
        return { ok: false, motivo: 'bloqueado', segundosEspera: ESPERA_POR_DEFECTO_SEG };
      }
      if (esErrorDeRed(error)) return { ok: false, motivo: 'red' };
      // Credenciales malas, mail sin confirmar, usuario inexistente...: todo igual hacia afuera.
      return { ok: false, motivo: 'credenciales' };
    }

    const sesion = await construirSesion(data.user.id);
    if (!sesion.ok) {
      // Cuenta válida pero sin membresía activa: no se deja pasar y no se explica por qué.
      await client.auth.signOut({ scope: 'local' });
      return { ok: false, motivo: sesion.motivo === 'red' ? 'red' : 'credenciales' };
    }
    return { ok: true, sesion: sesion.valor };
  }

  async function cerrarSesion(): Promise<void> {
    await client.auth.signOut({ scope: 'local' });
  }

  async function obtenerSesion(): Promise<Sesion | null> {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    const sesion = await construirSesion(data.session.user.id);
    return sesion.ok ? sesion.valor : null;
  }

  async function solicitarRecuperacion(email: string): Promise<{ ok: boolean; motivo?: 'red' }> {
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${globalThis.location?.origin ?? ''}/restablecer`,
    });
    // Solo un fallo de conexión se informa; cualquier otro caso responde igual
    // para no revelar si el mail está registrado.
    if (error && esErrorDeRed(error)) return { ok: false, motivo: 'red' };
    return { ok: true };
  }

  function suscribirseASesion(callback: (s: Sesion | null) => void): () => void {
    const { data } = client.auth.onAuthStateChange((_evento, session) => {
      // Importante: no llamar al cliente dentro del callback (puede trabarse); se difiere.
      setTimeout(async () => {
        if (!session) return callback(null);
        const sesion = await construirSesion(session.user.id);
        callback(sesion.ok ? sesion.valor : null);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }

  /**
   * ¿Se llegó desde el enlace de recuperación del mail? El enlace trae un token en la URL (type=recovery) que
   * el cliente de Supabase procesa y borra enseguida: por eso `traeToken` se lee ANTES de crear el cliente.
   */
  function esperarRecuperacion(traeToken: boolean): Promise<boolean> {
    return new Promise((resolver) => {
      let listo = false;
      const fin = (valor: boolean) => {
        if (listo) return;
        listo = true;
        suscripcion.data.subscription.unsubscribe();
        resolver(valor);
      };
      const suscripcion = client.auth.onAuthStateChange((evento) => {
        if (evento === 'PASSWORD_RECOVERY') fin(true);
      });
      setTimeout(async () => {
        const { data } = await client.auth.getSession();
        fin(traeToken && !!data.session);
      }, 3500);
    });
  }

  async function cambiarContrasena(nueva: string): Promise<{ ok: boolean; motivo?: 'debil' | 'red' | 'sin_sesion' }> {
    if (nueva.length < 8 || nueva.length > 72) return { ok: false, motivo: 'debil' };
    const { error } = await client.auth.updateUser({ password: nueva });
    if (error) {
      if (esErrorDeRed(error)) return { ok: false, motivo: 'red' };
      if (error.status === 401 || /session/i.test(error.message)) return { ok: false, motivo: 'sin_sesion' };
      return { ok: false, motivo: 'debil' };
    }
    await client.auth.signOut({ scope: 'local' }); // obliga a ingresar con la contraseña nueva
    return { ok: true };
  }

  return { iniciarSesion, cerrarSesion, obtenerSesion, solicitarRecuperacion, suscribirseASesion, esperarRecuperacion, cambiarContrasena };
}

/** Servicio real listo para usar con el cliente compartido (se crea al primer uso). */
export const authSupabase = {
  iniciarSesion: (e: string, p: string) => crearAuthSupabase(getSupabase()).iniciarSesion(e, p),
  cerrarSesion: () => crearAuthSupabase(getSupabase()).cerrarSesion(),
  obtenerSesion: () => crearAuthSupabase(getSupabase()).obtenerSesion(),
  solicitarRecuperacion: (e: string) => crearAuthSupabase(getSupabase()).solicitarRecuperacion(e),
  suscribirseASesion: (cb: (s: Sesion | null) => void) => crearAuthSupabase(getSupabase()).suscribirseASesion(cb),
  // La URL se lee ANTES de crear el cliente (que la limpia al procesar el token de recuperación).
  esperarRecuperacion: () => {
    const traeToken = /type=recovery/.test(globalThis.location?.hash ?? '');
    return crearAuthSupabase(getSupabase()).esperarRecuperacion(traeToken);
  },
  cambiarContrasena: (nueva: string) => crearAuthSupabase(getSupabase()).cambiarContrasena(nueva),
};
