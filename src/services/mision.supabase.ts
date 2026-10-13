import { getSupabase } from '@/lib/supabase';
import type { MisionParaResolver, MisionService, OpcionMision, ResultadoRespuesta, TipoRespuesta } from './mision.tipos';

/**
 * Misiones del alumno con datos reales. La RLS solo le deja leer lo de su curso. La respuesta correcta nunca viaja acá:
 * se manda la respuesta a una función del servidor (verificar-respuesta) que dice "correcta o no".
 */

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function filas(r: { data: unknown; error: { message: string } | null }): Fila[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data as Fila[]) ?? [];
}

async function estadoDeError(error: unknown): Promise<{ status: number | null; segundos?: number }> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (!ctx || typeof ctx.status !== 'number') return { status: null };
  let segundos: number | undefined;
  try {
    segundos = (await ctx.clone().json())?.segundosEspera;
  } catch {
    // sin cuerpo
  }
  return { status: ctx.status, segundos };
}

export const misionSupabase: MisionService = {
  async obtenerMision(misionId): Promise<MisionParaResolver> {
    const sb = getSupabase();
    const { data: ses } = await sb.auth.getSession();
    if (!ses.session) throw new Error('sin_sesion');
    const uid = ses.session.user.id;

    const m = (await sb.from('misiones').select('id, proyecto_id, orden, titulo, consigna, tipo_respuesta, opciones, tiene_pista, cantidad_pistas').eq('id', misionId).maybeSingle()).data as Fila | null;
    if (!m) throw new Error('no_encontrada');

    const [proyecto, hermanas, progreso, previa, consentimiento, valoracion] = await Promise.all([
      sb.from('proyectos').select('titulo').eq('id', m.proyecto_id).maybeSingle(),
      sb.from('misiones').select('id').eq('proyecto_id', m.proyecto_id),
      sb.from('progreso_misiones').select('estado, pistas_usadas').eq('mision_id', misionId).eq('alumno_id', uid).maybeSingle(),
      sb.from('respuestas_abiertas').select('texto').eq('mision_id', misionId).eq('alumno_id', uid).maybeSingle(),
      sb.from('consentimientos').select('estado').eq('alumno_id', uid).order('fecha', { ascending: false }).limit(1),
      sb.from('valoraciones_mision').select('marca, mensaje').eq('mision_id', misionId).eq('alumno_id', uid).maybeSingle(),
    ]);
    const v = valoracion.data as Fila | null;

    const tipo = m.tipo_respuesta as TipoRespuesta;
    return {
      id: m.id,
      titulo: m.titulo,
      enunciado: m.consigna ?? '',
      tipo,
      opciones: tipo === 'opcion' ? ((m.opciones as OpcionMision[]) ?? []) : [],
      orden: m.orden,
      total: filas(hermanas).length,
      proyectoNombre: (proyecto.data as Fila | null)?.titulo ?? '',
      completada: (progreso.data as Fila | null)?.estado === 'completada',
      respuestaPrevia: (previa.data as Fila | null)?.texto ?? undefined,
      valoracionDocente: v ? { marca: v.marca as 'encaminado' | 'repensar' | 'conversar', mensaje: (v.mensaje as string | null) ?? '' } : undefined,
      hayPista: !!m.tiene_pista,
      cantidadPistas: (m.cantidad_pistas as number | undefined) ?? (m.tiene_pista ? 1 : 0),
      pistasUsadas: ((progreso.data as Fila | null)?.pistas_usadas as number | undefined) ?? 0,
      sinConsentimiento: filas(consentimiento)[0]?.estado !== 'otorgado',
    };
  },

  async enviarRespuesta(misionId, respuesta): Promise<ResultadoRespuesta> {
    const { data, error } = await getSupabase().functions.invoke('verificar-respuesta', { body: { mision_id: misionId, respuesta } });
    if (error || !data?.ok) {
      const e = await estadoDeError(error);
      if (e.status === 422) return { estado: 'formato_invalido' };
      if (e.status === 429) return { estado: 'demasiados_intentos', segundosEspera: e.segundos ?? 60 };
      if (e.status === 403) return { estado: 'sin_permiso' };
      return { estado: 'error' };
    }
    if (data.correcta === false) return { estado: 'incorrecta' };
    return {
      estado: data.correcta === true ? 'correcta' : 'entregada',
      explicacion: data.explicacion ?? undefined,
      siguiente: data.siguiente ?? null,
    };
  },

  async pedirPista(misionId, otra = false): Promise<{ pistas: string[]; total: number }> {
    const { data, error } = await getSupabase().functions.invoke('pedir-pista', { body: { mision_id: misionId, accion: otra ? 'siguiente' : 'ver' } });
    if (error || !data?.ok) {
      const e = await estadoDeError(error);
      throw new Error(e.status === 404 ? 'sin_pista' : 'error');
    }
    const pistas = Array.isArray(data.pistas) ? (data.pistas as string[]) : [data.pista as string];
    return { pistas, total: typeof data.total === 'number' ? data.total : pistas.length };
  },
};
