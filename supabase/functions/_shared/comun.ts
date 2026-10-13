// Utilidades compartidas por las Edge Functions.
// IMPORTANTE: la service_role vive SOLO acá (servidor). Nunca en el cliente.
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const cabecerasCors = {
  'Access-Control-Allow-Origin': '*', // en producción: restringir al dominio de la app
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cabecerasCors, 'Content-Type': 'application/json' },
  });
}

export function error(status: number, codigo: string): Response {
  // Mensajes genéricos: nada de detalles internos hacia afuera.
  return responder({ ok: false, error: codigo }, status);
}

export function clienteAdmin(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Valida el JWT del que llama y devuelve el usuario real (no confiar en nada que venga en el body). */
export async function usuarioAutenticado(req: Request): Promise<User | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const cliente = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: err } = await cliente.auth.getUser();
  return err || !data.user ? null : data.user;
}

export async function leerJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const cuerpo = await req.json();
    return cuerpo && typeof cuerpo === 'object' ? (cuerpo as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const esUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function sha256(texto: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** IP del que llama (primer valor de x-forwarded-for). Solo sirve para limitar intentos, no es una identidad. */
export function ipDe(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? 'desconocida').split(',')[0].trim();
}

/** Cuenta intentos fallidos recientes de una clave. */
export async function intentosRecientes(admin: SupabaseClient, clave: string, minutos = 10): Promise<number> {
  const desde = new Date(Date.now() - minutos * 60_000).toISOString();
  const { count } = await admin.from('ingreso_intentos').select('id', { count: 'exact', head: true }).eq('clave', clave).gte('creado_en', desde);
  return count ?? 0;
}

export async function registrarIntento(admin: SupabaseClient, clave: string): Promise<void> {
  await admin.from('ingreso_intentos').insert({ clave });
}

// Sin letras ni números que se confunden (0/O, 1/I/L): el código lo lee una persona desde un papel o una pantalla.
export const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generarCodigo(largo: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
}
