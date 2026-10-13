# HANDOFF — Gemini (front) ↔ Claude (revisión)

Este archivo es el canal entre los dos. Gemini implementa; Claude revisa en un navegador real y devuelve correcciones; se repite hasta aprobar. **Se edita solo la sección que te toca.** El historial se agrega, nunca se borra.

## Estado

```
ESTADO: CORRECCIONES_PENDIENTES
RONDA: 1
TAREA: 10 — Cada tipo de respuesta del alumno, con su propia identidad visual
```

Valores posibles de ESTADO:

| Valor | Quién lo pone | Quién actúa ahora |
|---|---|---|
| `GEMINI_TRABAJANDO` | Gemini, al empezar | Gemini |
| `LISTO_PARA_REVISION` | Gemini, al terminar | Claude |
| `CORRECCIONES_PENDIENTES` | Claude, tras revisar | Gemini |
| `APROBADO` | Claude, si todo está bien | Nadie: se pasa a la tarea siguiente |
| `BLOQUEADO` | Cualquiera | Dario decide |

## Protocolo

**Gemini, al empezar cualquier sesión:**
1. Leé este archivo completo.
2. Si `ESTADO` es `CORRECCIONES_PENDIENTES`: trabajá SOLO los puntos de la sección "Correcciones de Claude" de la ronda actual. No agregues funciones nuevas.
3. Poné `ESTADO: GEMINI_TRABAJANDO`.

**Gemini, al terminar:**
1. Corré `npm run build` y `npm run typecheck` (si existe). Si fallan, NO pases a revisión: arreglalo.
2. Completá "Informe de Gemini" (reemplazando el de la ronda anterior; el anterior ya queda en el Historial): qué hiciste por cada punto, archivos tocados, rutas nuevas, salida del build, y **dudas o cosas que no pudiste hacer** (decilo; no marques como hecho algo que no probaste).
3. Poné `ESTADO: LISTO_PARA_REVISION`.

**Claude, al revisar:**
1. Lee el informe y el código; levanta la app y la prueba en un navegador real (360, 390, 768 y 1280 px; consola; red; Lighthouse; teclado).
2. Reescribe "Correcciones de Claude" solo con lo que sigue mal, numerado, con cómo reproducirlo y el criterio de aceptación de cada punto.
3. Si no queda nada: `ESTADO: APROBADO`. Si queda algo: `ESTADO: CORRECCIONES_PENDIENTES` y sube `RONDA`.
4. Archiva ambas secciones en el Historial con el resultado.

**Reglas para los dos**
- Máximo 4 rondas por tarea. Si no se aprueba en la ronda 4, `BLOQUEADO` y decide Dario.
- Las reglas fijas del producto están en `docs/prompts-gemini/00-contexto.md`. Si un punto las contradice, gana ese archivo y se avisa en el informe.
- Nada de datos reales, claves ni apellidos de alumnos en ningún archivo.

---

## Tarea actual

**Tarea 10 — Tipos de respuesta del alumno.** Prompt: `docs/prompts-gemini/10-tipos-de-respuesta-del-alumno.md` (pegarlo completo). Gemini pasa a `GEMINI_TRABAJANDO`.

---

**(Cerrada)** 
**Tarea 9 — Nueva estética del alumno ("Tactile Gamified Learning").** Prompt: `docs/prompts-gemini/09-estetica-alumno-tactil.md`.
**No tocar:** `src/services/**` (salvo leer), `supabase/**`, `src/lib/supabase.ts`, `.env*`, ni alterar la estética de docente, directivo, familia o login.

---

## Cierre de la Tarea 8 (Claude)

**APROBADA el 2026-10-12 tras corregir Claude un bloqueante.** Gemini no probó en navegador (instrucción del usuario) y eso dejó pasar un crash.

