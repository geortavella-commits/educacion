import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { codigoDeErrorFuncion } from '@/lib/mensajesIA';
import type { DatosRespuestaMision, RespuestaSugeridaIA } from '@/lib/borradorRespuesta';
import type { MarcaValoracion } from '@/lib/valoracionMision';
import { agruparEnHojas, respuestaLegible, type FilaHoja, type HojaSemana } from '@/lib/hojasImprimibles';
import type {
  AlumnoConAvance,
  ContextoCurricular,
  CoberturaProyecto,
  PlanSugerido,
  AlumnoCurso,
  Devolucion,
  DocenteService,
  EstadoProyectoDocente,
  GrupoDetalle,
  GrupoLista,
  ProyectoGestion,
  ProyectoGestionItem,
  TipoDevolucion,
} from './docente.tipos';

/**
 * Gestión de grupos por proyecto, proyectos con avance, alumnos y devoluciones (Supabase real).
 * La seguridad no depende de este archivo: la RLS y los triggers de la base son la barrera
 * (un grupo solo puede colgar de un proyecto de su curso y solo suma alumnos inscriptos en ese curso).
 */

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Gestion = Pick<
  DocenteService,
  | 'obtenerContextoCurricular'
  | 'obtenerCoberturaProyecto'
  | 'obtenerHojasProyecto'
  | 'valorarMision'
  | 'quitarValoracionMision'
  | 'marcarMisionEnPapel'
  | 'desmarcarMisionEnPapel'
  | 'listarGrupos'
  | 'obtenerGrupo'
  | 'agregarAlumnosAGrupo'
  | 'quitarAlumnoDeGrupo'
  | 'eliminarGrupo'
  | 'listarProyectosGestion'
  | 'obtenerProyectoGestion'
  | 'actualizarProyecto'
  | 'agregarMision'
  | 'eliminarProyecto'
  | 'datosParaSugerirGrupos'
  | 'generarAcceso'
  | 'estadoCodigoClase'
  | 'generarCodigoClase'
  | 'sugerirProyecto'
  | 'planificarProyecto'
  | 'sugerirBorradorMensaje'
  | 'sugerirNombresGrupos'
  | 'listarAlumnos'
  | 'listarDevoluciones'
  | 'crearDevolucion'
  | 'eliminarDevolucion'
>;

const SIN_ID = '00000000-0000-0000-0000-000000000000';

/** Lo que devuelven las funciones de IA para una misión (nombres de la base). */
interface MisionIA {
  titulo: string;
  consigna: string;
  contenido_id: string | null;
  respuesta: { tipo_respuesta: 'abierta' | 'numero' | 'texto' | 'opcion'; respuestas: string[]; tolerancia: number; opciones: { id: string; texto: string }[] | null; pistas: string[]; explicacion: string | null } | null;
}

const aRespuestaIA = (r: MisionIA['respuesta'] | undefined): RespuestaSugeridaIA | null =>
  r ? { tipoRespuesta: r.tipo_respuesta, respuestas: r.respuestas, tolerancia: r.tolerancia, opciones: r.opciones, pistas: r.pistas, explicacion: r.explicacion } : null;

/** Fila de `misiones` con TODAS las columnas (un alta en bloque exige que todas las filas traigan los mismos campos). */
export function filaMision(proyectoId: string, orden: number, m: { titulo: string; consigna?: string; contenidoId?: string; respuesta?: DatosRespuestaMision }, etapaId: string | null = null) {
  const r = m.respuesta;
  return {
    proyecto_id: proyectoId,
    orden,
    titulo: m.titulo.trim(),
    consigna: m.consigna?.trim() || null,
    contenido_id: m.contenidoId ?? null,
    tipo_respuesta: r?.tipoRespuesta ?? 'abierta',
    opciones: r?.tipoRespuesta === 'opcion' ? (r.opciones ?? null) : null,
    tiene_pista: !!r?.pistas?.length,
    cantidad_pistas: Math.min(3, r?.pistas?.length ?? 0),
    etapa_id: etapaId,
  };
}

/** Fila de `misiones_claves` (la respuesta correcta, secreta): solo hace falta si hay respuesta que corregir, pista o explicación. */
export function filaClave(misionId: string, r?: DatosRespuestaMision) {
  if (!r || (r.tipoRespuesta === 'abierta' && !r.pistas?.length && !r.explicacion)) return null;
  return {
    mision_id: misionId,
    respuestas: r.tipoRespuesta === 'abierta' ? [] : (r.respuestas ?? []),
    tolerancia: r.tolerancia ?? 0,
    pistas: (r.pistas ?? []).slice(0, 3),
    explicacion: r.explicacion ?? null,
  };
}

