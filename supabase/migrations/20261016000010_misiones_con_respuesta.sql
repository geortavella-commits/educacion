-- Migración 10: misiones con enunciado + respuesta que se puede comprobar.
--
-- Una misión puede ser:
--   'abierta'  entrega de texto libre (sin corrección automática; la lee la docente)
--   'numero'   la respuesta es un número ("3,5", "7/2")
--   'texto'    una respuesta corta ("Córdoba")
--   'opcion'   opción múltiple (se muestran las opciones; una sola es la correcta)
--
-- LA RESPUESTA CORRECTA NO VIAJA AL NAVEGADOR DEL ALUMNO. Vive en `misiones_claves`, que solo leen y escriben los docentes del
-- curso (RLS); el alumno manda su respuesta a una función del servidor (verificar-respuesta) que la compara y devuelve solo
-- "correcta o no". La pista y la explicación también están ahí: se entregan cuando corresponde, no antes.
-- Las misiones que ya existían quedan como 'abierta': siguen funcionando igual.

alter table public.misiones
  add column tipo_respuesta text not null default 'abierta' check (tipo_respuesta in ('abierta', 'numero', 'texto', 'opcion')),
  add column opciones jsonb,
  add column tiene_pista boolean not null default false;

-- Las opciones SÍ las ve el alumno (hay que mostrarlas); cuál es la correcta, no. Entre 2 y 6, solo si es de opción.
alter table public.misiones
  add constraint misiones_opciones_check check (
    (tipo_respuesta = 'opcion' and jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) between 2 and 6)
    or (tipo_respuesta <> 'opcion' and opciones is null)
  );

-- Cuántas veces probó el alumno. Es para que la docente vea dónde se trabó la clase; nunca se muestra como puntaje.
alter table public.progreso_misiones
  add column intentos smallint not null default 0 check (intentos >= 0);

-- ─── Claves de las misiones (secreto del docente) ───────────────────────────
-- security definer JUSTIFICADO: evita recursión de RLS al preguntar a quién pertenece la misión.
create or replace function public.puede_editar_mision(p_mision uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.misiones m
    where m.id = p_mision and public.puede_editar_proyecto(m.proyecto_id)
  );
$$;

create table public.misiones_claves (
  mision_id   uuid primary key references public.misiones(id) on delete cascade,
  -- 'numero' y 'texto': respuestas aceptadas (["3,5","7/2"]); 'opcion': el id de la opción correcta (["b"]); 'abierta': [].
  respuestas  jsonb not null default '[]'::jsonb,
  -- Solo 'numero': diferencia máxima aceptada (0 = exacto).
  tolerancia  numeric not null default 0 check (tolerancia >= 0),
  pista       text check (pista is null or char_length(btrim(pista)) between 3 and 400),
  explicacion text check (explicacion is null or char_length(btrim(explicacion)) between 3 and 400),
  created_at  timestamptz not null default now()
);
alter table public.misiones_claves enable row level security;

create policy misiones_claves_select on public.misiones_claves for select to authenticated
  using (public.puede_editar_mision(mision_id));
create policy misiones_claves_insert on public.misiones_claves for insert to authenticated
  with check (public.puede_editar_mision(mision_id));
create policy misiones_claves_update on public.misiones_claves for update to authenticated
  using (public.puede_editar_mision(mision_id)) with check (public.puede_editar_mision(mision_id));
create policy misiones_claves_delete on public.misiones_claves for delete to authenticated
  using (public.puede_editar_mision(mision_id));

-- La clave tiene que ser coherente con el tipo de la misión (se exige acá, no solo en la pantalla).
create or replace function public.misiones_claves_valida()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t text;
  o jsonb;
begin
  select tipo_respuesta, opciones into t, o from public.misiones where id = new.mision_id;
  if t is null then
    raise exception 'la misión no existe' using errcode = '23503';
  end if;
  if t = 'abierta' then
    new.respuestas := '[]'::jsonb;
    return new;
  end if;
  if jsonb_typeof(new.respuestas) <> 'array' or jsonb_array_length(new.respuestas) not between 1 and 10 then
    raise exception 'la misión necesita entre 1 y 10 respuestas correctas' using errcode = '23514';
  end if;
  if t = 'opcion' and not (
    jsonb_array_length(new.respuestas) = 1
    and exists (select 1 from jsonb_array_elements(o) x where x ->> 'id' = new.respuestas ->> 0)
  ) then
    raise exception 'la respuesta correcta debe ser una de las opciones' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger misiones_claves_valida
  before insert or update on public.misiones_claves
  for each row execute function public.misiones_claves_valida();

-- ─── Respuestas escritas de las misiones abiertas ───────────────────────────
-- Las escribe SOLO la función del servidor; las leen el propio alumno y la docente de su curso.
create table public.respuestas_abiertas (
  mision_id  uuid not null references public.misiones(id) on delete cascade,
  alumno_id  uuid not null references public.perfiles(id) on delete cascade,
  texto      text not null check (char_length(btrim(texto)) between 1 and 2000),
  updated_at timestamptz not null default now(),
  primary key (mision_id, alumno_id)
);
alter table public.respuestas_abiertas enable row level security;
create policy respuestas_abiertas_select on public.respuestas_abiertas for select to authenticated
  using (alumno_id = (select auth.uid()) or public.es_docente_de_alumno(alumno_id));