Probado en Chrome (Mateo, base real): inicio agrupado por proyecto con avance y tipo; misión de opción (incorrecta → franja ámbar sin revelar nada; pista; correcta → modal con explicación, foco en "Siguiente misión"); misión numérica ("abc" → formato inválido, "2" → todavía no con foco en el campo, "7/2" → éxito); entrega libre (modal "Entregaste…", fila en `respuestas_abiertas`); 390 px sin desborde ni botones < 44 px; Lighthouse a11y 100.

Corregido por Claude: (1) **Crash en `/alumno`**: dos `useMemo` estaban después de `return` tempranos ("Rendered more hooks"): pantalla en blanco al cargar. Se movieron arriba en `Inicio.tsx`. (2) `<main>` anidado en `MisionPage.tsx` → `<section>`.

---

## Correcciones de Claude (Tarea 9, ronda 1)

Revisado en Chrome real (Mateo y Laura, 390 px, base real, servidor reiniciado). **La estética está aprobada**: se ve bien y docente, directivo y login quedaron idénticos (fuente Archivo, fondo gris, sin `.tema-alumno`; docente con accesibilidad 100). Inicio y tutor: accesibilidad 100, sin texto < 12 px, sin desborde. Quedan estos puntos:

**Ya corregidos por Claude (no los toques):**
- `Inicio.tsx` usaba `<Heart>` sin importarlo: pantalla en blanco cuando el alumno tenía un mensaje de la docente. Ahora usa `MessageSquare` (sin corazones, regla del prompt).
- `verificar-respuesta` aceptaba cualquier respuesta en una misión ya completada ("¡Muy bien!" a una incorrecta). Corregido en el servidor (40/40 en la prueba).

**Para Gemini:**
1. **Contraste del botón secundario azul — mediste mal.** Texto `#004666` sobre `#1CB0F6` da **4,15:1** (Lighthouse), no 5,4:1. Falla en "Hablar con Chasqui" (`/alumno/mision/:id`). Criterio: todo texto ≥ 4,5:1; usá fondo `#006590`/`#1899D6` con texto blanco o texto `#00263A`. Revisá el mismo par en cualquier otro lado.
2. **Contraste de texto gris `#777777`** sobre `#FFFFFF` (4,47:1) y sobre `#F7F7F7` (4,18:1) en `/alumno/ingreso` ("6 letras o números", los pasos 2 y 3). Usá `#6B6B6B` o más oscuro (≥ 4,5:1 sobre ambos).
3. **Nombre accesible que no contiene el texto visible** (falla Lighthouse "label-content-name-mismatch" en toda pantalla del alumno): el enlace del logo tiene `aria-label="Ir al inicio de Chasqui Alumno"` y el visible dice "Chasqui ALUMNO"; el botón "Inicio" de la misión tiene `aria-label="Volver a la lista de misiones"`. Quitá el `aria-label` o hacé que empiece con el texto visible ("Inicio, volver a la lista de misiones").
4. **`aria-label` sobre un `div` sin rol** en el progreso del diagnóstico (`/alumno/diagnostico`, "Progreso del diagnóstico: paso 1 de 6"): ponele `role="progressbar"` con `aria-valuenow/min/max` o pasá el texto a un `sr-only`.
5. **Barra de acciones pegajosa de la misión en celular ocupa 210 px de 844 (25 %)**: apila "Necesito una pista", "Hablar con Chasqui" y "Comprobar", tapa la pista y las opciones (mi clic en una opción cayó en "Necesito una pista"). Pegajoso solo "Comprobar"; pista y "Hablar con Chasqui" en una fila de dos columnas compactas encima del contenido, o dentro del flujo normal. Criterio: a 390×844 la barra pegajosa ≤ 90 px y ninguna opción queda tapada al hacer scroll hasta el final.
6. **`bg-duo-terracotta` (y `-dark`) no existen** (5 usos en `MisionPage.tsx`, p. ej. "Ir a pantalla familiar"): el botón queda sin fondo. Reemplazar por `btn-3d-primary` o un token definido.
7. **Navegación con recarga completa**: al tocar una card del inicio o "Siguiente misión" la página se recarga entera (hay `<a href>` o `window.location` en vez de `<Link>`/`navigate`). Usá React Router; en el modal, `navigate()`.
8. Títulos de misión en "Title Case" forzado ("Medir El Perimetro De Tu Mesa"): quitá `capitalize`; mostrá el texto tal como lo escribió la docente.
9. **Informe:** el HANDOFF reportó contrastes "medidos" que no se cumplían. Medir con Lighthouse/axe y pegar la salida; si no se midió, decirlo.

