import { getSupabase } from '@/lib/supabase';
import { usarSupabase } from './modo';
import { authService } from './auth';
import { agruparEnHojas, type FilaHoja, type HojaSemana } from '@/lib/hojasImprimibles';

export interface AvanceArea {
  materia: string;
  porcentaje: number;
  completadas: number;
  total: number;
}

export interface HijoResumen {
  alumnoId: string;
  nombre: string;
  curso: string;
  consentimiento: 'pendiente' | 'otorgado' | 'revocado';
  avance: AvanceArea[];
  semana: { diasActivos: number; misionesCompletadas: number };
}

export interface ResumenFamilia {
  tutorNombre: string;
  hijos: HijoResumen[];
}

export interface DatosCanje {
  codigo: string;
  /** Solo si todavía no tiene cuenta */
  nombre?: string;
  email?: string;
  password?: string;
}

export type ResultadoCanje =
  | { ok: true; cuentaNueva: boolean }
  | { ok: false; motivo: 'codigo_invalido' | 'codigo_vencido' | 'ya_vinculada' | 'cuenta_existente' | 'bloqueado' | 'datos' | 'red'; segundos?: number };

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const abreviar = (area: string) => ({ Matemática: 'Mate', 'Ciencias Naturales': 'Cs. Nat.' } as Record<string, string>)[area] ?? area;

function filas(r: { data: unknown; error: { message: string } | null }): Fila[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data as Fila[]) ?? [];
}

// Datos de ejemplo: SOLO desarrollo con el interruptor apagado (no viajan en producción).
function ejemplo(): ResumenFamilia {
  return {
    tutorNombre: 'Familia de ejemplo',
    hijos: [
      {
        alumnoId: 'ejemplo-1', nombre: 'Mateo', curso: '5º B', consentimiento: 'otorgado',
        avance: [
          { materia: 'Mate', porcentaje: 72, completadas: 3, total: 4 },
          { materia: 'Cs. Nat.', porcentaje: 58, completadas: 2, total: 4 },
          { materia: 'Lengua', porcentaje: 85, completadas: 3, total: 4 },
        ],
        semana: { diasActivos: 3, misionesCompletadas: 4 },
      },
    ],
  };
}

