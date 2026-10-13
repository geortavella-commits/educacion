import { getSupabase } from '@/lib/supabase';
import type { ConsentimientoData, ConsentimientoService } from './consentimiento.tipos';

/** Versión del texto de consentimiento que acepta la familia (se actualiza cuando legal lo valide). */
export const VERSION_TEXTO_CONSENTIMIENTO = 'v1-borrador-2026-10';

type Fila = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const fecha = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined;

async function cargar(alumnoId?: string): Promise<ConsentimientoData> {
  const sb = getSupabase();
  const { data: ses } = await sb.auth.getSession();
  if (!ses.session) throw new Error('sin_sesion');
  const uid = ses.session.user.id;

  // Los hijos/as vinculados a esta cuenta de familia (la RLS ya lo limita a los suyos).
  const vinculos = ((await sb.from('familias_vinculos').select('alumno_id').eq('familia_id', uid)).data as Fila[] | null) ?? [];
  const ids = vinculos.map((v) => v.alumno_id as string);
  const elegido = alumnoId && ids.includes(alumnoId) ? alumnoId : ids[0];
  const [yo, escuela] = await Promise.all([
    sb.from('perfiles').select('nombre_visible').eq('id', uid).maybeSingle(),
    sb.from('escuelas').select('nombre, localidad').limit(1).maybeSingle(),
  ]);
  const e = escuela.data as Fila | null;
  const base = {
    tutorNombre: (yo.data as Fila | null)?.nombre_visible ?? '',
    escuela: e ? `${e.nombre}${e.localidad ? `, ${e.localidad}` : ''}` : '',
  };
  if (!elegido) return { id: '', alumnoNombre: '', ...base, estado: 'sin_permiso' };

  const [alumno, cons] = await Promise.all([
    sb.from('perfiles').select('nombre_visible').eq('id', elegido).maybeSingle(),
    sb.from('consentimientos').select('estado, fecha').eq('alumno_id', elegido).order('fecha', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const c = cons.data as Fila | null;
  const estado = (c?.estado ?? 'pendiente') as ConsentimientoData['estado'];
  return {
    id: elegido,
    alumnoNombre: (alumno.data as Fila | null)?.nombre_visible ?? '',
    ...base,
    estado,
    fechaOtorgado: estado === 'otorgado' ? fecha(c?.fecha) : undefined,
    fechaRevocado: estado === 'revocado' ? fecha(c?.fecha) : undefined,
  };
}

async function cambiar(id: string, accion: 'otorgar' | 'revocar'): Promise<ConsentimientoData> {
  const { data, error } = await getSupabase().functions.invoke('consentimiento', {
    body: { alumno_id: id, accion, ...(accion === 'otorgar' ? { version_texto: VERSION_TEXTO_CONSENTIMIENTO } : {}) },
  });
  if (error || !data?.ok) throw new Error('No se pudo guardar la decisión');
  return cargar(id);
}

export const consentimientoSupabase: ConsentimientoService = {
  obtenerConsentimiento: (id) => cargar(id),
  otorgarConsentimiento: (id) => cambiar(id, 'otorgar'),
  revocarConsentimiento: (id) => cambiar(id, 'revocar'),
};