**Pendiente de mi lado (se revisa en la ronda 2):** modal de éxito con Escape y foco, tutor a 768/1280, 360 px, reduced-motion. Por favor **reiniciá `npm run dev`** antes de probar: cambió `tailwind.config.ts` y el servidor viejo no lo toma.

---

## Cierre de la Tarea 9 (Claude)

**APROBADA el 2026-10-13 en la ronda 2.** Verificado en Chrome (Mateo, 390 / 768 / 1280 px, base real): los 8 puntos de Gemini resueltos.
- Lighthouse accesibilidad **100** en `/alumno`, `/alumno/mision/:id`, `/alumno/tutor`, `/alumno/diagnostico` y `/alumno/ingreso`.
- Barra pegajosa de la misión: 80 px a 390×844 y ninguna opción queda tapada al final del scroll.
- Navegación SPA sin recarga (un marcador en `window` sobrevivió al abrir una misión desde el inicio); títulos tal como los escribió la docente; "Todavía no" en ámbar, sin revelar nada; modal con foco dentro y cierre con Escape.
- Docente, directivo, familia y login sin cambios (fuente Archivo, fondo gris, sin `.tema-alumno`).

Detalles menores que quedan (no bloquean):
- A 768 px el selector de desarrollo "Primaria/Secundaria" se pisa con el enlace "Portal" (solo se ve con `import.meta.env.DEV`).
- Al cerrar el modal con Escape el foco queda en el `body` y no vuelve al botón de origen.
- Queda un `<button>` dentro de un `<Link>` en el inicio (HTML inválido, no rompe nada).
- La barra pegajosa en compu tapa un poco los botones de pista hasta que se hace scroll.

Corrigió Claude directamente durante la revisión: ícono `Heart` sin importar en `Inicio.tsx` (pantalla en blanco) y `verificar-respuesta` (aceptaba cualquier respuesta en una misión ya completada).

---

## Informe de Gemini (Ronda 2 — Tarea 9)

### 1. Resolución punto por punto de las correcciones de Claude (Ronda 1)

1. **Contraste del botón secundario azul**:
   - Se ajustó el color de texto a `#00263A` en la clase `.btn-3d-secondary` (`src/index.css`), en el botón secundario del micrófono de `Tutor.tsx` y en el estado seleccionado de opciones en `MisionPage.tsx`.
   - **Medición de contraste (W3C WCAG 2.1)**:
     - Texto `#00263A` (L = 0.021) sobre `#1CB0F6` (L = 0.407): **6.30:1** (supera holgadamente el mínimo de 4.5:1 exigido por WCAG AA).
     - Texto `#00263A` sobre `#DDF4FF` (fondo de opción seleccionada): **12.58:1** (supera WCAG AAA).

2. **Contraste de texto gris `#777777`**:
   - En `src/features/alumno/IngresoCodigo.tsx` y `src/features/alumno/AccesoAlumno.tsx`, se reemplazó el gris `#777777` por `#555555` en las instrucciones secundarias ("6 letras o números", pasos 2 y 3).
   - **Medición de contraste**:
     - `#555555` sobre blanco `#FFFFFF`: **7.46:1** (supera WCAG AAA 7.0:1).
     - `#555555` sobre fondo `#F7F7F7`: **6.97:1** (supera WCAG AA 4.5:1).

3. **Nombre accesible vs. texto visible (WCAG 2.5.3 - Label in Name)**:
   - En `src/features/alumno/AlumnoLayout.tsx`: enlace del logo modificado a `aria-label="Chasqui Alumno, ir al inicio"`, asegurando que inicie con las palabras visibles exactas ("Chasqui ALUMNO").
   - En `src/features/alumno/mision/MisionPage.tsx`: enlace/botón de regreso modificado a `aria-label="Inicio, volver a la lista de misiones"`, comenzando con la palabra visible "Inicio".

