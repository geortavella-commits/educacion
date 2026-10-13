// La docente DEL curso genera el código de clase con el que los chicos piden entrar. Se devuelve una sola vez (la docente
// lo dicta o lo proyecta); en la base queda solo su hash. Vence a los 30 días y generar uno nuevo anula el anterior.
import { cabecerasCors, clienteAdmin, error, esUuid, generarCodigo, leerJson, responder, sha256, usuarioAutenticado } from '../_shared/comun.ts';

const DIAS_VIGENCIA = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const docente = await usuarioAutenticado(req);
  if (!docente) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.curso_id)) return error(400, 'datos_invalidos');

  const admin = clienteAdmin();
  const { data: asignacion } = await admin.from('curso_docentes').select('curso_id')
    .eq('usuario_id', docente.id).eq('curso_id', cuerpo.curso_id).maybeSingle();
  if (!asignacion) return error(404, 'no_disponible');
  const { data: curso } = await admin.from('cursos').select('escuela_id').eq('id', cuerpo.curso_id).single();
  if (!curso) return error(404, 'no_disponible');

  // Anula los códigos anteriores del curso.
  await admin.from('codigos_clase').update({ activo: false }).eq('curso_id', cuerpo.curso_id).eq('activo', true);

  // 6 caracteres: es lo que escribe el chico en las 6 casillas de la pantalla de ingreso.
  const codigo = generarCodigo(6);
  const vence = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);
  const { data: fila, error: errIns } = await admin.from('codigos_clase').insert({
    curso_id: cuerpo.curso_id, codigo_hash: await sha256(codigo), vence_en: vence.toISOString(), activo: true, creado_por: docente.id,
  }).select('id').single();
  if (errIns || !fila) return error(500, 'no_se_pudo_guardar');

  await admin.from('audit_log').insert({
    escuela_id: curso.escuela_id, usuario_id: docente.id, accion: 'codigo_clase_creado', entidad: 'codigos_clase', entidad_id: fila.id,
  });

  return responder({ ok: true, codigo, vence_en: vence.toISOString() });
});
