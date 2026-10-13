// PÚBLICA. El alumno escribe el código de acceso que le dio su docente o su familia y recibe una sesión nueva del MISMO
// usuario (mismo avance, mismos mensajes). Nunca se entrega una contraseña: se devuelve un enlace de un solo uso que el
// cliente canjea con auth.verifyOtp. Defensas: código largo con vencimiento (solo se guarda el hash), un solo uso
// (se marca en el servidor ANTES de generar el enlace), límite de intentos fallidos por IP.
import { cabecerasCors, clienteAdmin, error, intentosRecientes, ipDe, leerJson, registrarIntento, responder, sha256 } from '../_shared/comun.ts';

const MAX_FALLOS_IP = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const cuerpo = await leerJson(req);
  const codigo = typeof cuerpo?.codigo === 'string' ? cuerpo.codigo.replace(/[\s-]/g, '').toUpperCase() : '';
  if (!/^[A-Z0-9]{8}$/.test(codigo)) return error(400, 'datos_invalidos');

  const admin = clienteAdmin();
  const claveIp = `acceso-ip:${await sha256(ipDe(req))}`;
  if ((await intentosRecientes(admin, claveIp)) >= MAX_FALLOS_IP) return responder({ ok: false, error: 'bloqueado', segundosEspera: 60 }, 429);

  const { data: acceso } = await admin.from('accesos_alumno')
    .select('id, alumno_id, escuela_id, vence_en, usado_en').eq('codigo_hash', await sha256(codigo)).maybeSingle();
  if (!acceso) {
    await registrarIntento(admin, claveIp);
    return error(404, 'codigo_invalido');
  }
  if (acceso.usado_en || new Date(acceso.vence_en).getTime() < Date.now()) {
    await registrarIntento(admin, claveIp);
    return error(410, 'codigo_vencido');
  }

  // Se marca como usado ANTES de generar el enlace y solo si seguía sin usar: dos pedidos a la vez no pueden entrar los dos.
  const { data: marcado } = await admin.from('accesos_alumno')
    .update({ usado_en: new Date().toISOString() }).eq('id', acceso.id).is('usado_en', null).select('id');
  if (!marcado || marcado.length === 0) return error(410, 'codigo_vencido');

  const { data: usuario } = await admin.auth.admin.getUserById(acceso.alumno_id);
  const { data: enlace, error: errLink } = usuario.user?.email
    ? await admin.auth.admin.generateLink({ type: 'magiclink', email: usuario.user.email })
    : { data: null, error: new Error('sin_mail') };
  if (errLink || !enlace?.properties?.hashed_token) {
    // No se pudo dar la sesión: se libera el código para que no se "gaste" sin haber servido.
    await admin.from('accesos_alumno').update({ usado_en: null }).eq('id', acceso.id);
    return error(500, 'no_se_pudo_crear');
  }

  await admin.from('audit_log').insert({
    escuela_id: acceso.escuela_id, usuario_id: acceso.alumno_id, accion: 'acceso_alumno_usado',
    entidad: 'accesos_alumno', entidad_id: acceso.id,
  });

  return responder({ ok: true, token_hash: enlace.properties.hashed_token });
});
