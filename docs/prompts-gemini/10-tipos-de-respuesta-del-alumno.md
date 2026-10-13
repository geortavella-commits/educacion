# Prompt 10 — Cada tipo de respuesta, con su propia identidad visual

Adjuntar: nada. Sigue sobre la pantalla de misión (Tarea 8) y la estética del alumno (Tarea 9). No cambia datos, rutas ni lógica: solo cómo se ve y se siente cada tipo de respuesta.
Contexto de producto: hoy las cuatro formas de responder (número, texto corto, elegir una opción, contar lo que pensaste) se ven casi iguales. Queremos que el chico **reconozca de un vistazo qué le piden** y que cada tipo tenga su propia personalidad, igual que cada tipo de ejercicio en las apps de aprendizaje que le gustan.

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 10. Protocolo normal: informe honesto y ESTADO: LISTO_PARA_REVISION.
Releé docs/prompts-gemini/00-contexto.md y docs/diseno/alumno-tactile-gamified.md.

NO TOCAR: src/services/**, supabase/**, src/lib/supabase.ts, .env*, ni nada del docente/directivo/familia. Los tipos vienen de `MisionParaResolver.tipo`: 'numero' | 'texto' | 'opcion' | 'abierta'.

IDENTIDAD DE CADA TIPO (misma estructura de pantalla; cambia el "tablero" de respuesta, el color de acento, el ícono y la microcopia)
  Cada tipo lleva: (1) una ETIQUETA con ícono y texto en el encabezado de la misión, (2) un color de acento propio para el borde del tablero, el foco y el botón "Comprobar", (3) un tablero de respuesta con forma distinta, (4) un texto de ayuda propio.

  NÚMERO — "Calculadora"  · acento AZUL (#1CB0F6; texto oscuro #00263A)
    - Etiqueta: ícono calculadora/hash + "Respondé con un número".
    - Tablero: un visor grande tipo pantalla de calculadora (fuente tabular, dígitos de 32–40 px, alineados a la derecha, fondo azul muy claro #DDF4FF, borde de 2 px azul). inputMode="decimal" (NO type=number).
    - Debajo, ayuda "Podés escribir 3,5 o 7/2". Opcional: un teclado numérico táctil plegable (0–9, coma, barra, borrar) que SOLO escribe en el visor (no es obligatorio; el teclado del dispositivo también funciona).
    - Formato inválido: el visor se marca con ícono + texto "Escribí un número, por ejemplo 3,5" (nunca solo color).

  TEXTO CORTO — "Globo de respuesta"  · acento NARANJA/ÁMBAR (borde #FF9600, fondo #FFF2D6, texto #4A2800)
    - Etiqueta: ícono globo de diálogo + "Escribí tu respuesta corta".
    - Tablero: una sola línea dentro de una burbuja de diálogo (esquina del habla cerrada hacia la mascota Chasqui), con contador suave de caracteres ("12/60", sin presión).
    - Ayuda: "Una palabra o una frase corta. No importan las mayúsculas ni los acentos."

  OPCIÓN MÚLTIPLE — "Tarjetas con letra"  · acento VERDE (borde #58CC02, seleccionada con fondo #E5F8CF y check)
    - Etiqueta: ícono lista/check + "Elegí una opción".
    - Tablero: cada opción es una tarjeta grande con una letra A, B, C… en una ficha a la izquierda (la letra también se lee por lector de pantalla: "Opción A: …"), toda la tarjeta clickeable, ≥56 px de alto; seleccionada = ficha verde con check, borde verde y sombra de apoyo. role="radiogroup" y navegación con flechas.
    - Ayuda: "Tocá la que te parezca".

  ENTREGA LIBRE — "Cuaderno"  · acento VIOLETA SUAVE (borde #8B7CF6, fondo #F1EFFF, texto #2B1F6B; verificá contraste ≥ 4,5:1)
    - Etiqueta: ícono lápiz/cuaderno + "Contá lo que pensaste".
    - Tablero: un textarea con aspecto de hoja de cuaderno (renglones suaves de fondo, margen a la izquierda), alto cómodo (≥ 160 px) que crece al escribir, botón "Entregar".
    - Ayuda: "Escribí con tus palabras. Tu seño lo va a leer." (No se corrige solo: no hay "correcto/incorrecto".)

  COMÚN A LOS CUATRO
    - El enunciado queda igual (protagonista, grande). La etiqueta del tipo va arriba del tablero, no reemplaza al título.
    - La mascota Chasqui acompaña con una expresión distinta por tipo (pensando con calculadora, charlando con globo, eligiendo, escribiendo) y queda quieta con prefers-reduced-motion.
    - El feedback (franja ámbar "Todavía no", modal de éxito) NO cambia por tipo: mismo lenguaje en los cuatro. El acento del tipo solo se usa en el tablero, la etiqueta, el foco y el botón principal.
    - Un solo lugar para esto: un componente `TableroRespuesta` (o similar) que recibe `tipo` y renderiza el tablero, para no repetir código en MisionPage.

  INICIO DEL ALUMNO (/alumno)
    - En cada tarjeta de misión, el chip del tipo usa el mismo ícono y el mismo acento (azul número, ámbar texto, verde opción, violeta entrega). Siempre con texto ("Número", "Texto corto", "Elegí una opción", "Contá lo que pensaste"): el color solo acompaña.

REGLAS (las de siempre, más estas)
  - Contraste: todo texto ≥ 4,5:1 sobre su fondo; los acentos de borde/ícono ≥ 3:1 contra el fondo. Medilo con Lighthouse, no a ojo. Los acentos de arriba son un punto de partida: si alguno no pasa, oscurecé el texto o el borde y avisalo en el informe.
  - Nada de rojo en el feedback ni para estados; sin puntos, XP, vidas, rankings ni cuentas regresivas de presión.
  - Textos ≥ 12 px (≥ 16 px el enunciado y las respuestas), zonas táctiles ≥ 48 px en primaria, sin overflow horizontal a 360/390/768/1280.
  - Todo respeta prefers-reduced-motion. Sin librerías nuevas. Textos en español rioplatense (vos).
  - Modo secundaria: misma lógica, más sobria (sin mascota grande, iconos más chicos).

CRITERIOS DE ACEPTACIÓN (los voy a verificar en Chrome con una misión de cada tipo)
  a. Las cuatro misiones se distinguen a primera vista (tablero, color, ícono y etiqueta distintos) y cada etiqueta lleva texto.
  b. Número: visor tipo calculadora; "3,5", "7/2" y "3.5" se aceptan; "abc" muestra el aviso con ícono + texto. Texto corto: burbuja con contador. Opción: tarjetas con letra, elegibles por teclado. Entrega libre: hoja de cuaderno.
  c. El feedback y el modal de éxito son idénticos en los cuatro tipos.
  d. Lighthouse accesibilidad 100 en una misión de cada tipo (con y sin modal) y en /alumno.
  e. Ningún texto < 12 px, ninguna zona táctil < 48 px, sin overflow, consola limpia; build y typecheck en 0.
  f. ANTES de informar: abrí cada tipo en el navegador (al menos una vez) y reportá lo medido, no lo calculado.
```
