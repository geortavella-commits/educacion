---
name: supabase-educacion-multiescuela
description: >
  Usar cuando se va a crear, modificar o depurar la base de datos de la
  plataforma educativa: schema, migraciones, roles (alumno, docente, familia,
  directivo), políticas RLS, helpers de seguridad, tablas de cursos, grupos,
  proyectos, currículo, perfil del alumno o tutor. También aplica cuando el
  usuario pregunta "¿quién puede ver esto?", "cómo estructuro usuarios o
  permisos", "por qué un docente ve datos de otra escuela", o antes de aplicar
  cualquier migración — incluso si no menciona RLS. Modelo: UNA sola base con
  la escuela como unidad de aislamiento (escuela_id). NO usar el patrón de
  supabase-comercio-multilocal (una base por cliente) en este proyecto.
  También cubre los DOS ENTORNOS (local y nube): cómo apuntar el front a cada
  uno, cómo llevar migraciones y funciones a la nube, y qué secretos van dónde.
---

# Skill: Base de datos multi-escuela — Supabase

## Cuándo usar esta skill

Cualquier cambio de schema, políticas o roles en la base de la plataforma
educativa. Hay menores de por medio: el criterio es **denegar por defecto**
y habilitar por rol, nunca al revés.

## Modelo

- Una sola base de datos para todas las escuelas.
- La escuela es la unidad de aislamiento: toda tabla con datos de alumnos
  lleva `escuela_id` (o se alcanza por un join directo a un curso).
- Roles por membresía (`membresias`: usuario + escuela + rol), no un rol global.
  Un mismo usuario puede ser docente en una escuela y familia en otra.
- Los datos personales se reducen al mínimo: `nombre_visible` y avatar. Sin
  apellido ni email para alumnos de primaria.

El schema completo (26 tablas, helpers, RLS de ejemplo, índices) está en
`references/schema.sql`. Los tests y la matriz de acceso están en
`references/tests-rls.md`. Leer cada archivo solo cuando la tarea lo requiere.

## Entornos: local y nube

Hay DOS bases y nunca se mezclan. La nube es una copia del local (esquema + datos
del 13/10/2026); desde ahí cada una evoluciona sola.

| | Local | Nube |
|---|---|---|
| Qué es | Supabase en Docker (`supabase start`) | Proyecto `educacion`, ref `bhzfxwveiqenskwqxlug`, Oregon |
| API | `http://127.0.0.1:54321` | `https://bhzfxwveiqenskwqxlug.supabase.co` |
| Base | puerto 54322, Studio 54323 | panel de Supabase |
| Front toma | `.env.local` (`npm run dev`) | `.env.production` (`npm run build`) |
| Funciones | `scripts/serve-funciones.ps1` (lee `C:\Users\dario\.chasqui\ia.env`) | desplegadas en la nube, con **Secrets** del panel |
| Para qué | desarrollo y pruebas destructivas | piloto / lo que ven otras personas |

**Qué entorno usa el front:** Vite pisa `.env.local` con el archivo del modo.
`npm run build` (modo `production`) usa `.env.production` → nube. `npm run dev`
usa `.env.local` → local. Para probar la nube sin editar nada:
`npm run dev -- --mode production`. Comprobación rápida: en la pestaña Network
las URL empiezan con `127.0.0.1:54321` (local) o `bhzfxwveiqenskwqxlug.supabase.co` (nube).

**Llevar cambios a la nube (siempre desde el local, ya probado):**
1. Migración nueva en `supabase/migrations/` y probarla con `supabase migration up`
   + `supabase test db`.
2. `supabase db push --linked --dry-run` para ver qué aplicaría; después sin `--dry-run`.
3. Funciones: `supabase functions deploy --project-ref bhzfxwveiqenskwqxlug --use-api`
   (respeta `verify_jwt` de `config.toml`; las 4 públicas son `canjear-codigo`,
   `reclamar-ingreso`, `canjear-invitacion`, `canjear-acceso`).
4. Datos: no se sincronizan. Si hace falta copiar, exportar con `pg_dump --data-only
   --column-inserts`, trocear (~180 KB) y cargar con `supabase db query --linked -f`,
   con `set session_replication_role = replica;` al principio de cada parte. Verificar
   conteos tabla por tabla contra el local.

**Vinculación:** el proyecto está linkeado (`supabase/.temp/project-ref`) y el historial
de migraciones está alineado (19 aplicadas). Si el CLI queda logueado en otra cuenta,
`supabase login --token <token>` de la cuenta dueña del proyecto.

**Secretos (los carga la persona, nunca el asistente ni el repo):**
- Nube: panel › Edge Functions › Secrets: `OPENAI_API_KEY`, `OPENAI_MODEL`
  (`gpt-4o-mini`), `IA_MAX_POR_DIA` (30). `SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY`
  los inyecta Supabase.
