-- Migración 7: los grupos cuelgan de un proyecto + devoluciones cualitativas de la docente.
--
-- Modelo: el curso tiene a todos sus alumnos (inscripciones). Un proyecto abarca a todo el curso por defecto
-- y, si la docente quiere, arma grupos DENTRO del proyecto. Un grupo de un proyecto solo puede tener alumnos
-- inscriptos en el curso de ese proyecto (lo exige la base, no solo la pantalla).
--
-- Devoluciones: texto libre de la docente para motivar o sugerir ("qué vi, qué reconozco, qué te propongo").
-- NO hay nota, puntaje, escala ni ranking: la evaluación oficial es de la docente fuera de la app.

-- ─── Grupos por proyecto ────────────────────────────────────────────────────
alter table public.grupos
  add column proyecto_id uuid references public.proyectos(id) on delete cascade;
create index grupos_proyecto_id_idx on public.grupos (proyecto_id);

-- security definer JUSTIFICADO: el trigger debe poder comprobar el curso del proyecto aunque quien escribe
-- no pueda leer ese proyecto; solo devuelve un error o deja pasar la fila, nunca datos.
create or replace function public.grupos_valida_proyecto()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.proyecto_id is not null and not exists (
    select 1 from public.proyectos p where p.id = new.proyecto_id and p.curso_id = new.curso_id
  ) then
    raise exception 'el proyecto no pertenece al curso del grupo' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger grupos_valida_proyecto
  before insert or update of proyecto_id, curso_id on public.grupos
  for each row execute function public.grupos_valida_proyecto();

-- Solo alumnos inscriptos en el curso del grupo (security definer: lee inscripciones/grupos sin depender de RLS).
create or replace function public.grupo_miembros_valida()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1
    from public.grupos g
    join public.inscripciones i on i.curso_id = g.curso_id
    where g.id = new.grupo_id and i.alumno_id = new.alumno_id
  ) then
    raise exception 'el alumno no está inscripto en el curso del grupo' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger grupo_miembros_valida
  before insert or update on public.grupo_miembros
  for each row execute function public.grupo_miembros_valida();

-- ─── Devoluciones cualitativas ──────────────────────────────────────────────
create table public.devoluciones (
  id          uuid primary key default gen_random_uuid(),
  alumno_id   uuid not null references public.perfiles(id) on delete cascade,
  autor_id    uuid not null references public.perfiles(id),
  proyecto_id uuid references public.proyectos(id) on delete set null,
  tipo        text not null check (tipo in ('motivacion', 'sugerencia', 'logro')),
  texto       text not null check (char_length(btrim(texto)) between 3 and 600),
  created_at  timestamptz not null default now()
);
create index devoluciones_alumno_idx on public.devoluciones (alumno_id, created_at desc);
alter table public.devoluciones enable row level security;

-- El proyecto (si se indica) tiene que ser del curso del alumno.
create or replace function public.devoluciones_valida()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.proyecto_id is not null and not exists (
    select 1
    from public.proyectos p
    join public.inscripciones i on i.curso_id = p.curso_id
    where p.id = new.proyecto_id and i.alumno_id = new.alumno_id
  ) then
    raise exception 'el proyecto no es del curso del alumno' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger devoluciones_valida
  before insert on public.devoluciones
  for each row execute function public.devoluciones_valida();

-- Las lee la docente del alumno y el propio alumno (son para motivarlo). Familia y compañeros, no.
create policy devoluciones_select on public.devoluciones for select to authenticated
  using (public.es_docente_de_alumno(alumno_id) or alumno_id = (select auth.uid()));
create policy devoluciones_insert on public.devoluciones for insert to authenticated
  with check (autor_id = (select auth.uid()) and public.es_docente_de_alumno(alumno_id));
create policy devoluciones_delete on public.devoluciones for delete to authenticated
  using (autor_id = (select auth.uid()) and public.es_docente_de_alumno(alumno_id));
