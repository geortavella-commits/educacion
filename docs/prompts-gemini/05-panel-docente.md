# Prompt 5 — Panel docente

Adjuntar: `docs/maqueta/pantallas/1a.html`, `4c.html`, `3c.html`, `3a.html`, `3b.html`.
(`5a` cargar planificación y `5b` exportar planificación van en el Prompt 6.)

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 5. Al terminar seguí el protocolo: informe honesto en HANDOFF.md y ESTADO: LISTO_PARA_REVISION.

Tarea: replicar cinco pantallas del docente en modo BASE (estilo de la maqueta, no el suave de primaria), dentro del layout actual con NavLateral. Hacelo EN ESTE ORDEN y verificá el build entre pantallas:

A) 1a  Panel de inicio                 → /docente                     src/features/docente/Inicio.tsx
B) 4c  Lista "Necesitan apoyo"         → /docente/apoyo               src/features/docente/Apoyo.tsx
C) 3c  Perfil del alumno               → /docente/alumnos/:id         src/features/docente/PerfilAlumno.tsx
D) 3a  Proyecto: materias, etapas y cobertura curricular
                                        → /docente/proyectos/:id      src/features/docente/Proyecto.tsx
E) 3b  Grupos sugeridos para el proyecto
                                        → /docente/proyectos/:id/grupos  src/features/docente/Grupos.tsx

Los ítems "Inicio", "Grupos" y "Proyectos" de la barra lateral deben llevar a rutas reales (no a anclas #) y marcar activo SOLO el de la ruta actual (aria-current="page"). "Grupos" lista los grupos del curso; "Proyectos" lista los proyectos (una tabla simple con enlace a cada uno).

Datos: src/services/docente.ts con funciones asíncronas tipadas que devuelven mocks (src/mocks/docente.ts). Un solo origen de números para todas las pantallas, coherentes entre sí (ver "Números" abajo). Sin llamadas a ningún modelo ni a Supabase.

Estados de cada pantalla (además del feliz): cargando (esqueleto), vacío, error con "Reintentar", y sin permiso. Un selector de estados de prueba en /sistema/estados, como en las tareas anteriores.

NÚMEROS (mantenelos así en todo el panel)
- Cursos: 5º B (24 alumnos), 6º A (22), 3º año (18, secundaria) → 64 alumnos. "Alumnos activos esta semana: 58 de 64".
- "Necesitan apoyo": 7 en total = 2 (5º B) + 1 (6º A) + 4 (3º año).
- Proyecto "La cancha del barrio" (5º B): Matemática 82 %, Ciencias 56 %, Lengua 31 % de avance de misiones. Cobertura: 9 de 12 contenidos (Matemática 3/4, Ciencias 2/4, Lengua 4/4).
- Proyectos en curso: 3.

A) 1a — PANEL
Saludo "Hola, Laura" (Seño Laura, sin apellido). Botones "Nuevo grupo" y "Crear proyecto". Tres números (activos de la semana, proyectos en curso, necesitan apoyo con enlace "ver lista →" a /docente/apoyo). Tarjeta del proyecto en foco con las 3 barras de "Avance de misiones", la línea "Alineado a: …" y el bloque "Lo que vio el tutor". Lista "Mis grupos · avance de misiones" con 5º B, 6º A, 3º año y un grupo de refuerzo de fracciones (6 alumnos).

B) 4c — NECESITAN APOYO
Lista de los 7 alumnos con: nombre de pila, curso, motivo escrito como OBSERVACIÓN ("Usó 3 pistas seguidas en 'Perímetro vs. área' (ayer)") y los botones "Corregir" y "Ver perfil". Encabezado fijo: "Son hipótesis de la app. Corregilas si no coinciden con lo que ves. Vos decidís qué hacer hoy." Se puede abrir como panel lateral deslizable desde el panel de inicio, pero la ruta /docente/apoyo debe funcionar sola.

C) 3c — PERFIL DEL ALUMNO
Nombre de pila + curso + intereses. "Avance de misiones (no son notas)" por materia. Bloque "Según su actividad reciente": hipótesis con el botón "Corregir" en cada una. Actividad reciente (Hoy / Ayer / Lun). Botones "Agregar a un grupo" y "Enviar nota a la familia" (solo abren un diálogo de ejemplo). Aviso: "Son sugerencias de la app. La calificación la decidís vos."
Agregá un bloque "Conversaciones con Chasqui": lista de sesiones (fecha + misión) y, al abrir una, un diálogo con la conversación COMPLETA (mock, con ChatBubble). Al lado, un botón "Resumen" que muestra un texto corto de ejemplo rotulado "Resumen generado por IA · puede tener errores". (Decisión de producto: el docente ve la conversación completa; el resumen es opcional.)

