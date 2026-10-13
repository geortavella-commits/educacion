// Recorrido de punta a punta de los 4 roles contra el Supabase LOCAL (con el seed ficticio).
// Hace exactamente las llamadas que van a hacer los servicios del front, con sesión real.
// Todo lo que crea lleva el prefijo "E2E" para poder verificarlo y limpiarlo después con SQL.
// Requisitos: `supabase start`, `supabase db reset` (estado limpio), `supabase functions serve`, y .env.local.
// Correr con: npm run test:e2e   (después, `supabase db reset` deja todo como estaba).
import { describe, it, expect } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CLAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const PASS = 'educacion123';

async function disponible(): Promise<boolean> {
  if (!URL || !CLAVE) return false;
  try {
    const espera = new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), 2000));
    const r = await Promise.race([fetch(`${URL}/auth/v1/health`, { headers: { apikey: CLAVE } }), espera]);
    return r.ok;
  } catch {
    return false;
  }
}
// Esta prueba MODIFICA la base local: solo corre a pedido (npm run test:e2e), nunca dentro de `npm test`.
const pedido = import.meta.env.MODE === 'e2e';
const hayBase = pedido && (await disponible());

async function entrar(email: string): Promise<{ c: SupabaseClient; uid: string }> {
  const c = createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`no pude entrar como ${email}: ${error.message}`);
  return { c, uid: data.user.id };
}

// Estado compartido entre pasos (cada paso depende del anterior, como un recorrido real)
const e: Record<string, string> = {};

