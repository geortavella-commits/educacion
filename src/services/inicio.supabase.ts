import { getSupabase } from '@/lib/supabase';
import { guardarInteresesDB, LISTA_INTERESES } from './diagnostico';
import type { DatosInicioAlumno, InicioService, MisionAlumno } from './inicio.tipos';
import { hoyEnCordoba } from '../../supabase/functions/_shared/semanas';

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const abreviar = (area: string) => ({ Matemática: 'Mate', 'Ciencias Naturales': 'Cs. Nat.' } as Record<string, string>)[area] ?? area;

function filas(r: { data: unknown; error: { message: string } | null }): Fila[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data as Fila[]) ?? [];
}

/** Inicio del alumno con datos reales (la RLS solo le deja ver lo suyo y lo de su curso). */
export const inicioSupabase: InicioService = {
  async getDatosInicio(): Promise<DatosInicioAlumno> {
    const sb = getSupabase();
    const { data: ses } = await sb.auth.getSession();
    if (!ses.session) throw new Error('sin_sesion');
    const uid = ses.session.user.id;

    // Solo los proyectos del CURSO del alumno (un proyecto "de la escuela" de otro curso es visible pero no es suyo).
    const inscripciones = filas(await sb.from('inscripciones').select('curso_id').eq('alumno_id', uid));
    const cursoIds = inscripciones.map((i) => i.curso_id as string);

    const [perfil, intereses, consentimiento, proyectos, progreso, conMensaje] = await Promise.all([
      sb.from('perfiles').select('nombre_visible').eq('id', uid).maybeSingle(),
      sb.from('intereses_alumno').select('interes').eq('alumno_id', uid).eq('origen', 'declarado'),
      sb.from('consentimientos').select('estado').eq('alumno_id', uid).order('fecha', { ascending: false }).limit(1),
      cursoIds.length
        ? sb.from('proyectos').select('id, titulo, estado, created_at, fecha_inicio').eq('estado', 'activo').in('curso_id', cursoIds).order('created_at')
        : Promise.resolve({ data: [], error: null }),
      sb.from('progreso_misiones').select('mision_id, estado').eq('alumno_id', uid),
      // La RLS deja leer solo las valoraciones propias.
      sb.from('valoraciones_mision').select('mision_id').eq('alumno_id', uid),
    ]);

    const proys = filas(proyectos);
    const ids = proys.map((p) => p.id as string);
    const misionesDB = ids.length ? filas(await sb.from('misiones').select('id, proyecto_id, orden, titulo, contenido_id, tipo_respuesta').in('proyecto_id', ids).order('orden')) : [];
    const cids = [...new Set(misionesDB.map((m) => m.contenido_id).filter(Boolean))] as string[];
    const conts = cids.length ? filas(await sb.from('curriculo_contenidos').select('id, area_id').in('id', cids)) : [];
    const areas = filas(await sb.from('areas').select('id, nombre'));
    const materiaDe = (m: Fila) => {
      const area = areas.find((a) => a.id === conts.find((c) => c.id === m.contenido_id)?.area_id)?.nombre;
      return area ? abreviar(area) : 'Proyecto';
    };
    const conMensajeIds = new Set(filas(conMensaje).map((v) => v.mision_id as string));
    const hechas = new Set(filas(progreso).filter((p) => p.estado === 'completada').map((p) => p.mision_id as string));

    // Agrupadas por proyecto (el más antiguo primero) y, dentro de cada uno, por orden: así cada misión se entiende en su proyecto.
    const nombreProyecto = new Map(proys.map((p) => [p.id as string, p.titulo as string]));
    const posicionProyecto = new Map(proys.map((p, i) => [p.id as string, i]));
    const misiones: MisionAlumno[] = [...misionesDB]
      .sort((a, b) => (posicionProyecto.get(a.proyecto_id) ?? 0) - (posicionProyecto.get(b.proyecto_id) ?? 0) || a.orden - b.orden)
      .map((m) => ({
        id: m.id,
        materias: [materiaDe(m)],
        titulo: m.titulo,
        duracionMinutos: 10,
        estado: hechas.has(m.id) ? ('Completada' as const) : ('Pendiente' as const),
        proyectoId: m.proyecto_id,
        proyectoNombre: nombreProyecto.get(m.proyecto_id) ?? '',
        orden: m.orden,
        tipo: m.tipo_respuesta,
        mensajeDocente: conMensajeIds.has(m.id),
      }));

    const proyectosAlumno = proys.map((p) => {
      const deP = misionesDB.filter((m) => m.proyecto_id === p.id);
      // Sin misiones visibles porque la primera semana todavía no empezó: se le avisa cuándo arranca (no se le oculta el proyecto).
      const empiezaEl = deP.length === 0 && p.fecha_inicio && (p.fecha_inicio as string) > hoyEnCordoba() ? (p.fecha_inicio as string) : null;
      return { id: p.id as string, nombre: p.titulo as string, misionesCompletadas: deP.filter((m) => hechas.has(m.id)).length, misionesTotales: deP.length, empiezaEl };
    });

    const foco = proys[0];
    const delFoco = misionesDB.filter((m) => m.proyecto_id === foco?.id);
    const estadoConsent = filas(consentimiento)[0]?.estado as string | undefined;

    return {
      alumnoNombre: (perfil.data as Fila | null)?.nombre_visible ?? '',
      estrellas: hechas.size, // una estrella por misión completada: sin niveles ni títulos
      pasiones: filas(intereses).map((i) => i.interes as string).filter((id) => LISTA_INTERESES.some((l) => l.id === id)),
      misiones,
      proyectos: proyectosAlumno,
      proyecto: {
        id: foco?.id ?? '',
        nombre: foco?.titulo ?? 'Todavía no hay un proyecto',
        misionesCompletadas: delFoco.filter((m) => hechas.has(m.id)).length,
        misionesTotales: delFoco.length,
      },
      sinConsentimiento: estadoConsent !== 'otorgado',
    };
  },

  async actualizarPasiones(nuevasPasiones: string[]): Promise<void> {
    await guardarInteresesDB(nuevasPasiones);
  },

  async listarMensajesDocente() {
    // La RLS deja leer solo los mensajes dirigidos a este alumno.
    const { data, error } = await getSupabase()
      .from('devoluciones')
      .select('id, tipo, texto, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({ id: d.id as string, tipo: d.tipo as 'motivacion' | 'sugerencia' | 'logro', texto: d.texto as string, creadoEn: d.created_at as string }));
  },

  async completarMision(misionId: string, opciones?: { pistasUsadas?: number }): Promise<void> {
    const { data, error } = await getSupabase().functions.invoke('completar-mision', {
      body: { mision_id: misionId, estado: 'completada', pistas_usadas: opciones?.pistasUsadas ?? 0 },
    });
    if (error || !data?.ok) throw new Error('No se pudo guardar tu avance');
  },
};
