// El alumno pide ayuda en una misión: hasta 3 pistas, de menos a más ayuda, que se entregan DE A UNA.
// Las pistas viven en `misiones_claves` (no son legibles desde el navegador). `pistas_usadas` cuenta cuántas desbloqueó.
//   · sin "accion" (o "ver"): si todavía no usó ninguna, entrega la primera; si ya usó, devuelve las que tiene, sin sumar.
//   · "siguiente": desbloquea una más (hasta el total) y devuelve todas las que lleva.
// La respuesta incluye `pista` (la última desbloqueada) por compatibilidad.
import { cabecerasCors, clienteAdmin, error, esUuid, leerJson, responder, usuarioAutenticado } from '../_shared/comun.ts';
import { contextoMision } from '../_shared/mision.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const usuario = await usuarioAutenticado(req);
  if (!usuario) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.mision_id)) return error(400, 'datos_invalidos');
  const quiereOtra = cuerpo.accion === 'siguiente';

  const admin = clienteAdmin();
  const c = await contextoMision(admin, usuario.id, cuerpo.mision_id);
  if (!c.ok) return c.respuesta;
  const { mision, proyecto } = c.ctx;

  const { data: clave } = await admin.from('misiones_claves').select('pistas, pista').eq('mision_id', mision.id).maybeSingle();
  const todas: string[] = Array.isArray(clave?.pistas) && clave.pistas.length > 0 ? (clave.pistas as unknown[]).filter((p): p is string => typeof p === 'string') : clave?.pista ? [clave.pista as string] : [];
  if (todas.length === 0) return error(404, 'sin_pista');

  const { data: prog } = await admin.from('progreso_misiones').select('estado, pistas_usadas').eq('mision_id', mision.id).eq('alumno_id', usuario.id).maybeSingle();
  const usadas = prog?.pistas_usadas ?? 0;
  // Cuántas debe tener desbloqueadas después de este pedido.
  const destino = Math.min(todas.length, Math.max(1, quiereOtra ? usadas + 1 : usadas));

  // Se anota sin pisar el estado de la misión (si ya la completó, sigue completada).
  if (!prog) {
    await admin.from('progreso_misiones').insert({ mision_id: mision.id, alumno_id: usuario.id, escuela_id: proyecto.escuela_id, estado: 'en_curso', pistas_usadas: destino });
  } else if (destino > usadas) {
    await admin.from('progreso_misiones').update({ pistas_usadas: destino }).eq('mision_id', mision.id).eq('alumno_id', usuario.id);
  }

  const desbloqueadas = todas.slice(0, destino);
  return responder({ ok: true, pista: desbloqueadas[desbloqueadas.length - 1], pistas: desbloqueadas, total: todas.length });
});
