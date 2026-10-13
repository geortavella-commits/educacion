import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import type {
  AlumnoApoyo,
  ActividadRecientePerfil,
  ContenidoCurricular,
  EstadoHipotesis,
  EtapaProyecto,
  GrupoResumen,
  GrupoSugerido,
  HipotesisPerfil,
  PerfilAlumnoDocente,
  ProyectoDetalle,
  ProyectoListItem,
  ResumenInicioDocente,
  SesionChasqui,
} from '@/mocks/docente';
import type {
  AlumnoCurso,
  ConsentimientoAlumno,
  ContenidoElegible,
  CursoDocente,
  DocenteService,
  NuevoGrupo,
  NuevoProyecto,
  SolicitudIngreso,
} from './docente.tipos';
import { obtenerInteresEnFrase } from './diagnostico';
import { filaClave, filaMision, gestionSupabase } from './docente.gestion.supabase';
import { buscarCoincidencias, type CoincidenciaNombre } from '@/lib/coincidenciaNombre';

/**
 * Servicio REAL del docente (Supabase). La seguridad no depende de este archivo: la RLS de la base
 * solo deja ver y modificar lo que corresponde al docente que inició sesión.
 */

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const COLORES_GRUPO = [
  { bg: 'bg-accent-700', text: 'text-white' },
  { bg: 'bg-[oklch(0.40_0.10_195)]', text: 'text-white' },
  { bg: 'bg-[oklch(0.40_0.14_260)]', text: 'text-white' },
  { bg: 'bg-[oklch(0.90_0.12_90)]', text: 'text-text' },
];
const COLORES_AREA_BARRA: Record<string, string> = {
  Matemática: 'bg-accent',
  'Ciencias Naturales': 'bg-[oklch(0.62_0.12_195)]',
  Lengua: 'bg-[oklch(0.55_0.15_260)]',
};
const COLORES_AREA_BLOQUE = ['bg-[oklch(0.62_0.12_195)]', 'bg-[oklch(0.55_0.15_260)]', 'bg-accent', 'bg-[oklch(0.80_0.14_90)]'];
const FONDO_AVANCE_PERFIL: Record<string, string> = {
  Matemática: 'bg-accent-100',
  'Ciencias Naturales': 'bg-[oklch(0.93_0.04_260)]',
  Lengua: 'bg-[oklch(0.95_0.08_90)]',
};
const ETIQUETA_MATERIA: Record<string, string> = { Matemática: 'bg-accent-100', 'Ciencias Naturales': 'bg-[oklch(0.93_0.04_260)]', Lengua: 'bg-[oklch(0.95_0.08_90)]' };

const abreviar = (area: string) => ({ Matemática: 'Mate', 'Ciencias Naturales': 'Cs. Nat.' } as Record<string, string>)[area] ?? area;
const iniciales = (nombre: string) => nombre.replace(/[^\p{L}]/gu, '').slice(0, 2).toUpperCase();
const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function filas(r: { data: unknown; error: { message: string } | null }): Fila[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data as Fila[]) ?? [];
}

const aEstadoUI = (e: string): EstadoHipotesis => (e === 'hipotesis' ? 'pendiente' : (e as EstadoHipotesis));
const aEstadoDB = (e: EstadoHipotesis) => (e === 'pendiente' ? 'hipotesis' : e);

