// El alumno registra el avance de una misión. Escritura sensible: solo desde acá (service_role).
// Reglas: el alumno debe estar inscripto en el curso del proyecto, el proyecto debe estar activo
// y debe existir consentimiento familiar otorgado. Cada cambio queda en audit_log.
import { cabecerasCors, clienteAdmin, error, esUuid, leerJson, responder, usuarioAutenticado } from '../_shared/comun.ts';
import { estaHabilitada } from '../_shared/semanas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const usuario = await usuarioAutenticado(req);
  if (!usuario) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.mision_id)) return error(400, 'datos_invalidos');
  const estado = cuerpo.estado === 'en_curso' ? 'en_curso' : 'completada';
  const pistas = Number.isInteger(cuerpo.pistas_usadas) ? (cuerpo.pistas_usadas as number) : 0;
  if (pistas < 0 || pistas > 50) return error(400, 'datos_invalidos');

  const admin = clienteAdmin();

  const { data: mision } = await admin
    .from('misiones')
    .select('id, proyecto_id, tipo_respuesta, etapas(semana), proyectos!inner(id, escuela_id, curso_id, estado, fecha_inicio)')
    .eq('id', cuerpo.mision_id)
    .maybeSingle();
  const proyecto = (mision as { proyectos?: { escuela_id: string; curso_id: string | null; estado: string } } | null)?.proyectos;
  // Misma respuesta si no existe o no corresponde: no se revela qué existe.
  if (!mision || !proyecto || proyecto.estado !== 'activo' || !proyecto.curso_id) return error(404, 'no_disponible');
  if (!estaHabilitada((proyecto as { fecha_inicio?: string | null }).fecha_inicio, (mision as { etapas?: { semana: number } | null }).etapas?.semana)) return error(404, 'no_disponible');

  // Las misiones con respuesta que se corrige se completan SOLO acertando (verificar-respuesta). Sin esto, un alumno podría
  // marcarlas como hechas llamando directo a esta función.
  if ((mision as { tipo_respuesta?: string }).tipo_respuesta !== 'abierta') return error(409, 'requiere_respuesta');

  const { data: inscripcion } = await admin
    .from('inscripciones').select('alumno_id')
    .eq('alumno_id', usuario.id).eq('curso_id', proyecto.curso_id).maybeSingle();
  if (!inscripcion) return error(404, 'no_disponible');

  const { data: consentimiento } = await admin
    .from('consentimientos').select('id')
    .eq('alumno_id', usuario.id).eq('estado', 'otorgado').limit(1).maybeSingle();
  if (!consentimiento) return error(403, 'sin_consentimiento');

  const { data: progreso, error: errUpsert } = await admin
    .from('progreso_misiones')
    .upsert(
      {
        mision_id: cuerpo.mision_id,
        alumno_id: usuario.id,
        escuela_id: proyecto.escuela_id,
        estado,
        pistas_usadas: pistas,
        completada_en: estado === 'completada' ? new Date().toISOString() : null,
      },
      { onConflict: 'mision_id,alumno_id' },
    )
    .select('mision_id, estado, pistas_usadas, completada_en')
    .single();
  if (errUpsert) return error(500, 'no_se_pudo_guardar');

  await admin.from('audit_log').insert({
    escuela_id: proyecto.escuela_id,
    usuario_id: usuario.id,
    accion: estado === 'completada' ? 'mision_completada' : 'mision_iniciada',
    entidad: 'misiones',
    entidad_id: cuerpo.mision_id,
  });

  return responder({ ok: true, progreso });
});
