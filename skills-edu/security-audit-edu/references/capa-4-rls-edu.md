# Capa 4 — RLS, aislamiento por escuela y por rol

Leer al llegar a la capa 4 de la auditoría.

## 1. Controles estructurales (SQL)

```sql
-- Tablas de public sin RLS (debe devolver 0 filas)
select tablename from pg_tables
where schemaname = 'public' and not rowsecurity;

-- Tablas con RLS activado pero sin ninguna política (acceso total denegado:
-- confirmar que es intencional)
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policies p
                  where p.schemaname = 'public' and p.tablename = c.relname);

-- Funciones security definer sin search_path fijo (debe devolver 0 filas)
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) c where c like 'search_path=%'));

-- Políticas permisivas sospechosas (using true, o sin mención de usuario)
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual = 'true' or with_check = 'true');

-- Grants a anon (debe devolver 0 filas en tablas de alumnos)
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon';
```

## 2. Patrones problemáticos

| Patrón | Por qué es un problema |
|--------|------------------------|
| `using (true)` o `auth.uid() is not null` en tablas de alumnos | Cualquier usuario autenticado, incluido un alumno de otra escuela, lee todo |
| Tabla con datos de alumnos sin `escuela_id` ni join a un curso | No se puede aislar por escuela |
| `membresias` o `perfiles` editables por el propio usuario | Escalada de rol |
| `security definer` sin `search_path` | Secuestro de funciones |
| Vista sin `security_invoker` sobre tablas con RLS | La vista ignora las políticas |
| Insert del cliente en `tutor_mensajes`, `senales_alumno`, `consentimientos`, `codigos_clase` | El alumno podría falsear su historial o consentimiento |
| Storage público o sin políticas | Planificaciones y archivos expuestos |
| `service_role` en el cliente o en `VITE_*` | Salta toda la RLS |
| Una política de update sin `with check` | Permite mover filas a otra escuela |

## 3. Intrusión manual (antes de cada piloto)

Con el token de cada rol (alumno, docente, familia, directivo, y uno de otra
escuela), consultar la API REST e intentar:
1. Leer tablas ajenas: `senales_alumno`, `tutor_mensajes`, `grupos_internos`,
   `consentimientos`, `membresias`.
2. Insertar o actualizar cambiando `escuela_id`, `alumno_id` o `rol`.
3. Leer archivos de Storage de otra escuela.
Todo debe fallar o devolver vacío. Documentar el resultado en el reporte.

## 4. Tests automáticos

Debe existir un set de pgTAP y de tests de API por rol (ver
`supabase-educacion-multiescuela/references/tests-rls.md`) corriendo en CI.
Marcar ❌ si no existe o no cubre la matriz completa.
