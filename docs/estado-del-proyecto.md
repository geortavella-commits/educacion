# Estado del proyecto — 2026-10-14

Para retomar rápido. Todo lo de abajo está verificado (no supuesto).

## Qué funciona hoy

**Base de datos (Supabase local, `supabase start`)**
- 8 migraciones: tablas, seguridad por fila (RLS), ingreso de primaria, invitaciones de familia, el alumno ve su consentimiento, resumen de hijo para la familia, **grupos por proyecto + devoluciones cualitativas** (la base exige que el grupo cuelgue de un proyecto de su curso y que sus miembros estén inscriptos en ese curso), **acceso nuevo de alumnos** (`accesos_alumno`) y cierre del reclamo de ingreso (`solicitudes_ingreso.reclamada_en`).
- Seed ficticio de Córdoba: 64 alumnos, 3 cursos, 3 proyectos, observaciones y consentimientos pendientes (`supabase/seed.sql`). Contraseña de las cuentas de prueba: `educacion123`.
- **88 pruebas de seguridad (pgTAP)**: `supabase test db`.

**Funciones del servidor (`supabase/functions/`, se levantan con `supabase functions serve`)**
| Función | Quién la usa | Qué hace |
|---|---|---|
| `completar-mision` | alumno | registra avance (exige inscripción, proyecto activo y consentimiento otorgado) |
| `consentimiento` | familia | otorga/revoca el consentimiento de su hijo/a |
| `canjear-codigo` | alumno de primaria (anónimo) | canjea el código de clase → solicitud pendiente |
| `aprobar-ingreso` | docente | aprueba/rechaza; al aprobar crea la cuenta del alumno |
| `reclamar-ingreso` | dispositivo del alumno | obtiene sesión sin contraseña (enlace de un solo uso) |
| `invitar-familia` | docente | genera el código de invitación para la familia de un alumno |
| `canjear-invitacion` | familia | crea su cuenta (o se vincula desde la suya) y deja el consentimiento pendiente |
| `generar-acceso` | docente del curso **o** familia vinculada | código de 8 caracteres, un solo uso, vence a los 15 min, para que un alumno recupere su sesión en otro dispositivo |
| `canjear-acceso` | alumno (anónimo) | canjea ese código y abre sesión como el MISMO usuario (sin contraseña); marca el código como usado antes de generar el enlace |
| `generar-codigo-clase` | docente del curso | código de clase de 6 caracteres (vence a los 30 días; anula el anterior). Se muestra una sola vez |

**Front (Vite + React + TS + Tailwind, `npm run dev`) — ahora conectado a la base real**
- Con `VITE_USAR_SUPABASE=true` (`.env.local`) las pantallas leen y escriben en Supabase con login real. En producción siempre es real; los datos de ejemplo y las cuentas simuladas solo existen en desarrollo y no viajan en el build (verificado: el bundle no contiene `educacion123`, `ficticio.test` ni datos mock).
- Roles probados en Chrome real y en la base: docente (corrige hipótesis, aprueba grupo, aprueba ingresos, invita familia, crea grupo y proyecto), alumno (completa misión; sin permiso familiar ve "falta el permiso"), familia (resumen del hijo, autoriza/retira consentimiento, crea cuenta con invitación), directivo.
- Pantallas nuevas: `/docente/ingresos`, `/docente/consentimientos`, `/docente/grupos/nuevo`, `/docente/proyectos/nuevo`, `/familia` (resumen real), `/familia/consentimiento`, `/familia/invitacion` (pública), `/restablecer` (pública).
- Recuperación de contraseña verificada con el mail real de Mailpit: clave nueva entra, la vieja se rechaza, el enlace no se reutiliza.

**Pruebas automáticas (todas pasan al 2026-10-12)**
- `npx tsc --noEmit`, `npm run lint` (0 errores, 7 advertencias de hooks), `npx vitest run` (19), `supabase test db` (62), `npm run build`.
- `npm run test:e2e`: 34 pruebas con sesión real (docente, alumno, familia, directivo, ingreso por código, vínculo de familia, seguridad de configuración). Modifica la base: después correr `supabase db reset`. Requiere `supabase start` + `supabase functions serve`.

## Cómo entra un alumno de primaria (y cómo vuelve a entrar)
1. **Primera vez:** escribe el código de clase en `/alumno/ingreso` → queda un pedido pendiente (sin cuenta) → la docente lo aprueba en "Pedidos de ingreso" → el dispositivo recibe su sesión **una sola vez** (el servidor marca el reclamo). Si hay otro alumno o pedido con el mismo nombre en el curso, el pedido muestra un cartel para que la docente decida si es la misma persona.
2. **Mismo dispositivo, otro día:** la sesión se renueva sola (no hace falta nada).
3. **Otro dispositivo, datos borrados o sesión cerrada:** la docente ("Alumnos › Dar nuevo acceso") **o la familia** (`/familia › Acceso en otro dispositivo`) generan un código; el chico lo escribe en `/alumno/acceso` ("Ya tengo cuenta") y vuelve a su mismo perfil. Un solo uso, 15 minutos.
No se cierran las sesiones de otros dispositivos al dar un acceso nuevo (decisión pendiente: hoy no hay forma de revocarlas desde las funciones).

## Navegación del docente (modelo: el curso tiene a todos sus alumnos; el proyecto abarca a todo el curso; los grupos son opcionales y viven dentro de un proyecto)