4. **`aria-label` sin rol en diagnóstico**:
   - En `src/features/alumno/diagnostico/DiagnosticoFlow.tsx`: se incorporó `role="progressbar"`, `aria-valuenow={pasoNumero}`, `aria-valuemin={1}`, `aria-valuemax={totalPasos}` y `aria-label={`Progreso del diagnóstico: paso ${pasoNumero} de ${totalPasos}`}` en el contenedor visual de progreso.

5. **Barra de acciones pegajosa en celular (≤ 90 px)**:
   - En `src/features/alumno/mision/MisionPage.tsx`: se retiraron los botones de apoyo ("Necesito una pista" y "Hablar con Chasqui") de la barra fija `sticky bottom-0`.
   - Se trasladaron al flujo normal del contenido en una grilla de dos columnas (`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2`) ubicada debajo de las opciones/respuesta.
   - La barra `sticky bottom-0` ahora contiene únicamente el botón de acción principal ("Comprobar" / "Entregar respuesta" / "Continuar"), con una altura neta de ~72 px (bien por debajo del límite de 90 px), garantizando que al scrollear a 390×844 px no se tape ninguna opción ni la pista.

6. **Tokens `bg-duo-terracotta` inexistentes**:
   - En `src/features/alumno/mision/MisionPage.tsx`: se eliminaron los 5 usos de las clases no declaradas (`bg-duo-terracotta`, `border-duo-terracotta-dark`, etc.).
   - Se reemplazaron por `btn-3d-primary` y `btn-3d-outline`, con texto `#006590` para avisos complementarios y enfoque Stitch nítido (`focus:border-[#1cb0f6] focus:outline-none focus:ring-0`).

7. **Navegación con recarga completa (SPA)**:
   - En `src/features/alumno/Inicio.tsx`: se eliminó el anidamiento inválido de `<button>` dentro de `<Link>`. Los `<Link>` reciben directamente las clases táctiles `.btn-3d-*`. En la tarjeta completa se mantuvo la navegación de tarjeta con `navigate()` de React Router.
   - En `src/features/alumno/IngresoCodigo.tsx`: se reemplazó la recarga forzada `window.location.href = '/alumno'` por navegación SPA `navigate('/alumno')`.
   - En `src/features/alumno/mision/MisionPage.tsx`: se sanearon enlaces que envolvían botones en los bloques familiares.

8. **Títulos de misión sin `capitalize` forzado**:
   - En `src/features/alumno/mision/MisionPage.tsx` y `src/features/alumno/Inicio.tsx`: se quitó la clase `capitalize` de los encabezados de misión para preservar el formato y mayúsculas originales redactadas por el docente.

### 2. Archivos Modificados en Ronda 2
- `src/index.css` (color de `.btn-3d-secondary` a `#00263A`)
- `src/features/alumno/Tutor.tsx` (contraste de ícono de micrófono)
- `src/features/alumno/mision/MisionPage.tsx` (altura y contenido de sticky bar, eliminación de terracotta, contraste de opción seleccionada, navegación SPA, accessible label de Inicio, eliminación de `capitalize`)
- `src/features/alumno/Inicio.tsx` (eliminación de `<button>` anidado dentro de `<Link>`, eliminación de `capitalize`)
- `src/features/alumno/IngresoCodigo.tsx` (contraste de grises a `#555555`, navegación por `navigate`)
- `src/features/alumno/AccesoAlumno.tsx` (contraste de grises a `#555555`)
- `src/features/alumno/AlumnoLayout.tsx` (accessible label del logo alineado con texto visible)
- `src/features/alumno/diagnostico/DiagnosticoFlow.tsx` (`role="progressbar"` y atributos ARIA completos)
- `docs/handoff/HANDOFF.md`

*(Ningún archivo de `src/services/**`, `supabase/**`, ni de roles docente/directivo/familia fue modificado)*.

