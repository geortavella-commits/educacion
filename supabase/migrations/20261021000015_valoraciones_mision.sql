-- Valoración cualitativa de la docente a nivel de MISIÓN (ejercicio): una marca suave y un mensaje corto para ese alumno.
-- Reglas del producto: sin notas ni puntajes; no es una calificación (la evaluación oficial es de la docente, fuera del sistema).
-- La lee la docente del alumno y el propio alumno; la familia y los compañeros, no.

create table public.valoraciones_mision (
  mision_id uuid not null references public.misiones(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  autor_id uuid not null references public.perfiles(id),
  marca text not null check (marca in ('encaminado', 'repensar', 'conversar')),
  mensaje text check (mensaje is null or (char_length(btrim(mensaje)) >= 3 and char_length(btrim(mensaje)) <= 600)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (mision_id, alumno_id)
);
create index valoraciones_mision_alumno_idx on public.valoraciones_mision (alumno_id);

alter table public.valoraciones_mision enable row level security;

-- La misión tiene que ser de un proyecto del curso del alumno: una docente no valora misiones ajenas al alumno.
create or replace function public.valoraciones_mision_valida()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1
    from public.misiones m
    join public.proyectos p on p.id = m.proyecto_id
    join public.inscripciones i on i.curso_id = p.curso_id
    where m.id = new.mision_id and i.alumno_id = new.alumno_id
  ) then
    raise exception 'la misión no es del curso del alumno' using errcode = '23514';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger valoraciones_mision_valida
  before insert or update on public.valoraciones_mision
  for each row execute function public.valoraciones_mision_valida();

create policy valoraciones_mision_select on public.valoraciones_mision for select to authenticated
  using (public.es_docente_de_alumno(alumno_id) or alumno_id = (select auth.uid()));
create policy valoraciones_mision_insert on public.valoraciones_mision for insert to authenticated
  with check (autor_id = (select auth.uid()) and public.es_docente_de_alumno(alumno_id));
create policy valoraciones_mision_update on public.valoraciones_mision for update to authenticated
  using (public.es_docente_de_alumno(alumno_id))
  with check (autor_id = (select auth.uid()) and public.es_docente_de_alumno(alumno_id));
create policy valoraciones_mision_delete on public.valoraciones_mision for delete to authenticated
  using (public.es_docente_de_alumno(alumno_id));

revoke all on public.valoraciones_mision from anon;
grant select, insert, update, delete on public.valoraciones_mision to authenticated;
