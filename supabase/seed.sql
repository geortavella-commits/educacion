-- ============================================================================
-- SEED FICTICIO — solo para desarrollo local (supabase db reset).
-- Todo es inventado: nombres de pila sin apellido, escuela ficticia de Córdoba,
-- mails @ficticio.test. NUNCA cargar datos reales de alumnos acá ni copiar
-- producción a este archivo.
--
-- Reproduce los números de la maqueta:
--   3 cursos: 5º B (24), 6º A (22), 3º año (18)  → 64 alumnos
--   7 alumnos con una observación para revisar (2 + 1 + 4)
--   9 consentimientos pendientes (3 + 2 + 4), el resto otorgado
--   Proyecto "La cancha del barrio": 9 de 12 contenidos cubiertos (3/4, 2/4, 4/4)
--   Avance de misiones aproximado: Matemática ~81 %, Ciencias ~54 %, Lengua ~29 %
--
-- Usuarios de prueba (contraseña de TODOS: educacion123, solo local):
--   directivo@ficticio.test   docente.laura@ficticio.test   docente.julian@ficticio.test
--   docente.carla@ficticio.test   alumno.mateo@ficticio.test   familia.mateo@ficticio.test
--   (el patrón es alumno.<nombre>@ficticio.test / familia.<nombre>@ficticio.test, sin tildes)
-- Código de clase de 5º B para probar el ingreso: COR5B2 (solo se guarda su hash).
-- ============================================================================

-- Todo va dentro de un único bloque DO: el CLI manda el archivo como un lote y
-- necesita que cada sentencia se planifique al ejecutarse (no todas de antemano).
do $seed$
declare n_al int; n_se int; n_pe int; n_co int;
begin

-- esquema auxiliar (se elimina al final)
create schema seedtmp;

create function seedtmp.id(k text) returns uuid language sql immutable as
  $$ select md5('edu-seed:' || k)::uuid $$;