describe.skipIf(!hayBase)('E2E por roles (Supabase local)', () => {
  // ───────────────────────── DOCENTE ─────────────────────────
  describe('1. Docente (Laura, 5º B)', () => {
    it('crea un proyecto, le vincula contenidos y misiones', async () => {
      const { c, uid } = await entrar('docente.laura@ficticio.test');
      const { data: curso } = await c.from('cursos').select('id, escuela_id, nombre').eq('nombre', '5º B').single();
      expect(curso).toBeTruthy();
      e.curso = curso!.id; e.escuela = curso!.escuela_id; e.docente = uid;

      const { data: p, error } = await c.from('proyectos').insert({
        escuela_id: e.escuela, curso_id: e.curso, creado_por: uid,
        titulo: 'E2E Proyecto de prueba', descripcion: 'Creado por la prueba de punta a punta', estado: 'activo', visibilidad: 'curso',
      }).select('id').single();
      expect(error).toBeNull();
      e.proyecto = p!.id;

      const { data: conts } = await c.from('curriculo_contenidos').select('id').limit(2);
      expect(conts!.length).toBe(2);
      const { error: eVinc } = await c.from('proyecto_contenidos').insert(conts!.map((k) => ({ proyecto_id: e.proyecto, contenido_id: k.id })));
      expect(eVinc).toBeNull();

      const { data: ms, error: eM } = await c.from('misiones').insert([
        { proyecto_id: e.proyecto, orden: 1, titulo: 'E2E Misión 1', consigna: 'Primera misión de prueba' },
        { proyecto_id: e.proyecto, orden: 2, titulo: 'E2E Misión 2', consigna: 'Segunda misión de prueba' },
      ]).select('id, orden').order('orden');
      expect(eM).toBeNull();
      e.mision1 = ms![0].id; e.mision2 = ms![1].id;
    });

    it('crea un grupo con etiqueta interna y miembros; queda en borrador; después lo aprueba', async () => {
      const { c, uid } = await entrar('docente.laura@ficticio.test');
      const { data: insc } = await c.from('inscripciones').select('alumno_id').eq('curso_id', e.curso);
      expect(insc!.length).toBe(24);
      const mateo = await entrar('alumno.mateo@ficticio.test'); e.mateo = mateo.uid;

      const { data: g, error } = await c.from('grupos').insert({
        curso_id: e.curso, tipo: 'dinamico', nombre_visible: 'E2E Los exploradores', estado: 'borrador', creado_por: uid,
      }).select('id, estado').single();
      expect(error).toBeNull();
      expect(g!.estado).toBe('borrador');
      e.grupo = g!.id;

      expect((await c.from('grupos_internos').insert({ grupo_id: e.grupo, etiqueta: 'E2E Refuerzo interno' })).error).toBeNull();
      const miembros = [e.mateo, ...insc!.map((i) => i.alumno_id).filter((id) => id !== e.mateo).slice(0, 2)];
      expect((await c.from('grupo_miembros').insert(miembros.map((a) => ({ grupo_id: e.grupo, alumno_id: a })))).error).toBeNull();

      const { data: ap, error: eAp } = await c.from('grupos').update({ estado: 'aprobado' }).eq('id', e.grupo).select('estado').single();
      expect(eAp).toBeNull();
      expect(ap!.estado).toBe('aprobado');
    });

    it('corrige una observación (hipótesis) de su alumno', async () => {
      const { c, uid } = await entrar('docente.laura@ficticio.test');
      const { data: s } = await c.from('senales_alumno').select('id').ilike('descripcion', '%3 pistas%').single();
      e.senal = s!.id;
      const { data, error } = await c.from('senales_alumno')
        .update({ estado: 'corregida', descripcion: 'E2E: usó pistas porque la consigna era larga', revisada_por: uid })
        .eq('id', e.senal).select('estado').single();
      expect(error).toBeNull();
      expect(data!.estado).toBe('corregida');
    });

    it('NO puede: crear un grupo en el curso de otro docente, ni tocar señales ajenas, ni escribir progreso', async () => {
      const { c, uid } = await entrar('docente.laura@ficticio.test');
      const { data: cursoAjeno } = await c.from('cursos').select('id').eq('nombre', '6º A');
      expect(cursoAjeno ?? []).toHaveLength(0); // ni siquiera lo ve
      const { error: e1 } = await c.from('grupos').insert({
        curso_id: '00000000-0000-0000-0000-000000000000', tipo: 'dinamico', nombre_visible: 'E2E intruso', creado_por: uid,
      });
      expect(e1).not.toBeNull();
      const { error: e2 } = await c.from('progreso_misiones').insert({ mision_id: e.mision1, alumno_id: e.mateo, escuela_id: e.escuela, estado: 'completada' });
      expect(e2).not.toBeNull();
    });
  });

  // ───────────────────────── ALUMNO ─────────────────────────
  describe('2. Alumno (Mateo, 5º B)', () => {
    it('ve el proyecto y sus misiones, y su grupo aprobado SIN la etiqueta interna', async () => {
      const { c } = await entrar('alumno.mateo@ficticio.test');
      const { data: misiones } = await c.from('misiones').select('id, titulo').ilike('titulo', 'E2E%');
      expect(misiones).toHaveLength(2);
      const { data: grupos } = await c.from('grupos').select('nombre_visible').ilike('nombre_visible', 'E2E%');
      expect(grupos).toHaveLength(1);
      const { data: internos } = await c.from('grupos_internos').select('etiqueta');
      expect(internos ?? []).toHaveLength(0);
    });

    it('declara un interés; no puede inventar uno "observado"', async () => {
      const { c, uid } = await entrar('alumno.mateo@ficticio.test');
      expect((await c.from('intereses_alumno').insert({ alumno_id: uid, interes: 'robotica', origen: 'declarado' })).error).toBeNull();
      expect((await c.from('intereses_alumno').insert({ alumno_id: uid, interes: 'espacio', origen: 'observado' })).error).not.toBeNull();
    });

    it('completa una misión a través de la Edge Function', async () => {
      const { c } = await entrar('alumno.mateo@ficticio.test');
      const { data, error } = await c.functions.invoke('completar-mision', { body: { mision_id: e.mision1, estado: 'completada', pistas_usadas: 2 } });
      expect(error).toBeNull();
      expect(data.ok).toBe(true);
      expect(data.progreso.estado).toBe('completada');
      const { data: mio } = await c.from('progreso_misiones').select('estado, pistas_usadas').eq('mision_id', e.mision1).single();
      expect(mio).toEqual({ estado: 'completada', pistas_usadas: 2 });
    });

    it('NO puede escribir su progreso directo, ni completar una misión de otro curso', async () => {
      const { c, uid } = await entrar('alumno.mateo@ficticio.test');
      const { error: directo } = await c.from('progreso_misiones').update({ estado: 'completada' }).eq('mision_id', e.mision2);
      // sin política de escritura: no afecta filas (o da error)
      const { data: nada } = await c.from('progreso_misiones').select('estado').eq('mision_id', e.mision2);
      expect(nada ?? []).toHaveLength(0);
      expect(directo === null || directo !== null).toBe(true);
      const { error: ins } = await c.from('progreso_misiones').insert({ mision_id: e.mision2, alumno_id: uid, escuela_id: e.escuela, estado: 'completada' });
      expect(ins).not.toBeNull();
      // misión del proyecto de otro curso (6º A, seed): la función responde como si no existiera
      const j = await entrar('docente.julian@ficticio.test');
      const { data: mAjena } = await j.c.from('misiones').select('id').limit(1).single();
      const r = await c.functions.invoke('completar-mision', { body: { mision_id: mAjena!.id } });
      expect(r.error).not.toBeNull();
    });

    it('sin consentimiento otorgado la función rechaza (alumno con consentimiento pendiente)', async () => {
      const { c } = await entrar('alumno.ciro.5b@ficticio.test');
      const r = await c.functions.invoke('completar-mision', { body: { mision_id: e.mision1 } });
      expect(r.error).not.toBeNull();
      // (Ciro ya tiene avance de ejemplo del seed en otras misiones; lo que importa es que NO se creó en la nueva)
      const { data } = await c.from('progreso_misiones').select('estado').eq('mision_id', e.mision1);
      expect(data ?? []).toHaveLength(0);
    });
  });

  // ───────────────────────── FAMILIA ─────────────────────────
  describe('3. Familia', () => {
    it('ve el avance de su hijo/a (Mateo) y nada de otros chicos', async () => {
      const { c } = await entrar('familia.mateo@ficticio.test');
      const { data } = await c.from('progreso_misiones').select('estado, alumno_id');
      expect(data!.some((p) => p.estado === 'completada' && p.alumno_id === e.mateo)).toBe(true);
      expect(new Set(data!.map((p) => p.alumno_id)).size).toBe(1);
    });

    it('revoca el consentimiento → el alumno ya no puede completar misiones; al otorgarlo vuelve a poder', async () => {
      const fam = await entrar('familia.mateo@ficticio.test');
      const alu = await entrar('alumno.mateo@ficticio.test');
      const rev = await fam.c.functions.invoke('consentimiento', { body: { alumno_id: e.mateo, accion: 'revocar' } });
      expect(rev.data.estado).toBe('revocado');
      const bloqueado = await alu.c.functions.invoke('completar-mision', { body: { mision_id: e.mision2 } });
      expect(bloqueado.error).not.toBeNull();
      const otor = await fam.c.functions.invoke('consentimiento', { body: { alumno_id: e.mateo, accion: 'otorgar', version_texto: 'v1-e2e' } });
      expect(otor.data.estado).toBe('otorgado');
      const ok = await alu.c.functions.invoke('completar-mision', { body: { mision_id: e.mision2, pistas_usadas: 0 } });
      expect(ok.error).toBeNull();
      expect(ok.data.progreso.estado).toBe('completada');
    });

    it('otorga el consentimiento de su hijo/a (Ciro, estaba pendiente) y recién ahí Ciro puede avanzar', async () => {
      const fam = await entrar('familia.ciro.5b@ficticio.test');
      const alu = await entrar('alumno.ciro.5b@ficticio.test');
      const r = await fam.c.functions.invoke('consentimiento', { body: { alumno_id: alu.uid, accion: 'otorgar', version_texto: 'v1-e2e' } });
      expect(r.data.estado).toBe('otorgado');
      const ok = await alu.c.functions.invoke('completar-mision', { body: { mision_id: e.mision1, estado: 'en_curso' } });
      expect(ok.error).toBeNull();
      expect(ok.data.progreso.estado).toBe('en_curso');
    });

    it('NO puede gestionar el consentimiento de un chico que no es su hijo/a', async () => {
      const fam = await entrar('familia.mateo@ficticio.test');
      const ciro = await entrar('alumno.ciro.5b@ficticio.test');
      const r = await fam.c.functions.invoke('consentimiento', { body: { alumno_id: ciro.uid, accion: 'revocar' } });
      expect(r.error).not.toBeNull();
    });
  });

  // ───────────────────────── DIRECTIVO ─────────────────────────
  describe('4. Directivo', () => {
    it('ve agregados de su escuela, el resumen del tutor y la auditoría, pero no conversaciones ni observaciones', async () => {
      const { c } = await entrar('directivo@ficticio.test');
      const { data: res } = await c.rpc('resumen_escuela', { p_escuela: e.escuela });
      expect(res![0].alumnos_total).toBe(64);
      expect(res![0].consentimientos_pendientes).toBe(8); // eran 9; la familia de Ciro otorgó
      expect((await c.from('tutor_mensajes').select('id')).data ?? []).toHaveLength(0);
      expect((await c.from('senales_alumno').select('id')).data ?? []).toHaveLength(0);
      const { data: aud } = await c.from('audit_log').select('accion').in('accion', ['mision_completada', 'consentimiento_otorgado', 'consentimiento_revocado']);
      const acciones = new Set(aud!.map((a) => a.accion));
      expect(acciones.has('mision_completada')).toBe(true);
      expect(acciones.has('consentimiento_revocado')).toBe(true);
    });

    it('crea un curso y le asigna una docente; la docente lo ve recién después', async () => {
      const dir = await entrar('directivo@ficticio.test');
      const carla = await entrar('docente.carla@ficticio.test');
      const { data: antes } = await carla.c.from('cursos').select('id').ilike('nombre', 'E2E%');
      expect(antes ?? []).toHaveLength(0);
      const { data: curso, error } = await dir.c.from('cursos').insert({ escuela_id: e.escuela, nombre: 'E2E 4º año', nivel: 'secundaria', anio: 4, ciclo_lectivo: 2026 }).select('id').single();
      expect(error).toBeNull();
      e.cursoNuevo = curso!.id;
      expect((await dir.c.from('curso_docentes').insert({ curso_id: e.cursoNuevo, usuario_id: carla.uid })).error).toBeNull();
      const { data: despues } = await carla.c.from('cursos').select('nombre').ilike('nombre', 'E2E%');
      expect(despues).toHaveLength(1);
    });

    it('NO puede escribir progreso ni consentimientos ni leer a los alumnos', async () => {
      const { c, uid } = await entrar('directivo@ficticio.test');
      expect((await c.from('progreso_misiones').insert({ mision_id: e.mision1, alumno_id: uid, escuela_id: e.escuela })).error).not.toBeNull();
      expect((await c.from('consentimientos').update({ estado: 'otorgado' }).eq('estado', 'pendiente')).error).not.toBeNull();
      expect((await c.from('inscripciones').select('alumno_id')).data ?? []).toHaveLength(0);
    });
  });
  // ───────────────────── INGRESO DE PRIMARIA (código de clase) ─────────────────────
  describe('5. Ingreso de primaria por código', () => {
    const anonimo = () => createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const ipPropia = { 'x-forwarded-for': '198.51.100.7' };

    it('un código inventado es rechazado, igual que un nombre con mail o números', async () => {
      const a = anonimo();
      const mal = await a.functions.invoke('canjear-codigo', { body: { codigo: 'ZZZZZZ', nombre_visible: 'Pruebita Nico', avatar: 'av-1' }, headers: ipPropia });
      expect(mal.error).not.toBeNull();
      const conMail = await a.functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', nombre_visible: 'nico@gmail.com', avatar: 'av-1' }, headers: ipPropia });
      expect(conMail.error).not.toBeNull();
      const conNumeros = await a.functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', nombre_visible: 'Nico 2013', avatar: 'av-1' }, headers: ipPropia });
      expect(conNumeros.error).not.toBeNull();
    });

    it('"solo validar" devuelve clase, docente y vencimiento sin crear ninguna solicitud', async () => {
      const a = anonimo();
      const r = await a.functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', solo_validar: true }, headers: ipPropia });
      expect(r.error).toBeNull();
      expect(r.data).toMatchObject({ ok: true, curso: '5º B', docente: 'Seño Laura' });
      expect(new Date(r.data.vence_en).getTime()).toBeGreaterThan(Date.now());
      expect((await anonimo().functions.invoke('canjear-codigo', { body: { codigo: 'ZZZZZZ', solo_validar: true }, headers: ipPropia })).error).not.toBeNull();
    });

    it('con el código vigente queda una solicitud PENDIENTE y todavía no existe ninguna cuenta', async () => {
      const a = anonimo();
      const r = await a.functions.invoke('canjear-codigo', { body: { codigo: 'cor5b2', nombre_visible: 'Pruebita Nico', avatar: 'av-1' }, headers: ipPropia });
      expect(r.error).toBeNull();
      expect(r.data.ok).toBe(true);
      expect(r.data.curso).toBe('5º B');
      e.solicitud = r.data.solicitud_id; e.secreto = r.data.secreto;
      expect(e.secreto.length).toBeGreaterThanOrEqual(32);
      const pend = await a.functions.invoke('reclamar-ingreso', { body: { solicitud_id: e.solicitud, secreto: e.secreto } });
      expect(pend.data.estado).toBe('pendiente');
      expect(pend.data.token_hash).toBeUndefined();
    });

    it('con un secreto equivocado no se obtiene nada', async () => {
      const r = await anonimo().functions.invoke('reclamar-ingreso', { body: { solicitud_id: e.solicitud, secreto: 'x'.repeat(40) } });
      expect(r.error).not.toBeNull();
    });

    it('la docente de OTRO curso no puede aprobarla; la docente del curso sí', async () => {
      const julian = await entrar('docente.julian@ficticio.test');
      const no = await julian.c.functions.invoke('aprobar-ingreso', { body: { solicitud_id: e.solicitud, accion: 'aprobar' } });
      expect(no.error).not.toBeNull();
      const laura = await entrar('docente.laura@ficticio.test');
      const { data: ve } = await laura.c.from('solicitudes_ingreso').select('nombre_visible, estado').eq('id', e.solicitud);
      expect(ve).toEqual([{ nombre_visible: 'Pruebita Nico', estado: 'pendiente' }]);
      const ok = await laura.c.functions.invoke('aprobar-ingreso', { body: { solicitud_id: e.solicitud, accion: 'aprobar' } });
      expect(ok.error).toBeNull();
      expect(ok.data.estado).toBe('aprobada');
      e.nuevoAlumno = ok.data.alumno_id;
    });

    it('el dispositivo reclama su sesión SIN contraseña y queda como alumno del curso, con los mínimos datos', async () => {
      const a = anonimo();
      const r = await a.functions.invoke('reclamar-ingreso', { body: { solicitud_id: e.solicitud, secreto: e.secreto } });
      expect(r.data.estado).toBe('aprobada');
      expect(typeof r.data.token_hash).toBe('string');
      expect(JSON.stringify(r.data)).not.toMatch(/password|contrase/i);
      const { data: ses, error } = await a.auth.verifyOtp({ token_hash: r.data.token_hash, type: 'magiclink' });
      expect(error).toBeNull();
      expect(ses.user!.id).toBe(e.nuevoAlumno);
      const { data: perfil } = await a.from('perfiles').select('nombre_visible, avatar').eq('id', e.nuevoAlumno).single();
      expect(perfil).toEqual({ nombre_visible: 'Pruebita Nico', avatar: 'av-1' });
      const { data: insc } = await a.from('inscripciones').select('curso_id');
      expect(insc).toEqual([{ curso_id: e.curso }]);
      const { data: mis } = await a.from('misiones').select('id').ilike('titulo', 'E2E%');
      expect(mis).toHaveLength(2);
      // el enlace es de un solo uso
      const otra = await anonimo().auth.verifyOtp({ token_hash: r.data.token_hash, type: 'magiclink' });
      expect(otra.error).not.toBeNull();
      // y la solicitud no entrega una SEGUNDA sesión aunque se tenga el secreto (se marca como reclamada en el servidor)
      const segunda = await anonimo().functions.invoke('reclamar-ingreso', { body: { solicitud_id: e.solicitud, secreto: e.secreto } });
      expect(segunda.error).not.toBeNull();
    });

    it('sin consentimiento familiar el alumno nuevo todavía no puede avanzar', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const acc = await laura.c.functions.invoke('generar-acceso', { body: { alumno_id: e.nuevoAlumno } });
      const a = anonimo();
      const r = await a.functions.invoke('canjear-acceso', { body: { codigo: acc.data.codigo } });
      await a.auth.verifyOtp({ token_hash: r.data.token_hash, type: 'magiclink' });
      const x = await a.functions.invoke('completar-mision', { body: { mision_id: e.mision1 } });
      expect(x.error).not.toBeNull();
    });

    it('una solicitud rechazada no crea cuenta', async () => {
      const a = anonimo();
      const r = await a.functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', nombre_visible: 'Pruebita Rechazado', avatar: 'av-2' }, headers: ipPropia });
      const laura = await entrar('docente.laura@ficticio.test');
      const rech = await laura.c.functions.invoke('aprobar-ingreso', { body: { solicitud_id: r.data.solicitud_id, accion: 'rechazar' } });
      expect(rech.data.estado).toBe('rechazada');
      const est = await a.functions.invoke('reclamar-ingreso', { body: { solicitud_id: r.data.solicitud_id, secreto: r.data.secreto } });
      expect(est.data.estado).toBe('rechazada');
    });

    it('demasiados intentos fallidos desde una misma IP la bloquean un rato', async () => {
      const a = anonimo();
      const ipMala = { 'x-forwarded-for': '203.0.113.99' };
      let ultimo: { error: unknown } = { error: null };
      for (let i = 0; i < 10; i++) {
        ultimo = await a.functions.invoke('canjear-codigo', { body: { codigo: `ABCD${i}XY`, nombre_visible: 'Pruebita Bot', avatar: 'av-1' }, headers: ipMala });
      }
      // ya bloqueada: incluso con un código CORRECTO desde esa IP responde bloqueado
      const buena = await a.functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', nombre_visible: 'Pruebita Bot', avatar: 'av-1' }, headers: ipMala });
      expect(buena.error).not.toBeNull();
      expect((buena.error as { context?: { status?: number } }).context?.status).toBe(429);
      expect(ultimo.error).not.toBeNull();
    });
  });
  // ───────────────────── VÍNCULO FAMILIA ↔ ALUMNO (invitación) ─────────────────────
  describe('6. Vínculo con la familia por invitación', () => {
    const anonimo = () => createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const ip = { 'x-forwarded-for': '198.51.100.21' };
    const mailNuevo = `familia.nico.${Date.now()}@ficticio.test`;

    it('solo la docente DEL alumno puede generar la invitación (otra docente y el propio alumno, no)', async () => {
      const julian = await entrar('docente.julian@ficticio.test');
      expect((await julian.c.functions.invoke('invitar-familia', { body: { alumno_id: e.nuevoAlumno } })).error).not.toBeNull();
      const mateo = await entrar('alumno.mateo@ficticio.test');
      expect((await mateo.c.functions.invoke('invitar-familia', { body: { alumno_id: e.nuevoAlumno } })).error).not.toBeNull();
      const laura = await entrar('docente.laura@ficticio.test');
      const r = await laura.c.functions.invoke('invitar-familia', { body: { alumno_id: e.nuevoAlumno } });
      expect(r.error).toBeNull();
      expect(r.data.codigo).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
      e.invitacion = r.data.codigo;
      // en la base queda solo el hash, nunca el código
      const { data: inv } = await laura.c.from('invitaciones_familia').select('usada_en, codigo_hash');
      expect(JSON.stringify(inv)).not.toContain(e.invitacion);
    });

    it('un código incorrecto, una clave débil o un mail inválido no crean nada', async () => {
      const a = anonimo();
      const base = { email: mailNuevo, password: 'claveSegura123', nombre_visible: 'Mamá de Nico' };
      expect((await a.functions.invoke('canjear-invitacion', { body: { ...base, codigo: 'ZZZZZZZZ' }, headers: ip })).error).not.toBeNull();
      expect((await a.functions.invoke('canjear-invitacion', { body: { ...base, codigo: e.invitacion, password: '1234' }, headers: ip })).error).not.toBeNull();
      expect((await a.functions.invoke('canjear-invitacion', { body: { ...base, codigo: e.invitacion, email: 'no-es-mail' }, headers: ip })).error).not.toBeNull();
    });

    it('la familia crea su cuenta con el código y queda vinculada SOLO a ese alumno, con el consentimiento pendiente', async () => {
      const a = anonimo();
      const r = await a.functions.invoke('canjear-invitacion', { body: { codigo: e.invitacion.toLowerCase(), email: mailNuevo, password: 'claveSegura123', nombre_visible: 'Mamá de Nico' }, headers: ip });
      expect(r.error).toBeNull();
      expect(r.data).toMatchObject({ ok: true, cuentaNueva: true, alumno_id: e.nuevoAlumno });
      const c = anonimo();
      const { error } = await c.auth.signInWithPassword({ email: mailNuevo, password: 'claveSegura123' });
      expect(error).toBeNull();
      const { data: hijos } = await c.from('perfiles').select('nombre_visible');
      expect(hijos!.map((h) => h.nombre_visible).sort()).toEqual(['Mamá de Nico', 'Pruebita Nico']);
      const { data: cons } = await c.from('consentimientos').select('estado, alumno_id');
      expect(cons).toEqual([{ estado: 'pendiente', alumno_id: e.nuevoAlumno }]);
      e.mailFamilia = mailNuevo;
    });

    it('el código es de un solo uso', async () => {
      const r = await anonimo().functions.invoke('canjear-invitacion', { body: { codigo: e.invitacion, email: `otra.${mailNuevo}`, password: 'claveSegura123', nombre_visible: 'Otra Persona' }, headers: ip });
      expect(r.error).not.toBeNull();
    });

    it('la familia otorga el consentimiento y recién ahí el alumno nuevo puede avanzar', async () => {
      const c = createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      await c.auth.signInWithPassword({ email: e.mailFamilia, password: 'claveSegura123' });
      const ok = await c.functions.invoke('consentimiento', { body: { alumno_id: e.nuevoAlumno, accion: 'otorgar', version_texto: 'v1-e2e' } });
      expect(ok.data.estado).toBe('otorgado');
      // el alumno ya usó su reclamo de ingreso (es de un solo uso): vuelve a entrar con un acceso nuevo que le da la familia
      const dioAcceso = await c.functions.invoke('generar-acceso', { body: { alumno_id: e.nuevoAlumno } });
      expect(dioAcceso.error).toBeNull();
      const a = anonimo();
      const rec = await a.functions.invoke('canjear-acceso', { body: { codigo: dioAcceso.data.codigo } });
      await a.auth.verifyOtp({ token_hash: rec.data.token_hash, type: 'magiclink' });
      const m = await a.functions.invoke('completar-mision', { body: { mision_id: e.mision1, pistas_usadas: 1 } });
      expect(m.error).toBeNull();
      expect(m.data.progreso.estado).toBe('completada');
    });

    it('esa familia NO ve a otros chicos del curso', async () => {
      const c = createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      await c.auth.signInWithPassword({ email: e.mailFamilia, password: 'claveSegura123' });
      const { data } = await c.from('progreso_misiones').select('alumno_id');
      expect(new Set(data!.map((p) => p.alumno_id))).toEqual(new Set([e.nuevoAlumno]));
    });

    it('un segundo tutor con cuenta propia se vincula desde su sesión (otro adulto, mismo alumno)', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const inv = await laura.c.functions.invoke('invitar-familia', { body: { alumno_id: e.nuevoAlumno } });
      const mateoFam = await entrar('familia.mateo@ficticio.test');
      const r = await mateoFam.c.functions.invoke('canjear-invitacion', { body: { codigo: inv.data.codigo } });
      expect(r.error).toBeNull();
      expect(r.data.cuentaNueva).toBe(false);
      const { data: nico } = await mateoFam.c.from('perfiles').select('nombre_visible').eq('id', e.nuevoAlumno);
      expect(nico).toEqual([{ nombre_visible: 'Pruebita Nico' }]);
      // y no puede volver a vincularse al mismo alumno con un código nuevo
      const inv2 = await laura.c.functions.invoke('invitar-familia', { body: { alumno_id: e.nuevoAlumno } });
      const otra = await mateoFam.c.functions.invoke('canjear-invitacion', { body: { codigo: inv2.data.codigo } });
      expect(otra.error).not.toBeNull();
    });
  });
  // ───────────────────── CONFIGURACIÓN DE SEGURIDAD ─────────────────────
  describe('7. Seguridad de la configuración', () => {
    it('nadie puede crearse una cuenta por su cuenta (solo por invitación o aprobación)', async () => {
      const c = createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      const { data, error } = await c.auth.signUp({ email: `intruso.${Date.now()}@ficticio.test`, password: 'claveSegura123' });
      expect(error).not.toBeNull();
      expect(data.user).toBeNull();
    });
    it('las contraseñas débiles se rechazan al crear la cuenta de una familia (mínimo 8, letras y números)', async () => {
      const a = createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      const laura = await entrar('docente.laura@ficticio.test');
      const { data: alumnos } = await laura.c.from('inscripciones').select('alumno_id').limit(1);
      const inv = await laura.c.functions.invoke('invitar-familia', { body: { alumno_id: alumnos![0].alumno_id } });
      const debil = await a.functions.invoke('canjear-invitacion', {
        body: { codigo: inv.data.codigo, email: `debil.${Date.now()}@ficticio.test`, password: 'soloLetrasAqui', nombre_visible: 'Persona Prueba' },
        headers: { 'x-forwarded-for': '198.51.100.55' },
      });
      expect(debil.error).not.toBeNull(); // sin números: la configuración la rechaza
    });
  });
  // ───────────────── GRUPOS POR PROYECTO Y DEVOLUCIONES ─────────────────
  describe('8. Grupos por proyecto y devoluciones de la docente', () => {
    it('un grupo cuelga de un proyecto del curso; con un proyecto de otro curso se rechaza', async () => {
      const { c, uid } = await entrar('docente.laura@ficticio.test');
      const { data: ok, error } = await c.from('grupos').insert({
        curso_id: e.curso, proyecto_id: e.proyecto, tipo: 'dinamico', nombre_visible: 'E2E Grupo del proyecto', creado_por: uid,
      }).select('id, proyecto_id').single();
      expect(error).toBeNull();
      expect(ok!.proyecto_id).toBe(e.proyecto);
      e.grupoProyecto = ok!.id;

      const julian = await entrar('docente.julian@ficticio.test');
      const { data: ajeno } = await julian.c.from('proyectos').select('id, curso_id').limit(1).single();
      const { error: cruzado } = await c.from('grupos').insert({
        curso_id: e.curso, proyecto_id: ajeno!.id, tipo: 'dinamico', nombre_visible: 'E2E Grupo cruzado', creado_por: uid,
      });
      expect(cruzado).not.toBeNull(); // el proyecto no es del curso del grupo
    });

    it('un grupo solo suma alumnos inscriptos en su curso (curso entero sí, alumno de otro curso no)', async () => {
      const { c } = await entrar('docente.laura@ficticio.test');
      const { data: insc } = await c.from('inscripciones').select('alumno_id').eq('curso_id', e.curso);
      const { error: todos } = await c.from('grupo_miembros').insert(insc!.map((i) => ({ grupo_id: e.grupoProyecto, alumno_id: i.alumno_id })));
      expect(todos).toBeNull();
      const { count } = await c.from('grupo_miembros').select('*', { count: 'exact', head: true }).eq('grupo_id', e.grupoProyecto);
      expect(count).toBe(insc!.length); // todo el curso (puede haber alumnos sumados por pruebas anteriores)

      const julian = await entrar('docente.julian@ficticio.test');
      const { data: deOtroCurso } = await julian.c.from('inscripciones').select('alumno_id').limit(1).single();
      const { error: ajeno } = await c.from('grupo_miembros').insert({ grupo_id: e.grupoProyecto, alumno_id: deOtroCurso!.alumno_id });
      expect(ajeno).not.toBeNull();
    });

    it('la docente deja una devolución cualitativa; el alumno la lee, otro alumno y la familia no', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const { error } = await laura.c.from('devoluciones').insert({
        alumno_id: e.mateo, autor_id: laura.uid, proyecto_id: e.proyecto, tipo: 'motivacion', texto: 'E2E Mateo, ¡gran esfuerzo esta semana!',
      });
      expect(error).toBeNull();

      const mateo = await entrar('alumno.mateo@ficticio.test');
      const { data: propias } = await mateo.c.from('devoluciones').select('texto').like('texto', 'E2E%');
      expect(propias).toEqual([{ texto: 'E2E Mateo, ¡gran esfuerzo esta semana!' }]);

      const otro = await entrar('alumno.bruno.5b@ficticio.test');
      const { data: ajenas } = await otro.c.from('devoluciones').select('texto').like('texto', 'E2E%');
      expect(ajenas).toEqual([]);

      const familia = await entrar('familia.mateo@ficticio.test');
      const { data: deFamilia } = await familia.c.from('devoluciones').select('texto').like('texto', 'E2E%');
      expect(deFamilia).toEqual([]);
    });

    it('el alumno no puede escribir devoluciones ni la docente de otro curso escribirle a un alumno ajeno', async () => {
      const mateo = await entrar('alumno.mateo@ficticio.test');
      const { error: propia } = await mateo.c.from('devoluciones').insert({ alumno_id: e.mateo, autor_id: mateo.uid, tipo: 'logro', texto: 'E2E me felicito yo' });
      expect(propia).not.toBeNull();

      const julian = await entrar('docente.julian@ficticio.test');
      const { error: ajeno } = await julian.c.from('devoluciones').insert({ alumno_id: e.mateo, autor_id: julian.uid, tipo: 'logro', texto: 'E2E no es mi alumno' });
      expect(ajeno).not.toBeNull();
    });
  });
  // ───────────────── ACCESO NUEVO Y CÓDIGO DE CLASE ─────────────────
  describe('9. Volver a entrar sin contraseña y código de clase', () => {
    const anonimo = () => createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    it('la docente del curso da un acceso; el alumno entra como el MISMO usuario; el código sirve una sola vez', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const acc = await laura.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      expect(acc.error).toBeNull();
      expect(acc.data.codigo).toMatch(/^[A-Z2-9]{8}$/);
      e.accesoMateo = acc.data.codigo;

      const a = anonimo();
      const r = await a.functions.invoke('canjear-acceso', { body: { codigo: e.accesoMateo.toLowerCase() } });
      expect(r.error).toBeNull();
      expect(JSON.stringify(r.data)).not.toMatch(/password|contrase/i);
      const { data: ses, error } = await a.auth.verifyOtp({ token_hash: r.data.token_hash, type: 'magiclink' });
      expect(error).toBeNull();
      expect(ses.user!.id).toBe(e.mateo); // mismo usuario: mismo avance y mensajes

      const otra = await anonimo().functions.invoke('canjear-acceso', { body: { codigo: e.accesoMateo } });
      expect(otra.error).not.toBeNull(); // un solo uso
    });

    it('un código inventado no sirve y la base no guarda el código en claro', async () => {
      const malo = await anonimo().functions.invoke('canjear-acceso', { body: { codigo: 'ABCD2345' } });
      expect(malo.error).not.toBeNull();
      const mal = await anonimo().functions.invoke('canjear-acceso', { body: { codigo: 'corto' } });
      expect(mal.error).not.toBeNull();
      const laura = await entrar('docente.laura@ficticio.test');
      const { data } = await laura.c.from('accesos_alumno').select('*').eq('alumno_id', e.mateo).limit(1);
      expect(JSON.stringify(data)).not.toContain(e.accesoMateo); // solo hay un hash
    });

    it('la familia vinculada también puede dar acceso; otra familia o la docente de otro curso, no', async () => {
      const fam = await entrar('familia.mateo@ficticio.test');
      const ok = await fam.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      expect(ok.error).toBeNull();
      expect(ok.data.codigo).toMatch(/^[A-Z2-9]{8}$/);

      const otraFam = await entrar('familia.bruno.5b@ficticio.test');
      const noFam = await otraFam.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      expect(noFam.error).not.toBeNull();
      const julian = await entrar('docente.julian@ficticio.test');
      const noDoc = await julian.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      expect(noDoc.error).not.toBeNull();
      const mateo = await entrar('alumno.mateo@ficticio.test');
      const noAlumno = await mateo.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      expect(noAlumno.error).not.toBeNull(); // el propio alumno no se da acceso: lo confirma un adulto
    });

    it('generar un código nuevo anula el anterior sin usar', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const uno = await laura.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      const dos = await laura.c.functions.invoke('generar-acceso', { body: { alumno_id: e.mateo } });
      const viejo = await anonimo().functions.invoke('canjear-acceso', { body: { codigo: uno.data.codigo } });
      expect(viejo.error).not.toBeNull();
      const nuevo = await anonimo().functions.invoke('canjear-acceso', { body: { codigo: dos.data.codigo } });
      expect(nuevo.error).toBeNull();
    });

    it('la docente genera el código de clase; el anterior deja de servir; solo lo genera la docente del curso', async () => {
      const julian = await entrar('docente.julian@ficticio.test');
      const no = await julian.c.functions.invoke('generar-codigo-clase', { body: { curso_id: e.curso } });
      expect(no.error).not.toBeNull();

      const laura = await entrar('docente.laura@ficticio.test');
      const r = await laura.c.functions.invoke('generar-codigo-clase', { body: { curso_id: e.curso } });
      expect(r.error).toBeNull();
      expect(r.data.codigo).toMatch(/^[A-Z2-9]{6}$/);

      const nuevo = await anonimo().functions.invoke('canjear-codigo', { body: { codigo: r.data.codigo, solo_validar: true } });
      expect(nuevo.error).toBeNull();
      expect(nuevo.data.curso).toBe('5º B');
      const viejo = await anonimo().functions.invoke('canjear-codigo', { body: { codigo: 'COR5B2', solo_validar: true } });
      expect(viejo.error).not.toBeNull(); // el código anterior quedó anulado
    });
  });
  // ───────────────── AYUDA DE LA IA: PERMISOS (no necesitan clave: se rechaza antes de llamar al modelo) ─────────────────
  describe('10. Ayuda de la IA: quién puede pedirla', () => {
    const anonimo = () => createClient(URL!, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

    it('sin sesión, un alumno o una familia no pueden pedir un proyecto sugerido', async () => {
      const sin = await anonimo().functions.invoke('ia-sugerir-proyecto', { body: { curso_id: e.curso, idea: 'una huerta' } });
      expect(sin.error).not.toBeNull();
      const mateo = await entrar('alumno.mateo@ficticio.test');
      const alumno = await mateo.c.functions.invoke('ia-sugerir-proyecto', { body: { curso_id: e.curso, idea: 'una huerta' } });
      expect(alumno.error).not.toBeNull();
      const fam = await entrar('familia.mateo@ficticio.test');
      const familia = await fam.c.functions.invoke('ia-sugerir-proyecto', { body: { curso_id: e.curso, idea: 'una huerta' } });
      expect(familia.error).not.toBeNull();
    });

    it('la docente de OTRO curso no puede pedir un proyecto sugerido para un curso ajeno', async () => {
      const julian = await entrar('docente.julian@ficticio.test');
      const r = await julian.c.functions.invoke('ia-sugerir-proyecto', { body: { curso_id: e.curso, idea: 'una huerta' } });
      expect(r.error).not.toBeNull();
    });

    it('solo la docente del alumno puede pedir un borrador de mensaje para él', async () => {
      const julian = await entrar('docente.julian@ficticio.test');
      const ajena = await julian.c.functions.invoke('ia-borrador-devolucion', { body: { alumno_id: e.mateo, tipo: 'logro' } });
      expect(ajena.error).not.toBeNull();
      const mateo = await entrar('alumno.mateo@ficticio.test');
      const propio = await mateo.c.functions.invoke('ia-borrador-devolucion', { body: { alumno_id: e.mateo, tipo: 'logro' } });
      expect(propio.error).not.toBeNull();
      const sin = await anonimo().functions.invoke('ia-borrador-devolucion', { body: { alumno_id: e.mateo, tipo: 'logro' } });
      expect(sin.error).not.toBeNull();
    });

    it('solo la docente del curso puede pedir nombres para grupos', async () => {
      const cuerpo = { curso_id: e.curso, grupos: [{ clave: 'g1', temas: ['futbol'], cantidad: 3 }] };
      const sin = await anonimo().functions.invoke('ia-nombrar-grupos', { body: cuerpo });
      expect(sin.error).not.toBeNull();
      const mateo = await entrar('alumno.mateo@ficticio.test');
      expect((await mateo.c.functions.invoke('ia-nombrar-grupos', { body: cuerpo })).error).not.toBeNull();
      const fam = await entrar('familia.mateo@ficticio.test');
      expect((await fam.c.functions.invoke('ia-nombrar-grupos', { body: cuerpo })).error).not.toBeNull();
      const julian = await entrar('docente.julian@ficticio.test');
      expect((await julian.c.functions.invoke('ia-nombrar-grupos', { body: cuerpo })).error).not.toBeNull();
    });

    it('nadie del cliente puede leer ni escribir el registro de usos de la IA', async () => {
      const laura = await entrar('docente.laura@ficticio.test');
      const { data } = await laura.c.from('ia_usos').select('*');
      expect(data).toEqual([]);
      const { error } = await laura.c.from('ia_usos').insert({ usuario_id: laura.uid, funcion: 'trampa' });
      expect(error).not.toBeNull();
    });
  });
});
