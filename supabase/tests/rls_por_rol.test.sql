-- Tests de RLS por rol (pgTAP). Correr con: supabase test db
-- Todos los datos son ficticios. Se arma el escenario como postgres (sin RLS)
-- y después se actúa como cada rol con set role.
begin;
select plan(108);

-- ─── Escenario ──────────────────────────────────────────────────────────────
-- IDs fijos legibles (esquema temporal de test: se descarta con el rollback)
create schema tests;
create function tests.u(n int) returns uuid language sql immutable as
  $$ select ('00000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid $$;
-- 1 dir_a · 2 doc_a1 · 3 doc_a2 · 4 al_a1x · 5 al_a1y · 6 al_a2x · 7 fam_a1x
-- 8 doc_b · 9 al_b · 10 dir_b

insert into auth.users (id, aud, role, email)
select tests.u(n), 'authenticated', 'authenticated', 'test' || n || '@ficticio.test'
from generate_series(1, 10) n;

insert into public.perfiles (id, nombre_visible)
select tests.u(n), 'Persona ' || n from generate_series(1, 10) n;

insert into public.jurisdicciones (id, nombre) values (tests.u(90), 'Córdoba (test)');
insert into public.escuelas (id, jurisdiccion_id, nombre) values
  (tests.u(91), tests.u(90), 'Escuela A (ficticia)'),
  (tests.u(92), tests.u(90), 'Escuela B (ficticia)');

insert into public.membresias (escuela_id, usuario_id, rol) values
  (tests.u(91), tests.u(1), 'directivo'),
  (tests.u(91), tests.u(2), 'docente'),
  (tests.u(91), tests.u(3), 'docente'),
  (tests.u(91), tests.u(4), 'alumno'),
  (tests.u(91), tests.u(5), 'alumno'),
  (tests.u(91), tests.u(6), 'alumno'),
  (tests.u(91), tests.u(7), 'familia'),
  (tests.u(92), tests.u(8), 'docente'),
  (tests.u(92), tests.u(9), 'alumno'),
  (tests.u(92), tests.u(10), 'directivo');

insert into public.cursos (id, escuela_id, nombre, nivel, anio, ciclo_lectivo) values
  (tests.u(81), tests.u(91), '5º B', 'primaria', 5, 2026),
  (tests.u(82), tests.u(91), '6º A', 'primaria', 6, 2026),
  (tests.u(83), tests.u(92), '5º C', 'primaria', 5, 2026);
insert into public.curso_docentes values
  (tests.u(81), tests.u(2)), (tests.u(82), tests.u(3)), (tests.u(83), tests.u(8));
insert into public.inscripciones values
  (tests.u(81), tests.u(4)), (tests.u(81), tests.u(5)),
  (tests.u(82), tests.u(6)), (tests.u(83), tests.u(9));
insert into public.familias_vinculos values (tests.u(7), tests.u(4));
insert into public.consentimientos (escuela_id, alumno_id, otorgado_por, version_texto, estado) values
  (tests.u(91), tests.u(4), tests.u(7), 'v1', 'otorgado'),
  (tests.u(91), tests.u(5), tests.u(7), 'v1', 'pendiente');

insert into public.grupos (id, curso_id, tipo, nombre_visible, estado, creado_por) values
  (tests.u(71), tests.u(81), 'dinamico', 'Los goleadores del área', 'aprobado', tests.u(2));
insert into public.grupos_internos values (tests.u(71), 'Refuerzo');
insert into public.grupo_miembros values (tests.u(71), tests.u(4));

insert into public.proyectos (id, escuela_id, curso_id, creado_por, titulo, estado) values
  (tests.u(61), tests.u(91), tests.u(81), tests.u(2), 'Proyecto A1', 'activo'),
  (tests.u(62), tests.u(91), tests.u(82), tests.u(3), 'Proyecto A2', 'activo'),
  (tests.u(63), tests.u(92), tests.u(83), tests.u(8), 'Proyecto B1', 'activo');
insert into public.misiones (id, proyecto_id, orden, titulo) values
  (tests.u(51), tests.u(61), 1, 'Mision A1'),
  (tests.u(52), tests.u(62), 1, 'Mision A2');
insert into public.misiones (id, proyecto_id, orden, titulo, tipo_respuesta, opciones) values
  (tests.u(53), tests.u(61), 3, 'Mision numerica A1', 'numero', null),
  (tests.u(54), tests.u(61), 4, 'Mision texto A1', 'texto', null),
  (tests.u(55), tests.u(61), 5, 'Mision opcion A1', 'opcion', '[{"id":"a","texto":"Uno"},{"id":"b","texto":"Dos"}]'::jsonb);
insert into public.misiones_claves (mision_id, respuestas) values (tests.u(53), '["3,5"]'::jsonb);
insert into public.respuestas_abiertas (mision_id, alumno_id, texto) values (tests.u(51), tests.u(4), 'Mi respuesta escrita');

insert into public.progreso_misiones (mision_id, alumno_id, escuela_id) values
  (tests.u(51), tests.u(4), tests.u(91)),
  (tests.u(51), tests.u(5), tests.u(91)),
  (tests.u(52), tests.u(6), tests.u(91));
insert into public.senales_alumno (id, escuela_id, alumno_id, descripcion) values
  (tests.u(41), tests.u(91), tests.u(4), 'Hipótesis de prueba A1'),
  (tests.u(42), tests.u(91), tests.u(6), 'Hipótesis de prueba A2');
insert into public.tutor_sesiones (id, escuela_id, alumno_id) values
  (tests.u(31), tests.u(91), tests.u(4)),
  (tests.u(32), tests.u(91), tests.u(5)),
  (tests.u(33), tests.u(91), tests.u(6));
insert into public.tutor_mensajes (sesion_id, escuela_id, autor, contenido, revision)
select s, tests.u(91), a, 'texto de prueba', case when a = 'tutor' then 'aprobado' end
from unnest(array[tests.u(31), tests.u(32), tests.u(33)]) s, unnest(array['alumno','tutor']) a;
insert into public.tutor_resumenes (sesion_id, escuela_id, alumno_id, resumen) values
  (tests.u(31), tests.u(91), tests.u(4), 'Resumen de prueba');

insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values
  (tests.u(4), tests.u(2), 'logro', 'Muy buen trabajo con las medidas.'),
  (tests.u(5), tests.u(2), 'sugerencia', 'Probá dibujar primero la cancha.');

insert into public.invitaciones_familia (escuela_id, alumno_id, codigo_hash, vence_en, creada_por) values
  (tests.u(91), tests.u(4), 'hash-de-prueba', now() + interval '1 day', tests.u(2));
insert into public.ingreso_intentos (clave) values ('ip:prueba');
insert into public.ia_usos (escuela_id, usuario_id, funcion, tokens_entrada, tokens_salida) values
  (tests.u(91), tests.u(2), 'prueba', 10, 5);

insert into public.accesos_alumno (escuela_id, alumno_id, codigo_hash, vence_en, creado_por) values
  (tests.u(91), tests.u(4), 'hash-acceso-de-prueba', now() + interval '15 minutes', tests.u(2));

create function tests.act_as(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
grant usage on schema tests to public;
grant execute on all functions in schema tests to public;

-- ─── Alumno (al_a1x) ────────────────────────────────────────────────────────
select tests.act_as(tests.u(4));

select is((select count(*)::int from public.perfiles where id = tests.u(4)), 1, 'alumno: ve su perfil');
select is((select count(*)::int from public.perfiles where id = tests.u(5)), 0, 'alumno: no ve el perfil de un compañero que no es de su equipo');
select is((select count(*)::int from public.progreso_misiones where alumno_id = tests.u(5)), 0, 'alumno: no ve el progreso de otro');
select is((select count(*)::int from public.progreso_misiones), 1, 'alumno: ve solo su progreso');
select is((select count(*)::int from public.senales_alumno), 0, 'alumno: no ve señales sobre sí mismo');
select is((select count(*)::int from public.grupos_internos), 0, 'alumno: no ve etiquetas internas de grupos');
select is((select count(*)::int from public.grupos), 1, 'alumno: ve su grupo aprobado (nombre neutro)');
select is((select count(*)::int from public.tutor_mensajes), 2, 'alumno: ve solo sus mensajes del tutor');
select is((select count(*)::int from public.tutor_resumenes), 0, 'alumno: no ve resúmenes');
select is((select count(*)::int from public.proyectos), 1, 'alumno: ve solo el proyecto de su curso');
select is((select count(*)::int from public.escuelas), 1, 'alumno: ve solo su escuela');
select throws_ok($$ insert into public.tutor_mensajes (sesion_id, escuela_id, autor, contenido, revision)
  values (tests.u(31), tests.u(91), 'tutor', 'x', 'aprobado') $$, null, 'alumno: no puede escribir mensajes del tutor');
select throws_ok($$ insert into public.senales_alumno (escuela_id, alumno_id, descripcion)
  values (tests.u(91), tests.u(4), 'x') $$, null, 'alumno: no puede crear señales');
select throws_ok($$ insert into public.consentimientos (escuela_id, alumno_id, otorgado_por, version_texto, estado)
  values (tests.u(91), tests.u(4), tests.u(4), 'v1', 'otorgado') $$, null, 'alumno: no puede darse consentimiento');
select throws_ok($$ update public.membresias set rol = 'docente' $$, null, 'alumno: no puede cambiar su rol');
select throws_ok($$ update public.progreso_misiones set estado = 'completada' $$, null, 'alumno: no escribe progreso desde el cliente');
select throws_ok($$ insert into public.intereses_alumno (alumno_id, interes, origen)
  values (tests.u(4), 'fútbol', 'observado') $$, null, 'alumno: no puede insertar intereses "observados"');
select lives_ok($$ insert into public.intereses_alumno (alumno_id, interes, origen)
  values (tests.u(4), 'fútbol', 'declarado') $$, 'alumno: puede declarar sus intereses');
select is((select count(*)::int from public.invitaciones_familia), 0, 'alumno: no ve invitaciones de familia');
select throws_ok($$ select * from public.ingreso_intentos $$, null, 'alumno: no puede leer los intentos de ingreso');
select throws_ok($$ insert into public.invitaciones_familia (escuela_id, alumno_id, codigo_hash, vence_en, creada_por)
  values (tests.u(91), tests.u(4), 'x', now(), tests.u(4)) $$, null, 'alumno: no puede crear invitaciones');

-- ─── Docente a1 ─────────────────────────────────────────────────────────────
reset role;
select tests.act_as(tests.u(2));

select is((select count(*)::int from public.inscripciones), 2, 'docente a1: ve a los alumnos de su curso');
select is((select count(*)::int from public.inscripciones where curso_id = tests.u(82)), 0, 'docente a1: no ve alumnos de curso_a2');
select is((select count(*)::int from public.senales_alumno), 1, 'docente a1: ve solo señales de sus alumnos');
select is((select count(*)::int from public.proyectos), 1, 'docente a1: ve solo el proyecto de su curso');
select is((select count(*)::int from public.grupos_internos), 1, 'docente a1: ve etiquetas internas de sus grupos');
select is((select count(*)::int from public.tutor_mensajes), 4, 'docente a1: ve la conversación completa de sus alumnos');
select is((select count(*)::int from public.tutor_resumenes), 1, 'docente a1: ve resúmenes de sus alumnos');
select is((select count(*)::int from public.escuelas where id = tests.u(92)), 0, 'docente a1: no ve escuela_b');
select is((select count(*)::int from public.perfiles where id = tests.u(9)), 0, 'docente a1: no ve alumnos de escuela_b');
select is((select count(*)::int from public.invitaciones_familia), 1, 'docente a1: ve las invitaciones de sus alumnos (solo el estado, el código nunca)');
select lives_ok($$ update public.senales_alumno set estado = 'corregida', revisada_por = tests.u(2)
  where id = tests.u(41) $$, 'docente a1: puede corregir una señal de su alumno');
select throws_ok($$ update public.senales_alumno set alumno_id = tests.u(6) where id = tests.u(41) $$,
  null, 'docente a1: no puede reasignar una señal a otro alumno');
select lives_ok($$ insert into public.proyectos (escuela_id, curso_id, creado_por, titulo)
  values (tests.u(91), tests.u(81), tests.u(2), 'Nuevo') $$, 'docente a1: crea proyecto en su curso');
select throws_ok($$ insert into public.proyectos (escuela_id, curso_id, creado_por, titulo)
  values (tests.u(91), tests.u(82), tests.u(2), 'Ajeno') $$, null, 'docente a1: no crea proyecto en curso ajeno');
select throws_ok($$ insert into public.tutor_mensajes (sesion_id, escuela_id, autor, contenido, revision)
  values (tests.u(31), tests.u(91), 'tutor', 'x', 'aprobado') $$, null, 'docente: no escribe mensajes del tutor');
select throws_ok($$ insert into public.codigos_clase (curso_id, codigo_hash, vence_en, creado_por)
  values (tests.u(81), 'h', now(), tests.u(2)) $$, null, 'docente: no escribe códigos de clase desde el cliente');

-- ─── Familia (fam_a1x) ──────────────────────────────────────────────────────
reset role;
select tests.act_as(tests.u(7));

select is((select count(*)::int from public.perfiles where id = tests.u(4)), 1, 'familia: ve a su hijo/a');
select is((select count(*)::int from public.perfiles where id = tests.u(5)), 0, 'familia: no ve a otro alumno del curso');
select is((select count(*)::int from public.progreso_misiones), 1, 'familia: ve el progreso de su hijo/a');
select is((select count(*)::int from public.tutor_mensajes), 0, 'familia: no ve la conversación');
select is((select count(*)::int from public.senales_alumno), 0, 'familia: no ve señales');
select is((select count(*)::int from public.invitaciones_familia), 0, 'familia: no ve invitaciones');
select ok((select count(*) from public.resumen_hijo(tests.u(4))) >= 0, 'familia: puede pedir el resumen de SU hijo/a');
select is((select dias_activos from public.actividad_semana_hijo(tests.u(4))), 0, 'familia: ve la actividad de la semana de SU hijo/a (agregada)');
select throws_ok($$ select * from public.resumen_hijo(tests.u(5)) $$, '42501', null, 'familia: NO puede pedir el resumen de otro alumno');
select throws_ok($$ select * from public.actividad_semana_hijo(tests.u(6)) $$, '42501', null, 'familia: NO puede pedir la actividad de otro alumno');

-- ─── Directivo a ────────────────────────────────────────────────────────────
reset role;
select tests.act_as(tests.u(1));

select is((select count(*)::int from public.tutor_mensajes), 0, 'directivo: no ve transcripciones');
select is((select count(*)::int from public.tutor_resumenes), 1, 'directivo: ve resúmenes de su escuela');
select is((select count(*)::int from public.inscripciones), 0, 'directivo: no ve inscripciones de alumnos');
select is((select count(*)::int from public.perfiles where id = tests.u(4)), 0, 'directivo: no ve perfiles de alumnos');
select is((select count(*)::int from public.perfiles where id = tests.u(2)), 1, 'directivo: ve a los docentes de su escuela');
select is((select count(*)::int from public.cursos), 2, 'directivo: ve los cursos de su escuela');
select is((select cursos_activos from public.resumen_escuela(tests.u(91))), 2, 'directivo: obtiene agregados de su escuela');
select throws_ok($$ select * from public.resumen_escuela(tests.u(92)) $$, null, 'directivo: no obtiene agregados de otra escuela');
select is((select count(*)::int from public.proyectos where escuela_id = tests.u(92)), 0, 'directivo a: no ve proyectos de escuela_b');

-- ─── Docente b (otra escuela) ───────────────────────────────────────────────
reset role;
select tests.act_as(tests.u(8));

select is((select count(*)::int from public.senales_alumno), 0, 'docente b: no ve señales de escuela_a');
select is((select count(*)::int from public.invitaciones_familia), 0, 'docente b: no ve invitaciones de otra escuela');
select is((select count(*)::int from public.proyectos), 1, 'docente b: ve solo su proyecto');

-- ─── Devoluciones y grupos por proyecto ─────────────────────────────────────
reset role;
select tests.act_as(tests.u(4));
select is((select count(*)::int from public.devoluciones), 1, 'alumno: ve solo SUS devoluciones');
select throws_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values (tests.u(4), tests.u(4), 'logro', 'Me felicito solo') $$,
  '42501', null, 'alumno: no puede escribir devoluciones');

reset role;
select tests.act_as(tests.u(7));
select is((select count(*)::int from public.devoluciones), 0, 'familia: no ve las devoluciones');

reset role;
select tests.act_as(tests.u(3));
select is((select count(*)::int from public.devoluciones), 0, 'docente a2: no ve devoluciones de alumnos de otro curso');
select throws_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values (tests.u(4), tests.u(3), 'logro', 'No es mi alumno') $$,
  '42501', null, 'docente a2: no puede escribir a un alumno de otro curso');

