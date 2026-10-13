-- ============================================================================
-- Schema inicial — plataforma educativa multi-escuela (Supabase / Postgres)
-- Punto de partida: NO fue ejecutado todavía. Correr en un Supabase local
-- (supabase start), revisar las políticas y probarlas con pgTAP antes de usar
-- con alumnos reales. Cada bloque debe vivir como migración versionada.
-- ============================================================================

-- ─── BLOQUE 1: tipos y organización ─────────────────────────────────────────

create type public.rol_escuela as enum ('directivo','docente','alumno','familia');
create type public.nivel_educativo as enum ('primaria','secundaria');
create type public.visibilidad_proyecto as enum ('privado','curso','escuela','publico');
create type public.estado_proyecto as enum ('borrador','activo','finalizado','archivado');

create table public.jurisdicciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table public.escuelas (
  id uuid primary key default gen_random_uuid(),
  jurisdiccion_id uuid not null references public.jurisdicciones(id),
  nombre text not null,
  localidad text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Datos mínimos: sin apellido ni email para alumnos de primaria
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_visible text not null,
  avatar text,
  created_at timestamptz not null default now()
);

create table public.membresias (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  rol public.rol_escuela not null,
  activa boolean not null default true,
  unique (escuela_id, usuario_id, rol)
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  nombre text not null,
  nivel public.nivel_educativo not null,
  anio smallint not null,
  ciclo_lectivo smallint not null,
  created_at timestamptz not null default now()
);

create table public.curso_docentes (
  curso_id uuid references public.cursos(id) on delete cascade,
  usuario_id uuid references public.perfiles(id) on delete cascade,
  primary key (curso_id, usuario_id)
);

create table public.inscripciones (
  curso_id uuid references public.cursos(id) on delete cascade,
  alumno_id uuid references public.perfiles(id) on delete cascade,
  primary key (curso_id, alumno_id)
);

-- Ingreso de primaria por código de clase (se guarda solo el hash)
create table public.codigos_clase (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  codigo_hash text not null,
  vence_en timestamptz not null,
  activo boolean not null default true,
  creado_por uuid not null references public.perfiles(id)
);

create table public.solicitudes_ingreso (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  nombre_visible text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  created_at timestamptz not null default now()
);

create table public.familias_vinculos (
  familia_id uuid references public.perfiles(id) on delete cascade,
  alumno_id uuid references public.perfiles(id) on delete cascade,
  primary key (familia_id, alumno_id)
);

create table public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  otorgado_por uuid not null references public.perfiles(id),
  version_texto text not null,
  estado text not null check (estado in ('pendiente','otorgado','revocado')),
  fecha timestamptz not null default now()
);

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  tipo text not null check (tipo in ('formal','dinamico')),
  nombre_visible text not null,   -- lo ven los alumnos, nombre neutro
  criterio jsonb,
  estado text not null default 'borrador' check (estado in ('borrador','aprobado')),
  creado_por uuid not null references public.perfiles(id)
);

-- Etiqueta que solo ve el docente (por ejemplo 'Refuerzo')
create table public.grupos_internos (
  grupo_id uuid primary key references public.grupos(id) on delete cascade,
  etiqueta text not null
);

create table public.grupo_miembros (
  grupo_id uuid references public.grupos(id) on delete cascade,
  alumno_id uuid references public.perfiles(id) on delete cascade,
  primary key (grupo_id, alumno_id)
);

-- ─── BLOQUE 2: currículo y proyectos ────────────────────────────────────────

create table public.curriculo_versiones (
  id uuid primary key default gen_random_uuid(),
  jurisdiccion_id uuid not null references public.jurisdicciones(id),
  nombre text not null,
  vigente boolean not null default false,
  validada_por text,   -- persona con criterio pedagógico que validó la carga
  validada_en date,
  created_at timestamptz not null default now()
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.curriculo_versiones(id) on delete cascade,
  nombre text not null
);

create table public.curriculo_contenidos (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.curriculo_versiones(id) on delete cascade,
  area_id uuid not null references public.areas(id),
  nivel public.nivel_educativo not null,
  anio smallint not null,
  eje text,
  descripcion text not null,
  es_nap boolean not null default false,
  escuela_id uuid references public.escuelas(id)   -- contenido propio del docente; null = oficial
);

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  curso_id uuid references public.cursos(id) on delete set null,
  creado_por uuid not null references public.perfiles(id),
  titulo text not null,
  descripcion text,
  nivel_escalera smallint not null default 1 check (nivel_escalera between 1 and 4),
  estado public.estado_proyecto not null default 'borrador',
  visibilidad public.visibilidad_proyecto not null default 'curso',
  created_at timestamptz not null default now()
);

create table public.proyecto_contenidos (
  proyecto_id uuid references public.proyectos(id) on delete cascade,
  contenido_id uuid references public.curriculo_contenidos(id),
  primary key (proyecto_id, contenido_id)
);

create table public.misiones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  contenido_id uuid references public.curriculo_contenidos(id),
  orden smallint not null,
  titulo text not null,
  consigna text
);

create table public.proyecto_miembros (
  proyecto_id uuid references public.proyectos(id) on delete cascade,
  alumno_id uuid references public.perfiles(id) on delete cascade,
  rol_equipo text,
  primary key (proyecto_id, alumno_id)
);

-- ─── BLOQUE 3: alumno y tutor ───────────────────────────────────────────────

