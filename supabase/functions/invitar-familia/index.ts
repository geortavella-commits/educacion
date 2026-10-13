// La docente genera un código de invitación para la familia de UN alumno suyo.
// El código se devuelve una sola vez (la docente se lo entrega a la familia); en la base queda solo
// su hash. Vence a los 7 días, sirve una vez, y generar uno nuevo anula los anteriores sin usar.
import { cabecerasCors, clienteAdmin, error, esUuid, leerJson, responder, sha256, usuarioAutenticado } from '../_shared/comun.ts';

const DIAS_VIGENCIA = 7;
// Sin letras ni números que se confunden (0/O, 1/I/L): lo va a leer una familia desde un papel.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarCodigo(largo = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const docente = await usuarioAutenticado(req);
  if (!docente) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.alumno_id)) return error(400, 'datos_invalidos');

  const admin = clienteAdmin();

  // Debe ser docente de un curso en el que está inscripto el alumno. Si no, "no existe".
  const { data: insc } = await admin.from('inscripciones').select('curso_id').eq('alumno_id', cuerpo.alumno_id);
  const cursos = (insc ?? []).map((i) => i.curso_id);
  if (cursos.length === 0) return error(404, 'no_disponible');
  const { data: asignacion } = await admin.from('curso_docentes').select('curso_id')
    .eq('usuario_id', docente.id).in('curso_id', cursos).limit(1).maybeSingle();
  if (!asignacion) return error(404, 'no_disponible');

  const { data: curso } = await admin.from('cursos').select('escuela_id').eq('id', asignacion.curso_id).single();
  if (!curso) return error(404, 'no_disponible');

  const ahora = new Date();
  // Anula las invitaciones anteriores sin usar de ese alumno.
  await admin.from('invitaciones_familia').update({ vence_en: ahora.toISOString() })
    .eq('alumno_id', cuerpo.alumno_id).is('usada_en', null).gt('vence_en', ahora.toISOString());

  const codigo = generarCodigo();
  const vence = new Date(ahora.getTime() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);
  const { data: inv, error: errIns } = await admin.from('invitaciones_familia').insert({
    escuela_id: curso.escuela_id, alumno_id: cuerpo.alumno_id, codigo_hash: await sha256(codigo),
    vence_en: vence.toISOString(), creada_por: docente.id,
  }).select('id').single();
  if (errIns || !inv) return error(500, 'no_se_pudo_guardar');

  await admin.from('audit_log').insert({
    escuela_id: curso.escuela_id, usuario_id: docente.id, accion: 'invitacion_familia_creada',
    entidad: 'invitaciones_familia', entidad_id: inv.id,
  });

  return responder({ ok: true, codigo, vence_en: vence.toISOString() });
});
