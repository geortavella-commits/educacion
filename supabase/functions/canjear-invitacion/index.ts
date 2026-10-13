// La familia canjea el código de invitación que le dio la docente.
//  - SIN sesión: crea su cuenta (mail + contraseña + nombre) y queda vinculada al alumno de la invitación.
//  - CON sesión: vincula una cuenta que ya existe (otro hijo, o un segundo tutor).
// En ambos casos queda el consentimiento PENDIENTE: recién después la familia lo otorga (función
// `consentimiento`). La familia solo puede vincularse al alumno de SU invitación. Todo en audit_log.
import { cabecerasCors, clienteAdmin, error, intentosRecientes, ipDe, leerJson, registrarIntento, responder, sha256, usuarioAutenticado } from '../_shared/comun.ts';

const MAX_FALLOS_IP = 8;
const MAX_FALLOS_CODIGO = 20;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const NOMBRE_VALIDO = /^[\p{L}][\p{L} '.-]{0,29}$/u; // nombre de la persona adulta, para mostrarlo en la app

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const cuerpo = await leerJson(req);
  const codigo = typeof cuerpo?.codigo === 'string' ? cuerpo.codigo.trim().toUpperCase().replace(/[\s-]/g, '') : '';
  if (!/^[A-Z0-9]{8}$/.test(codigo)) return error(400, 'datos_invalidos');

  // ¿Hay sesión de usuario? El cliente de Supabase manda SIEMPRE un token: si es la clave pública
  // (llamada anónima) o uno vencido, no es una sesión y se sigue como anónimo: sin sesión hay que
  // mandar mail + contraseña + nombre, así que no se gana ningún permiso por no tener token válido.
  const usuario = await usuarioAutenticado(req);

  // Datos para crear cuenta (solo si no hay sesión)
  const email = typeof cuerpo?.email === 'string' ? cuerpo.email.trim().toLowerCase() : '';
  const password = typeof cuerpo?.password === 'string' ? cuerpo.password : '';
  const nombre = typeof cuerpo?.nombre_visible === 'string' ? cuerpo.nombre_visible.trim().replace(/\s+/g, ' ') : '';
  if (!usuario) {
    // Contraseña: 8 a 72 caracteres, con letras y números, y distinta del mail (la API de administración no aplica la política de Auth).
    const claveValida = password.length >= 8 && password.length <= 72 && /\p{L}/u.test(password) && /\d/.test(password) && password.toLowerCase() !== email;
    if (!EMAIL.test(email) || !claveValida || !NOMBRE_VALIDO.test(nombre)) {
      return error(400, 'datos_invalidos');
    }
  }

  const admin = clienteAdmin();
  const hash = await sha256(codigo);
  const claveIp = `ip:${await sha256(ipDe(req))}`;
  const claveCodigo = `invitacion:${hash}`;
  if ((await intentosRecientes(admin, claveIp)) >= MAX_FALLOS_IP || (await intentosRecientes(admin, claveCodigo)) >= MAX_FALLOS_CODIGO) {
    return responder({ ok: false, error: 'bloqueado', segundosEspera: 60 }, 429);
  }

  const { data: inv } = await admin.from('invitaciones_familia')
    .select('id, escuela_id, alumno_id, vence_en, usada_en').eq('codigo_hash', hash).maybeSingle();
  if (!inv) {
    await registrarIntento(admin, claveIp);
    return error(404, 'codigo_invalido');
  }
  if (inv.usada_en || new Date(inv.vence_en).getTime() < Date.now()) {
    await registrarIntento(admin, claveIp);
    return error(410, 'codigo_vencido');
  }

  let familiaId: string;
  let cuentaNueva = false;

  if (usuario) {
    familiaId = usuario.id;
    const { data: yaVinculada } = await admin.from('familias_vinculos').select('familia_id')
      .eq('familia_id', familiaId).eq('alumno_id', inv.alumno_id).maybeSingle();
    if (yaVinculada) return error(409, 'ya_vinculada');
  } else {
    const { data: creado, error: errUser } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, // el código que entregó la docente hace de verificación
      app_metadata: { rol: 'familia', creado_por_invitacion: true },
    });
    if (errUser || !creado.user) {
      // Mail ya registrado: solo se le dice a quien tiene un código válido.
      return error(errUser?.message?.toLowerCase().includes('already') ? 409 : 500, errUser?.message?.toLowerCase().includes('already') ? 'cuenta_existente' : 'no_se_pudo_crear');
    }
    familiaId = creado.user.id;
    cuentaNueva = true;
    const { error: errPerfil } = await admin.from('perfiles').insert({ id: familiaId, nombre_visible: nombre });
    if (errPerfil) {
      await admin.auth.admin.deleteUser(familiaId);
      return error(500, 'no_se_pudo_crear');
    }
  }

  // Membresía de familia en la escuela (si todavía no la tiene).
  const { data: memb } = await admin.from('membresias').select('id')
    .eq('usuario_id', familiaId).eq('escuela_id', inv.escuela_id).eq('rol', 'familia').maybeSingle();
  const pasos: Array<() => PromiseLike<{ error: unknown }>> = [];
  if (!memb) pasos.push(() => admin.from('membresias').insert({ escuela_id: inv.escuela_id, usuario_id: familiaId, rol: 'familia' }));
  pasos.push(() => admin.from('familias_vinculos').insert({ familia_id: familiaId, alumno_id: inv.alumno_id }));
  // Consentimiento pendiente (si el alumno todavía no tiene fila de consentimiento).
  const { data: cons } = await admin.from('consentimientos').select('id').eq('alumno_id', inv.alumno_id).limit(1).maybeSingle();
  if (!cons) {
    pasos.push(() => admin.from('consentimientos').insert({
      escuela_id: inv.escuela_id, alumno_id: inv.alumno_id, otorgado_por: familiaId, version_texto: 'pendiente', estado: 'pendiente',
    }));
  }
  pasos.push(() => admin.from('invitaciones_familia').update({ usada_en: new Date().toISOString(), usada_por: familiaId }).eq('id', inv.id));

  for (const paso of pasos) {
    const { error: errPaso } = await paso();
    if (errPaso) {
      if (cuentaNueva) await admin.auth.admin.deleteUser(familiaId); // deshace la cuenta nueva (cascada)
      return error(500, 'no_se_pudo_guardar');
    }
  }

  await admin.from('audit_log').insert({
    escuela_id: inv.escuela_id, usuario_id: familiaId, accion: 'familia_vinculada', entidad: 'familias_vinculos', entidad_id: inv.id,
  });

  return responder({ ok: true, cuentaNueva, alumno_id: inv.alumno_id });
});