function filas(r: { data: unknown; error: { message: string } | null }): Fila[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data as Fila[]) ?? [];
}

async function usuarioActual(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new Error('sin_sesion');
  return data.session.user.id;
}

/** Todo lo que hace falta para calcular avances de los cursos de la docente. */
async function cargar(sb: SupabaseClient) {
  const uid = await usuarioActual(sb);
  const cd = filas(await sb.from('curso_docentes').select('curso_id').eq('usuario_id', uid));
  const cursoIds = cd.map((c) => c.curso_id as string);
  const enCursos = cursoIds.length ? cursoIds : [SIN_ID];
  const [cursos, inscripciones, proyectos, grupos] = await Promise.all([
    sb.from('cursos').select('id, nombre, anio').in('id', enCursos).order('anio'),
    sb.from('inscripciones').select('curso_id, alumno_id').in('curso_id', enCursos),
    sb.from('proyectos').select('id, titulo, descripcion, curso_id, estado, created_at, fecha_inicio').in('curso_id', enCursos).order('created_at'),
    sb.from('grupos').select('id, nombre_visible, estado, curso_id, proyecto_id').in('curso_id', enCursos).order('nombre_visible'),
  ]).then((r) => r.map(filas));
  const proyectoIds = proyectos.map((p) => p.id as string);
  const grupoIds = grupos.map((g) => g.id as string);
  const alumnoIds = [...new Set(inscripciones.map((i) => i.alumno_id as string))];
  const [misiones, miembros, internos, perfiles, etapas] = await Promise.all([
    proyectoIds.length ? sb.from('misiones').select('id, proyecto_id, orden, titulo, consigna, tipo_respuesta, etapa_id').in('proyecto_id', proyectoIds).order('orden') : { data: [], error: null },
    grupoIds.length ? sb.from('grupo_miembros').select('grupo_id, alumno_id').in('grupo_id', grupoIds) : { data: [], error: null },
    grupoIds.length ? sb.from('grupos_internos').select('grupo_id, etiqueta').in('grupo_id', grupoIds) : { data: [], error: null },
    alumnoIds.length ? sb.from('perfiles').select('id, nombre_visible').in('id', alumnoIds) : { data: [], error: null },
    proyectoIds.length ? sb.from('etapas').select('id, proyecto_id, semana, titulo, objetivo').in('proyecto_id', proyectoIds).order('semana') : { data: [], error: null },
  ]).then((r) => r.map(filas));
  const misionIds = misiones.map((m) => m.id as string);
  const progreso = misionIds.length
    ? filas(await sb.from('progreso_misiones').select('mision_id, alumno_id').eq('estado', 'completada').in('mision_id', misionIds))
    : [];
  return {
    uid,
    cursos,
    inscripciones,
    proyectos,
    grupos,
    misiones,
    etapas,
    miembros,
    progreso,
    etiqueta: new Map(internos.map((i) => [i.grupo_id as string, i.etiqueta as string])),
    nombre: new Map(perfiles.map((p) => [p.id as string, p.nombre_visible as string])),
  };
}
type Base = Awaited<ReturnType<typeof cargar>>;

const alumnosDelCurso = (b: Base, cursoId: string) => b.inscripciones.filter((i) => i.curso_id === cursoId).map((i) => i.alumno_id as string);
const nombreCurso = (b: Base, cursoId: string) => (b.cursos.find((c) => c.id === cursoId)?.nombre as string | undefined) ?? '';
const misionesDe = (b: Base, proyectoId: string) => b.misiones.filter((m) => m.proyecto_id === proyectoId);

function completadasDe(b: Base, proyectoId: string, alumnos: Set<string>): number {
  const ids = new Set(misionesDe(b, proyectoId).map((m) => m.id as string));
  return b.progreso.filter((p) => ids.has(p.mision_id) && alumnos.has(p.alumno_id)).length;
}

function porcentaje(completadas: number, alumnos: number, misiones: number) {
  const total = alumnos * misiones;
  return total > 0 ? Math.round((100 * completadas) / total) : 0;
}

function miembrosDe(b: Base, grupoId: string): string[] {
  return b.miembros.filter((m) => m.grupo_id === grupoId).map((m) => m.alumno_id as string);
}

function armarGrupo(b: Base, g: Fila): GrupoLista {
  const proy = g.proyecto_id ? b.proyectos.find((p) => p.id === g.proyecto_id) : undefined;
  const miembros = new Set(miembrosDe(b, g.id));
  return {
    id: g.id,
    nombreVisible: g.nombre_visible,
    etiquetaDocente: b.etiqueta.get(g.id) ?? '',
    estado: g.estado,
    proyectoId: proy?.id ?? null,
    proyectoTitulo: proy?.titulo ?? null,
    cursoId: g.curso_id,
    curso: nombreCurso(b, g.curso_id),
    alumnos: miembros.size,
    avance: proy ? porcentaje(completadasDe(b, proy.id, miembros), miembros.size, misionesDe(b, proy.id).length) : 0,
  };
}

