-- Migración 4: vínculo familia ↔ alumno por invitación.
-- La docente genera un código para UN alumno (vence, un solo uso, solo se guarda su hash).
-- La familia lo canjea (crea su cuenta o se vincula desde la suya). Todo lo escriben Edge Functions.

create table public.invitaciones_familia (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  codigo_hash text not null unique,
  vence_en timestamptz not null,
  usada_en timestamptz,
  usada_por uuid references public.perfiles(id) on delete set null,
  creada_por uuid not null references public.perfiles(id),
  created_at timestamptz not null default now()
);
create index on public.invitaciones_familia (alumno_id);
create index on public.invitaciones_familia (escuela_id, usada_en);

alter table public.invitaciones_familia enable row level security;
revoke all on public.invitaciones_familia from anon, authenticated;
grant select on public.invitaciones_familia to authenticated;

-- La docente ve el ESTADO de las invitaciones de sus alumnos (nunca el código: solo existe su hash).
create policy invitaciones_familia_select on public.invitaciones_familia for select to authenticated
  using (public.es_docente_de_alumno(alumno_id));
