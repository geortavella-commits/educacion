# Prompt 9 — Nueva estética del alumno ("Tactile Gamified Learning")

Adjuntar: `docs/diseno/alumno-tactile-gamified.md` (sistema de diseño de Google Stitch: colores, tipografía, botones 3D, chips, tarjetas).
Ya tenés la pantalla de misión (Tarea 8). Esto es SOLO un cambio visual del alumno: no cambia datos, rutas ni lógica.

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 9. Protocolo normal: informe honesto y ESTADO: LISTO_PARA_REVISION.
Releé docs/prompts-gemini/00-contexto.md. Leé docs/diseno/alumno-tactile-gamified.md completo.

ALCANCE
  - Aplicá la estética a TODO lo del alumno: /alumno (inicio), /alumno/mision/:id y su modal, /alumno/tutor, /alumno/diagnostico, /alumno/ingreso y el acceso por código, el AlumnoLayout (encabezado/navegación).
  - NO cambies docente, directivo, familia ni login: siguen con su estética actual. Por eso los tokens nuevos van ACOTADOS al alumno (p. ej. un contenedor `.tema-alumno` en AlumnoLayout que redefine las variables CSS), sin tocar :root. Verificá que /docente se vea idéntico antes y después.
  - Cargá Nunito Sans (Google Fonts, pesos 600/700/800/900) solo para el alumno.
  - No cambies src/services/**, supabase/**, ni textos funcionales. Sin librerías nuevas.

LO QUE SE ADOPTA DEL ARCHIVO
  - Paleta verde/azul/dorado/naranja, superficies #F7F7F7/#FFFFFF y bordes de 2 px #E5E5E5.
  - Botones 3D: fondo plano, borde inferior de 4 px más oscuro, que se aplasta al presionar (translate-y + borde inferior colapsa). Primario, secundario (azul), outline y destructivo.
  - Tarjetas rounded-2xl/3xl con borde de 2 px y "labio" inferior; chips en cápsula; burbujas de ideas; inputs con borde de 2 px que pasa a azul en foco (sin halo borroso); burbuja del tutor con la esquina del habla más cerrada; modales con scrim y borde sólido inferior.
  - Layout: contenedor central máx. 1080 px en compu; 1 columna en celular con botones de acción pegajosos abajo; zonas táctiles 48–52 px.

CAMBIOS OBLIGATORIOS AL ARCHIVO (chocan con las reglas del producto o con accesibilidad)
  1. CONTRASTE. Texto blanco sobre #58CC02 (≈2,2:1) y sobre #1CB0F6 (≈2,5:1) NO cumple AA. En botones primarios usá texto oscuro (#1E5000, el "on-primary-container" del archivo) sobre el verde, y en secundarios texto #004666 sobre el azul claro, o bien usá los tonos oscuros (#2B6C00 y #006590) como fondo con texto blanco. Todo texto ≥ 4,5:1 (≥ 3:1 solo para texto grande ≥ 24 px o 19 px en negrita). Los bordes/íconos que comunican estado ≥ 3:1. Medilo con una herramienta, no a ojo.
  2. TAMAÑO. Nada de 11 px (label-sm del archivo): mínimo 12 px en todo el producto; en primaria el texto de lectura 16–17 px o más.
  3. PROHIBIDO aunque el archivo lo mencione: VIDAS/corazones, puntos de experiencia (XP), gemas, ligas, rankings, comparaciones con otros chicos, cuentas regresivas con presión, mensajes de culpa. Se permiten "estrellas" y una "racha" simple, SIN pérdida ni castigo (si no vino un día, no se muestra nada negativo). Los chips gamificados del archivo se usan solo para: estrellas, racha simple, avance del proyecto.
  4. ROJO. El rojo cardenal #FF4B4B NO se usa para respuestas incorrectas ni para el alumno en general. "Todavía no" usa el naranja/ámbar suave (#FF9600 en tono claro de fondo + texto oscuro). El rojo queda solo para acciones destructivas de adultos (que no existen en el alumno).
  5. COLOR NUNCA SOLO. Estados (correcto, pendiente, seleccionado, error de formato) siempre con ícono + texto además del color.
  6. MOVIMIENTO. Todas las animaciones y el "hundido" de botones respetan prefers-reduced-motion (sin translate, solo cambio de tono).
  7. La docente NO queda afectada: ningún cambio de tokens globales. Los textos "No son notas" y demás avisos pedagógicos se mantienen.
  8. Modo secundaria: misma estructura, sin mascota grande ni tono infantil (tipografía y chips más sobrios); el modo primaria usa la estética completa.

PANTALLAS A REVISAR (mismos comportamientos que antes, nuevo aspecto)
  - Inicio: saludo + chips (estrellas/racha), tarjeta "Hablá con Chasqui" azul, "Tus pasiones" como chips, bloques por proyecto con barra de avance gruesa y tarjetas de misión con botón "Resolver" 3D.
  - Misión: enunciado grande, opciones como tarjetas con borde de 2 px (seleccionada: fondo #DDF4FF y borde azul + check), botón "Comprobar" 3D pegajoso abajo en celular, franja de "Todavía no" ámbar, modal de éxito con botón 3D "Siguiente misión".
  - Tutor: burbujas del tutor y del alumno, ideas como chips, barra de entrada con botones circulares 3D (micrófono, enviar).
  - Diagnóstico e ingreso por código: opciones y casillas con el mismo lenguaje.

CRITERIOS DE ACEPTACIÓN (los voy a medir en Chrome a 360, 390, 768 y 1280)
  a. /docente, /directivo, /familia y /ingresar se ven igual que antes (comparo capturas).
  b. Lighthouse accesibilidad 100 en /alumno, /alumno/mision/<id> (con modal abierto y cerrado), /alumno/tutor y /alumno/diagnostico; sin fallas de contraste.
  c. Ningún texto < 12 px y ninguna zona táctil < 44 px (48 en primaria) en las pantallas del alumno.
  d. No aparecen corazones/vidas, XP, gemas ni rankings; no hay rojo en feedback al alumno.
  e. Con prefers-reduced-motion los botones no se mueven.
  f. Sin overflow horizontal; consola limpia; build y typecheck en 0.
  g. ANTES de informar: abrí cada pantalla en el navegador (al menos una vez) y reportá lo medido. La Tarea 8 pasó build y typecheck pero crasheaba al cargar.
```
