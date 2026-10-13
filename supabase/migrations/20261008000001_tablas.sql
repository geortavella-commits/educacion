-- Migración 1: tipos y tablas (bloques 1-3 del schema de referencia + tutor_resumenes).
-- RLS, helpers y políticas van en la migración 2.

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

-- Resumen del tutor generado por IA (decisión: el directivo ve solo el resumen,
-- nunca la transcripción). Lo escribe únicamente una Edge Function.
create table public.tutor_resumenes (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.tutor_sesiones(id) on delete cascade,
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id uuid not null references public.perfiles(id) on delete cascade,
  resumen text not null,
  created_at timestamptz not null default now()
);