reset role;
select tests.act_as(tests.u(2));
select is((select count(*)::int from public.devoluciones), 2, 'docente a1: ve las devoluciones de su curso');
select lives_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values (tests.u(4), tests.u(2), 'sugerencia', 'Probá dibujar antes de calcular.') $$,
  'docente a1: escribe una devolución a su alumno');
select throws_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values (tests.u(4), tests.u(3), 'logro', 'Firmada por otra') $$,
  '42501', null, 'docente a1: no puede firmar como otra persona');
select throws_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, tipo, texto) values (tests.u(4), tests.u(2), 'logro', 'Ok') $$,
  '23514', null, 'docente a1: la devolución vacía o muy corta se rechaza');
select throws_ok(
  $$ insert into public.devoluciones (alumno_id, autor_id, proyecto_id, tipo, texto) values (tests.u(4), tests.u(2), tests.u(62), 'logro', 'Proyecto de otro curso') $$,
  '23514', null, 'docente a1: la devolución no puede apuntar a un proyecto de otro curso');
select lives_ok(
  $$ insert into public.grupos (curso_id, proyecto_id, tipo, nombre_visible, creado_por) values (tests.u(81), tests.u(61), 'dinamico', 'Equipo de prueba', tests.u(2)) $$,
  'docente a1: crea un grupo dentro de un proyecto de su curso');
