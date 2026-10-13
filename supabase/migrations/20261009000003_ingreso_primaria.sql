-- Migración 3: ingreso de primaria por código de clase.
-- Flujo: el alumno canjea el código → queda una solicitud pendiente → la docente la aprueba
-- (Edge Function crea la cuenta) → el dispositivo del alumno reclama su sesión con un secreto.
-- Todas las escrituras las hacen Edge Functions con service_role; el cliente solo lee (la docente).

alter table public.solicitudes_ingreso
  add column avatar text,
  add column token_hash text,                                   -- hash del secreto que guarda el dispositivo del alumno
  add column usuario_id uuid references public.perfiles(id) on delete set null,
  add column resuelta_por uuid references public.perfiles(id),
  add column resuelta_en timestamptz;

create index on public.solicitudes_ingreso (curso_id, estado);

-- Registro de intentos fallidos para limitar por IP y por código (fuerza bruta).
create table public.ingreso_intentos (
  id bigint generated always as identity primary key,
  clave text not null,                                          -- 'ip:<hash>' o 'codigo:<hash>' o 'solicitud:<id>'
  creado_en timestamptz not null default now()
);
create index on public.ingreso_intentos (clave, creado_en);
alter table public.ingreso_intentos enable row level security;  -- sin políticas: nadie del cliente la ve ni la escribe
revoke all on public.ingreso_intentos from anon, authenticated;
