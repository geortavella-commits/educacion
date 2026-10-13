// PÚBLICA. El alumno de primaria canjea el código de clase y queda una solicitud PENDIENTE.
// No crea ninguna cuenta: eso lo hace la docente al aprobar (aprobar-ingreso).
// Defensas: código largo con vencimiento (se guarda solo el hash), límite de intentos fallidos por IP
// y por código, tope de solicitudes pendientes por curso, nombre sin datos personales, secreto de un
// solo dispositivo (se devuelve una vez y se guarda solo su hash).
import { cabecerasCors, clienteAdmin, error, intentosRecientes, ipDe, leerJson, registrarIntento, responder, sha256 } from '../_shared/comun.ts';

const MAX_FALLOS_IP = 8;
const MAX_FALLOS_CODIGO = 30;
const MAX_PENDIENTES_POR_CURSO = 60;
const AVATARES = ['av-1', 'av-2', 'av-3', 'av-4', 'av-5', 'av-6']; // los mismos ids que usa la pantalla de ingreso

// Solo letras (con tildes), espacios y guion; 1 a 24 caracteres. Sin números, mails ni enlaces.
const NOMBRE_VALIDO = /^[\p{L}][\p{L} '-]{0,23}$/u;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (req.method !== 'POST') return error(405, 'metodo');

  const cuerpo = await leerJson(req);
  const codigo = typeof cuerpo?.codigo === 'string' ? cuerpo.codigo.trim().toUpperCase() : '';
  const nombre = typeof cuerpo?.nombre_visible === 'string' ? cuerpo.nombre_visible.trim().replace(/\s+/g, ' ') : '';
  const avatar = typeof cuerpo?.avatar === 'string' ? cuerpo.avatar : '';
  // "solo_validar": el alumno primero comprueba que el código sirve (paso 1 de la pantalla) y recién
  // después elige nombre y avatar. En ese modo no se crea nada.
  const soloValidar = cuerpo?.solo_validar === true;
  if (!/^[A-Z0-9]{6,12}$/.test(codigo) || (!soloValidar && (!NOMBRE_VALIDO.test(nombre) || !AVATARES.includes(avatar)))) {
    return error(400, 'datos_invalidos');
  }

  const admin = clienteAdmin();
  const claveIp = `ip:${await sha256(ipDe(req))}`;
  const hashCodigo = await sha256(codigo);
  const claveCodigo = `codigo:${hashCodigo}`;

  if ((await intentosRecientes(admin, claveIp)) >= MAX_FALLOS_IP || (await intentosRecientes(admin, claveCodigo)) >= MAX_FALLOS_CODIGO) {
    return responder({ ok: false, error: 'bloqueado', segundosEspera: 60 }, 429);
  }

  const { data: fila } = await admin
    .from('codigos_clase').select('curso_id, activo, vence_en, cursos!inner(nombre)')
    .eq('codigo_hash', hashCodigo).maybeSingle();

  if (!fila) {
    await registrarIntento(admin, claveIp);
    return error(404, 'codigo_invalido');
  }
  if (!fila.activo || new Date(fila.vence_en).getTime() < Date.now()) {
    await registrarIntento(admin, claveIp);
    return error(410, 'codigo_vencido');
  }

  const curso = (fila as unknown as { cursos: { nombre: string } }).cursos.nombre;

  if (soloValidar) {
    // Datos que el chico ya conoce: nombre de su clase y de su seño/o, y cuándo vence el código.
    const { data: asignacion } = await admin.from('curso_docentes').select('usuario_id').eq('curso_id', fila.curso_id).limit(1).maybeSingle();
    const { data: docente } = asignacion
      ? await admin.from('perfiles').select('nombre_visible').eq('id', asignacion.usuario_id).maybeSingle()
      : { data: null };
    return responder({ ok: true, curso, docente: docente?.nombre_visible ?? null, vence_en: fila.vence_en });
  }

  const { count } = await admin.from('solicitudes_ingreso').select('id', { count: 'exact', head: true })
    .eq('curso_id', fila.curso_id).eq('estado', 'pendiente');
  if ((count ?? 0) >= MAX_PENDIENTES_POR_CURSO) return responder({ ok: false, error: 'bloqueado', segundosEspera: 300 }, 429);

  // Secreto del dispositivo: se devuelve ACÁ una sola vez; en la base queda solo su hash.
  const secreto = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const { data: solicitud, error: errIns } = await admin.from('solicitudes_ingreso')
    .insert({ curso_id: fila.curso_id, nombre_visible: nombre, avatar, estado: 'pendiente', token_hash: await sha256(secreto) })
    .select('id').single();
  if (errIns || !solicitud) return error(500, 'no_se_pudo_guardar');

  return responder({ ok: true, solicitud_id: solicitud.id, secreto, curso });
});