select throws_ok(
  $$ insert into public.grupos (curso_id, proyecto_id, tipo, nombre_visible, creado_por) values (tests.u(81), tests.u(62), 'dinamico', 'Grupo cruzado', tests.u(2)) $$,
  '23514', null, 'docente a1: no puede colgar un grupo de un proyecto de otro curso');
select throws_ok(
  $$ insert into public.grupo_miembros values (tests.u(71), tests.u(6)) $$,
  '23514', null, 'docente a1: no puede sumar a un grupo un alumno que no está inscripto en el curso');
select lives_ok(
  $$ insert into public.grupo_miembros values (tests.u(71), tests.u(5)) $$,
  'docente a1: suma al grupo un alumno inscripto en su curso');

-- ─── Misiones con respuesta: la respuesta correcta es secreto de la docente ─────────────────────
reset role;
select tests.act_as(tests.u(4));
select is((select count(*)::int from public.misiones_claves), 0, 'alumno: NO lee las respuestas correctas de las misiones');
select throws_ok($$ insert into public.misiones_claves (mision_id, respuestas) values (tests.u(54), '["x"]'::jsonb) $$, '42501', null, 'alumno: no puede escribir respuestas correctas');
select is((select count(*)::int from public.respuestas_abiertas), 1, 'alumno: ve su propia respuesta escrita');
select throws_ok($$ insert into public.respuestas_abiertas (mision_id, alumno_id, texto) values (tests.u(51), tests.u(4), 'trampa') $$, '42501', null, 'alumno: no escribe respuestas abiertas desde el cliente (lo hace la función)');

