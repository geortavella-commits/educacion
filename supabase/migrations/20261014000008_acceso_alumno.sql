-- Migración 8: volver a entrar sin contraseña ("acceso nuevo") y cierre del reclamo de ingreso.
--
-- Un alumno de primaria no tiene mail ni contraseña conocidos. Si cambia de dispositivo o borra los datos
-- del navegador, la docente DE SU CURSO o la familia VINCULADA le generan un código corto, de un solo uso y
-- con vencimiento, que canjea en /alumno/acceso (función canjear-acceso). Solo se guarda su hash.
-- El cliente no escribe nunca en esta tabla: lo hacen las funciones con la clave de servicio.

create table public.accesos_alumno (
  id         uuid primary key default gen_random_uuid(),
  escuela_id uuid not null references public.escuelas(id) on delete cascade,
  alumno_id  uuid not null references public.perfiles(id) on delete cascade,
  codigo_hash text not null unique,
  vence_en   timestamptz not null,
  usado_en   timestamptz,
  creado_por uuid not null references public.perfiles(id),
  created_at timestamptz not null default now()
);
create index accesos_alumno_alumno_idx on public.accesos_alumno (alumno_id, created_at desc);
alter table public.accesos_alumno enable row level security;

-- Solo la docente del alumno ve que existe un acceso (nunca el código: no se guarda). Sin política de escritura.
create policy accesos_alumno_select on public.accesos_alumno for select to authenticated
  using (public.es_docente_de_alumno(alumno_id));

-- El reclamo de ingreso (reclamar-ingreso) pasa a marcarse en el servidor: una solicitud aprobada
-- entrega su sesión una sola vez, no "las veces que alguien tenga el secreto durante 24 h".
alter table public.solicitudes_ingreso add column reclamada_en timestamptz;
