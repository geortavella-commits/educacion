# Tests de RLS por rol

Leer este archivo al escribir o revisar tests, o antes de cada piloto.
Todos los datos de prueba son **ficticios**. Nunca usar datos reales de alumnos.

## Datos de prueba mínimos (seed de test)

- 2 escuelas: `escuela_a`, `escuela_b`
- En `escuela_a`: 2 cursos (`curso_a1`, `curso_a2`), cada uno con su docente
  (`docente_a1`, `docente_a2`), 2 alumnos por curso, 1 familia vinculada a un
  alumno de `curso_a1`, 1 directivo
- En `escuela_b`: 1 curso, 1 docente, 1 alumno
- 1 proyecto por curso, con misiones, señales y una sesión de tutor por alumno

## Matriz: qué debe pasar

| Quién intenta | Qué | Resultado esperado |
|---------------|-----|--------------------|
| Alumno de `curso_a1` | Leer perfil, progreso o mensajes de otro alumno | 0 filas |
| Alumno | Leer `senales_alumno` sobre sí mismo | 0 filas |
| Alumno | Leer `grupos_internos` | 0 filas |
| Alumno | Insertar o editar `tutor_mensajes`, `senales_alumno`, `consentimientos` | Error |
| Alumno | Editar su propia `membresias` o cambiar su rol | Error |
| Docente `a1` | Leer alumnos, señales y proyectos de `curso_a1` | Filas |
| Docente `a1` | Leer alumnos o señales de `curso_a2` | 0 filas |
| Docente `a1` | Leer cualquier dato de `escuela_b` | 0 filas |
| Docente | Corregir una señal de su alumno | Permitido |
| Familia | Leer a su hijo/a | Filas (resumen) |
| Familia | Leer a otro alumno del mismo curso | 0 filas |
| Directivo `a` | Leer agregados de `escuela_a` | Filas |
| Directivo `a` | Leer datos de `escuela_b` | 0 filas |
| Anónimo (sin sesión) | Leer cualquier tabla | Error o 0 filas |
| Cualquier rol | Usar `service_role` desde el cliente | No debe existir esa key en el bundle |

## Control estructural (correr siempre)

```sql
-- Debe devolver 0 filas
select tablename from pg_tables
where schemaname = 'public' and not rowsecurity;

-- Funciones security definer sin search_path fijo (debe devolver 0 filas)
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) c where c like 'search_path=%'));
```

## Esqueleto pgTAP (supabase/tests/)

```sql
begin;
select plan(3);

-- Simular a un usuario autenticado (reemplazar por el UUID de seed)
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

-- Un alumno no puede leer las señales sobre sí mismo
select is_empty(
  $$ select 1 from public.senales_alumno $$,
  'el alumno no ve señales'
);

-- Un alumno no puede insertar mensajes del tutor
select throws_ok(
  $$ insert into public.tutor_mensajes (sesion_id, escuela_id, autor, contenido, revision)
     values (gen_random_uuid(), gen_random_uuid(), 'tutor', 'x', 'aprobado') $$,
  null,
  'el cliente no puede escribir mensajes del tutor'
);

-- Un alumno no puede cambiar su rol
select throws_ok(
  $$ update public.membresias set rol = 'docente' $$,
  null,
  'no se puede escalar el rol'
);

select * from finish();
rollback;
```

Notas:
- `throws_ok` con `null` acepta cualquier error. Un `update` sin filas visibles
  **no** lanza error: en ese caso verificar con `is_empty` o con el conteo de
  filas afectadas. Ajustar cada caso a su comportamiento real.
- Verificar la sintaxis de pgTAP y de `set_config` contra la versión de
  Supabase que se use; este esqueleto es una guía, no un test ejecutado.
- Correr con `supabase test db` y en CI antes de cada merge.

## Test de intrusión manual antes del piloto

1. Iniciar sesión como alumno y abrir las herramientas del navegador.
2. Con el token del alumno, intentar consultar por la API REST tablas ajenas
   (`senales_alumno`, `tutor_mensajes` de otro alumno, `grupos_internos`).
3. Probar cambiar `escuela_id` o `alumno_id` en un insert propio.
4. Repetir con docente de otra escuela.
Todo debe fallar o devolver vacío.