reset role;
select tests.act_as(tests.u(5));
select is((select count(*)::int from public.respuestas_abiertas), 0, 'alumno: no ve la respuesta escrita de un compañero');

reset role;
select tests.act_as(tests.u(7));
select is((select count(*)::int from public.respuestas_abiertas), 0, 'familia: no lee las respuestas escritas');
select is((select count(*)::int from public.misiones_claves), 0, 'familia: no lee las respuestas correctas');

reset role;
select tests.act_as(tests.u(3));
select is((select count(*)::int from public.misiones_claves), 0, 'docente a2: no ve las respuestas correctas de otro curso');
select is((select count(*)::int from public.respuestas_abiertas), 0, 'docente a2: no ve respuestas escritas de alumnos de otro curso');
select throws_ok($$ insert into public.misiones_claves (mision_id, respuestas) values (tests.u(54), '["x"]'::jsonb) $$, '42501', null, 'docente a2: no puede cargar respuestas en una misión de otro curso');

reset role;
select tests.act_as(tests.u(2));
select is((select count(*)::int from public.misiones_claves), 1, 'docente a1: ve las respuestas correctas de sus misiones');
select is((select count(*)::int from public.respuestas_abiertas), 1, 'docente a1: lee la respuesta escrita de su alumno');
select lives_ok($$ insert into public.misiones_claves (mision_id, respuestas, tolerancia) values (tests.u(54), '["Córdoba","provincia de Córdoba"]'::jsonb, 0) $$, 'docente a1: carga las respuestas correctas de su misión');
select throws_ok($$ insert into public.misiones_claves (mision_id, respuestas) values (tests.u(55), '["z"]'::jsonb) $$, '23514', null, 'la base rechaza una opción correcta que no es una de las opciones');
select throws_ok($$ insert into public.misiones_claves (mision_id, respuestas) values (tests.u(54), '["otra"]'::jsonb) $$, '23505', null, 'una misión tiene una sola clave (no se carga dos veces)');
select throws_ok($$ insert into public.misiones (proyecto_id, orden, titulo, tipo_respuesta, opciones) values (tests.u(61), 9, 'Una sola opción', 'opcion', '[{"id":"a","texto":"Sola"}]'::jsonb) $$, '23514', null, 'la base rechaza una misión de opción con menos de 2 opciones');
select throws_ok($$ insert into public.misiones (proyecto_id, orden, titulo, tipo_respuesta, opciones) values (tests.u(61), 9, 'Texto con opciones', 'texto', '[{"id":"a","texto":"x"},{"id":"b","texto":"y"}]'::jsonb) $$, '23514', null, 'solo las misiones de opción llevan opciones');