function armarProyecto(b: Base, p: Fila): ProyectoGestionItem {
  const alumnos = new Set(alumnosDelCurso(b, p.curso_id));
  const ms = misionesDe(b, p.id);
  return {
    id: p.id,
    titulo: p.titulo,
    estado: p.estado as EstadoProyectoDocente,
    cursoId: p.curso_id,
    curso: nombreCurso(b, p.curso_id),
    alumnos: alumnos.size,
    avance: porcentaje(completadasDe(b, p.id, alumnos), alumnos.size, ms.length),
    misiones: ms.length,
    grupos: b.grupos.filter((g) => g.proyecto_id === p.id).length,
  };
}

const comparar = (a: string, b: string) => a.localeCompare(b, 'es');

export const gestionSupabase: Gestion = {
  async valorarMision(misionId, alumnoId, marca: MarcaValoracion, mensaje): Promise<void> {
    const sb = getSupabase();
    const { data: ses } = await sb.auth.getSession();
    const uid = ses.session?.user.id;
    if (!uid) throw new Error('sin_sesion');
    const texto = mensaje.trim();
    const { error } = await sb
      .from('valoraciones_mision')
      .upsert({ mision_id: misionId, alumno_id: alumnoId, autor_id: uid, marca, mensaje: texto === '' ? null : texto }, { onConflict: 'mision_id,alumno_id' });
    if (error) throw new Error(error.message);
  },

  async marcarMisionEnPapel(misionId, alumnoId): Promise<void> {
    const { error } = await getSupabase().rpc('marcar_mision_en_papel', { p_mision: misionId, p_alumno: alumnoId });
    if (error) throw new Error(error.message);
  },

  async desmarcarMisionEnPapel(misionId, alumnoId): Promise<void> {
    const { error } = await getSupabase().rpc('desmarcar_mision_en_papel', { p_mision: misionId, p_alumno: alumnoId });
    if (error) throw new Error(error.message);
  },

  async quitarValoracionMision(misionId, alumnoId): Promise<void> {
    const { error } = await getSupabase().from('valoraciones_mision').delete().eq('mision_id', misionId).eq('alumno_id', alumnoId);
    if (error) throw new Error(error.message);
  },

  async obtenerHojasProyecto(proyectoId, conClaves): Promise<HojaSemana[]> {
    const sb = getSupabase();
    const proy = (await sb.from('proyectos').select('id, titulo, curso_id, created_at').eq('id', proyectoId).maybeSingle()).data as Fila | null;
    if (!proy) throw new Error('Proyecto no encontrado');
    const curso = (await sb.from('cursos').select('nombre, escuela_id').eq('id', proy.curso_id).maybeSingle()).data as Fila | null;
    const esc = curso ? ((await sb.from('escuelas').select('nombre').eq('id', curso.escuela_id).maybeSingle()).data as Fila | null) : null;
    const [etapas, misiones] = await Promise.all([
      sb.from('etapas').select('id, semana, titulo, objetivo').eq('proyecto_id', proyectoId),
      sb.from('misiones').select('id, orden, titulo, consigna, tipo_respuesta, opciones, etapa_id').eq('proyecto_id', proyectoId).order('orden'),
    ]);
    for (const r of [etapas, misiones]) if (r.error) throw new Error(r.error.message);
    const etapaDe = new Map(((etapas.data as Fila[]) ?? []).map((e) => [e.id as string, e]));
    const ms = (misiones.data as Fila[]) ?? [];

    const claves = new Map<string, string[]>();
    if (conClaves && ms.length > 0) {
      const k = await sb.from('misiones_claves').select('mision_id, respuestas').in('mision_id', ms.map((m) => m.id as string));
      if (k.error) throw new Error(k.error.message);
      for (const r of (k.data as Fila[]) ?? []) claves.set(r.mision_id as string, ((r.respuestas as unknown[]) ?? []).filter((x): x is string => typeof x === 'string'));
    }

    const filasHoja: FilaHoja[] = ms.map((m) => {
      const e = m.etapa_id ? etapaDe.get(m.etapa_id as string) : undefined;
      return {
        proyecto_id: proyectoId, proyecto_titulo: proy.titulo as string,
        semana: (e?.semana as number | undefined) ?? null, etapa_titulo: (e?.titulo as string | undefined) ?? null, etapa_objetivo: (e?.objetivo as string | null | undefined) ?? null,
        mision_id: m.id as string, orden: m.orden as number, titulo: m.titulo as string, consigna: (m.consigna as string | null) ?? null,
        tipo_respuesta: m.tipo_respuesta as string, opciones: (m.opciones as { id: string; texto: string }[] | null) ?? null,
        curso_nombre: (curso?.nombre as string | undefined) ?? '', escuela_nombre: (esc?.nombre as string | undefined) ?? '',
      };
    });
    const hojas = agruparEnHojas(filasHoja);
    if (conClaves) {
      for (const h of hojas) for (const m of h.misiones) {
        const r = claves.get(m.id);
        if (r && r.length > 0) m.respuestaEsperada = respuestaLegible(m.tipo, m.opciones, r);
      }
    }
    return hojas;
  },

  async obtenerCoberturaProyecto(proyectoId): Promise<CoberturaProyecto> {
    const sb = getSupabase();
    const proy = (await sb.from('proyectos').select('id, curso_id').eq('id', proyectoId).maybeSingle()).data as Fila | null;
    if (!proy) throw new Error('Proyecto no encontrado');
    const curso = (await sb.from('cursos').select('anio, nivel').eq('id', proy.curso_id).maybeSingle()).data as Fila | null;
    if (!curso) throw new Error('Curso no encontrado');
    const [conts, areas, delCurso, etapasDelProyecto] = await Promise.all([
      sb.from('curriculo_contenidos').select('id, area_id, descripcion, fuente, orden, curriculo_indicadores(orden, texto)').eq('anio', curso.anio).eq('nivel', curso.nivel).order('orden'),
      sb.from('areas').select('id, nombre'),
      sb.from('proyectos').select('id').eq('curso_id', proy.curso_id),
      sb.from('etapas').select('id, semana').eq('proyecto_id', proyectoId),
    ]);
    for (const r of [conts, areas, delCurso, etapasDelProyecto]) if (r.error) throw new Error(r.error.message);
    const proyIds = ((delCurso.data as Fila[]) ?? []).map((p) => p.id as string);
    const [vinc, mis, enEtapas] = await Promise.all([
      sb.from('proyecto_contenidos').select('proyecto_id, contenido_id').in('proyecto_id', proyIds),
      sb.from('misiones').select('proyecto_id, orden, contenido_id, etapa_id').in('proyecto_id', proyIds).not('contenido_id', 'is', null),
      sb.from('etapa_contenidos').select('contenido_id, etapas!inner(proyecto_id, semana)').in('etapas.proyecto_id', proyIds),
    ]);
    for (const r of [vinc, mis, enEtapas]) if (r.error) throw new Error(r.error.message);
    const semanaDeEtapa = new Map(((etapasDelProyecto.data as Fila[]) ?? []).map((e) => [e.id as string, e.semana as number]));

    // Dónde se trabaja cada aprendizaje: primero en ESTE proyecto (misión o semana planificada), si no, en otro proyecto del curso.
    const aqui = new Map<string, string>();
    const enOtro = new Set<string>();
    for (const m of (mis.data as Fila[]) ?? []) {
      const k = m.contenido_id as string;
      if (m.proyecto_id === proyectoId) {
        const semana = m.etapa_id ? semanaDeEtapa.get(m.etapa_id as string) : undefined;
        if (!aqui.has(k)) aqui.set(k, `Misión ${m.orden}${semana ? ` · semana ${semana}` : ''}`);
      } else enOtro.add(k);
    }
    for (const e of (enEtapas.data as Fila[]) ?? []) {
      const k = e.contenido_id as string;
      const et = e.etapas as { proyecto_id: string; semana: number };
      if (et.proyecto_id === proyectoId) {
        if (!aqui.has(k)) aqui.set(k, `Planificado en la semana ${et.semana}`);
      } else enOtro.add(k);
    }
    for (const v of (vinc.data as Fila[]) ?? []) {
      const k = v.contenido_id as string;
      if (v.proyecto_id === proyectoId) {
        if (!aqui.has(k)) aqui.set(k, 'Elegido para este proyecto');
      } else enOtro.add(k);
    }

    const nombre = new Map(((areas.data as Fila[]) ?? []).map((a) => [a.id as string, a.nombre as string]));
    // Con contenidos del Ministerio cargados para este grado se usan solo esos; los de ejemplo quedan de respaldo.
    const todos = (conts.data as Fila[]) ?? [];
    const oficiales = todos.filter((c) => c.fuente);
    const base = oficiales.length > 0 ? oficiales : todos;
    const aprendizajes = base.map((c) => {
      const id = c.id as string;
      const detalle = aqui.get(id) ?? (enOtro.has(id) ? 'En otro proyecto del curso' : null);
      return {
        id,
        materiaId: c.area_id as string,
        materia: nombre.get(c.area_id as string) ?? 'General',
        descripcion: c.descripcion as string,
        indicadores: [...((c.curriculo_indicadores as Fila[]) ?? [])].sort((a, b) => (a.orden as number) - (b.orden as number)).map((i) => i.texto as string),
        cubierto: detalle !== null,
        detalle,
      };
    });
    const porMateria = new Map<string, CoberturaProyecto['materias'][number]>();
    for (const a of aprendizajes) {
      const m = porMateria.get(a.materiaId) ?? { id: a.materiaId, nombre: a.materia, total: 0, cubiertos: 0, enEsteProyecto: 0 };
      m.total++;
      if (a.cubierto) m.cubiertos++;
      if (aqui.has(a.id)) m.enEsteProyecto++;
      porMateria.set(a.materiaId, m);
    }
    return {
      etiquetaGrado: `${curso.anio}.º ${curso.nivel === 'secundaria' ? 'año' : 'grado'}`,
      validada: false, // ni los de ejemplo ni los del Ministerio (versión en consulta) fueron validados todavía por la escuela
      materias: [...porMateria.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      aprendizajes,
    };
  },

  async obtenerContextoCurricular(anio): Promise<ContextoCurricular> {
    if (!Number.isInteger(anio) || anio < 1 || anio > 6) throw new Error('grado_invalido');
    const sb = getSupabase();
    const ver = await sb.from('curriculo_versiones').select('id, nombre, vigente, validada_por').ilike('nombre', '%Progresiones de Aprendizaje%').maybeSingle();
    if (ver.error) throw new Error(ver.error.message);
    const v = ver.data as Fila | null;
    if (!v) return { version: '', validada: false, materias: [] };
    const [areas, metas, conts] = await Promise.all([
      sb.from('areas').select('id, nombre').eq('version_id', v.id).order('nombre'),
      sb.from('curriculo_metas').select('id, area_id, ciclo, orden, texto').eq('version_id', v.id).lte('anio_desde', anio).gte('anio_hasta', anio).order('orden'),
      sb.from('curriculo_contenidos').select('id, area_id, meta_id, orden, descripcion, curriculo_indicadores(orden, texto)').eq('version_id', v.id).eq('anio', anio).order('orden'),
    ]);
    for (const r of [areas, metas, conts]) if (r.error) throw new Error(r.error.message);
    const ordenar = (l: Fila[]) => [...l].sort((a, b) => (a.orden as number) - (b.orden as number));
    return {
      version: v.nombre as string,
      validada: !!v.vigente && !!v.validada_por,
      materias: ((areas.data as Fila[]) ?? [])
        .map((a) => ({
          id: a.id as string,
          nombre: a.nombre as string,
          metas: ((metas.data as Fila[]) ?? []).filter((m) => m.area_id === a.id).map((m) => ({ id: m.id as string, texto: m.texto as string, ciclo: m.ciclo as string })),
          aprendizajes: ((conts.data as Fila[]) ?? [])
            .filter((c) => c.area_id === a.id)
            .map((c) => ({
              id: c.id as string,
              metaId: (c.meta_id as string | null) ?? null,
              descripcion: c.descripcion as string,
              indicadores: ordenar((c.curriculo_indicadores as Fila[]) ?? []).map((i) => i.texto as string),
            })),
        }))
        .filter((m) => m.aprendizajes.length > 0),
    };
  },

  async listarGrupos(): Promise<GrupoLista[]> {
    const b = await cargar(getSupabase());
    return b.grupos.map((g) => armarGrupo(b, g));
  },

  async obtenerGrupo(grupoId): Promise<GrupoDetalle> {
    const b = await cargar(getSupabase());
    const g = b.grupos.find((x) => x.id === grupoId);
    if (!g) throw new Error('Grupo no encontrado');
    const base = armarGrupo(b, g);
    const miembroIds = miembrosDe(b, grupoId);
    const total = base.proyectoId ? misionesDe(b, base.proyectoId).length : 0;
    const ids = new Set(base.proyectoId ? misionesDe(b, base.proyectoId).map((m) => m.id as string) : []);
    const miembros = miembroIds
      .map((id) => ({
        id,
        nombre: b.nombre.get(id) ?? '—',
        completadas: b.progreso.filter((p) => p.alumno_id === id && ids.has(p.mision_id)).length,
        total,
      }))
      .sort((x, y) => comparar(x.nombre, y.nombre));
    const enGrupo = new Set(miembroIds);
    const candidatos: AlumnoCurso[] = alumnosDelCurso(b, g.curso_id)
      .filter((id) => !enGrupo.has(id))
      .map((id) => ({ id, nombre: b.nombre.get(id) ?? '—' }))
      .sort((x, y) => comparar(x.nombre, y.nombre));
    return { ...base, miembros, candidatos };
  },

  async agregarAlumnosAGrupo(grupoId, alumnoIds): Promise<void> {
    if (alumnoIds.length === 0) return;
    const { error } = await getSupabase()
      .from('grupo_miembros')
      .insert(alumnoIds.map((alumno_id) => ({ grupo_id: grupoId, alumno_id })));
    if (error) throw new Error(error.message);
  },

  async quitarAlumnoDeGrupo(grupoId, alumnoId): Promise<void> {
    const { error } = await getSupabase().from('grupo_miembros').delete().eq('grupo_id', grupoId).eq('alumno_id', alumnoId);
    if (error) throw new Error(error.message);
  },

  async eliminarGrupo(grupoId): Promise<void> {
    // Con RLS, si el grupo no es de un curso de la docente no se borra nada: se avisa en vez de fingir éxito.
    const { data, error } = await getSupabase().from('grupos').delete().eq('id', grupoId).select('id');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No se pudo eliminar el grupo');
  },

  async listarProyectosGestion(): Promise<ProyectoGestionItem[]> {
    const b = await cargar(getSupabase());
    return b.proyectos.map((p) => armarProyecto(b, p));
  },

  async obtenerProyectoGestion(proyectoId): Promise<ProyectoGestion> {
    const b = await cargar(getSupabase());
    const p = b.proyectos.find((x) => x.id === proyectoId);
    if (!p) throw new Error('Proyecto no encontrado');
    const alumnos = new Set(alumnosDelCurso(b, p.curso_id));
    const misionIds = new Set(misionesDe(b, p.id).map((m) => m.id as string));
    return {
      ...armarProyecto(b, p),
      descripcion: p.descripcion ?? '',
      misionesDetalle: misionesDe(b, p.id).map((m) => ({
        id: m.id,
        orden: m.orden,
        titulo: m.titulo,
        consigna: m.consigna ?? '',
        alumnosQueCompletaron: b.progreso.filter((x) => x.mision_id === m.id && alumnos.has(x.alumno_id)).length,
        tipoRespuesta: m.tipo_respuesta,
        semana: m.etapa_id ? ((b.etapas.find((e) => e.id === m.etapa_id)?.semana as number | undefined) ?? null) : null,
      })),
      etapas: b.etapas.filter((e) => e.proyecto_id === p.id).map((e) => ({ semana: e.semana as number, titulo: e.titulo as string, objetivo: (e.objetivo as string | null) ?? '' })),
      fechaInicio: (p.fecha_inicio as string | null) ?? null,
      gruposLista: b.grupos.filter((g) => g.proyecto_id === p.id).map((g) => armarGrupo(b, g)),
      participantes: [...alumnos]
        .map((id) => ({
          id,
          nombre: b.nombre.get(id) ?? '—',
          completadas: b.progreso.filter((x) => x.alumno_id === id && misionIds.has(x.mision_id)).length,
          total: misionIds.size,
        }))
        .sort((x, y) => comparar(x.nombre, y.nombre)),
    };
  },

  async actualizarProyecto(proyectoId, datos): Promise<void> {
    const { error } = await getSupabase()
      .from('proyectos')
      .update({ titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim() || null, estado: datos.estado, ...(datos.fechaInicio && /^\d{4}-\d{2}-\d{2}$/.test(datos.fechaInicio) ? { fecha_inicio: datos.fechaInicio } : {}) })
      .eq('id', proyectoId);
    if (error) throw new Error(error.message);
  },

  async eliminarProyecto(proyectoId): Promise<void> {
    const { data, error } = await getSupabase().from('proyectos').delete().eq('id', proyectoId).select('id');
    // 23503: hay conversaciones del tutor o señales de apoyo que dependen de sus misiones.
    if (error) throw new Error(error.code === '23503' ? 'con_actividad' : error.message);
    // La RLS solo deja borrar al creador: si no se borró nada, no se finge éxito.
    if (!data || data.length === 0) throw new Error('sin_permiso');
  },

  async datosParaSugerirGrupos(cursoId, proyectoId) {
    const sb = getSupabase();
    const ids = filas(await sb.from('inscripciones').select('alumno_id').eq('curso_id', cursoId)).map((i) => i.alumno_id as string);
    if (ids.length === 0) return { alumnos: [], totalMisiones: 0 };
    const [perfiles, intereses, misiones] = await Promise.all([
      sb.from('perfiles').select('id, nombre_visible').in('id', ids),
      sb.from('intereses_alumno').select('alumno_id, interes').in('alumno_id', ids),
      sb.from('misiones').select('id').eq('proyecto_id', proyectoId),
    ]).then((r) => r.map(filas));
    const misionIds = misiones.map((m) => m.id as string);
    const progreso = misionIds.length
      ? filas(await sb.from('progreso_misiones').select('alumno_id, mision_id').eq('estado', 'completada').in('mision_id', misionIds).in('alumno_id', ids))
      : [];
    return {
      totalMisiones: misionIds.length,
      alumnos: perfiles.map((p) => ({
        id: p.id as string,
        nombre: p.nombre_visible as string,
        intereses: intereses.filter((i) => i.alumno_id === p.id).map((i) => i.interes as string),
        completadas: progreso.filter((x) => x.alumno_id === p.id).length,
      })),
    };
  },

  async generarAcceso(alumnoId): Promise<{ codigo: string; venceEn: string }> {
    const { data, error } = await getSupabase().functions.invoke('generar-acceso', { body: { alumno_id: alumnoId } });
    if (error || !data?.ok) throw new Error('No se pudo generar el acceso');
    return { codigo: data.codigo, venceEn: data.vence_en };
  },

  async estadoCodigoClase(cursoId): Promise<{ vigente: boolean; venceEn: string | null }> {
    const filasCodigos = filas(
      await getSupabase().from('codigos_clase').select('vence_en').eq('curso_id', cursoId).eq('activo', true).gt('vence_en', new Date().toISOString()).order('vence_en', { ascending: false }).limit(1),
    );
    return { vigente: filasCodigos.length > 0, venceEn: (filasCodigos[0]?.vence_en as string | undefined) ?? null };
  },

  async generarCodigoClase(cursoId): Promise<{ codigo: string; venceEn: string }> {
    const { data, error } = await getSupabase().functions.invoke('generar-codigo-clase', { body: { curso_id: cursoId } });
    if (error || !data?.ok) throw new Error('No se pudo generar el código');
    return { codigo: data.codigo, venceEn: data.vence_en };
  },

  async sugerirProyecto(datos) {
    const { data, error } = await getSupabase().functions.invoke('ia-sugerir-proyecto', {
      body: { curso_id: datos.cursoId, idea: datos.idea, cantidad: datos.cantidad, contenido_ids: datos.contenidoIds, usar_intereses: datos.usarIntereses !== false, enfoque: datos.enfoque ?? 'todos' },
    });
    if (error || !data?.ok) throw new Error(await codigoDeErrorFuncion(error));
    const s = data.sugerencia as { titulo: string; descripcion: string; misiones: (MisionIA)[]; descartadas?: number };
    return {
      titulo: s.titulo,
      descripcion: s.descripcion,
      misiones: s.misiones.map((m) => ({ titulo: m.titulo, consigna: m.consigna, contenidoId: m.contenido_id, respuesta: aRespuestaIA(m.respuesta) })),
      interesesUsados: (data.intereses_usados as string[]) ?? [],
      descartadas: s.descartadas ?? 0,
    };
  },

  async planificarProyecto(datos): Promise<PlanSugerido> {
    const { data, error } = await getSupabase().functions.invoke('ia-planificar-proyecto', {
      body: { curso_id: datos.cursoId, idea: datos.idea, semanas: datos.semanas, misiones_por_semana: datos.misionesPorSemana, area_ids: datos.areaIds, usar_intereses: datos.usarIntereses !== false, enfoque: datos.enfoque ?? 'todos' },
    });
    if (error || !data?.ok) throw new Error(await codigoDeErrorFuncion(error));
    const p = data.plan as { titulo: string; descripcion: string; descartadas?: number; etapas: { semana: number; titulo: string; objetivo: string; contenido_ids: string[]; misiones: (MisionIA)[] }[] };
    return {
      titulo: p.titulo,
      descripcion: p.descripcion,
      semanas: Number(data.semanas) || p.etapas.length,
      etapas: p.etapas.map((e) => ({
        semana: e.semana,
        titulo: e.titulo,
        objetivo: e.objetivo,
        contenidoIds: e.contenido_ids,
        misiones: e.misiones.map((m) => ({ titulo: m.titulo, consigna: m.consigna, contenidoId: m.contenido_id, respuesta: aRespuestaIA(m.respuesta) })),
      })),
      interesesUsados: (data.intereses_usados as string[]) ?? [],
      descartadas: p.descartadas ?? 0,
    };
  },

  async sugerirNombresGrupos(datos) {
    const { data, error } = await getSupabase().functions.invoke('ia-nombrar-grupos', {
      body: { curso_id: datos.cursoId, proyecto_id: datos.proyectoId, grupos: datos.grupos },
    });
    if (error || !data?.ok) throw new Error(await codigoDeErrorFuncion(error));
    return data.nombres as Record<string, string>;
  },

  async sugerirBorradorMensaje(datos) {
    const { data, error } = await getSupabase().functions.invoke('ia-borrador-devolucion', {
      body: { alumno_id: datos.alumnoId, tipo: datos.tipo, pista: datos.pista },
    });
    if (error || !data?.ok) throw new Error(await codigoDeErrorFuncion(error));
    return data.texto as string;
  },

  async agregarMision(proyectoId, datos): Promise<void> {
    const sb = getSupabase();
    const ultima = filas(await sb.from('misiones').select('orden').eq('proyecto_id', proyectoId).order('orden', { ascending: false }).limit(1))[0];
    // Si el proyecto está planificado por semanas, la misión nueva cuelga de la etapa elegida.
    let etapaId: string | null = null;
    if (datos.semana) {
      const e = (await sb.from('etapas').select('id').eq('proyecto_id', proyectoId).eq('semana', datos.semana).maybeSingle()).data as Fila | null;
      if (!e) throw new Error('semana_inexistente');
      etapaId = e.id as string;
    }
    const m = await sb.from('misiones').insert(filaMision(proyectoId, ((ultima?.orden as number | undefined) ?? 0) + 1, datos, etapaId)).select('id').single();
    if (m.error || !m.data) throw new Error(m.error?.message ?? 'No se pudo crear la misión');
    const clave = filaClave((m.data as Fila).id as string, datos.respuesta);
    if (clave) {
      const k = await sb.from('misiones_claves').insert(clave);
      if (k.error) {
        await sb.from('misiones').delete().eq('id', (m.data as Fila).id); // no deja una misión a medias
        throw new Error(k.error.message);
      }
    }
    if (datos.contenidoId) {
      // Que el contenido figure como cubierto por el proyecto (si ya figuraba, no pasa nada).
      const c = await sb.from('proyecto_contenidos').insert({ proyecto_id: proyectoId, contenido_id: datos.contenidoId });
      if (c.error && c.error.code !== '23505') throw new Error(c.error.message);
    }
  },

  async listarAlumnos(): Promise<AlumnoConAvance[]> {
    const b = await cargar(getSupabase());
    const out: AlumnoConAvance[] = [];
    for (const i of b.inscripciones) {
      const ms = b.proyectos.filter((p) => p.curso_id === i.curso_id).flatMap((p) => misionesDe(b, p.id));
      const ids = new Set(ms.map((m) => m.id as string));
      out.push({
        id: i.alumno_id,
        nombre: b.nombre.get(i.alumno_id) ?? '—',
        cursoId: i.curso_id,
        curso: nombreCurso(b, i.curso_id),
        completadas: b.progreso.filter((p) => p.alumno_id === i.alumno_id && ids.has(p.mision_id)).length,
        total: ms.length,
      });
    }
    return out.sort((x, y) => comparar(x.curso, y.curso) || comparar(x.nombre, y.nombre));
  },

  async listarDevoluciones(alumnoId): Promise<Devolucion[]> {
    const sb = getSupabase();
    const ds = filas(await sb.from('devoluciones').select('id, alumno_id, proyecto_id, tipo, texto, created_at').eq('alumno_id', alumnoId).order('created_at', { ascending: false }));
    const pids = [...new Set(ds.map((d) => d.proyecto_id).filter(Boolean))] as string[];
    const ps = pids.length ? filas(await sb.from('proyectos').select('id, titulo').in('id', pids)) : [];
    const titulo = new Map(ps.map((p) => [p.id as string, p.titulo as string]));
    return ds.map((d) => ({
      id: d.id,
      alumnoId: d.alumno_id,
      tipo: d.tipo as TipoDevolucion,
      texto: d.texto,
      proyectoTitulo: d.proyecto_id ? titulo.get(d.proyecto_id) ?? null : null,
      creadaEn: d.created_at,
    }));
  },

  async crearDevolucion(datos): Promise<Devolucion> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const r = await sb
      .from('devoluciones')
      .insert({ alumno_id: datos.alumnoId, autor_id: uid, tipo: datos.tipo, texto: datos.texto.trim(), proyecto_id: datos.proyectoId ?? null })
      .select('id, alumno_id, tipo, texto, created_at')
      .single();
    if (r.error || !r.data) throw new Error(r.error?.message ?? 'No se pudo guardar el mensaje');
    const d = r.data as Fila;
    return { id: d.id, alumnoId: d.alumno_id, tipo: d.tipo, texto: d.texto, proyectoTitulo: null, creadaEn: d.created_at };
  },

  async eliminarDevolucion(devolucionId): Promise<void> {
    const { error } = await getSupabase().from('devoluciones').delete().eq('id', devolucionId);
    if (error) throw new Error(error.message);
  },
};