| Pantalla | Ruta | Qué se hace ahí |
|---|---|---|
| Inicio (panel) | `/docente` | Ve sus proyectos y sus grupos con el avance de cada uno, alumnos que necesitan apoyo y el proyecto en foco. Atajos: Nuevo grupo, Crear proyecto. |
| Alumnos | `/docente/alumnos` | Todos los alumnos de sus cursos, con filtro por curso y búsqueda; avance de cada uno; entra al perfil, le deja un mensaje o le da un acceso nuevo. Arriba: aviso de pedidos pendientes y el código de clase (generar uno nuevo; se muestra una sola vez). |
| Perfil del alumno | `/docente/alumnos/:id` | Avance por materia, hipótesis de la app (con "Corregir"), actividad, **mensajes para el alumno** (logro, motivación o sugerencia; sin notas) y conversaciones con Chasqui. |
| Grupos | `/docente/grupos` | Pestañas Aprobados / En borrador, botón Nuevo grupo. |
| Nuevo grupo | `/docente/grupos/nuevo` | Elige el proyecto, nombre, etiqueta interna y alumnos (o "todo el curso"). Nace en borrador. **Sugerencias para armar grupos** (sin IA, calculadas en el navegador): por intereses en común, grupos variados o ritmo de avance parecido en el proyecto; "Usar este grupo" completa el formulario y "Crear los N como borrador" los crea todos. Los nombres que ven los chicos son neutros ("Equipo A", "Equipo Fútbol"); el ritmo solo lo ve la docente. |
| Grupo | `/docente/grupos/:id` | Alumnos con su avance, agregar y quitar alumnos, editar, aprobar o deshacer, ir al proyecto y dejar mensajes. |
| Proyectos | `/docente/proyectos` | Lista con avance, estado, grupos y misiones. |
| Proyecto | `/docente/proyectos/:id` | Editar, publicar, agregar misiones, ver avance por misión, sus grupos y la cobertura curricular. |
| Pedidos de ingreso / Familias y consentimientos | `/docente/ingresos`, `/docente/consentimientos` | Aprobar chicos nuevos; invitar a las familias. |

Todas llevan camino de migas ("Inicio › Grupos › Equipo X"). Los números del menú son avisos que piden una acción: grupos en borrador por aprobar y pedidos de ingreso pendientes.

**Eliminar:** la docente puede eliminar grupos (se borra el grupo y su lista, no los alumnos) y proyectos que creó (se borran sus misiones, el avance y sus grupos), siempre con confirmación. Si algún alumno ya conversó con el tutor sobre las misiones del proyecto, la base **impide borrarlo** y la pantalla indica archivarlo (Editar › Estado › Archivado): así no se pierden registros de menores.

**Evaluar:** la app no califica. La docente acompaña con mensajes cualitativos (el alumno los ve en su inicio; la familia todavía no). La evaluación oficial sigue siendo suya, fuera de la app.

## Qué NO se probó todavía
- Responsivo a 768 px y las pantallas de familia/directivo/alumno nuevas (`/familia`, `/familia/consentimiento`, `/familia/invitacion`, `/restablecer`, `/docente/ingresos`, `/docente/consentimientos`): sin auditar. Las pantallas de docente nuevas se midieron a 360 y 1280 px (sin desborde, textos ≥12 px, botones ≥44 px) y Lighthouse de accesibilidad dio 100.
- Mensajes de la docente para la familia (hoy solo los lee el alumno) y exportar planificación (se sacó el botón de ejemplo).
- Con los datos de ejemplo (sin base) las pantallas de grupos, proyectos con avance, alumnos y mensajes no funcionan: requieren `VITE_USAR_SUPABASE=true`.

## Qué NO está hecho
1. **Pantallas**: cargar/exportar planificación (5a/5b), misión y proyecto del alumno, directivo (4a/4b) con función de agregados, secundaria (2c/2d/6c/7).
2. **Tutor con IA real** + revisor (hoy es un guion). Proveedor de IA/voz sin elegir.
3. **Legales/de producto**: texto de consentimiento con asesoría legal (Ley 25.326; hoy dice "[proveedor a definir]"), retención y borrado, protocolo ante señales de riesgo, validación humana del currículo de Córdoba.
4. **Técnicos**: proyecto de Supabase en la nube (dev/staging) + Vercel; alta de docentes por el directivo; rotar claves viejas que estuvieron en OneDrive; un login/prueba intermitente tras reiniciar la base (sin causa conocida).
5. **Limpieza del seed**: solo hay contenidos curriculares para 5.º año (el formulario de proyecto de 6.º A muestra "no hay contenidos"); 2 solicitudes pendientes sin token ("Nuevo compañero", "Otro alumno") sobran; la explicación de grupos sugeridos es genérica; la hipótesis de Bruno contradice su progreso.

## Cómo trabajamos
- Gemini hizo el front con el ciclo `docs/handoff/HANDOFF.md` (reglas en `.agents/rules/handoff-claude.md`, workflow `/ronda`). Claude revisa en Chrome real y devuelve correcciones; máximo 3 rondas por tarea. Revisar que la Rule `.agents/rules/handoff-claude.md` no haya vuelto a contener el documento entero.
- Reglas fijas del producto: `docs/prompts-gemini/00-contexto.md` (12 reglas). Guía para probar a mano: `docs/guia-de-prueba.md`.
- Claude es dueño de todo lo de Supabase, seguridad y funciones del servidor.
