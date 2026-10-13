import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para el navegador.
 *
 * Reglas (ver docs/prompts-gemini/00-contexto.md):
 *  - Solo la clave PÚBLICA (anon / publishable). La seguridad real la da la RLS de la base.
 *  - Jamás service_role ni claves secretas en el cliente ni en variables VITE_*.
 *  - Los componentes NO importan este archivo: solo lo usan los servicios de src/services/.
 */

function rolDeLaClave(clave: string): string | null {
  // Las claves legacy son JWT: el rol viaja en el payload.
  const partes = clave.split('.');
  if (partes.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/** Corta de raíz si alguien puso una clave secreta donde va la pública. */
export function validarClavePublica(clave: string): void {
  if (clave.startsWith('sb_secret_') || rolDeLaClave(clave) === 'service_role') {
    throw new Error(
      'Se configuró una clave SECRETA de Supabase en el cliente. Usá solo la clave pública (anon/publishable).'
    );
  }
}

let instancia: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (instancia) return instancia;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !clave) {
    throw new Error(
      'Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copiá .env.example a .env.local y completalo.'
    );
  }
  validarClavePublica(clave);
  instancia = createClient(url, clave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return instancia;
}