D) 3a — PROYECTO
Título, botones "Exportar planificación" y "Publicar a 5º B" (solo diálogos de ejemplo, sin exportar nada todavía). Materias como chips y las 4 etapas numeradas con su materia. "Rúbrica en foco": criterio escrito en una frase + los tres niveles descriptivos (En inicio / En proceso / Logrado) como CRITERIOS para el docente. Tablero "Cobertura curricular · 5º grado": 9 de 12, por área, lista de contenidos cubiertos y faltantes con el botón "Agregar actividad".

E) 3b — GRUPOS SUGERIDOS
Tarjetas con: nombre neutro del grupo, cantidad de alumnos (iniciales de avatar), por qué lo sugiere el tutor, "Alumnos ven: <nombre neutro>", "Solo docente: <etiqueta interna>", y botones "Aprobar" y "Editar". Cada grupo nace en BORRADOR; "Aprobar" lo pasa a "Aprobado" (se ve el cambio). "Editar" abre un diálogo para cambiar el nombre visible y la etiqueta interna. Pie fijo: "Nada se arma solo: los grupos quedan en borrador hasta que los aprobes."

CORRECCIONES RESPECTO DE LA MAQUETA (obligatorias)
1. Nombres de alumnos: solo nombre de pila (sin apellido). Docente: "Seño Laura". Escuela ficticia de Córdoba (no Rosario). Sin mails reales.
2. Todo porcentaje se rotula "Avance de misiones", nunca como nota. Sacá las etiquetas "Logrado / En proceso" de la actividad reciente del perfil (3c): en su lugar mostrá hechos ("Usó 1 pista", "Completó la misión").
3. Toda observación sobre un alumno es una HIPÓTESIS: arranca con "Según su actividad reciente…" o es una frase descriptiva de lo que pasó, nunca una etiqueta ("tiene dificultad", "es lento"). Cada una lleva "Corregir". Al tocarlo se abre un diálogo con tres acciones: "Es correcta" (confirmada), "Corregir el texto" (corregida, con campo de texto) y "Descartar" (descartada). El estado se ve en pantalla (confirmada / corregida / descartada).
4. La etiqueta interna de un grupo ("Refuerzo", "Equipo mixto", "Desafío extra") la ve SOLO el docente y nunca aparece en una vista de alumno. El nombre visible para alumnos tiene que ser neutro: al editar, si el nombre contiene palabras como "refuerzo", "nivel", "bajo", "avanzado", "apoyo" o "fácil/difícil", mostrar un aviso "Este nombre puede clasificar a los alumnos. Los alumnos lo van a ver."
5. Los contenidos curriculares (NAP) de la maqueta son EJEMPLOS: rotulá la lista "Contenidos de ejemplo (a validar con el diseño curricular de Córdoba)". No los presentes como oficiales.
6. La rúbrica y la cobertura no generan notas: mantené visible "La evaluación oficial es tuya. La app no califica ni genera notas."
7. "Necesitan apoyo" es una vista SOLO del docente. No uses esa frase en ninguna pantalla de alumno o familia.
8. Íconos de lucide-react (nada de emojis como íconos). Texto de al menos 14 px. Contraste AA con los tokens (--color-accent-strong para texto sobre blanco).
9. Un solo <main> por página. Los gráficos de barras de avance usan role="progressbar" con aria-valuenow y un texto equivalente.

CRITERIO DE ACEPTACIÓN
- Se recorre el panel completo en 360, 390, 768 y 1280 px SIN scroll horizontal y SIN overflow-x-hidden que lo tape. A 1280 px el contenido ocupa todo el ancho junto a la barra lateral (la barra se vuelve menú desplegable en móvil).
- Consola sin errores ni avisos. Lighthouse accesibilidad = 100 en /docente, /docente/apoyo y /docente/alumnos/:id (probalo si podés; si no, escribí "no verificado").
- Los números son los mismos en todas las pantallas.
- npm run build y npm run typecheck pasan.

Al terminar, completá el "Informe de Gemini" en HANDOFF.md: qué hiciste por pantalla, rutas nuevas, salida del build, y qué NO pudiste verificar.
```
