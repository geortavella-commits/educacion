// El alumno manda su respuesta a una misión. El SERVIDOR la compara con la respuesta correcta (que el alumno nunca ve) y devuelve
// solo "correcta o no". Si es correcta, la misión queda completada y se devuelve cuál sigue. Si no, puede volver a intentar.
//
// Qué se cuida:
//  - La respuesta correcta, la pista y la explicación viven en `misiones_claves` (el alumno no puede leerla): salen solo cuando corresponde.
//  - Una respuesta incorrecta NUNCA revela la correcta ni cuántos intentos quedan (no hay límite de intentos ni puntaje).
//  - Tope de intentos por minuto para que nadie pruebe respuestas a lo bruto; un formato que no se puede comparar no cuenta.
//  - Las misiones "abierta" (texto libre) no se corrigen: se guarda lo que escribió el alumno para que lo lea la docente.
import { cabecerasCors, clienteAdmin, error, esUuid, intentosRecientes, leerJson, registrarIntento, responder, usuarioAutenticado } from '../_shared/comun.ts';
import { contextoMision, siguienteMision } from '../_shared/mision.ts';
import { esRespuestaCorrecta, respuestaConFormatoValido } from '../_shared/respuestas.ts';

const MAX_INTENTOS_POR_10_MIN = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const usuario = await usuarioAutenticado(req);
  if (!usuario) return error(401, 'sin_sesion');

  const cuerpo = await leerJson(req);
  if (!cuerpo || !esUuid(cuerpo.mision_id) || typeof cuerpo.respuesta !== 'string') return error(400, 'datos_invalidos');
  const respuesta = cuerpo.respuesta.trim().slice(0, 2001);

  const admin = clienteAdmin();
  const c = await contextoMision(admin, usuario.id, cuerpo.mision_id);
  if (!c.ok) return c.respuesta;
  const { mision, proyecto } = c.ctx;
  const tipo = mision.tipo_respuesta;

  if (!respuestaConFormatoValido(tipo, respuesta, mision.opciones)) return error(422, 'formato_invalido');

  const { data: prog } = await admin.from('progreso_misiones').select('estado, intentos, pistas_usadas').eq('mision_id', mision.id).eq('alumno_id', usuario.id).maybeSingle();
  const yaCompletada = prog?.estado === 'completada';

  const { data: clave } = await admin.from('misiones_claves').select('respuestas, tolerancia, explicacion').eq('mision_id', mision.id).maybeSingle();

  const intentosPrevios = prog?.intentos ?? 0;
  const guardar = (estado: 'en_curso' | 'completada') =>
    admin.from('progreso_misiones').upsert(
      {
        mision_id: mision.id, alumno_id: usuario.id, escuela_id: proyecto.escuela_id, estado,
        intentos: Math.min(intentosPrevios + 1, 30000), pistas_usadas: prog?.pistas_usadas ?? 0,
        completada_en: estado === 'completada' ? new Date().toISOString() : null,
      },
      { onConflict: 'mision_id,alumno_id' },
    );

  if (tipo === 'abierta') {
    const { error: eTexto } = await admin.from('respuestas_abiertas').upsert({ mision_id: mision.id, alumno_id: usuario.id, texto: respuesta, updated_at: new Date().toISOString() }, { onConflict: 'mision_id,alumno_id' });
    if (eTexto) return error(500, 'no_se_pudo_guardar');
  } else {
    const claveRespuestas = Array.isArray(clave?.respuestas) ? (clave!.respuestas as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    if (claveRespuestas.length === 0) return error(409, 'sin_clave'); // la docente todavía no cargó la respuesta correcta

    const claveIntentos = `resp:${usuario.id}:${mision.id}`;
    if ((await intentosRecientes(admin, claveIntentos, 10)) >= MAX_INTENTOS_POR_10_MIN) return responder({ ok: false, error: 'demasiados_intentos', segundosEspera: 60 }, 429);

    const correcta = esRespuestaCorrecta(tipo, respuesta, claveRespuestas, Number(clave?.tolerancia ?? 0));
    if (!correcta) {
      await registrarIntento(admin, claveIntentos);
      // Si ya la tenía completada, repasarla y equivocarse no le quita lo hecho: se corrige igual, pero no se toca el progreso.
      if (!yaCompletada) {
        const { error: eGuardar } = await guardar('en_curso');
        if (eGuardar) return error(500, 'no_se_pudo_guardar');
      }
      // Nunca se revela la respuesta correcta ni cuántos intentos van.
      return responder({ ok: true, correcta: false, completada: false });
    }
  }

  // Repasar una ya completada y acertar: se muestra el festejo de nuevo, sin reescribir fecha ni auditoría.
  if (yaCompletada && tipo !== 'abierta') {
    return responder({ ok: true, correcta: true, completada: true, explicacion: clave?.explicacion ?? null, siguiente: await siguienteMision(admin, usuario.id, mision.proyecto_id, mision.orden) });
  }

  const { error: eProg } = await guardar('completada');
  if (eProg) return error(500, 'no_se_pudo_guardar');
  await admin.from('audit_log').insert({ escuela_id: proyecto.escuela_id, usuario_id: usuario.id, accion: 'mision_completada', entidad: 'misiones', entidad_id: mision.id });

  return responder({
    ok: true,
    correcta: tipo === 'abierta' ? null : true,
    completada: true,
    explicacion: clave?.explicacion ?? null,
    siguiente: await siguienteMision(admin, usuario.id, mision.proyecto_id, mision.orden),
  });
});
