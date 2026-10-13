// Reglas comunes de las funciones que trabajan sobre una misión de un alumno (verificar-respuesta, pedir-pista).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { error } from './comun.ts';
import type { OpcionMision, TipoRespuesta } from './respuestas.ts';
import { estaHabilitada } from './semanas.ts';

export interface ContextoMision {
  mision: { id: string; proyecto_id: string; orden: number; tipo_respuesta: TipoRespuesta; opciones: OpcionMision[] | null; tiene_pista: boolean };
  proyecto: { escuela_id: string; curso_id: string };
}

/**
 * La misión tiene que existir, ser de un proyecto ACTIVO del curso del alumno, y la familia tiene que haber dado el permiso.
 * Misma respuesta si no existe o no corresponde: no se revela qué existe.
 */
export async function contextoMision(admin: SupabaseClient, alumnoId: string, misionId: string): Promise<{ ok: true; ctx: ContextoMision } | { ok: false; respuesta: Response }> {
  const { data: m } = await admin
    .from('misiones')
    .select('id, proyecto_id, orden, tipo_respuesta, opciones, tiene_pista, etapas(semana), proyectos!inner(escuela_id, curso_id, estado, fecha_inicio)')
    .eq('id', misionId)
    .maybeSingle();
  const proyecto = (m as { proyectos?: { escuela_id: string; curso_id: string | null; estado: string; fecha_inicio: string | null } } | null)?.proyectos;
  if (!m || !proyecto || proyecto.estado !== 'activo' || !proyecto.curso_id) return { ok: false, respuesta: error(404, 'no_disponible') };
  // Una misión de una semana que todavía no empezó no existe para el alumno.
  if (!estaHabilitada(proyecto.fecha_inicio, (m as { etapas?: { semana: number } | null }).etapas?.semana)) return { ok: false, respuesta: error(404, 'no_disponible') };

  const { data: inscripcion } = await admin.from('inscripciones').select('alumno_id').eq('alumno_id', alumnoId).eq('curso_id', proyecto.curso_id).maybeSingle();
  if (!inscripcion) return { ok: false, respuesta: error(404, 'no_disponible') };

  const { data: consentimiento } = await admin.from('consentimientos').select('id').eq('alumno_id', alumnoId).eq('estado', 'otorgado').limit(1).maybeSingle();
  if (!consentimiento) return { ok: false, respuesta: error(403, 'sin_consentimiento') };

  const fila = m as unknown as ContextoMision['mision'];
  return { ok: true, ctx: { mision: fila, proyecto: { escuela_id: proyecto.escuela_id, curso_id: proyecto.curso_id } } };
}

/** La próxima misión del proyecto que el alumno todavía no completó (primero las que siguen en orden; si no, las anteriores pendientes). */
export async function siguienteMision(admin: SupabaseClient, alumnoId: string, proyectoId: string, ordenActual: number): Promise<{ id: string; titulo: string } | null> {
  const { data: ms } = await admin.from('misiones').select('id, titulo, orden, etapas(semana), proyectos!inner(fecha_inicio)').eq('proyecto_id', proyectoId).order('orden');
  // Solo las que ya se habilitaron: nunca se manda a un alumno a una misión de una semana futura.
  const lista = ((ms ?? []) as unknown as { id: string; titulo: string; orden: number; etapas: { semana: number } | null; proyectos: { fecha_inicio: string | null } }[]).filter((x) => estaHabilitada(x.proyectos?.fecha_inicio, x.etapas?.semana));
  if (lista.length === 0) return null;
  const { data: hechas } = await admin.from('progreso_misiones').select('mision_id').eq('alumno_id', alumnoId).eq('estado', 'completada').in('mision_id', lista.map((x) => x.id));
  const hecha = new Set((hechas ?? []).map((h) => h.mision_id as string));
  const pendientes = lista.filter((x) => !hecha.has(x.id));
  const siguiente = pendientes.find((x) => x.orden > ordenActual) ?? pendientes[0] ?? null;
  return siguiente ? { id: siguiente.id, titulo: siguiente.titulo } : null;
}
