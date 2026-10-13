-- Currículo oficial por ciclo: Metas → Aprendizajes y contenidos → Indicadores de logro.
-- Los "aprendizajes y contenidos" reutilizan curriculo_contenidos (ya enlazada a misiones y proyectos); se le suma la meta a la que pertenecen.
-- Todo se carga desde las Progresiones de Aprendizaje del Ministerio (versión en consulta) y queda SIN VALIDAR hasta que una docente lo revise
-- (curriculo_versiones.vigente / validada_por). Estas tablas son de solo lectura para la app: se cargan con un script (rol de servicio).

create table public.curriculo_metas (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references public.curriculo_versiones(id) on delete cascade,
  area_id     uuid not null references public.areas(id),
  nivel       public.nivel_educativo not null,
  ciclo       text not null check (char_length(ciclo) between 3 and 40),   -- p. ej. '5.º y 6.º grado'
  anio_desde  smallint not null check (anio_desde between 1 and 7),
  anio_hasta  smallint not null check (anio_hasta between 1 and 7),
  orden       integer not null default 0,
  texto       text not null check (char_length(texto) between 5 and 2000),
  check (anio_hasta >= anio_desde)
);
create index curriculo_metas_busqueda on public.curriculo_metas (version_id, area_id, nivel, anio_desde, anio_hasta);

create table public.curriculo_indicadores (
  id           uuid primary key default gen_random_uuid(),
  contenido_id uuid not null references public.curriculo_contenidos(id) on delete cascade,
  orden        integer not null default 0,
  texto        text not null check (char_length(texto) between 3 and 1500)
);
create index curriculo_indicadores_contenido on public.curriculo_indicadores (contenido_id, orden);

alter table public.curriculo_contenidos
  add column meta_id uuid references public.curriculo_metas(id) on delete set null,
  add column orden   integer not null default 0,
  add column fuente  text check (fuente is null or char_length(fuente) <= 200);
create index curriculo_contenidos_meta on public.curriculo_contenidos (meta_id);

alter table public.curriculo_metas enable row level security;
alter table public.curriculo_indicadores enable row level security;

-- Lectura para cualquier miembro de una escuela (es material de referencia, sin datos personales); nadie escribe desde la app.
create policy curriculo_metas_select on public.curriculo_metas
  for select to authenticated using (public.tiene_membresia());
create policy curriculo_indicadores_select on public.curriculo_indicadores
  for select to authenticated using (public.tiene_membresia());

revoke all on public.curriculo_metas, public.curriculo_indicadores from anon;
grant select on public.curriculo_metas, public.curriculo_indicadores to authenticated;
