// La docente DEL curso del alumno, o una persona de su familia VINCULADA, genera un código de acceso nuevo para ese
// alumno (cambió de dispositivo, borró los datos del navegador, etc.). El código se devuelve una sola vez; en la base
// queda solo su hash. Vence a los 15 minutos, sirve una vez, y generar uno nuevo anula los anteriores sin usar.
import { cabecerasCors, clienteAdmin, error, esUuid, generarCodigo, leerJson, responder, sha256, usuarioAutenticado } from '../_shared/comun.ts';

const MINUTOS_VIGENCIA = 15;
const MAX_POR_HORA = 10; // tope por alumno: evita llenar la tabla o hostigar con códigos

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const quien = await usuarioAutenticado(req);
  if (!quien) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.alumno_id)) return error(400, 'datos_invalidos');
  const alumnoId = cuerpo.alumno_id;

  const admin = clienteAdmin();

  // Tiene que ser un alumno. Si no, "no existe" (no se revela nada).
  const { data: membresia } = await admin.from('membresias').select('escuela_id')
    .eq('usuario_id', alumnoId).eq('rol', 'alumno').limit(1).maybeSingle();
  if (!membresia) return error(404, 'no_disponible');

  // ¿Quién pide? Docente de un curso del alumno, o familia vinculada a él. Cualquier otra persona: "no existe".
  const { data: insc } = await admin.from('inscripciones').select('curso_id').eq('alumno_id', alumnoId);
  const cursos = (insc ?? []).map((i) => i.curso_id);
  let origen: 'docente' | 'familia' | null = null;
  if (cursos.length > 0) {
    const { data: asignacion } = await admin.from('curso_docentes').select('curso_id')
      .eq('usuario_id', quien.id).in('curso_id', cursos).limit(1).maybeSingle();
    if (asignacion) origen = 'docente';
  }
  if (!origen) {
    const { data: vinculo } = await admin.from('familias_vinculos').select('alumno_id')
      .eq('familia_id', quien.id).eq('alumno_id', alumnoId).maybeSingle();
    if (vinculo) origen = 'familia';
  }
  if (!origen) return error(404, 'no_disponible');

  const ahora = new Date();
  const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from('accesos_alumno').select('*', { count: 'exact', head: true })
    .eq('alumno_id', alumnoId).gte('created_at', haceUnaHora);
  if ((count ?? 0) >= MAX_POR_HORA) return responder({ ok: false, error: 'demasiados_codigos' }, 429);

  // Anula los códigos anteriores sin usar de ese alumno.
  await admin.from('accesos_alumno').update({ vence_en: ahora.toISOString() })
    .eq('alumno_id', alumnoId).is('usado_en', null).gt('vence_en', ahora.toISOString());

  const codigo = generarCodigo(8);
  const vence = new Date(ahora.getTime() + MINUTOS_VIGENCIA * 60 * 1000);
  const { data: acceso, error: errIns } = await admin.from('accesos_alumno').insert({
    escuela_id: membresia.escuela_id, alumno_id: alumnoId, codigo_hash: await sha256(codigo),
    vence_en: vence.toISOString(), creado_por: quien.id,
  }).select('id').single();
  if (errIns || !acceso) return error(500, 'no_se_pudo_guardar');

  await admin.from('audit_log').insert({
    escuela_id: membresia.escuela_id, usuario_id: quien.id,
    accion: origen === 'docente' ? 'acceso_alumno_creado_docente' : 'acceso_alumno_creado_familia',
    entidad: 'accesos_alumno', entidad_id: acceso.id,
  });

  return responder({ ok: true, codigo, vence_en: vence.toISOString() });
});
