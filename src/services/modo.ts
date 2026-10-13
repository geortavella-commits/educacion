/**
 * ¿Los servicios usan Supabase de verdad o los datos de ejemplo?
 *  - Producción: SIEMPRE Supabase.
 *  - Desarrollo: Supabase si VITE_USAR_SUPABASE=true en .env.local; si no, datos de ejemplo (src/mocks).
 */
export const usarSupabase: boolean = !import.meta.env.DEV || import.meta.env.VITE_USAR_SUPABASE === 'true';
