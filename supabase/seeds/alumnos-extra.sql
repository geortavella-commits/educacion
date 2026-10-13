-- ============================================================================
-- 10 ALUMNOS EXTRA para probar las sugerencias de grupos. Solo desarrollo local; todo ficticio (nombres de pila, @ficticio.test).
-- Se SUMA a la base mínima (NO borra nada): se puede correr cuantas veces haga falta (no duplica).
--
--   docker exec -i supabase_db_educacion psql -U postgres -v ON_ERROR_STOP=1 < supabase/seeds/alumnos-extra.sql
--
-- Requiere la base mínima (curso 5º B y su docente) y, para que tengan avance, al menos un proyecto con misiones en ese curso.
-- Cada uno tiene intereses y un avance distinto para que se note cómo agrupa cada criterio:
--   intereses  → fútbol (Joaquín, Thiago, Benicio), dibujo (Lucía, Camila, Emma), música, cocina, animales… y Ciro sin intereses
--   avance     → entre 0 y 2 misiones completadas (se toman las primeras del proyecto; si hay menos, las que haya)
-- Contraseña de todos: educacion123 (mail: alumno.<nombre>.5b@ficticio.test). Sin permiso familiar registrado.
-- ============================================================================

begin;

create function pg_temp.id(k text) returns uuid language sql immutable as
  $$ select md5('edu-min:' || k)::uuid $$;

create temp table t_extra (clave text, nombre text, intereses text[], completadas int) on commit drop;
insert into t_extra values
  ('lucia',     'Lucía',     array['dibujo','musica'],        2),
  ('joaquin',   'Joaquín',   array['futbol','videojuegos'],   0),
  ('camila',    'Camila',    array['dibujo','animales'],      2),
  ('thiago',    'Thiago',    array['futbol'],                 1),
  ('valentina', 'Valentina', array['musica','cocina'],        1),
  ('benicio',   'Benicio',   array['futbol','robotica'],      2),
  ('emma',      'Emma',      array['dibujo'],                 0),
  ('santino',   'Santino',   array['videojuegos','espacio'],  1),
  ('martina',   'Martina',   array['cocina','animales'],      2),
  ('ciro',      'Ciro',      array[]::text[],                 0);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', pg_temp.id('u:al:' || clave), 'authenticated', 'authenticated',
       'alumno.' || clave || '.5b@ficticio.test',
       extensions.crypt('educacion123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
       '', '', '', '', '', '', '', ''
from t_extra
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), pg_temp.id('u:al:' || clave), pg_temp.id('u:al:' || clave)::text,
       jsonb_build_object('sub', pg_temp.id('u:al:' || clave)::text, 'email', 'alumno.' || clave || '.5b@ficticio.test', 'email_verified', true),
       'email', now(), now(), now()
from t_extra
on conflict do nothing;

insert into public.perfiles (id, nombre_visible) select pg_temp.id('u:al:' || clave), nombre from t_extra on conflict (id) do nothing;
insert into public.membresias (escuela_id, usuario_id, rol) select pg_temp.id('esc'), pg_temp.id('u:al:' || clave), 'alumno' from t_extra on conflict do nothing;
insert into public.inscripciones (curso_id, alumno_id) select pg_temp.id('c:5b'), pg_temp.id('u:al:' || clave) from t_extra on conflict do nothing;

insert into public.intereses_alumno (alumno_id, interes, origen)
select pg_temp.id('u:al:' || clave), unnest(intereses), 'declarado' from t_extra
on conflict do nothing;

-- Avance: las primeras N misiones (por orden) de los proyectos del curso.
insert into public.progreso_misiones (mision_id, alumno_id, escuela_id, estado, pistas_usadas, completada_en)
select m.id, pg_temp.id('u:al:' || e.clave), pg_temp.id('esc'), 'completada', 0, now() - interval '1 day'
from t_extra e
cross join lateral (
  select m2.id
  from public.misiones m2
  join public.proyectos p on p.id = m2.proyecto_id
  where p.curso_id = pg_temp.id('c:5b')
  order by p.created_at, m2.orden
  limit e.completadas
) m
on conflict do nothing;

commit;
