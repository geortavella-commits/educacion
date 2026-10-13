-- Migración 5: el alumno puede VER (no modificar) el estado de su propio consentimiento.
-- Hace falta para mostrarle "tu familia todavía tiene que autorizar a Chasqui" en vez de un error.
-- Sigue sin poder escribirlo: solo lo cambia la familia, desde la Edge Function `consentimiento`.
create policy consentimientos_select_propio on public.consentimientos for select to authenticated
  using (alumno_id = (select auth.uid()));
