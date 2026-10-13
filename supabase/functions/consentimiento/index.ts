// La familia otorga o revoca el consentimiento de su hijo/a. Escritura sensible: solo desde acá.
// Reglas: quien llama debe estar vinculado al alumno (familias_vinculos). Se registra versión del
// texto, quién y cuándo, y cada cambio queda en audit_log. Revocar es tan fácil como otorgar.
import { cabecerasCors, clienteAdmin, error, esUuid, leerJson, responder, usuarioAutenticado } from '../_shared/comun.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const usuario = await usuarioAutenticado(req);
  if (!usuario) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.alumno_id) || !['otorgar', 'revocar'].includes(cuerpo.accion as string)) {
    return error(400, 'datos_invalidos');
  }
  const version = typeof cuerpo.version_texto === 'string' ? cuerpo.version_texto.trim().slice(0, 40) : '';
  if (cuerpo.accion === 'otorgar' && !version) return error(400, 'datos_invalidos');

  const admin = clienteAdmin();

  const { data: vinculo } = await admin
    .from('familias_vinculos').select('familia_id')
    .eq('familia_id', usuario.id).eq('alumno_id', cuerpo.alumno_id).maybeSingle();
  if (!vinculo) return error(404, 'no_disponible');

  const { data: actual } = await admin
    .from('consentimientos').select('id, escuela_id, estado')
    .eq('alumno_id', cuerpo.alumno_id).order('fecha', { ascending: false }).limit(1).maybeSingle();
  if (!actual) return error(404, 'no_disponible');

  const nuevoEstado = cuerpo.accion === 'otorgar' ? 'otorgado' : 'revocado';
  if (actual.estado === nuevoEstado) return responder({ ok: true, estado: nuevoEstado, sinCambios: true });

  const { error: errUpdate } = await admin
    .from('consentimientos')
    .update({
      estado: nuevoEstado,
      otorgado_por: usuario.id,
      fecha: new Date().toISOString(),
      ...(cuerpo.accion === 'otorgar' ? { version_texto: version } : {}),
    })
    .eq('id', actual.id);
  if (errUpdate) return error(500, 'no_se_pudo_guardar');

  await admin.from('audit_log').insert({
    escuela_id: actual.escuela_id,
    usuario_id: usuario.id,
    accion: cuerpo.accion === 'otorgar' ? 'consentimiento_otorgado' : 'consentimiento_revocado',
    entidad: 'consentimientos',
    entidad_id: actual.id,
  });

  return responder({ ok: true, estado: nuevoEstado });
});
