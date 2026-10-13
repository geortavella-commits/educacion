-- Migración 9: registro de usos de la IA (control de costo y de abuso).
--
-- Cada llamada al modelo que hace una Edge Function deja una fila acá: quién, desde qué escuela, para qué función y
-- cuántos tokens gastó. NUNCA se guarda el texto enviado ni el recibido (podría tener datos de menores). Sirve para
-- el tope diario por docente y para ver cuánto cuesta. El cliente no lee ni escribe esta tabla: solo las funciones
-- del servidor (clave de servicio), igual que accesos_alumno.

create table public.ia_usos (
  id              uuid primary key default gen_random_uuid(),
  escuela_id      uuid references public.escuelas(id) on delete set null,
  usuario_id      uuid not null references public.perfiles(id) on delete cascade,
  funcion         text not null,
  tokens_entrada  integer not null default 0 check (tokens_entrada >= 0),
  tokens_salida   integer not null default 0 check (tokens_salida >= 0),
  created_at      timestamptz not null default now()
);
create index ia_usos_usuario_idx on public.ia_usos (usuario_id, created_at desc);
alter table public.ia_usos enable row level security;
-- Sin políticas a propósito: deny-by-default para anon y authenticated.