- Local: `C:\Users\dario\.chasqui\ia.env` (fuera de OneDrive).
- `.env.production` y `.env.local` solo llevan valores PÚBLICOS (URL y clave
  publicable). Jamás `service_role` ni la clave de OpenAI con prefijo `VITE_`.

**Configuración que solo se hace en el panel** (el MCP/CLI no la cambia): Site URL y
Redirect URLs, registro abierto apagado, protección de contraseñas filtradas, SMTP propio.

**Pendientes de seguridad antes de datos reales:** las 17 cuentas ficticias
(`@ficticio.test`, contraseña `educacion123`) están copiadas en la nube y son públicas
por la portada → borrarlas o cambiarles la contraseña.

**Regla:** nunca editar a mano la base de la nube; todo cambio de esquema entra por
migración versionada. Las migraciones que crean funciones `SECURITY DEFINER` después de la
2 deben hacer `revoke execute ... from public, anon` explícito (los privilegios por
defecto de Supabase se las dan a `anon`; la migración 19 corrigió siete).

## Matriz de acceso (resumen)

| Rol | Ve | Modifica |
|-----|----|----------|
| Alumno | Su perfil, misiones, equipo, proyectos y sus propios mensajes del tutor | Su progreso y su conversación, vía Edge Function |
| Docente | Alumnos de sus cursos, proyectos, señales como hipótesis | Grupos, proyectos, corrección de señales |
| Familia | Solo a su hijo/a, en formato resumen | Consentimientos |
| Directivo | Su escuela: agregados, consentimientos pendientes, cobertura | Altas de docentes y cursos |
| Soporte | Nada de alumnos por defecto | Acceso excepcional, con registro en `audit_log` |

## Flujo de trabajo

1. Preguntar: ¿schema nuevo, modificación o debugging de políticas?
2. Leer `references/schema.sql` y trabajar siempre **como migración
   versionada** (`supabase/migrations/`). Nunca cambios directos en producción.
3. Para toda tabla nueva con datos de alumnos:
   - agregar `escuela_id` y su índice
   - activar RLS
   - escribir políticas por rol (select, insert, update, delete por separado)
   - decidir si el cliente puede escribir o solo una Edge Function
   - agregar el caso al set de tests de `references/tests-rls.md`
4. Correr los tests de RLS antes de dar el cambio por terminado.
5. Al final, ofrecer: "¿Corro la auditoría de seguridad (`security-audit-edu`)?"

## Reglas que nunca se omiten

- Toda tabla de `public` tiene RLS activado. Una tabla sin RLS es un bloqueante.
- Sin política, no hay acceso: no crear políticas "abiertas" (`using (true)`)
  para "que funcione".
- No dar a `anon` acceso a ninguna tabla (`revoke all ... from anon`).
- Funciones `SECURITY DEFINER`: siempre con `set search_path = ''`, nombres
  calificados (`public.tabla`) y justificación en un comentario. Usar
  `(select auth.uid())` dentro de las políticas.
- Las vistas que lean datos de alumnos usan `security_invoker = true`.
- Escrituras sensibles solo vía Edge Function con `service_role`:
  `tutor_mensajes`, `senales_alumno` (al crearse), `consentimientos`,
  `codigos_clase`, `solicitudes_ingreso`, `progreso_misiones`.
- Nada del cliente puede modificar `membresias`, roles ni `escuela_id`.
- La etiqueta interna de un grupo vive en `grupos_internos` (solo docente).
  Nunca poner en una tabla visible para alumnos información que los clasifique.
- `service_role` jamás en el cliente ni en variables `VITE_*`.
- Las señales sobre el alumno nacen como `hipotesis`; solo el docente las
  confirma, corrige o descarta. No hay columnas de diagnóstico.
- Storage: bucket privado por defecto, ruta con `escuela_id/` y políticas
  sobre `storage.objects` equivalentes a las de las tablas.

## Señales de alerta — detener y consultar

- Pedido de deshabilitar RLS o de usar `SECURITY DEFINER` sin justificación
- Una política que no menciona escuela, curso o usuario
- Un alumno que puede leer filas de otro alumno
- Datos reales de alumnos en staging o en un seed
- Cambios directos en la base de producción

## Checklist final

- [ ] Query de control: `select tablename from pg_tables where schemaname='public' and not rowsecurity;` devuelve 0 filas
- [ ] Cada tabla con datos de alumnos tiene `escuela_id` o join directo a un curso
- [ ] Helpers con `search_path` fijo
- [ ] Índices sobre las columnas usadas en políticas
- [ ] Tests de RLS por rol pasan (alumno, docente, familia, directivo, entre escuelas)
- [ ] El cliente no puede insertar en las tablas de escritura sensible
- [ ] Migración versionada y probada en un Supabase local (`supabase start`)
