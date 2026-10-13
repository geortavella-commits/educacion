-- Las funciones creadas DESPUÉS del `revoke ... from public, anon` de la migración 2 quedaron ejecutables por `anon`
-- (los privilegios por defecto de Supabase se los dan a quien no tiene sesión). Son funciones de validación de triggers y
-- un helper de RLS: ninguna debe poder llamarse sin haber ingresado.
revoke execute on function public.valoraciones_mision_valida() from public, anon;
revoke execute on function public.grupo_miembros_valida() from public, anon;
revoke execute on function public.devoluciones_valida() from public, anon;
revoke execute on function public.grupos_valida_proyecto() from public, anon;
revoke execute on function public.misiones_claves_valida() from public, anon;
revoke execute on function public.misiones_etapa_valida() from public, anon;
revoke execute on function public.puede_editar_mision(uuid) from public, anon;