-- ─── Eliminar grupos ────────────────────────────────────────────────────────
reset role;
-- Borra con los permisos de quien llama (la RLS aplica) y devuelve cuántas filas se borraron.
create function tests.borrar_grupo(p uuid) returns int language plpgsql as $$
declare n int;
begin
  delete from public.grupos where id = p;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function tests.borrar_grupo(uuid) to public;
select tests.act_as(tests.u(4));
select is(tests.borrar_grupo(tests.u(71)), 0, 'alumno: no puede eliminar un grupo');

reset role;
select tests.act_as(tests.u(3));
select is(tests.borrar_grupo(tests.u(71)), 0, 'docente a2: no puede eliminar un grupo de otro curso');

reset role;
select tests.act_as(tests.u(2));
select is(tests.borrar_grupo(tests.u(71)), 1, 'docente a1: elimina un grupo de su curso');
reset role;
select is((select count(*)::int from public.grupo_miembros where grupo_id = tests.u(71)), 0, 'al eliminar el grupo también se borra su lista de miembros');

-- ─── Eliminar proyectos ─────────────────────────────────────────────────────
reset role;
create function tests.borrar_proyecto(p uuid) returns int language plpgsql as $$
declare n int;
begin
  delete from public.proyectos where id = p;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function tests.borrar_proyecto(uuid) to public;
