// La docente aprueba o rechaza una solicitud de ingreso. Al aprobar, SE CREA la cuenta del alumno
// (solo desde el servidor): usuario de auth sin mail real ni contraseña conocida, perfil mínimo
// (nombre visible + avatar), membresía de alumno e inscripción al curso. Queda en audit_log.
import { cabecerasCors, clienteAdmin, error, esUuid, leerJson, responder, usuarioAutenticado } from '../_shared/comun.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const docente = await usuarioAutenticado(req);
  if (!docente) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.solicitud_id) || !['aprobar', 'rechazar'].includes(cuerpo.accion as string)) {
    return error(400, 'datos_invalidos');
  }

  const admin = clienteAdmin();

  const { data: sol } = await admin.from('solicitudes_ingreso')
    .select('id, curso_id, nombre_visible, avatar, estado, cursos!inner(escuela_id)')
    .eq('id', cuerpo.solicitud_id).maybeSingle();
  if (!sol) return error(404, 'no_disponible');

  // Debe ser docente de ESE curso; si no, responde como si no existiera.
  const { data: asignacion } = await admin.from('curso_docentes').select('usuario_id')
    .eq('curso_id', sol.curso_id).eq('usuario_id', docente.id).maybeSingle();
  if (!asignacion) return error(404, 'no_disponible');
  if (sol.estado !== 'pendiente') return error(409, 'ya_resuelta');

  const escuelaId = (sol as unknown as { cursos: { escuela_id: string } }).cursos.escuela_id;
  const ahora = new Date().toISOString();

  if (cuerpo.accion === 'rechazar') {
    await admin.from('solicitudes_ingreso').update({ estado: 'rechazada', resuelta_por: docente.id, resuelta_en: ahora }).eq('id', sol.id); // se conserva el secreto: así el dispositivo del alumno puede enterarse de que fue rechazado
    await admin.from('audit_log').insert({ escuela_id: escuelaId, usuario_id: docente.id, accion: 'ingreso_rechazado', entidad: 'solicitudes_ingreso', entidad_id: sol.id });
    return responder({ ok: true, estado: 'rechazada' });
  }

  // Cuenta técnica: el alumno no usa mail ni contraseña. Dominio .invalid (nunca existe) y clave aleatoria
  // que nadie conoce; el acceso del dispositivo se da con un enlace de un solo uso (reclamar-ingreso).
  const alias = crypto.randomUUID();
  const { data: creado, error: errUser } = await admin.auth.admin.createUser({
    email: `alumno-${alias}@alumnos.chasqui.invalid`,
    password: crypto.randomUUID() + crypto.randomUUID(),
    email_confirm: true,
    app_metadata: { rol: 'alumno', creado_por_ingreso: true },
  });
  if (errUser || !creado.user) return error(500, 'no_se_pudo_crear');
  const uid = creado.user.id;

  const pasos = [
    () => admin.from('perfiles').insert({ id: uid, nombre_visible: sol.nombre_visible, avatar: sol.avatar }),
    () => admin.from('membresias').insert({ escuela_id: escuelaId, usuario_id: uid, rol: 'alumno' }),
    () => admin.from('inscripciones').insert({ curso_id: sol.curso_id, alumno_id: uid }),
    () => admin.from('solicitudes_ingreso').update({ estado: 'aprobada', usuario_id: uid, resuelta_por: docente.id, resuelta_en: ahora }).eq('id', sol.id),
  ];
  for (const paso of pasos) {
    const { error: errPaso } = await paso();
    if (errPaso) {
      await admin.auth.admin.deleteUser(uid); // deshace todo (las filas dependientes se borran en cascada)
      return error(500, 'no_se_pudo_crear');
    }
  }

  await admin.from('audit_log').insert({ escuela_id: escuelaId, usuario_id: docente.id, accion: 'ingreso_aprobado', entidad: 'solicitudes_ingreso', entidad_id: sol.id });
  return responder({ ok: true, estado: 'aprobada', alumno_id: uid });
});
