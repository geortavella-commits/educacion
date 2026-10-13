-- ============================================================================
-- SEED MÍNIMO — base casi vacía para armar todo desde cero con la app.
-- Solo para desarrollo local. Todo es ficticio (mails @ficticio.test, sin apellidos).
--
-- Cómo cargarlo (reemplaza la base entera, borra lo que hubiera):
--   supabase db reset --no-seed
--   docker exec -i supabase_db_educacion psql -U postgres -v ON_ERROR_STOP=1 < supabase/seeds/minimo.sql
--
-- Queda: 1 escuela, 1 curso (5º B), 1 usuario por rol (contraseña de todos: educacion123),
-- el currículo de EJEMPLO de 5º año (sin validar) y un código de clase vigente: COR5B2.
-- NO hay grupos, proyectos, misiones ni más alumnos: eso se crea desde la app.
-- ============================================================================

begin;

-- Ids fijos y legibles, derivados del nombre
create function pg_temp.id(k text) returns uuid language sql immutable as
  $$ select md5('edu-min:' || k)::uuid $$;

-- ─── Escuela y curso ────────────────────────────────────────────────────────
insert into public.jurisdicciones (id, nombre) values (pg_temp.id('jur'), 'Córdoba');
insert into public.escuelas (id, jurisdiccion_id, nombre, localidad) values
  (pg_temp.id('esc'), pg_temp.id('jur'), 'Escuela Ficticia N° 14', 'Córdoba capital');
insert into public.cursos (id, escuela_id, nombre, nivel, anio, ciclo_lectivo) values
  (pg_temp.id('c:5b'), pg_temp.id('esc'), '5º B', 'primaria', 5, 2026);

-- ─── Un usuario por rol ─────────────────────────────────────────────────────
create temp table t_users (clave text, email text, nombre text, rol public.rol_escuela) on commit drop;
insert into t_users values
  ('dir',    'directivo@ficticio.test',      'Dirección',        'directivo'),
  ('laura',  'docente.laura@ficticio.test',  'Seño Laura',       'docente'),
  ('mateo',  'alumno.mateo@ficticio.test',   'Mateo',            'alumno'),
  ('fmateo', 'familia.mateo@ficticio.test',  'Familia de Mateo', 'familia');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', pg_temp.id('u:' || clave), 'authenticated', 'authenticated', email,
       extensions.crypt('educacion123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
       '', '', '', '', '', '', '', ''
from t_users;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), pg_temp.id('u:' || clave), pg_temp.id('u:' || clave)::text,
       jsonb_build_object('sub', pg_temp.id('u:' || clave)::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from t_users;

insert into public.perfiles (id, nombre_visible) select pg_temp.id('u:' || clave), nombre from t_users;
insert into public.membresias (escuela_id, usuario_id, rol) select pg_temp.id('esc'), pg_temp.id('u:' || clave), rol from t_users;

-- ─── Relaciones mínimas para que la app funcione ────────────────────────────
insert into public.curso_docentes (curso_id, usuario_id) values (pg_temp.id('c:5b'), pg_temp.id('u:laura'));
insert into public.inscripciones (curso_id, alumno_id) values (pg_temp.id('c:5b'), pg_temp.id('u:mateo'));
insert into public.familias_vinculos (familia_id, alumno_id) values (pg_temp.id('u:fmateo'), pg_temp.id('u:mateo'));
-- Consentimiento ya otorgado para que Mateo pueda usar la app (texto de ejemplo, sin validar legalmente)
insert into public.consentimientos (escuela_id, alumno_id, otorgado_por, version_texto, estado, fecha)
values (pg_temp.id('esc'), pg_temp.id('u:mateo'), pg_temp.id('u:fmateo'), 'v1-ejemplo', 'otorgado', now());

-- Código de clase para que se sumen alumnos nuevos (se guarda solo el hash): COR5B2
insert into public.codigos_clase (curso_id, codigo_hash, vence_en, activo, creado_por) values
  (pg_temp.id('c:5b'), encode(extensions.digest('COR5B2', 'sha256'), 'hex'), now() + interval '90 days', true, pg_temp.id('u:laura'));

-- ─── Currículo (EJEMPLO sin validar: no está marcado como vigente) ───────────
insert into public.curriculo_versiones (id, jurisdiccion_id, nombre, vigente, validada_por, validada_en) values
  (pg_temp.id('cv'), pg_temp.id('jur'), 'Córdoba — contenidos de EJEMPLO (sin validar)', false, null, null);
insert into public.areas (id, version_id, nombre) values
  (pg_temp.id('a:mat'), pg_temp.id('cv'), 'Matemática'),
  (pg_temp.id('a:cn'),  pg_temp.id('cv'), 'Ciencias Naturales'),
  (pg_temp.id('a:len'), pg_temp.id('cv'), 'Lengua');
insert into public.curriculo_contenidos (id, version_id, area_id, nivel, anio, eje, descripcion, es_nap) values
  (pg_temp.id('k:m1'), pg_temp.id('cv'), pg_temp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Calcular perímetro y área de figuras compuestas', true),
  (pg_temp.id('k:m2'), pg_temp.id('cv'), pg_temp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Medir longitudes con unidades convencionales', true),
  (pg_temp.id('k:m3'), pg_temp.id('cv'), pg_temp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Comparar y ordenar medidas', true),
  (pg_temp.id('k:m4'), pg_temp.id('cv'), pg_temp.id('a:mat'), 'primaria', 5, 'Números y operaciones', 'Proporcionalidad directa', true),
  (pg_temp.id('k:c1'), pg_temp.id('cv'), pg_temp.id('a:cn'),  'primaria', 5, 'Materiales', 'Propiedades de los materiales y su uso', true),
  (pg_temp.id('k:c2'), pg_temp.id('cv'), pg_temp.id('a:cn'),  'primaria', 5, 'Materiales', 'Cambios de los materiales por la acción del calor', true),
  (pg_temp.id('k:c3'), pg_temp.id('cv'), pg_temp.id('a:cn'),  'primaria', 5, 'La Tierra', 'Tipos de suelo y absorción de agua', true),
  (pg_temp.id('k:c4'), pg_temp.id('cv'), pg_temp.id('a:cn'),  'primaria', 5, 'Materiales', 'Mezclas y separación de componentes', true),
  (pg_temp.id('k:l1'), pg_temp.id('cv'), pg_temp.id('a:len'), 'primaria', 5, 'Escritura', 'Producción de textos de opinión y cartas formales', true),
  (pg_temp.id('k:l2'), pg_temp.id('cv'), pg_temp.id('a:len'), 'primaria', 5, 'Escritura', 'Textos expositivos', true),
  (pg_temp.id('k:l3'), pg_temp.id('cv'), pg_temp.id('a:len'), 'primaria', 5, 'Reflexión sobre la lengua', 'Puntuación y ortografía en la escritura', true),
  (pg_temp.id('k:l4'), pg_temp.id('cv'), pg_temp.id('a:len'), 'primaria', 5, 'Oralidad', 'Exposición oral de resultados', true);

commit;
