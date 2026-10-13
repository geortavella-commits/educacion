# Prompt 7 — Diseño responsivo para cualquier dispositivo

Adjuntar: nada de la maqueta (la del alumno es solo de celular; acá hay que resolver tablet y compu).
Contexto de producto: en primaria pocos chicos tienen celular propio. El uso real va a ser en el aula (tablet, netbook, PC) y en casa con la familia. **Ningún rol puede quedar limitado a un tipo de dispositivo.**

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 7. Al terminar seguí el protocolo: informe honesto en HANDOFF.md y ESTADO: LISTO_PARA_REVISION.
Releé docs/prompts-gemini/00-contexto.md: se agregó la regla 12 (responsivo sin límites de dispositivo).

OBJETIVO
Que TODAS las pantallas de TODOS los roles funcionen bien en celular, tablet y compu, en vertical y horizontal, con táctil, mouse y teclado. Hoy /alumno queda dentro de un "marco de celular" de 420 px en pantallas grandes: eliminalo. No se agrega ninguna función nueva; solo cambia cómo se acomoda lo que ya existe.

PUNTOS DE CORTE (Tailwind por defecto) Y CÓMO SE ACOMODA
  base  < 640 px   celular vertical: una columna, a pantalla completa.
  sm    ≥ 640      celular horizontal / tablet chica: una columna con más aire.
  md    ≥ 768      tablet vertical: tipografía y zonas táctiles un escalón más grandes; grillas de 2 columnas donde ayude.
  lg    ≥ 1024     tablet horizontal / notebook: layout de 2 columnas donde corresponda.
  xl    ≥ 1280     compu: aprovechar el ancho con un máximo razonable (max-w-6xl a 7xl), centrado SOLO el contenedor, nunca un marco.
  2xl   ≥ 1536     igual que xl (no estirar texto más allá de ~70 caracteres por línea).

ALUMNO (modo primaria y secundaria; layout compartido)
  - AlumnoLayout: sacá el marco de celular (md:max-w-[420px], bordes redondeados grandes, sombra). Encabezado de ancho completo y contenido dentro de un contenedor fluido (px-4 en base, px-6 en md, px-8 en lg).
  - Navegación: si hay barra inferior, solo en < md; desde md pasa a un encabezado/barra superior. El menú nunca tapa contenido.
  - El selector "Primaria (Suave) / Secundaria" del encabezado es una herramienta de desarrollo: mostralo SOLO con import.meta.env.DEV.
  - Inicio (/alumno): base 1 columna (saludo → "Hablá con Chasqui" → pasiones → misiones → proyecto). lg: 2 columnas (izquierda: saludo, Chasqui, pasiones; derecha: misiones del día y proyecto).
  - Diagnóstico (/alumno/diagnostico): una tarjeta central de ancho máx. ~2xl; opciones en 1 columna en base y grilla 2×2 desde sm; título y opciones un escalón más grandes desde md. Progreso siempre visible.
  - Tutor (/alumno/tutor): el chat usa TODO el alto disponible (100dvh, no 100vh) con el campo de mensaje fijo abajo, y respeta el área segura del celular (env(safe-area-inset-bottom)). Desde md el chat ocupa una columna centrada de ancho máx. ~3xl; desde lg el botón de voz y las "Ideas para responder" quedan en una fila cómoda. El teclado en pantalla NO debe tapar el campo de texto ni el último mensaje.
  - Ingreso por código (/alumno/ingreso): tarjeta centrada de ancho máx. md en todos los tamaños; las 6 casillas del código nunca se salen ni se achican por debajo de 44 px.
  - Dejá previsto lo mismo para las pantallas de secundaria que se agreguen después (no las construyas ahora).

DOCENTE, DIRECTIVO, FAMILIA, LOGIN
  - Docente y directivo: barra lateral fija desde lg; en md (tablet vertical) pasa a menú desplegable accesible (botón con aria-expanded, se cierra con Escape y al navegar); en base igual. Contenido a todo el ancho restante.
  - Tablas y listas: en base se vuelven tarjetas apiladas o tienen scroll horizontal DENTRO de su contenedor (overflow-x-auto), nunca desbordan la página.
  - Diálogos: en base ocupan casi toda la pantalla (con scroll interno si hace falta); desde md quedan centrados con ancho máx.
  - Familia y login: contenedor centrado fluido, sin anchos fijos.

ENTRADA (táctil, mouse y teclado)
  - Zonas táctiles ≥ 48 px en primaria y ≥ 44 px en el resto, en cualquier dispositivo.
  - Nada esencial depende de :hover (en táctil no existe). Los estados hover son un extra.
  - Todo es operable solo con teclado: orden de tab lógico, foco visible, Enter envía el chat, Escape cierra diálogos y menús.
  - Texto: base 16 px (17 px en primaria) y sube hasta 18–20 px en md+ para primaria. Nunca menos de 12 px.
  - Zoom: al ampliar al 200 % o con 320 px de ancho no se pierde contenido ni aparece scroll horizontal (WCAG reflow).

CUIDADOS
  - Sin overflow-x-hidden para tapar desbordes. Sin anchos fijos en px para contenedores (usar w-full, max-w-*, min-w-0).
  - Imágenes y avatares escalan; ningún texto se corta con "…" salvo nombres muy largos en listas.
  - Usá dvh para alturas de pantalla completa; vh solo si no hay alternativa.
  - Sin librerías nuevas. Tokens de siempre, sin colores hardcodeados.
  - Orientación horizontal en celular (por ejemplo 844×390): el encabezado se compacta y el chat sigue siendo usable.

CRITERIO DE ACEPTACIÓN
  Probá y listá resultado por ruta en estos tamaños: 360×800, 390×844, 844×390 (celular horizontal), 768×1024 (tablet vertical), 1024×768 (tablet horizontal), 1280×800 y 1920×1080.
  Rutas: /ingresar, /recuperar, /alumno, /alumno/diagnostico, /alumno/tutor, /alumno/ingreso, /docente, /docente/apoyo, /docente/alumnos/santi, /docente/proyectos/cancha-barrio, /docente/proyectos/cancha-barrio/grupos, /familia, /directivo.
  En todas: sin scroll horizontal, sin texto cortado, sin marco de celular, un solo <main>, consola limpia. Lighthouse accesibilidad = 100 en /alumno, /alumno/tutor y /docente (o escribí "no verificado").
  npm run build y npm run typecheck pasan.

Al terminar completá el "Informe de Gemini" en HANDOFF.md con una tabla: pantalla × tamaño (qué layout usa en cada punto de corte) y qué NO pudiste verificar.
```
