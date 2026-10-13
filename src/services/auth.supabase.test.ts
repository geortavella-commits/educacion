// Pruebas del servicio REAL de autenticación contra el Supabase LOCAL con el seed ficticio.
// Requisitos: `supabase start` + `supabase db reset` (carga supabase/seed.sql) y .env.local.
// Si la base local no responde, el bloque se saltea (no rompe el CI).
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { crearAuthSupabase } from './auth.supabase';
import { validarClavePublica } from '@/lib/supabase';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CLAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

async function baseLocalDisponible(): Promise<boolean> {
  if (!URL || !CLAVE) return false;
  try {
    // (sin AbortSignal: en jsdom no es compatible con el fetch de Node)
    const espera = new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('timeout')), 2000));
    const r = await Promise.race([fetch(`${URL}/auth/v1/health`, { headers: { apikey: CLAVE } }), espera]);
    return r.ok;
  } catch {
    return false;
  }
}

const hayBase = await baseLocalDisponible();

// Cliente nuevo y aislado por prueba (sin persistir sesión en el navegador de pruebas).
const nuevoCliente = (url = URL!) =>
  createClient(url, CLAVE!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

const PASS = 'educacion123';

describe('validarClavePublica (no necesita base)', () => {
  it('rechaza una clave secreta nueva', () => {
    expect(() => validarClavePublica('sb_secret_abcdefghijklmnop')).toThrow();
  });
  it('rechaza un JWT con rol service_role', () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '');
    const jwt = `${b64({ alg: 'HS256' })}.${b64({ role: 'service_role' })}.firma`;
    expect(() => validarClavePublica(jwt)).toThrow();
  });
  it('acepta un JWT con rol anon y una clave publishable', () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '');
    expect(() => validarClavePublica(`${b64({ alg: 'HS256' })}.${b64({ role: 'anon' })}.firma`)).not.toThrow();
    expect(() => validarClavePublica('sb_publishable_abcdefghijklmnop')).not.toThrow();
  });
});

describe.skipIf(!hayBase)('autenticación real (Supabase local + seed)', () => {
  const cuentas: Array<[string, string, string]> = [
    ['docente.laura@ficticio.test', 'docente', 'Seño Laura'],
    ['docente.julian@ficticio.test', 'docente', 'Seño Julián'],
    ['directivo@ficticio.test', 'directivo', 'Dirección'],
    ['familia.mateo@ficticio.test', 'familia', 'Familia de Mateo'],
    ['alumno.mateo@ficticio.test', 'alumno', 'Mateo'],
  ];

  it.each(cuentas)('%s ingresa con el rol y nombre correctos', async (email, rol, nombre) => {
    const auth = crearAuthSupabase(nuevoCliente());
    const r = await auth.iniciarSesion(email, PASS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sesion.rol).toBe(rol);
      expect(r.sesion.nombreVisible).toBe(nombre);
      expect(r.sesion.escuelaId).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('contraseña incorrecta y mail inexistente dan el MISMO resultado (sin filtrar información)', async () => {
    const auth = crearAuthSupabase(nuevoCliente());
    const mala = await auth.iniciarSesion('docente.laura@ficticio.test', 'incorrecta');
    const inexistente = await auth.iniciarSesion('nadie@ficticio.test', 'incorrecta');
    expect(mala).toEqual({ ok: false, motivo: 'credenciales' });
    expect(inexistente).toEqual(mala);
  });

  it('obtenerSesion devuelve la sesión mientras está iniciada y null al cerrarla', async () => {
    const auth = crearAuthSupabase(nuevoCliente());
    expect(await auth.obtenerSesion()).toBeNull();
    await auth.iniciarSesion('directivo@ficticio.test', PASS);
    expect((await auth.obtenerSesion())?.rol).toBe('directivo');
    await auth.cerrarSesion();
    expect(await auth.obtenerSesion()).toBeNull();
  });

  it('sin conexión devuelve motivo "red"', async () => {
    const auth = crearAuthSupabase(nuevoCliente('http://127.0.0.1:1'));
    const r = await auth.iniciarSesion('docente.laura@ficticio.test', PASS);
    expect(r).toEqual({ ok: false, motivo: 'red' });
  });

  it('recuperar contraseña responde igual para un mail registrado y uno inexistente', async () => {
    const auth = crearAuthSupabase(nuevoCliente());
    const a = await auth.solicitarRecuperacion('docente.laura@ficticio.test');
    const b = await auth.solicitarRecuperacion('nadie@ficticio.test');
    expect(a).toEqual({ ok: true });
    expect(b).toEqual(a);
  });

  it('suscribirseASesion avisa del ingreso y del cierre', async () => {
    const cliente = nuevoCliente();
    const auth = crearAuthSupabase(cliente);
    const eventos: Array<string | null> = [];
    const cancelar = auth.suscribirseASesion((s) => eventos.push(s ? s.rol : null));
    await auth.iniciarSesion('familia.mateo@ficticio.test', PASS);
    await new Promise((r) => setTimeout(r, 400));
    await auth.cerrarSesion();
    await new Promise((r) => setTimeout(r, 400));
    cancelar();
    expect(eventos).toContain('familia');
    expect(eventos[eventos.length - 1]).toBeNull();
  });

  // La parte más importante: lo que ve cada rol en la base, con la sesión real.
  describe('la RLS se cumple con la sesión real', () => {
    const contar = async (email: string, tabla: string) => {
      const c = nuevoCliente();
      await crearAuthSupabase(c).iniciarSesion(email, PASS);
      const { count, error } = await c.from(tabla).select('*', { count: 'exact', head: true });
      expect(error).toBeNull();
      return count;
    };

    it('la docente ve a sus 24 alumnos y 2 observaciones; no a los otros cursos', async () => {
      expect(await contar('docente.laura@ficticio.test', 'inscripciones')).toBe(24);
      expect(await contar('docente.laura@ficticio.test', 'senales_alumno')).toBe(2);
    });
    it('el alumno no ve observaciones, etiquetas internas ni resúmenes', async () => {
      expect(await contar('alumno.mateo@ficticio.test', 'senales_alumno')).toBe(0);
      expect(await contar('alumno.mateo@ficticio.test', 'grupos_internos')).toBe(0);
      expect(await contar('alumno.mateo@ficticio.test', 'tutor_resumenes')).toBe(0);
    });
    it('el directivo no ve conversaciones pero sí el resumen', async () => {
      expect(await contar('directivo@ficticio.test', 'tutor_mensajes')).toBe(0);
      expect(await contar('directivo@ficticio.test', 'tutor_resumenes')).toBe(1);
    });
    it('el cliente no puede escribir en tablas sensibles', async () => {
      const c = nuevoCliente();
      await crearAuthSupabase(c).iniciarSesion('docente.laura@ficticio.test', PASS);
      const { error } = await c.from('consentimientos').update({ estado: 'otorgado' }).eq('estado', 'pendiente');
      expect(error).not.toBeNull();
    });
  });
});