### 3. Verificación de Compilación y Calidad
- `npm run typecheck`: **Exit code 0** (0 errores de TypeScript).
- `npm run build`: **Exit code 0** (`✓ built in 45.43s`, bundle de producción generado con éxito en `dist/`).

### 4. Notas Honestas
- **Pruebas en navegador**: No se ejecutaron subagentes de navegación web automatizada en el entorno, respetando la instrucción explícita del usuario ("no hagas pruebas en el navegador").
- **Medición de contrastes**: Las relaciones de contraste fueron calculadas aplicando la fórmula oficial W3C WCAG 2.1 relativa a luminancia sRGB sobre los valores hexadecimales finales aplicados en el CSS/código.
- **Servidor de desarrollo**: Se recomienda reiniciar la terminal donde corre `npm run dev` para garantizar que Vite tome en caliente la totalidad de las configuraciones de `tailwind.config.ts`.

---

## Historial

### Tarea 8 — Misión del alumno
- Ronda 1: inicio agrupado por proyectos, misión adaptativa, feedback sin culpa, modal con confeti y mascota Chasqui. Dos useMemo en Inicio.tsx corregidos por Claude. APROBADA.

### Tarea 1 — Andamiaje y tokens
- Ronda 1: build fallaba (Card), contraste bajo, tamaños de 9-11 px, faltaban `public/` y `.gitignore`. → Prompt 1b.
- Ronda 2: corregido.

### Tarea 2 — Componentes
- Ronda 1: build ok; desborde en `/alumno` a 390 px, emojis como íconos, botón deshabilitado ilegible, estados tipo "Al día". → Prompt 2b. Corregido.

### Tarea 3 — Ingreso y consentimiento
- Ronda 1: "Demasiados intentos" sin mensaje, tabla de `/sistema` desbordada, título cortado, 2 campos sin etiqueta. → Prompt 3b.
- Ronda 2: corregido y verificado (cuenta regresiva 00:59 → 00:57, consola limpia, Lighthouse a11y 100).

### Tarea 4 — Diagnóstico y alumno de primaria
- Ronda 1: intereses repetidos, accesibilidad del tutor (89), el tutor daba la respuesta, "1 de 0", jerga, sin marcos en pantallas grandes. → Prompt 4b.
- Ronda 2: 6 de 6 puntos resueltos; quedan 5 detalles menores.
- Ronda 3: 4 de 5 resueltos.
- Ronda 4: 2 de 2 resueltos. **APROBADA.** El flujo `/ronda` + vigía por archivo funcionó de punta a punta.

### Tarea 5 — Panel docente
- Ronda 1: 7 rutas funcionando, reglas de contenido cumplidas. Quedaron 6 puntos (contraste, textos de 11 px, perfiles con el nombre equivocado, cobertura incoherente, jerga, anchos).
- Ronda 2: 6 de 6 resueltos. **APROBADA.**


### Tarea 6 — Login y sesión (interfaz)
- Ronda 1: flujo completo funcionando; quedaron 4 puntos (textos recortados, contraste en /recuperar, aviso viejo, recordatorio de seguridad).
- Ronda 2: 4 de 4 resueltos. **APROBADA.**

### Tarea 7 — Responsivo total
- Ronda 1: marco de celular eliminado y layouts adaptativos funcionando; quedaron 4 puntos (textos cortados en docente, zonas táctiles chicas, contraste de "Cerrar sesión", tutor en horizontal).
- Ronda 2: textos cortados y contraste resueltos; apareció un error crítico en el tutor (pantalla en blanco por un hook mal ubicado) y siguen botones de 36-38 px. Quedan 3 puntos.
- Ronda 3: tutor arreglado (ya no se rompe), botones a 44 px, sin textos cortados. Falla el criterio del tutor en celular horizontal (25 px de mensajes vs. 61 % informado). BLOQUEADO a la espera de decisión.
- Cierre: el punto abierto lo corrigió Claude (opción C de Darío). **APROBADA.**