function periodoDe(fecha: string | null): string {
  if (!fecha) return 'Antes';
  const d = new Date(fecha);
  const hoy = new Date();
  const dias = Math.floor((new Date(hoy.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
}

async function usuarioActual(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new Error('sin_sesion');
  return data.session.user.id;
}

/** Cursos del docente (RLS: solo los suyos). */
async function cursosDelDocente(sb: SupabaseClient): Promise<Array<{ id: string; nombre: string; anio: number; nivel: 'primaria' | 'secundaria'; escuela_id: string }>> {
  const uid = await usuarioActual(sb);
  const cd = filas(await sb.from('curso_docentes').select('curso_id').eq('usuario_id', uid));
  const ids = cd.map((c) => c.curso_id as string);
  if (ids.length === 0) return [];
  return filas(await sb.from('cursos').select('id, nombre, anio, nivel, escuela_id').in('id', ids).order('anio')) as never;
}

/** Datos base para calcular avances y conteos de todos los cursos del docente. */
async function cargarBase(sb: SupabaseClient) {
  const cursos = await cursosDelDocente(sb);
  const cursoIds = cursos.map((c) => c.id);
  const inscripciones = cursoIds.length ? filas(await sb.from('inscripciones').select('curso_id, alumno_id').in('curso_id', cursoIds)) : [];
  const proyectos = filas(await sb.from('proyectos').select('id, titulo, curso_id, estado, created_at').in('curso_id', cursoIds.length ? cursoIds : ['00000000-0000-0000-0000-000000000000']).order('created_at'));
  const proyectoIds = proyectos.map((p) => p.id as string);
  const misiones = proyectoIds.length ? filas(await sb.from('misiones').select('id, proyecto_id, orden, titulo, consigna, contenido_id').in('proyecto_id', proyectoIds).order('orden')) : [];
  const misionIds = misiones.map((m) => m.id as string);
  const progreso = misionIds.length ? filas(await sb.from('progreso_misiones').select('mision_id, alumno_id, estado, pistas_usadas, completada_en').in('mision_id', misionIds)) : [];
  const contenidoIds = [...new Set(misiones.map((m) => m.contenido_id).filter(Boolean))] as string[];
  const contenidos = contenidoIds.length ? filas(await sb.from('curriculo_contenidos').select('id, area_id, eje, descripcion, anio').in('id', contenidoIds)) : [];
  const areas = filas(await sb.from('areas').select('id, nombre'));
  const areaNombre = new Map(areas.map((a) => [a.id as string, a.nombre as string]));
  const areaDeContenido = new Map(contenidos.map((c) => [c.id as string, areaNombre.get(c.area_id) ?? 'General']));
  return { cursos, inscripciones, proyectos, misiones, progreso, contenidos, areaNombre, areaDeContenido };
}

const areaDeMision = (m: Fila, base: Awaited<ReturnType<typeof cargarBase>>) => (m.contenido_id ? base.areaDeContenido.get(m.contenido_id) ?? 'General' : 'General');

function porcentaje(completadas: number, alumnos: number, misiones: number) {
  const total = alumnos * misiones;
  return total > 0 ? Math.round((100 * completadas) / total) : 0;
}

async function resolverGrupo(sb: SupabaseClient, grupoId: string): Promise<GrupoSugerido> {
  const g = filas(await sb.from('grupos').select('id, nombre_visible, estado, criterio').eq('id', grupoId))[0];
  if (!g) throw new Error('Grupo no encontrado');
  const [internos, miembros] = await Promise.all([
    sb.from('grupos_internos').select('etiqueta').eq('grupo_id', grupoId).maybeSingle(),
    sb.from('grupo_miembros').select('alumno_id').eq('grupo_id', grupoId),
  ]);
  const alumnoIds = filas(miembros).map((m) => m.alumno_id as string);
  const perfiles = alumnoIds.length ? filas(await sb.from('perfiles').select('id, nombre_visible').in('id', alumnoIds)) : [];
  const nombres = alumnoIds.map((id) => perfiles.find((p) => p.id === id)?.nombre_visible ?? '—');
  return {
    id: g.id,
    nombreVisible: g.nombre_visible,
    etiquetaDocente: (internos.data as Fila | null)?.etiqueta ?? '',
    alumnosCount: nombres.length,
    alumnosIniciales: nombres.map(iniciales),
    alumnosNombres: nombres,
    explicacionTutor: (g.criterio as Fila | null)?.explicacion ?? 'Grupo armado por vos para este curso.',
    estado: g.estado,
  };
}

export const docenteSupabase: DocenteService = {
  ...gestionSupabase,

  // ───────────────────────── Panel de inicio ─────────────────────────
  async obtenerInicio(): Promise<ResumenInicioDocente> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const [perfil, escuela, base, senales, sesiones] = await Promise.all([
      sb.from('perfiles').select('nombre_visible').eq('id', uid).maybeSingle(),
      sb.from('escuelas').select('nombre, localidad').limit(1).maybeSingle(),
      cargarBase(sb),
      sb.from('senales_alumno').select('id, alumno_id, estado'),
      sb.from('tutor_sesiones').select('alumno_id, created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    const alumnosPorCurso = new Map<string, Set<string>>();
    base.inscripciones.forEach((i) => {
      if (!alumnosPorCurso.has(i.curso_id)) alumnosPorCurso.set(i.curso_id, new Set());
      alumnosPorCurso.get(i.curso_id)!.add(i.alumno_id);
    });
    const todosAlumnos = new Set(base.inscripciones.map((i) => i.alumno_id as string));
    const cursoDeAlumno = new Map(base.inscripciones.map((i) => [i.alumno_id as string, i.curso_id as string]));

    const haceUnaSemana = Date.now() - 7 * 86400000;
    const activos = new Set<string>();
    base.progreso.forEach((p) => {
      if (p.completada_en && new Date(p.completada_en).getTime() >= haceUnaSemana) activos.add(p.alumno_id);
    });
    filas(sesiones).forEach((s) => activos.add(s.alumno_id));

    const señalesPend = filas(senales).filter((s) => s.estado === 'hipotesis');
    const proyectosActivos = base.proyectos.filter((p) => p.estado === 'activo');

    // Proyecto en foco: el primero activo con misiones.
    const foco = proyectosActivos.find((p) => base.misiones.some((m) => m.proyecto_id === p.id)) ?? proyectosActivos[0];
    let proyectoEnFoco: ResumenInicioDocente['proyectoEnFoco'] = {
      id: '', titulo: 'Todavía no hay un proyecto en curso', curso: '', materiasTexto: 'Creá tu primer proyecto para verlo acá',
      alineacionNap: '—', avanceMisiones: [], loQueVioElTutor: 'Cuando tus alumnos trabajen con Chasqui, acá vas a ver qué observó.',
    };
    if (foco) {
      const curso = base.cursos.find((c) => c.id === foco.curso_id);
      const ms = base.misiones.filter((m) => m.proyecto_id === foco.id);
      const alumnos = alumnosPorCurso.get(foco.curso_id)?.size ?? 0;
      const porArea = new Map<string, Fila[]>();
      ms.forEach((m) => {
        const a = areaDeMision(m, base);
        porArea.set(a, [...(porArea.get(a) ?? []), m]);
      });
      const avance = [...porArea.entries()].map(([area, lista], i) => {
        const ids = new Set(lista.map((m) => m.id as string));
        const completadas = base.progreso.filter((p) => ids.has(p.mision_id) && p.estado === 'completada').length;
        return {
          materia: `${area} · ${lista[0].titulo}`,
          porcentaje: porcentaje(completadas, alumnos, lista.length),
          colorClass: COLORES_AREA_BARRA[area] ?? COLORES_AREA_BLOQUE[i % COLORES_AREA_BLOQUE.length],
        };
      });
      const pc = filas(await sb.from('proyecto_contenidos').select('contenido_id').eq('proyecto_id', foco.id));
      const cids = pc.map((x) => x.contenido_id as string);
      const conts = cids.length ? filas(await sb.from('curriculo_contenidos').select('id, area_id, eje, descripcion').in('id', cids)) : [];
      const alineacion = [...new Set(conts.map((c) => `${c.eje ?? c.descripcion} (${abreviar(base.areaNombre.get(c.area_id) ?? '')})`))].slice(0, 4).join(', ');
      const resumen = filas(await sb.from('tutor_resumenes').select('resumen').order('created_at', { ascending: false }).limit(1))[0];
      proyectoEnFoco = {
        id: foco.id,
        titulo: `Proyecto: ${foco.titulo}`,
        curso: curso?.nombre ?? '',
        materiasTexto: `${curso?.nombre ?? ''} · ${[...porArea.keys()].map(abreviar).join(' + ') || 'sin materias todavía'}`,
        alineacionNap: alineacion || 'Todavía sin contenidos vinculados',
        avanceMisiones: avance,
        loQueVioElTutor: resumen?.resumen ?? 'Todavía no hay conversaciones con Chasqui sobre este proyecto.',
      };
    }

    // Mis grupos: un renglón por curso + los grupos aprobados.
    const misGrupos: GrupoResumen[] = base.cursos.map((c, i) => {
      const alumnos = alumnosPorCurso.get(c.id) ?? new Set<string>();
      const msCurso = base.misiones.filter((m) => base.proyectos.find((p) => p.id === m.proyecto_id)?.curso_id === c.id);
      const msIds = new Set(msCurso.map((m) => m.id as string));
      const completadas = base.progreso.filter((p) => msIds.has(p.mision_id) && p.estado === 'completada').length;
      const apoyo = señalesPend.filter((s) => cursoDeAlumno.get(s.alumno_id) === c.id).length;
      const col = COLORES_GRUPO[i % COLORES_GRUPO.length];
      return {
        id: c.id,
        codigo: c.nombre.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase(),
        nombre: `${c.nombre} · ${c.nivel === 'primaria' ? 'Primaria' : 'Secundaria'}`,
        info: `${alumnos.size} alumnos · ${apoyo === 0 ? 'ninguno necesita apoyo' : apoyo === 1 ? '1 necesita apoyo' : `${apoyo} necesitan apoyo`}`,
        porcentaje: porcentaje(completadas, alumnos.size, msCurso.length),
        colorBg: col.bg,
        colorText: col.text,
        cursoId: c.id,
      };
    });
    const gruposAprobados = base.cursos.length ? filas(await sb.from('grupos').select('id, nombre_visible, estado, curso_id').eq('estado', 'aprobado')) : [];
    for (const g of gruposAprobados) {
      const [interno, miembros] = await Promise.all([
        sb.from('grupos_internos').select('etiqueta').eq('grupo_id', g.id).maybeSingle(),
        sb.from('grupo_miembros').select('alumno_id').eq('grupo_id', g.id),
      ]);
      const ids = new Set(filas(miembros).map((m) => m.alumno_id as string));
      const msCurso = base.misiones.filter((m) => base.proyectos.find((p) => p.id === m.proyecto_id)?.curso_id === g.curso_id);
      const msIds = new Set(msCurso.map((m) => m.id as string));
      const completadas = base.progreso.filter((p) => ids.has(p.alumno_id) && msIds.has(p.mision_id) && p.estado === 'completada').length;
      const col = COLORES_GRUPO[3];
      misGrupos.push({
        id: g.id, codigo: 'Eq',
        nombre: `Grupo · ${(interno.data as Fila | null)?.etiqueta ?? g.nombre_visible}`,
        info: `Armado por vos · ${ids.size} alumnos`,
        porcentaje: porcentaje(completadas, ids.size, msCurso.length),
        colorBg: col.bg, colorText: col.text, cursoId: g.curso_id,
      });
    }

    const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const e = escuela.data as Fila | null;
    return {
      docenteNombre: ((perfil.data as Fila | null)?.nombre_visible ?? '').replace(/^Seño\s+/i, '') || 'docente',
      escuela: e ? `${e.nombre}${e.localidad ? `, ${e.localidad}` : ''}` : '',
      fechaTexto: fecha.charAt(0).toUpperCase() + fecha.slice(1),
      metricas: {
        activosEstaSemana: activos.size,
        totalAlumnos: todosAlumnos.size,
        proyectosEnCurso: proyectosActivos.length,
        necesitanApoyo: señalesPend.length,
      },
      proyectoEnFoco,
      misGrupos,
    };
  },

  // ───────────────────────── Necesitan apoyo ─────────────────────────
  async obtenerAlumnosApoyo(): Promise<AlumnoApoyo[]> {
    const sb = getSupabase();
    const senales = filas(await sb.from('senales_alumno').select('id, alumno_id, descripcion, estado, created_at').order('created_at', { ascending: false }));
    // Una fila por alumno (la observación más reciente).
    const porAlumno = new Map<string, Fila>();
    senales.forEach((s) => { if (!porAlumno.has(s.alumno_id)) porAlumno.set(s.alumno_id, s); });
    const ids = [...porAlumno.keys()];
    if (ids.length === 0) return [];
    const [perfiles, insc] = await Promise.all([
      sb.from('perfiles').select('id, nombre_visible').in('id', ids),
      sb.from('inscripciones').select('alumno_id, curso_id').in('alumno_id', ids),
    ]);
    const cursoIds = [...new Set(filas(insc).map((i) => i.curso_id as string))];
    const cursos = filas(await sb.from('cursos').select('id, nombre').in('id', cursoIds));
    const cursoNombre = (alumnoId: string) => {
      const ci = filas(insc).find((i) => i.alumno_id === alumnoId)?.curso_id;
      return cursos.find((c) => c.id === ci)?.nombre ?? '';
    };
    return ids.map((id) => {
      const s = porAlumno.get(id)!;
      return {
        id,
        nombre: filas(perfiles).find((p) => p.id === id)?.nombre_visible ?? '—',
        curso: cursoNombre(id),
        motivoObservacion: s.descripcion,
        estadoHipotesis: aEstadoUI(s.estado),
        textoCorregido: s.estado === 'corregida' ? s.descripcion : undefined,
      };
    });
  },

  async actualizarHipotesisApoyo(alumnoId, estado, textoCorregido): Promise<AlumnoApoyo> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const s = filas(await sb.from('senales_alumno').select('id, descripcion').eq('alumno_id', alumnoId).order('created_at', { ascending: false }).limit(1))[0];
    if (!s) throw new Error('Observación no encontrada');
    const cambios: Fila = { estado: aEstadoDB(estado), revisada_por: uid };
    if (estado === 'corregida' && textoCorregido?.trim()) cambios.descripcion = textoCorregido.trim();
    const { error } = await sb.from('senales_alumno').update(cambios).eq('id', s.id);
    if (error) throw new Error(error.message);
    const lista = await this.obtenerAlumnosApoyo();
    const actual = lista.find((a) => a.id === alumnoId);
    if (!actual) throw new Error('Alumno no encontrado');
    return actual;
  },

  // ───────────────────────── Perfil del alumno ─────────────────────────
  async obtenerPerfilAlumno(alumnoId): Promise<PerfilAlumnoDocente> {
    const sb = getSupabase();
    const [perfil, insc, intereses, senales, progreso, sesiones, entregas, valoraciones, diagnostico] = await Promise.all([
      sb.from('perfiles').select('id, nombre_visible').eq('id', alumnoId).maybeSingle(),
      sb.from('inscripciones').select('curso_id').eq('alumno_id', alumnoId),
      sb.from('intereses_alumno').select('interes').eq('alumno_id', alumnoId),
      sb.from('senales_alumno').select('id, descripcion, estado').eq('alumno_id', alumnoId).order('created_at', { ascending: false }),
      sb.from('progreso_misiones').select('mision_id, estado, pistas_usadas, completada_en, en_papel').eq('alumno_id', alumnoId),
      sb.from('tutor_sesiones').select('id, mision_id, created_at').eq('alumno_id', alumnoId).order('created_at', { ascending: false }),
      sb.from('respuestas_abiertas').select('mision_id, texto').eq('alumno_id', alumnoId),
      sb.from('valoraciones_mision').select('mision_id, marca, mensaje').eq('alumno_id', alumnoId),
      sb.from('diagnostico_resultados').select('area, aciertos, total').eq('alumno_id', alumnoId),
    ]);
    const p = perfil.data as Fila | null;
    if (!p) throw new Error('Alumno no encontrado');
    const cursoId = filas(insc)[0]?.curso_id as string | undefined;
    const curso = cursoId ? (await sb.from('cursos').select('nombre').eq('id', cursoId).maybeSingle()).data as Fila | null : null;

    // Misiones de los proyectos del curso del alumno, para calcular el avance por materia.
    const proys = cursoId ? filas(await sb.from('proyectos').select('id, titulo, estado').eq('curso_id', cursoId)) : [];
    const ms = proys.length ? filas(await sb.from('misiones').select('id, titulo, contenido_id, proyecto_id, orden').in('proyecto_id', proys.map((x) => x.id))) : [];
    const cids = [...new Set(ms.map((m) => m.contenido_id).filter(Boolean))] as string[];
    const conts = cids.length ? filas(await sb.from('curriculo_contenidos').select('id, area_id').in('id', cids)) : [];
    const areas = filas(await sb.from('areas').select('id, nombre'));
    const areaDe = (m: Fila) => areas.find((a) => a.id === conts.find((c) => c.id === m.contenido_id)?.area_id)?.nombre ?? 'General';
    const porArea = new Map<string, Fila[]>();
    ms.forEach((m) => porArea.set(areaDe(m), [...(porArea.get(areaDe(m)) ?? []), m]));
    const prog = filas(progreso);
    const avance = [...porArea.entries()].map(([area, lista]) => {
      const ids = new Set(lista.map((m) => m.id as string));
      const hechas = prog.filter((x) => ids.has(x.mision_id) && x.estado === 'completada').length;
      return { materia: abreviar(area), porcentaje: lista.length ? Math.round((100 * hechas) / lista.length) : 0, bgClass: FONDO_AVANCE_PERFIL[area] ?? 'bg-accent-100' };
    });

    const textoDe = new Map(filas(entregas).map((r) => [r.mision_id as string, r.texto as string]));
    const valoradas = new Map(filas(valoraciones).map((v) => [v.mision_id as string, { marca: v.marca as 'encaminado' | 'repensar' | 'conversar', mensaje: (v.mensaje as string | null) ?? '' }]));
    const titulo = (id: string | null) => ms.find((m) => m.id === id)?.titulo ?? 'Misión';
    const actividad: ActividadRecientePerfil[] = [...prog]
      .sort((a, b) => (b.completada_en ?? '').localeCompare(a.completada_en ?? ''))
      .slice(0, 5)
      .map((x, i) => ({
        id: `act-${i}`,
        periodo: periodoDe(x.completada_en),
        actividad: `${titulo(x.mision_id)}${x.pistas_usadas ? `: usó ${x.pistas_usadas} ${x.pistas_usadas === 1 ? 'pista' : 'pistas'}` : ''}`,
        respuesta: textoDe.get(x.mision_id),
        misionId: x.mision_id as string,
        estado: x.estado as 'pendiente' | 'en_curso' | 'completada',
        enPapel: !!x.en_papel,
        valoracion: valoradas.get(x.mision_id as string),
        hecho: x.en_papel ? 'Hecha en papel' : x.estado === 'completada' ? 'Completó la misión' : x.estado === 'en_curso' ? 'En exploración' : 'Sin empezar',
      }));

    const convs: SesionChasqui[] = [];
    for (const s of filas(sesiones)) {
      const [mensajes, resumen] = await Promise.all([
        sb.from('tutor_mensajes').select('autor, contenido, created_at').eq('sesion_id', s.id).order('created_at'),
        sb.from('tutor_resumenes').select('resumen').eq('sesion_id', s.id).maybeSingle(),
      ]);
      convs.push({
        id: s.id,
        fecha: new Date(s.created_at).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ''),
        mision: titulo(s.mision_id),
        resumenIA: (resumen.data as Fila | null)?.resumen ?? 'Todavía no hay un resumen de esta conversación.',
        mensajes: filas(mensajes).map((m) => ({
          emisor: m.autor === 'tutor' ? 'tutor' : 'alumno',
          contenido: m.contenido,
          hora: new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        })),
      });
    }

    const hipotesis: HipotesisPerfil[] = filas(senales).map((s) => ({
      id: s.id, texto: s.descripcion, estado: aEstadoUI(s.estado), textoCorregido: s.estado === 'corregida' ? s.descripcion : undefined,
    }));

    return {
      id: p.id,
      nombre: p.nombre_visible,
      curso: curso?.nombre ?? '',
      intereses: filas(intereses).map((i) => obtenerInteresEnFrase(i.interes) ?? i.interes).join(', ') || 'Todavía sin intereses elegidos',
      iniciales: iniciales(p.nombre_visible),
      avanceMisiones: avance,
      hipotesis,
      actividadReciente: actividad,
      diagnostico: filas(diagnostico).map((d) => ({ area: d.area as 'matematica' | 'lengua', aciertos: d.aciertos as number, total: d.total as number })),
      misionesPendientes: ms
        .filter((m) => !prog.some((x) => x.mision_id === m.id && x.estado === 'completada') && proys.find((y) => y.id === m.proyecto_id)?.estado === 'activo')
        .sort((a, b) => String(a.proyecto_id).localeCompare(String(b.proyecto_id)) || (a.orden as number) - (b.orden as number))
        .map((m) => ({ misionId: m.id as string, titulo: m.titulo as string, proyecto: (proys.find((y) => y.id === m.proyecto_id)?.titulo as string | undefined) ?? '' })),
      conversaciones: convs,
    };
  },

  async actualizarHipotesisPerfil(hipotesisId, estado, textoCorregido): Promise<void> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const cambios: Fila = { estado: aEstadoDB(estado), revisada_por: uid };
    if (estado === 'corregida' && textoCorregido?.trim()) cambios.descripcion = textoCorregido.trim();
    const { error } = await sb.from('senales_alumno').update(cambios).eq('id', hipotesisId);
    if (error) throw new Error(error.message);
  },

  // ───────────────────────── Proyecto y cobertura ─────────────────────────
  async obtenerProyecto(proyectoId): Promise<ProyectoDetalle> {
    const sb = getSupabase();
    const base = await cargarBase(sb);
    const proy = (esUuid(proyectoId) ? base.proyectos.find((p) => p.id === proyectoId) : undefined) ?? base.proyectos.find((p) => p.estado === 'activo') ?? base.proyectos[0];
    if (!proy) throw new Error('Proyecto no encontrado');
    const curso = base.cursos.find((c) => c.id === proy.curso_id);
    const ms = base.misiones.filter((m) => m.proyecto_id === proy.id);
    const etapas: EtapaProyecto[] = ms.map((m) => {
      const area = areaDeMision(m, base);
      return { numero: m.orden, titulo: m.titulo, materia: abreviar(area), materiaTagBg: ETIQUETA_MATERIA[area] ?? 'bg-neutral-100' };
    });
    const materiasChips = [...new Set(ms.map((m) => abreviar(areaDeMision(m, base))))];

    // Cobertura del CURSO: contenidos del año del curso vinculados a algún proyecto del curso.
    const anio = curso?.anio ?? 0;
    const contenidosAnio = filas(await sb.from('curriculo_contenidos').select('id, area_id, descripcion, eje').eq('anio', anio).is('escuela_id', null));
    const proyIds = base.proyectos.filter((p) => p.curso_id === proy.curso_id).map((p) => p.id as string);
    const vinc = proyIds.length ? filas(await sb.from('proyecto_contenidos').select('proyecto_id, contenido_id').in('proyecto_id', proyIds)) : [];
    const cubiertosSet = new Set(vinc.map((v) => v.contenido_id as string));
    const etapaDeContenido = new Map<string, number>();
    ms.forEach((m) => { if (m.contenido_id) etapaDeContenido.set(m.contenido_id, m.orden); });

    const nombresArea = [...new Set(contenidosAnio.map((c) => base.areaNombre.get(c.area_id) ?? 'General'))];
    const areasRes = nombresArea.map((nombre, i) => {
      const deArea = contenidosAnio.filter((c) => (base.areaNombre.get(c.area_id) ?? 'General') === nombre);
      return { nombre: abreviar(nombre), cubiertos: deArea.filter((c) => cubiertosSet.has(c.id)).length, total: deArea.length, colorBg: COLORES_AREA_BLOQUE[i % COLORES_AREA_BLOQUE.length] };
    });
    const contenidos: ContenidoCurricular[] = contenidosAnio
      .map((c) => {
        const area = abreviar(base.areaNombre.get(c.area_id) ?? 'General');
        const cubierto = cubiertosSet.has(c.id);
        return {
          id: c.id, area, estado: cubierto ? ('cubierto' as const) : ('falta' as const),
          descripcion: c.descripcion,
          detalle: cubierto && etapaDeContenido.has(c.id) ? `Cubierto en etapa ${etapaDeContenido.get(c.id)}` : undefined,
        };
      })
      .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === 'cubierto' ? -1 : 1));
    const totalCub = contenidos.filter((c) => c.estado === 'cubierto').length;

    return {
      id: proy.id,
      paso: proy.estado === 'activo' ? 'En curso' : proy.estado === 'borrador' ? 'Borrador' : 'Finalizado',
      titulo: proy.titulo,
      curso: curso?.nombre ?? '',
      materiasChips,
      etapas,
      // La rúbrica todavía no se guarda en la base: criterio neutro hasta que el docente la defina.
      rubricaEnFoco: {
        criterio: 'Criterio a definir por el docente.',
        niveles: [
          { nivel: 'En inicio', descripcion: 'Necesita acompañamiento para empezar la tarea.' },
          { nivel: 'En proceso', descripcion: 'Avanza con ayuda de las preguntas guía.' },
          { nivel: 'Logrado', descripcion: 'Resuelve la tarea y puede explicar cómo lo hizo.' },
        ],
      },
      coberturaCurricular: {
        titulo: `Cobertura curricular · ${anio}º ${curso?.nivel === 'secundaria' ? 'año' : 'grado'}`,
        resumen: `${totalCub} de ${contenidos.length} NAP cubiertos`,
        areas: areasRes,
        contenidos,
      },
    };
  },

  async obtenerProyectos(): Promise<ProyectoListItem[]> {
    const sb = getSupabase();
    const base = await cargarBase(sb);
    const out: ProyectoListItem[] = [];
    for (const p of base.proyectos) {
      const curso = base.cursos.find((c) => c.id === p.curso_id);
      const ms = base.misiones.filter((m) => m.proyecto_id === p.id);
      const materias = [...new Set(ms.map((m) => abreviar(areaDeMision(m, base))))].join(' + ') || 'Sin materias todavía';
      const vinc = filas(await sb.from('proyecto_contenidos').select('contenido_id').eq('proyecto_id', p.id));
      const total = filas(await sb.from('curriculo_contenidos').select('id').eq('anio', curso?.anio ?? 0).is('escuela_id', null)).length;
      out.push({
        id: p.id, titulo: p.titulo, curso: curso?.nombre ?? '', materias,
        cobertura: `${vinc.length} de ${total}`,
        estado: p.estado === 'activo' ? 'en_curso' : p.estado === 'borrador' ? 'planificado' : 'finalizado',
      });
    }
    return out;
  },

  // ───────────────────────── Grupos ─────────────────────────
  async obtenerGruposSugeridos(): Promise<GrupoSugerido[]> {
    const sb = getSupabase();
    const gs = filas(await sb.from('grupos').select('id').order('nombre_visible'));
    return Promise.all(gs.map((g) => resolverGrupo(sb, g.id)));
  },

  async cambiarEstadoGrupo(grupoId, nuevoEstado): Promise<GrupoSugerido> {
    const sb = getSupabase();
    const { error } = await sb.from('grupos').update({ estado: nuevoEstado }).eq('id', grupoId);
    if (error) throw new Error(error.message);
    return resolverGrupo(sb, grupoId);
  },

  async editarGrupo(grupoId, datos): Promise<GrupoSugerido> {
    const sb = getSupabase();
    const { error } = await sb.from('grupos').update({ nombre_visible: datos.nombreVisible.trim() }).eq('id', grupoId);
    if (error) throw new Error(error.message);
    const etiqueta = datos.etiquetaDocente.trim();
    if (etiqueta) {
      const e2 = await sb.from('grupos_internos').upsert({ grupo_id: grupoId, etiqueta }, { onConflict: 'grupo_id' });
      if (e2.error) throw new Error(e2.error.message);
    }
    return resolverGrupo(sb, grupoId);
  },

  // ───────────────────────── Gestión: formularios ─────────────────────────
  async listarCursos(): Promise<CursoDocente[]> {
    const cursos = await cursosDelDocente(getSupabase());
    return cursos.map((c) => ({ id: c.id, nombre: c.nombre, anio: c.anio, nivel: c.nivel }));
  },

  async listarAlumnosDeCurso(cursoId): Promise<AlumnoCurso[]> {
    const sb = getSupabase();
    const insc = filas(await sb.from('inscripciones').select('alumno_id').eq('curso_id', cursoId));
    const ids = insc.map((i) => i.alumno_id as string);
    if (ids.length === 0) return [];
    const perfiles = filas(await sb.from('perfiles').select('id, nombre_visible').in('id', ids));
    return perfiles.map((p) => ({ id: p.id, nombre: p.nombre_visible })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },

  async listarContenidosDelCurso(cursoId): Promise<ContenidoElegible[]> {
    const sb = getSupabase();
    const curso = (await sb.from('cursos').select('anio').eq('id', cursoId).maybeSingle()).data as Fila | null;
    if (!curso) return [];
    const [conts, areas] = await Promise.all([
      sb.from('curriculo_contenidos').select('id, area_id, descripcion, fuente, orden').eq('anio', curso.anio).order('orden'),
      sb.from('areas').select('id, nombre'),
    ]);
    const nombre = new Map(filas(areas).map((a) => [a.id as string, a.nombre as string]));
    // Con contenidos del Ministerio cargados para este grado se usan solo esos; los de ejemplo quedan de respaldo.
    const todos = filas(conts);
    const oficiales = todos.filter((c) => c.fuente);
    return (oficiales.length > 0 ? oficiales : todos).map((c) => ({ id: c.id, area: nombre.get(c.area_id) ?? 'General', descripcion: c.descripcion }));
  },

  async crearGrupo(datos: NuevoGrupo): Promise<GrupoSugerido> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const g = await sb.from('grupos').insert({
      curso_id: datos.cursoId, proyecto_id: datos.proyectoId ?? null, tipo: 'dinamico', nombre_visible: datos.nombreVisible.trim(), estado: 'aprobado', creado_por: uid,
      criterio: { origen: 'armado por la docente', explicacion: datos.explicacion ?? 'Grupo armado por vos para este curso.' },
    }).select('id').single();
    if (g.error || !g.data) throw new Error(g.error?.message ?? 'No se pudo crear el grupo');
    const id = (g.data as Fila).id as string;
    try {
      if (datos.etiquetaDocente.trim()) {
        const i = await sb.from('grupos_internos').insert({ grupo_id: id, etiqueta: datos.etiquetaDocente.trim() });
        if (i.error) throw new Error(i.error.message);
      }
      if (datos.alumnoIds.length) {
        const m = await sb.from('grupo_miembros').insert(datos.alumnoIds.map((a) => ({ grupo_id: id, alumno_id: a })));
        if (m.error) throw new Error(m.error.message);
      }
    } catch (e) {
      await sb.from('grupos').delete().eq('id', id); // no deja un grupo a medias
      throw e;
    }
    return resolverGrupo(sb, id);
  },

  async crearProyecto(datos: NuevoProyecto): Promise<{ id: string }> {
    const sb = getSupabase();
    const uid = await usuarioActual(sb);
    const curso = (await sb.from('cursos').select('escuela_id').eq('id', datos.cursoId).maybeSingle()).data as Fila | null;
    if (!curso) throw new Error('Curso no encontrado');
    const p = await sb.from('proyectos').insert({
      escuela_id: curso.escuela_id, curso_id: datos.cursoId, creado_por: uid, titulo: datos.titulo.trim(),
      descripcion: datos.descripcion?.trim() || null, estado: datos.publicar ? 'activo' : 'borrador', visibilidad: 'curso',
      fecha_inicio: datos.etapas?.length ? (datos.fechaInicio ?? null) : null, semanas: datos.etapas?.length ? Math.max(...datos.etapas.map((e) => e.semana)) : null,
    }).select('id').single();
    if (p.error || !p.data) throw new Error(p.error?.message ?? 'No se pudo crear el proyecto');
    const id = (p.data as Fila).id as string;
    try {
      if (datos.contenidoIds.length) {
        const c = await sb.from('proyecto_contenidos').insert(datos.contenidoIds.map((k) => ({ proyecto_id: id, contenido_id: k })));
        if (c.error) throw new Error(c.error.message);
      }
      // Planificación por semanas: primero las etapas (una por semana, con los aprendizajes que cubre), después las misiones colgadas de cada una.
      const etapaDeSemana = new Map<number, string>();
      if (datos.etapas?.length) {
        const e = await sb.from('etapas').insert(datos.etapas.map((x) => ({ proyecto_id: id, semana: x.semana, titulo: x.titulo.trim(), objetivo: x.objetivo?.trim() || null }))).select('id, semana');
        if (e.error) throw new Error(e.error.message);
        for (const r of (e.data as Fila[]) ?? []) etapaDeSemana.set(r.semana as number, r.id as string);
        const enlaces = datos.etapas.flatMap((x) => [...new Set(x.contenidoIds)].map((k) => ({ etapa_id: etapaDeSemana.get(x.semana) as string, contenido_id: k })));
        if (enlaces.length) {
          const ec = await sb.from('etapa_contenidos').insert(enlaces);
          if (ec.error) throw new Error(ec.error.message);
        }
      }
      if (datos.misiones.length) {
        const m = await sb.from('misiones').insert(datos.misiones.map((x, i) => filaMision(id, i + 1, x, x.semana ? (etapaDeSemana.get(x.semana) ?? null) : null))).select('id, orden');
        if (m.error) throw new Error(m.error.message);
        // Las respuestas correctas van aparte (misiones_claves): solo las puede leer la docente.
        const claves = ((m.data as Fila[]) ?? []).map((r) => filaClave(r.id as string, datos.misiones[(r.orden as number) - 1].respuesta)).filter((k): k is NonNullable<typeof k> => k !== null);
        if (claves.length) {
          const k = await sb.from('misiones_claves').insert(claves);
          if (k.error) throw new Error(k.error.message);
        }
      }
    } catch (e) {
      await sb.from('proyectos').delete().eq('id', id); // no deja un proyecto a medias
      throw e;
    }
    return { id };
  },

  // ───────────────────────── Ingreso y familias ─────────────────────────
  async listarSolicitudesIngreso(): Promise<SolicitudIngreso[]> {
    const sb = getSupabase();
    const sols = filas(await sb.from('solicitudes_ingreso').select('id, curso_id, nombre_visible, avatar, created_at').eq('estado', 'pendiente').order('created_at'));
    const cursoIds = [...new Set(sols.map((s) => s.curso_id as string))];
    const cursos = cursoIds.length ? filas(await sb.from('cursos').select('id, nombre').in('id', cursoIds)) : [];
    // Para avisar de nombres repetidos: alumnos ya inscriptos en cada curso + los otros pedidos pendientes.
    const insc = cursoIds.length ? filas(await sb.from('inscripciones').select('curso_id, alumno_id').in('curso_id', cursoIds)) : [];
    const alumnoIds = [...new Set(insc.map((i) => i.alumno_id as string))];
    const perfiles = alumnoIds.length ? filas(await sb.from('perfiles').select('id, nombre_visible').in('id', alumnoIds)) : [];
    const nombreDe = new Map(perfiles.map((p) => [p.id as string, p.nombre_visible as string]));
    return sols.map((s) => {
      const candidatos: CoincidenciaNombre[] = [
        ...insc.filter((i) => i.curso_id === s.curso_id).map((i) => ({ id: i.alumno_id as string, nombre: nombreDe.get(i.alumno_id) ?? '', tipo: 'alumno' as const })),
        ...sols.filter((o) => o.curso_id === s.curso_id && o.id !== s.id).map((o) => ({ id: o.id as string, nombre: o.nombre_visible as string, tipo: 'pedido' as const })),
      ];
      return {
        id: s.id, cursoId: s.curso_id, curso: cursos.find((c) => c.id === s.curso_id)?.nombre ?? '',
        nombreVisible: s.nombre_visible, avatar: s.avatar ?? null, creadaEn: s.created_at,
        coincidencias: buscarCoincidencias(s.nombre_visible, candidatos),
      };
    });
  },

  async resolverSolicitudIngreso(solicitudId, accion): Promise<void> {
    const { data, error } = await getSupabase().functions.invoke('aprobar-ingreso', { body: { solicitud_id: solicitudId, accion } });
    if (error || !data?.ok) throw new Error('No se pudo resolver la solicitud');
  },

  async listarConsentimientos(): Promise<ConsentimientoAlumno[]> {
    const sb = getSupabase();
    const insc = filas(await sb.from('inscripciones').select('alumno_id, curso_id'));
    const ids = insc.map((i) => i.alumno_id as string);
    if (ids.length === 0) return [];
    const [perfiles, cursos, cons, vinculos, invs] = await Promise.all([
      sb.from('perfiles').select('id, nombre_visible').in('id', ids),
      sb.from('cursos').select('id, nombre'),
      sb.from('consentimientos').select('alumno_id, estado').in('alumno_id', ids),
      sb.from('familias_vinculos').select('alumno_id').in('alumno_id', ids),
      sb.from('invitaciones_familia').select('alumno_id, vence_en, usada_en').in('alumno_id', ids),
    ]);
    const ahora = Date.now();
    return insc
      .map((i) => {
        const estado = filas(cons).find((c) => c.alumno_id === i.alumno_id)?.estado as ConsentimientoAlumno['estado'] | undefined;
        return {
          alumnoId: i.alumno_id,
          nombre: filas(perfiles).find((p) => p.id === i.alumno_id)?.nombre_visible ?? '—',
          curso: filas(cursos).find((c) => c.id === i.curso_id)?.nombre ?? '',
          estado: estado ?? 'sin_registro',
          familiaVinculada: filas(vinculos).some((v) => v.alumno_id === i.alumno_id),
          invitacionVigente: filas(invs).some((v) => v.alumno_id === i.alumno_id && !v.usada_en && new Date(v.vence_en).getTime() > ahora),
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },

  async invitarFamilia(alumnoId): Promise<{ codigo: string; venceEn: string }> {
    const { data, error } = await getSupabase().functions.invoke('invitar-familia', { body: { alumno_id: alumnoId } });
    if (error || !data?.ok) throw new Error('No se pudo generar la invitación');
    return { codigo: data.codigo, venceEn: data.vence_en };
  },
};