create table public.progreso_misiones (
  mision_id uuid references public.misiones(id) on delete cascade,
  alumno_id uuid references public.perfiles(id) on delete cascade,
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_curso','completada')),
  pistas_usadas smallint not null default 0,
  completada_en timestamptz,
  primary key (mision_id, alumno_id)
);

create table public.intereses_alumno (
  alumno_id uuid references public.perfiles(id) on delete cascade,
  interes text not null,
  origen text not null check (origen in ('declarado','observado')),
  primary key (alumno_id, interes)
);

-- Observaciones de la app: hipótesis que el docente confirma, corrige o descarta
create table public.senales_alumno (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  area_id uuid references public.areas(id),
  descripcion text not null,
  mision_origen uuid references public.misiones(id),
  estado text not null default 'hipotesis' check (estado in ('hipotesis','confirmada','corregida','descartada')),
  revisada_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create table public.tutor_sesiones (
  id uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  mision_id uuid references public.misiones(id),
  created_at timestamptz not null default now()
);

create table public.tutor_mensajes (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.tutor_sesiones(id) on delete cascade,
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  autor text not null check (autor in ('alumno','tutor')),
  contenido text not null,   -- lo que efectivamente se mostró
  revision text check (revision in ('aprobado','ajustado','bloqueado')),
  motivo_revision text,
  created_at timestamptz not null default now(),
  check ((autor = 'tutor') = (revision is not null))
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  escuela_id uuid,
  usuario_id uuid,
  accion text not null,
  entidad text,
  entidad_id uuid,
  created_at timestamptz not null default now()
);

-- ─── BLOQUE 4: helpers, RLS e índices ───────────────────────────────────────

-- Sin acceso anónimo a ninguna tabla
revoke all on all tables in schema public from anon;

-- Helpers: security definer con search_path fijo
create or replace function public.es_miembro(p_escuela uuid, p_rol public.rol_escuela default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membresias m
    where m.usuario_id = (select auth.uid())
      and m.escuela_id = p_escuela
      and m.activa
      and (p_rol is null or m.rol = p_rol)
  );
$$;

create or replace function public.es_docente_del_curso(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.curso_docentes d
    where d.curso_id = p_curso and d.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.esta_inscripto(p_curso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.inscripciones i
    where i.curso_id = p_curso and i.alumno_id = (select auth.uid())
  );
$$;

create or replace function public.es_docente_de_alumno(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.inscripciones i
    join public.curso_docentes d on d.curso_id = i.curso_id
    where i.alumno_id = p_alumno and d.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_familia_de(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.familias_vinculos f
    where f.alumno_id = p_alumno and f.familia_id = (select auth.uid())
  );
$$;

create or replace function public.puede_ver_alumno(p_alumno uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_alumno = (select auth.uid())
      or public.es_docente_de_alumno(p_alumno)
      or public.es_familia_de(p_alumno);
$$;

-- RLS activado en todas las tablas: sin política, no hay acceso
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Políticas de ejemplo (el resto sigue el mismo patrón)
create policy membresias_select on public.membresias for select to authenticated
  using (usuario_id = (select auth.uid()) or public.es_miembro(escuela_id, 'directivo'));

create policy perfiles_select on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or public.puede_ver_alumno(id));

create policy grupos_internos_select on public.grupos_internos for select to authenticated
  using (exists (
    select 1 from public.grupos g
    where g.id = grupo_id and public.es_docente_del_curso(g.curso_id)
  ));

create policy proyectos_select on public.proyectos for select to authenticated
  using (
    creado_por = (select auth.uid())
    or public.es_docente_del_curso(curso_id)
    or public.esta_inscripto(curso_id)
    or (visibilidad in ('escuela','publico') and public.es_miembro(escuela_id))
  );

create policy proyectos_insert on public.proyectos for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.es_miembro(escuela_id, 'docente'));

create policy senales_select on public.senales_alumno for select to authenticated
  using (public.es_docente_de_alumno(alumno_id));

create policy senales_update on public.senales_alumno for update to authenticated
  using (public.es_docente_de_alumno(alumno_id))
  with check (public.es_docente_de_alumno(alumno_id));

-- Ajustar según la decisión pendiente: ¿el docente ve la transcripción completa?
create policy tutor_mensajes_select on public.tutor_mensajes for select to authenticated
  using (exists (
    select 1 from public.tutor_sesiones s
    where s.id = sesion_id
      and (s.alumno_id = (select auth.uid()) or public.es_docente_de_alumno(s.alumno_id))
  ));

-- Índices sobre las columnas que usan las políticas
create index on public.membresias (usuario_id, escuela_id);
create index on public.inscripciones (alumno_id);
create index on public.curso_docentes (usuario_id);
create index on public.familias_vinculos (alumno_id);
create index on public.proyectos (escuela_id, curso_id);
create index on public.senales_alumno (alumno_id);
create index on public.tutor_sesiones (alumno_id);
create index on public.tutor_mensajes (sesion_id);

-- ─── PENDIENTES ─────────────────────────────────────────────────────────────
-- * Políticas completas de las tablas restantes (cursos, inscripciones, grupos,
--   consentimientos, misiones, progreso, currículo, audit_log).
-- * Políticas de Storage para planificaciones del docente.
-- * Vistas con security_invoker = true para los tableros.
-- * Edge Function que crea la cuenta del alumno de primaria al aprobarse la
--   solicitud de ingreso.
-- * Decidir si docente y directivo ven transcripción completa o solo resumen.