-- Una conversación del tutor sobre una misión del proyecto A1 (protege los registros de los alumnos).
insert into public.tutor_sesiones (id, escuela_id, alumno_id, mision_id) values (tests.u(34), tests.u(91), tests.u(4), tests.u(51));

select tests.act_as(tests.u(3));
select is(tests.borrar_proyecto(tests.u(61)), 0, 'docente a2: no puede eliminar el proyecto de otra docente');

reset role;
select tests.act_as(tests.u(2));
select throws_ok($$ select tests.borrar_proyecto(tests.u(61)) $$, '23503', null, 'docente a1: no puede eliminar un proyecto con conversaciones del tutor');

reset role;
delete from public.tutor_sesiones where id = tests.u(34);
select tests.act_as(tests.u(2));
select is(tests.borrar_proyecto(tests.u(61)), 1, 'docente a1: elimina su proyecto sin conversaciones');

-- ─── Accesos nuevos de alumnos (solo la docente del alumno ve que existen; nadie del cliente escribe) ─────
reset role;
select tests.act_as(tests.u(2));
select is((select count(*)::int from public.accesos_alumno), 1, 'docente a1: ve los accesos de sus alumnos');
select throws_ok($$ insert into public.accesos_alumno (escuela_id, alumno_id, codigo_hash, vence_en, creado_por)
  values (tests.u(91), tests.u(4), 'x', now(), tests.u(2)) $$, '42501', null, 'docente a1: no puede crear accesos directo (solo la función del servidor)');
