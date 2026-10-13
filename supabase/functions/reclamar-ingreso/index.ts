// PÚBLICA. El dispositivo del alumno pregunta por su solicitud con el secreto que recibió al canjear.
// Si está pendiente/rechazada, lo informa. Si fue aprobada (y hace menos de 24 h), devuelve un
// enlace de UN SOLO USO para abrir sesión (el cliente lo canjea con auth.verifyOtp). Nunca se
// entrega ninguna contraseña. Intentos con secreto equivocado se limitan.
import { cabecerasCors, clienteAdmin, error, esUuid, intentosRecientes, leerJson, registrarIntento, responder, sha256 } from '../_shared/comun.ts';

const VENTANA_RECLAMO_MS = 24 * 60 * 60 * 1000;
const MAX_FALLOS = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.solicitud_id) || typeof cuerpo.secreto !== 'string' || cuerpo.secreto.length < 32 || cuerpo.secreto.length > 128) {
    return error(400, 'datos_invalidos');
  }

  const admin = clienteAdmin();
  const clave = `solicitud:${cuerpo.solicitud_id}`;
  if ((await intentosRecientes(admin, clave)) >= MAX_FALLOS) return responder({ ok: false, error: 'bloqueado', segundosEspera: 60 }, 429);

  const { data: sol } = await admin.from('solicitudes_ingreso')
    .select('id, estado, token_hash, usuario_id, resuelta_en, reclamada_en').eq('id', cuerpo.solicitud_id).maybeSingle();

  // Mismo error si no existe o el secreto no coincide.
  if (!sol || !sol.token_hash || sol.token_hash !== (await sha256(cuerpo.secreto))) {
    await registrarIntento(admin, clave);
    return error(404, 'no_disponible');
  }

  if (sol.estado === 'pendiente') return responder({ ok: true, estado: 'pendiente' });
  if (sol.estado === 'rechazada') return responder({ ok: true, estado: 'rechazada' });

  if (!sol.usuario_id || !sol.resuelta_en || Date.now() - new Date(sol.resuelta_en).getTime() > VENTANA_RECLAMO_MS) {
    return error(410, 'reclamo_vencido');
  }

  // La sesión se entrega UNA sola vez: se marca como reclamada ANTES de generar el enlace y solo si seguía sin reclamar.
  // (Si el dispositivo la pierde, la docente o la familia generan un acceso nuevo.)
  if (sol.reclamada_en) return error(410, 'reclamo_vencido');
  const { data: marcada } = await admin.from('solicitudes_ingreso')
    .update({ reclamada_en: new Date().toISOString() }).eq('id', sol.id).is('reclamada_en', null).select('id');
  if (!marcada || marcada.length === 0) return error(410, 'reclamo_vencido');

  const { data: usuario } = await admin.auth.admin.getUserById(sol.usuario_id);
  if (!usuario.user?.email) return error(500, 'no_se_pudo_crear');
  const { data: enlace, error: errLink } = await admin.auth.admin.generateLink({ type: 'magiclink', email: usuario.user.email });
  if (errLink || !enlace.properties?.hashed_token) return error(500, 'no_se_pudo_crear');

  return responder({ ok: true, estado: 'aprobada', token_hash: enlace.properties.hashed_token });
});