-- sin tildes ni espacios, para armar mails
create function seedtmp.slug(t text) returns text language sql immutable as
  $$ select lower(translate(t, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) $$;

-- ─── Escuela ────────────────────────────────────────────────────────────────
insert into public.jurisdicciones (id, nombre) values (seedtmp.id('jur'), 'Córdoba');
insert into public.escuelas (id, jurisdiccion_id, nombre, localidad) values
  (seedtmp.id('esc'), seedtmp.id('jur'), 'Escuela Ficticia N° 14', 'Córdoba capital');

-- ─── Personas ───────────────────────────────────────────────────────────────
create table seedtmp.t_alumnos (curso text, n int, nombre text, pendiente boolean);
insert into seedtmp.t_alumnos (curso, n, nombre)
select '5b', row_number() over (), x from unnest(array[
 'Mateo','Sofía','Valentina','Tomás','Camila','Lucas','Santi','Bruno','Felipe','Juan','Catalina','Emma',
 'Martina','Benja','Julieta','Thiago','Renata','Facundo','Delfina','Gael','Olivia','Ignacio','Pilar','Ciro']) x;
insert into seedtmp.t_alumnos (curso, n, nombre)
select '6a', row_number() over (), x from unnest(array[
 'Ailén','Agustín','Malena','Santino','Lola','Bautista','Zoe','Dante','Mía','León','Alma','Franco',
 'Nina','Joaco','Rocío','Máximo','Abigail','Lautaro','Violeta','Matías','Jazmín','Elías']) x;
insert into seedtmp.t_alumnos (curso, n, nombre)
select '3a', row_number() over (), x from unnest(array[
 'Lara','Joaquín','Nicolás','Abril','Milo','Candela','Ramiro','Antonella','Gonzalo','Brisa','Simón','Luna',
 'Esteban','Paulina','Valeria','Kevin','Aldana','Iván']) x;
update seedtmp.t_alumnos set pendiente = nombre in
  ('Ciro','Pilar','Ignacio', 'Elías','Jazmín', 'Iván','Aldana','Kevin','Valeria');

-- Adultos: id, mail, nombre visible
create table seedtmp.t_adultos (clave text, email text, nombre text, rol public.rol_escuela);
insert into seedtmp.t_adultos values
 ('dir',   'directivo@ficticio.test',        'Dirección',     'directivo'),
 ('laura', 'docente.laura@ficticio.test',    'Seño Laura',    'docente'),
 ('julian','docente.julian@ficticio.test',   'Seño Julián',   'docente'),
 ('carla', 'docente.carla@ficticio.test',    'Seño Carla',    'docente');

-- Todos los usuarios de auth (adultos, alumnos y una familia por alumno)
create table seedtmp.t_users as
  select seedtmp.id('u:' || clave) as uid, email, nombre, rol, null::text as curso from seedtmp.t_adultos
  union all
  select seedtmp.id('u:al:' || curso || ':' || nombre), 'alumno.' || seedtmp.slug(nombre) || '.' || curso || '@ficticio.test',
         nombre, 'alumno'::public.rol_escuela, curso from seedtmp.t_alumnos
  union all
  select seedtmp.id('u:fam:' || curso || ':' || nombre), 'familia.' || seedtmp.slug(nombre) || '.' || curso || '@ficticio.test',
         'Familia de ' || nombre, 'familia'::public.rol_escuela, curso from seedtmp.t_alumnos;
-- atajos fáciles de recordar para probar con un solo alumno/familia
update seedtmp.t_users set email = 'alumno.mateo@ficticio.test'  where uid = seedtmp.id('u:al:5b:Mateo');
update seedtmp.t_users set email = 'familia.mateo@ficticio.test' where uid = seedtmp.id('u:fam:5b:Mateo');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', email,
       extensions.crypt('educacion123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
       '', '', '', '', '', '', '', ''
from seedtmp.t_users;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), uid, uid::text,
       jsonb_build_object('sub', uid::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from seedtmp.t_users;

insert into public.perfiles (id, nombre_visible) select uid, nombre from seedtmp.t_users;

insert into public.membresias (escuela_id, usuario_id, rol)
select seedtmp.id('esc'), uid, rol from seedtmp.t_users;

-- ─── Cursos, docentes, inscripciones y familias ─────────────────────────────
insert into public.cursos (id, escuela_id, nombre, nivel, anio, ciclo_lectivo) values
 (seedtmp.id('c:5b'), seedtmp.id('esc'), '5º B',    'primaria',   5, 2026),
 (seedtmp.id('c:6a'), seedtmp.id('esc'), '6º A',    'primaria',   6, 2026),
 (seedtmp.id('c:3a'), seedtmp.id('esc'), '3º año',  'secundaria', 3, 2026);

insert into public.curso_docentes values
 (seedtmp.id('c:5b'), seedtmp.id('u:laura')),
 (seedtmp.id('c:6a'), seedtmp.id('u:julian')),
 (seedtmp.id('c:3a'), seedtmp.id('u:carla'));

insert into public.inscripciones (curso_id, alumno_id)
select seedtmp.id('c:' || curso), seedtmp.id('u:al:' || curso || ':' || nombre) from seedtmp.t_alumnos;

insert into public.familias_vinculos (familia_id, alumno_id)
select seedtmp.id('u:fam:' || curso || ':' || nombre), seedtmp.id('u:al:' || curso || ':' || nombre) from seedtmp.t_alumnos;

-- Consentimiento: texto v1 (de ejemplo; el texto real se valida con asesoría legal)
insert into public.consentimientos (escuela_id, alumno_id, otorgado_por, version_texto, estado, fecha)
select seedtmp.id('esc'), seedtmp.id('u:al:' || curso || ':' || nombre), seedtmp.id('u:fam:' || curso || ':' || nombre),
       'v1-ejemplo', case when pendiente then 'pendiente' else 'otorgado' end, now() - interval '3 days'
from seedtmp.t_alumnos;

-- Ingreso de primaria: se guarda solo el hash del código
insert into public.codigos_clase (curso_id, codigo_hash, vence_en, activo, creado_por) values
 (seedtmp.id('c:5b'), encode(extensions.digest('COR5B2', 'sha256'), 'hex'), now() + interval '30 days', true, seedtmp.id('u:laura')),
 (seedtmp.id('c:6a'), encode(extensions.digest('COR6A7', 'sha256'), 'hex'), now() + interval '30 days', true, seedtmp.id('u:julian'));
insert into public.solicitudes_ingreso (curso_id, nombre_visible, estado) values
 (seedtmp.id('c:5b'), 'Nuevo compañero', 'pendiente'),
 (seedtmp.id('c:5b'), 'Otro alumno', 'pendiente');

-- ─── Currículo (EJEMPLO sin validar: no está marcado como vigente) ───────────
insert into public.curriculo_versiones (id, jurisdiccion_id, nombre, vigente, validada_por, validada_en) values
 (seedtmp.id('cv'), seedtmp.id('jur'), 'Córdoba — contenidos de EJEMPLO (sin validar)', false, null, null);
insert into public.areas (id, version_id, nombre) values
 (seedtmp.id('a:mat'), seedtmp.id('cv'), 'Matemática'),
 (seedtmp.id('a:cn'),  seedtmp.id('cv'), 'Ciencias Naturales'),
 (seedtmp.id('a:len'), seedtmp.id('cv'), 'Lengua');
insert into public.curriculo_contenidos (id, version_id, area_id, nivel, anio, eje, descripcion, es_nap) values
 (seedtmp.id('k:m1'), seedtmp.id('cv'), seedtmp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Calcular perímetro y área de figuras compuestas', true),
 (seedtmp.id('k:m2'), seedtmp.id('cv'), seedtmp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Medir longitudes con unidades convencionales', true),
 (seedtmp.id('k:m3'), seedtmp.id('cv'), seedtmp.id('a:mat'), 'primaria', 5, 'Geometría y medida', 'Comparar y ordenar medidas', true),
 (seedtmp.id('k:m4'), seedtmp.id('cv'), seedtmp.id('a:mat'), 'primaria', 5, 'Números y operaciones', 'Proporcionalidad directa', true),
 (seedtmp.id('k:c1'), seedtmp.id('cv'), seedtmp.id('a:cn'),  'primaria', 5, 'Materiales', 'Propiedades de los materiales y su uso', true),
 (seedtmp.id('k:c2'), seedtmp.id('cv'), seedtmp.id('a:cn'),  'primaria', 5, 'Materiales', 'Cambios de los materiales por la acción del calor', true),
 (seedtmp.id('k:c3'), seedtmp.id('cv'), seedtmp.id('a:cn'),  'primaria', 5, 'La Tierra', 'Tipos de suelo y absorción de agua', true),
 (seedtmp.id('k:c4'), seedtmp.id('cv'), seedtmp.id('a:cn'),  'primaria', 5, 'Materiales', 'Mezclas y separación de componentes', true),
 (seedtmp.id('k:l1'), seedtmp.id('cv'), seedtmp.id('a:len'), 'primaria', 5, 'Escritura', 'Producción de textos de opinión y cartas formales', true),
 (seedtmp.id('k:l2'), seedtmp.id('cv'), seedtmp.id('a:len'), 'primaria', 5, 'Escritura', 'Textos expositivos', true),
 (seedtmp.id('k:l3'), seedtmp.id('cv'), seedtmp.id('a:len'), 'primaria', 5, 'Reflexión sobre la lengua', 'Puntuación y ortografía en la escritura', true),
 (seedtmp.id('k:l4'), seedtmp.id('cv'), seedtmp.id('a:len'), 'primaria', 5, 'Oralidad', 'Exposición oral de resultados', true);

-- ─── Proyectos ──────────────────────────────────────────────────────────────
insert into public.proyectos (id, escuela_id, curso_id, creado_por, titulo, descripcion, nivel_escalera, estado, visibilidad) values
 (seedtmp.id('p:cancha'), seedtmp.id('esc'), seedtmp.id('c:5b'), seedtmp.id('u:laura'),
  'La cancha del barrio', 'Medir la cancha, estudiar el suelo y escribir una carta al intendente con datos propios.', 1, 'activo', 'curso'),
 (seedtmp.id('p:recetas'), seedtmp.id('esc'), seedtmp.id('c:6a'), seedtmp.id('u:julian'),
  'Recetas y proporciones', 'Escalar recetas usando proporcionalidad.', 1, 'activo', 'curso'),
 (seedtmp.id('p:huella'), seedtmp.id('esc'), seedtmp.id('c:3a'), seedtmp.id('u:carla'),
  'Huella de carbono del colegio', 'Relevar el consumo eléctrico del aula y proponer una reducción.', 2, 'activo', 'escuela');

-- 9 de 12 contenidos cubiertos por "La cancha del barrio"
insert into public.proyecto_contenidos (proyecto_id, contenido_id)
select seedtmp.id('p:cancha'), seedtmp.id('k:' || k)
from unnest(array['m1','m2','m3','c1','c2','l1','l2','l3','l4']) k;

insert into public.misiones (id, proyecto_id, contenido_id, orden, titulo, consigna) values
 (seedtmp.id('m:1'), seedtmp.id('p:cancha'), seedtmp.id('k:m2'), 1, 'Explorar: ¿cuánto mide una cancha?', 'Medí el arco con pasos antes de calcular.'),
 (seedtmp.id('m:2'), seedtmp.id('p:cancha'), seedtmp.id('k:m1'), 2, 'Medir y calcular el área', 'Calculá el área de la cancha dibujada.'),
 (seedtmp.id('m:3'), seedtmp.id('p:cancha'), seedtmp.id('k:c1'), 3, 'El césped y el suelo', 'Investigá qué materiales conviene usar.'),
 (seedtmp.id('m:4'), seedtmp.id('p:cancha'), seedtmp.id('k:l1'), 4, 'Carta al intendente', 'Escribí una carta con tus datos.'),
 (seedtmp.id('m:5'), seedtmp.id('p:recetas'), null, 1, 'Escalar una receta', 'Duplicá y reducí las cantidades de una receta.'),
 (seedtmp.id('m:6'), seedtmp.id('p:huella'), null, 1, 'Relevar el consumo del aula', 'Anotá el consumo eléctrico durante una semana.');

-- Progreso de 5º B (aprox.: mis. 1 → 11/12 · 2 → 8/12 · 3 → 13 de 24 · 4 → 7 de 24)
insert into public.progreso_misiones (mision_id, alumno_id, escuela_id, estado, pistas_usadas, completada_en)
select seedtmp.id('m:' || m), seedtmp.id('u:al:5b:' || nombre), seedtmp.id('esc'),
       case when n <= lim then 'completada' when n <= lim + 3 then 'en_curso' else 'pendiente' end,
       (n % 4)::smallint,
       case when n <= lim then now() - (n || ' hours')::interval end
from seedtmp.t_alumnos a
join (values (1, 21), (2, 18), (3, 13), (4, 7)) v(m, lim) on true
where a.curso = '5b';

insert into public.proyecto_miembros (proyecto_id, alumno_id, rol_equipo)
select seedtmp.id('p:cancha'), seedtmp.id('u:al:5b:' || nombre), null from seedtmp.t_alumnos where curso = '5b';

-- ─── Intereses (mismos ids que la lista del front) ──────────────────────────
insert into public.intereses_alumno (alumno_id, interes, origen)
select seedtmp.id('u:al:' || curso || ':' || nombre), i, 'declarado'
from seedtmp.t_alumnos a,
     lateral (values ('futbol', n % 2 = 1), ('dibujo', n % 3 = 0), ('musica', n % 5 = 0), ('videojuegos', n % 7 = 0), ('cocina', n % 4 = 0)) v(i, ok)
where ok;

-- ─── Devoluciones cualitativas (sin notas ni puntajes) ──────────────────────
insert into public.devoluciones (alumno_id, autor_id, proyecto_id, tipo, texto) values
 (seedtmp.id('u:al:5b:Bruno'), seedtmp.id('u:laura'), seedtmp.id('p:cancha'), 'logro',
  'Bruno, me gustó mucho cómo explicaste el cálculo del área con tus propias palabras. ¡Seguí así!'),
 (seedtmp.id('u:al:5b:Santi'), seedtmp.id('u:laura'), seedtmp.id('p:cancha'), 'sugerencia',
  'Santi, probá dibujar la cancha antes de calcular: te puede ayudar a ver qué medidas faltan.'),
 (seedtmp.id('u:al:5b:Mateo'), seedtmp.id('u:laura'), null, 'motivacion',
  'Mateo, ¡buen trabajo esta semana! Cuando quieras, contale a la clase cómo medís con pasos.');

-- ─── Grupos (nombre neutro para alumnos; etiqueta interna solo docente) ─────
insert into public.grupos (id, curso_id, proyecto_id, tipo, nombre_visible, criterio, estado, creado_por) values
 (seedtmp.id('g:gol'),  seedtmp.id('c:5b'), seedtmp.id('p:cancha'), 'dinamico', 'Los goleadores del área', '{"origen":"sugerido por el tutor"}', 'borrador', seedtmp.id('u:laura')),
 (seedtmp.id('g:crack'),seedtmp.id('c:5b'), seedtmp.id('p:cancha'), 'dinamico', 'Los cracks del barrio',   '{"origen":"sugerido por el tutor"}', 'borrador', seedtmp.id('u:laura')),
 (seedtmp.id('g:arq'),  seedtmp.id('c:5b'), seedtmp.id('p:cancha'), 'dinamico', 'Los arquitectos',         '{"origen":"sugerido por el tutor"}', 'borrador', seedtmp.id('u:laura')),
 (seedtmp.id('g:frac'), seedtmp.id('c:5b'), seedtmp.id('p:cancha'), 'dinamico', 'Equipo Fracciones',       '{"origen":"armado por la docente"}', 'aprobado', seedtmp.id('u:laura'));
insert into public.grupos_internos (grupo_id, etiqueta) values
 (seedtmp.id('g:gol'),   'Refuerzo · Área y perímetro'),
 (seedtmp.id('g:crack'), 'Equipo mixto'),
 (seedtmp.id('g:arq'),   'Desafío extra · Proporcionalidad'),
 (seedtmp.id('g:frac'),  'Refuerzo · Fracciones');
insert into public.grupo_miembros (grupo_id, alumno_id)
select seedtmp.id('g:' || g), seedtmp.id('u:al:5b:' || nombre)
from (values
 ('gol','Valentina'),('gol','Tomás'),('gol','Camila'),('gol','Lucas'),
 ('crack','Santi'),('crack','Bruno'),('crack','Mateo'),('crack','Sofía'),('crack','Felipe'),
 ('arq','Juan'),('arq','Catalina'),('arq','Emma'),
 ('frac','Pilar'),('frac','Ciro'),('frac','Gael'),('frac','Delfina'),('frac','Ignacio'),('frac','Olivia')
) v(g, nombre);

-- ─── Observaciones (hipótesis) de los 7 alumnos que el docente debe revisar ─
insert into public.senales_alumno (escuela_id, alumno_id, descripcion, estado)
select seedtmp.id('esc'), seedtmp.id('u:al:' || curso || ':' || nombre), d, 'hipotesis'
from (values
 ('5b','Santi',   'Usó 3 pistas seguidas en "Perímetro vs. área" (ayer).'),
 ('5b','Bruno',   'No entró a ninguna misión en 5 días.'),
 ('6a','Ailén',   'Dejó incompleta dos veces la misión de fracciones.'),
 ('3a','Lara',    'Cambió 4 veces su respuesta en Movimiento.'),
 ('3a','Joaquín', 'Sin actividad en el proyecto esta semana.'),
 ('3a','Nicolás', 'Pidió ejemplo parecido 5 veces en Física.'),
 ('3a','Abril',   'Las etapas del proyecto van atrasadas.')
) v(curso, nombre, d);

-- ─── Conversación de ejemplo (Santi) con su resumen ─────────────────────────
insert into public.tutor_sesiones (id, escuela_id, alumno_id, mision_id) values
 (seedtmp.id('s:1'), seedtmp.id('esc'), seedtmp.id('u:al:5b:Santi'), seedtmp.id('m:2')),
 (seedtmp.id('s:2'), seedtmp.id('esc'), seedtmp.id('u:al:5b:Mateo'), seedtmp.id('m:1'));
insert into public.tutor_mensajes (sesion_id, escuela_id, autor, contenido, revision, motivo_revision, created_at) values
 (seedtmp.id('s:1'), seedtmp.id('esc'), 'tutor',  '¿Te acordás cuánto medía el travesaño del arco que medimos?', 'aprobado', null, now() - interval '30 minutes'),
 (seedtmp.id('s:1'), seedtmp.id('esc'), 'alumno', 'Sí, medía como 7 pasos míos de largo y 2 de alto.', null, null, now() - interval '29 minutes'),
 (seedtmp.id('s:1'), seedtmp.id('esc'), 'tutor',  'Bien observado. Si quisiéramos cubrir esa entrada con una red, ¿cómo calcularías el espacio que ocupa?', 'aprobado', null, now() - interval '28 minutes'),
 (seedtmp.id('s:1'), seedtmp.id('esc'), 'alumno', 'Multiplico el largo por el alto.', null, null, now() - interval '27 minutes'),
 (seedtmp.id('s:2'), seedtmp.id('esc'), 'tutor',  'Si el delantero mete 2 de cada 3 penales, ¿cómo podemos pensar cuántos goles haría con 6?', 'ajustado', 'Se reformuló para no dar el resultado.', now() - interval '2 hours');
insert into public.tutor_resumenes (sesion_id, escuela_id, alumno_id, resumen) values
 (seedtmp.id('s:1'), seedtmp.id('esc'), seedtmp.id('u:al:5b:Santi'),
  'Midió el arco con pasos y propuso multiplicar largo por alto para calcular la superficie. Resumen generado por IA; puede tener errores.');

-- ─── Verificación rápida: si no cierran los números de la maqueta, falla el reset ──
select count(*) into n_al from public.inscripciones;
select count(*) into n_se from public.senales_alumno;
select count(*) into n_pe from public.consentimientos where estado = 'pendiente';
select count(*) into n_co from public.proyecto_contenidos;
if n_al <> 64 or n_se <> 7 or n_pe <> 9 or n_co <> 9 then
  raise exception 'Seed inconsistente: alumnos=%, señales=%, pendientes=%, contenidos=%', n_al, n_se, n_pe, n_co;
end if;

drop schema seedtmp cascade;

end
$seed$;