reset role;
select tests.act_as(tests.u(3));
select is((select count(*)::int from public.accesos_alumno), 0, 'docente a2: no ve accesos de alumnos de otro curso');
reset role;
select tests.act_as(tests.u(4));
select is((select count(*)::int from public.accesos_alumno), 0, 'alumno: no ve accesos');
reset role;
select tests.act_as(tests.u(7));
select is((select count(*)::int from public.accesos_alumno), 0, 'familia: no lee la tabla (genera el código por la función)');

-- ─── Registro de usos de la IA (solo las funciones del servidor lo leen y escriben) ─────
reset role;
select tests.act_as(tests.u(2));
select is((select count(*)::int from public.ia_usos), 0, 'docente: no lee el registro de usos de la IA (solo las funciones)');
select throws_ok($$ insert into public.ia_usos (usuario_id, funcion) values (tests.u(2), 'x') $$, '42501', null, 'docente: no puede escribir en el registro de usos de la IA');
reset role;
select tests.act_as(tests.u(4));
select is((select count(*)::int from public.ia_usos), 0, 'alumno: no ve el registro de usos de la IA');

-- ─── Anónimo ────────────────────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok($$ select * from public.perfiles $$, null, 'anónimo: no lee perfiles');

-- ─── Controles estructurales ────────────────────────────────────────────────
reset role;
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'toda tabla de public tiene RLS'
);
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and (p.proconfig is null or not exists (
         select 1 from unnest(p.proconfig) c where c like 'search_path=%')) $$,
  'toda función security definer fija search_path'
);

select * from finish();
rollback;