export const familiaService = {
  /**
   * La familia habilita a su hijo/a para entrar desde otro dispositivo (cambió de tablet, borró los datos del navegador).
   * Devuelve un código de 8 caracteres, de un solo uso y con vencimiento corto: se muestra una sola vez.
   */
  async generarAccesoHijo(alumnoId: string): Promise<{ codigo: string; venceEn: string }> {
    if (import.meta.env.DEV && !usarSupabase) throw new Error('Solo disponible con la base real');
    const { data, error } = await getSupabase().functions.invoke('generar-acceso', { body: { alumno_id: alumnoId } });
    if (error || !data?.ok) throw new Error('No se pudo generar el acceso');
    return { codigo: data.codigo, venceEn: data.vence_en };
  },

  /**
   * Hojas imprimibles de misiones de un hijo/a: una por semana ya habilitada. La base solo responde por los propios y
   * NUNCA incluye respuestas correctas ni pistas.
   */
  async obtenerHojasHijo(alumnoId: string): Promise<HojaSemana[]> {
    if (import.meta.env.DEV && !usarSupabase) {
      return agruparEnHojas([
        { proyecto_id: 'e1', proyecto_titulo: 'La huerta de la escuela', semana: 1, etapa_titulo: 'Explorando nuestra huerta', etapa_objetivo: 'Mirar y registrar qué necesitan las plantas.', mision_id: 'm1', orden: 1, titulo: 'Observá la tierra', consigna: 'Mirá la tierra de la huerta y contá cómo es.', tipo_respuesta: 'abierta', opciones: null, curso_nombre: '5º B', escuela_nombre: 'Escuela de ejemplo', alumno_nombre: 'Mateo' },
        { proyecto_id: 'e1', proyecto_titulo: 'La huerta de la escuela', semana: 1, etapa_titulo: 'Explorando nuestra huerta', etapa_objetivo: 'Mirar y registrar qué necesitan las plantas.', mision_id: 'm2', orden: 2, titulo: 'Medí tu planta', consigna: 'Medía 12 cm y ahora mide 15,5 cm. ¿Cuántos centímetros creció?', tipo_respuesta: 'numero', opciones: null, curso_nombre: '5º B', escuela_nombre: 'Escuela de ejemplo', alumno_nombre: 'Mateo' },
      ]);
    }
    const r = await getSupabase().rpc('hoja_misiones_hijo', { p_alumno: alumnoId });
    return agruparEnHojas(filas(r) as unknown as FilaHoja[]);
  },

  /** Resumen (no notas) de cada hijo/a vinculado/a a la cuenta. La base solo responde por los propios. */
  async obtenerResumen(): Promise<ResumenFamilia> {
    if (import.meta.env.DEV && !usarSupabase) return ejemplo();
    const sb = getSupabase();
    const { data: ses } = await sb.auth.getSession();
    if (!ses.session) throw new Error('sin_sesion');
    const uid = ses.session.user.id;

    const [yo, vinculos] = await Promise.all([
      sb.from('perfiles').select('nombre_visible').eq('id', uid).maybeSingle(),
      sb.from('familias_vinculos').select('alumno_id').eq('familia_id', uid),
    ]);
    const ids = filas(vinculos).map((v) => v.alumno_id as string);
    const hijos: HijoResumen[] = [];
    for (const id of ids) {
      const [perfil, insc, cons, resumen, semana] = await Promise.all([
        sb.from('perfiles').select('nombre_visible').eq('id', id).maybeSingle(),
        sb.from('inscripciones').select('curso_id').eq('alumno_id', id),
        sb.from('consentimientos').select('estado').eq('alumno_id', id).order('fecha', { ascending: false }).limit(1),
        sb.rpc('resumen_hijo', { p_alumno: id }),
        sb.rpc('actividad_semana_hijo', { p_alumno: id }),
      ]);
      const cursoId = filas(insc)[0]?.curso_id as string | undefined;
      const curso = cursoId ? ((await sb.from('cursos').select('nombre').eq('id', cursoId).maybeSingle()).data as Fila | null) : null;
      const act = filas(semana)[0] ?? { dias_activos: 0, misiones_completadas: 0 };
      hijos.push({
        alumnoId: id,
        nombre: (perfil.data as Fila | null)?.nombre_visible ?? '',
        curso: curso?.nombre ?? '',
        consentimiento: (filas(cons)[0]?.estado ?? 'pendiente') as HijoResumen['consentimiento'],
        avance: filas(resumen).map((r) => ({
          materia: abreviar(r.area),
          completadas: r.completadas,
          total: r.total,
          porcentaje: r.total > 0 ? Math.round((100 * r.completadas) / r.total) : 0,
        })),
        semana: { diasActivos: act.dias_activos, misionesCompletadas: act.misiones_completadas },
      });
    }
    return { tutorNombre: (yo.data as Fila | null)?.nombre_visible ?? '', hijos };
  },

  /**
   * Canjea el código de invitación de la docente: crea la cuenta de la familia (sin sesión) o vincula
   * otro hijo/a a la cuenta que ya está abierta (con sesión).
   */
  async canjearInvitacion(datos: DatosCanje): Promise<ResultadoCanje> {
    if (import.meta.env.DEV && !usarSupabase) return { ok: true, cuentaNueva: !!datos.email };
    const sb = getSupabase();
    const sesion = await authService.obtenerSesion();
    const body = sesion
      ? { codigo: datos.codigo }
      : { codigo: datos.codigo, nombre_visible: datos.nombre, email: datos.email, password: datos.password };

    const { data, error } = await sb.functions.invoke('canjear-invitacion', { body });
    if (error || !data?.ok) {
      const ctx = (error as { context?: Response } | null)?.context;
      if (!ctx || typeof ctx.status !== 'number') return { ok: false, motivo: 'red' };
      let cuerpo: Fila = {};
      try { cuerpo = await ctx.clone().json(); } catch { /* sin cuerpo */ }
      switch (ctx.status) {
        case 400: return { ok: false, motivo: 'datos' };
        case 404: return { ok: false, motivo: 'codigo_invalido' };
        case 410: return { ok: false, motivo: 'codigo_vencido' };
        case 409: return { ok: false, motivo: cuerpo.error === 'ya_vinculada' ? 'ya_vinculada' : 'cuenta_existente' };
        case 429: return { ok: false, motivo: 'bloqueado', segundos: cuerpo.segundosEspera ?? 60 };
        default: return { ok: false, motivo: 'red' };
      }
    }
    // Cuenta nueva: se abre la sesión con la contraseña que acaba de elegir.
    if (data.cuentaNueva && datos.email && datos.password) {
      const ingreso = await authService.iniciarSesion(datos.email, datos.password);
      if (!ingreso.ok) return { ok: false, motivo: 'red' };
    }
    return { ok: true, cuentaNueva: !!data.cuentaNueva };
  },
};
