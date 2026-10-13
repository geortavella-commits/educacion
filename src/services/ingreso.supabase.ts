import { getSupabase } from '@/lib/supabase';
import type { EstadoIngreso, EstadoSolicitud, IngresoService, ValidacionCodigoResult } from './ingreso.tipos';

/**
 * Ingreso de primaria por código de clase (modo real). Todo pasa por Edge Functions: el alumno todavía
 * no tiene cuenta. Lo único que se guarda en el dispositivo es el SECRETO de la solicitud pendiente
 * (sirve para reclamar la sesión una vez aprobada, durante 24 h, y se borra al usarlo).
 */
const CLAVE_SOLICITUD = 'chasqui_ingreso_pendiente';

interface RespuestaError { status: number; segundos?: number }

async function leerError(error: unknown): Promise<RespuestaError | 'red'> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (!ctx || typeof ctx.status !== 'number') return 'red';
  let segundos: number | undefined;
  try {
    segundos = (await ctx.clone().json())?.segundosEspera;
  } catch {
    // sin cuerpo
  }
  return { status: ctx.status, segundos };
}

function guardarSolicitud(id: string, secreto: string) {
  try { localStorage.setItem(CLAVE_SOLICITUD, JSON.stringify({ id, secreto })); } catch { /* sin almacenamiento */ }
}
function leerSolicitud(): { id: string; secreto: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_SOLICITUD) ?? 'null');
    return v && typeof v.id === 'string' && typeof v.secreto === 'string' ? v : null;
  } catch { return null; }
}
function borrarSolicitud() {
  try { localStorage.removeItem(CLAVE_SOLICITUD); } catch { /* sin almacenamiento */ }
}

function aEstado(e: RespuestaError | 'red'): { estado: EstadoIngreso; mensaje: string; segundosBloqueo?: number } {
  if (e === 'red') return { estado: 'error_red', mensaje: 'No hay conexión con la escuela. Revisá tu internet y volvé a probar.' };
  if (e.status === 429) return { estado: 'demasiados_intentos', mensaje: 'Probaste muchas veces. Esperá 1 minuto y volvé a intentar.', segundosBloqueo: e.segundos ?? 60 };
  if (e.status === 410) return { estado: 'vencido', mensaje: 'Este código ya venció. Pedile uno nuevo a tu seño.' };
  return { estado: 'incorrecto', mensaje: 'El código no coincide con ninguna clase activa. Revisá las 6 letras o números. Si tenés un código de acceso de 8 letras, usá “Entrá con tu código de acceso”, más abajo.' };
}

export const ingresoSupabase: IngresoService = {
  async validarCodigo(codigo: string): Promise<ValidacionCodigoResult> {
    const { data, error } = await getSupabase().functions.invoke('canjear-codigo', {
      body: { codigo: codigo.trim().toUpperCase(), solo_validar: true },
    });
    if (error || !data?.ok) return aEstado(await leerError(error));
    const vence = new Date(data.vence_en);
    return {
      estado: 'valido',
      cursoInfo: {
        id: '',
        nombre: data.curso,
        anio: '',
        docente: data.docente ?? 'tu seño',
        vencimiento: `Hasta el ${vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`,
      },
    };
  },

  async solicitarIngresoAlumno(codigo, nombre, avatarId) {
    const { data, error } = await getSupabase().functions.invoke('canjear-codigo', {
      body: { codigo: codigo.trim().toUpperCase(), nombre_visible: nombre, avatar: avatarId },
    });
    if (error || !data?.ok) {
      const e = await leerError(error);
      const r = aEstado(e);
      // 400 acá casi siempre es el nombre (números, mails, símbolos): se le explica al chico.
      const mensaje = e !== 'red' && e.status === 400 ? 'Escribí solo tu nombre de pila, con letras (sin números ni símbolos).' : r.mensaje;
      return { exito: false, estado: e !== 'red' && e.status === 400 ? 'incorrecto' : r.estado, mensaje, segundosBloqueo: r.segundosBloqueo };
    }
    guardarSolicitud(data.solicitud_id, data.secreto);
    return { exito: true, estado: 'esperando_aprobacion' };
  },

  haySolicitudEnEspera(): boolean {
    return leerSolicitud() !== null;
  },

  async entrarConCodigoAcceso(codigo: string) {
    const sb = getSupabase();
    const { data, error } = await sb.functions.invoke('canjear-acceso', { body: { codigo } });
    if (error || !data?.ok) {
      const e = await leerError(error);
      if (e === 'red') return { exito: false, motivo: 'red' as const };
      if (e.status === 429) return { exito: false, motivo: 'bloqueado' as const };
      if (e.status === 410) return { exito: false, motivo: 'vencido' as const };
      return { exito: false, motivo: 'invalido' as const };
    }
    // El enlace es de un solo uso: abre la sesión del MISMO alumno (sin contraseña).
    const { error: errOtp } = await sb.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
    if (errOtp) return { exito: false, motivo: 'red' as const };
    return { exito: true };
  },

  async consultarEstadoSolicitud(): Promise<EstadoSolicitud> {
    const sol = leerSolicitud();
    if (!sol) return 'sin_solicitud';
    const sb = getSupabase();
    const { data, error } = await sb.functions.invoke('reclamar-ingreso', { body: { solicitud_id: sol.id, secreto: sol.secreto } });
    if (error || !data?.ok) {
      const e = await leerError(error);
      if (e !== 'red' && (e.status === 404 || e.status === 410)) {
        borrarSolicitud(); // la solicitud ya no existe o venció el plazo de reclamo
        return 'sin_solicitud';
      }
      return 'error';
    }
    if (data.estado === 'pendiente') return 'pendiente';
    if (data.estado === 'rechazada') {
      borrarSolicitud();
      return 'rechazada';
    }
    const { error: errOtp } = await sb.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
    if (errOtp) return 'error';
    borrarSolicitud();
    return 'aprobada';
  },
};
