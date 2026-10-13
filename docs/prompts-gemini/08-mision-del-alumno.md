# Prompt 8 — Misión del alumno: enunciado, respuesta, éxito y próxima misión

Adjuntar: nada. Todo el contrato de datos ya está hecho por Claude (servicios `misionService` e `inicioService`, con datos simulados para trabajar sin base).
Contexto de producto: hoy la card de una misión solo lleva al chat. Queremos que el alumno vea **el problema**, lo **responda**, reciba un cierre festejado y **siga a la próxima misión**. El chat con Chasqui pasa a ser **opcional** (un apoyo, no el camino principal). Además, el inicio mezclaba misiones de distintos proyectos sin identificarlas.

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 8. Al terminar seguí el protocolo: informe honesto en HANDOFF.md y ESTADO: LISTO_PARA_REVISION.
Releé docs/prompts-gemini/00-contexto.md (reglas fijas, incluidas la 12 de responsivo y las de tono: nada califica ni clasifica al alumno, el tutor nunca da la respuesta).

NO TOCAR: src/services/** (salvo leer), supabase/**, src/lib/supabase.ts, .env*. Los servicios ya existen: usá `misionService` e `inicioService` desde '@/services'. Trabajá con los datos simulados (ids sim-1 numero, sim-2 opcion, sim-3 texto, sim-4 abierta; `IDS_MISIONES_DE_EJEMPLO`).

CONTRATO (leelo en src/services/mision.tipos.ts e inicio.tipos.ts)
  misionService.obtenerMision(id) → { titulo, enunciado, tipo: 'numero'|'texto'|'opcion'|'abierta', opciones[{id,texto}], orden, total, proyectoNombre, completada, respuestaPrevia?, hayPista, sinConsentimiento? }
  misionService.enviarRespuesta(id, respuesta) → { estado, explicacion?, siguiente?: {id,titulo}|null, segundosEspera? }
     estado: 'correcta' | 'incorrecta' | 'entregada' | 'formato_invalido' | 'demasiados_intentos' | 'sin_permiso' | 'error'
     (en 'opcion' la respuesta es el id de la opción elegida)
  misionService.pedirPista(id) → string (lanza Error('sin_pista') si no hay)
  inicioService.obtenerDatos() → ahora trae `proyectos[{id,nombre,misionesCompletadas,misionesTotales}]` y cada misión trae proyectoId, proyectoNombre, orden y tipo.
  La respuesta correcta NUNCA llega al navegador: no intentes mostrarla ni deducirla.

1) NUEVA PANTALLA /alumno/mision/:id  (dentro de AlumnoLayout, ruta protegida para rol alumno)
  - Arriba: volver al inicio; "Proyecto: <proyectoNombre> · Misión <orden> de <total>" (texto, no solo color).
  - Título de la misión y, debajo, el ENUNCIADO bien legible (es el protagonista de la pantalla; tipografía grande en primaria). Respetá saltos de línea del enunciado.
  - Zona de respuesta según `tipo`:
      numero  → un campo grande (inputMode="decimal", NO type=number para no perder "3,5" ni "7/2"), con ayuda "Podés escribir 3,5 o 7/2".
      texto   → un campo de una línea con etiqueta "Tu respuesta".
      opcion  → grupo de radios grandes (role radiogroup), una opción por fila, toda la fila clickeable (≥48 px en primaria).
      abierta → un textarea "Contá lo que pensaste" y el botón dice "Entregar" (no "Comprobar"); si hay `respuestaPrevia`, mostrarla precargada.
    Cada campo con <label> real, foco visible, Enter envía (menos en el textarea).
  - Botón principal "Comprobar" (deshabilitado si la respuesta está vacía; mientras envía, "Comprobando…" y no se puede tocar de nuevo).
  - Si `hayPista`: botón secundario "Necesito una pista" → pide la pista y la muestra en un recuadro (role="status"); puede pedirla de nuevo sin límite. Si falla con 'sin_pista', ocultá el botón.
  - Botón secundario y OPCIONAL "Hablar con Chasqui" que lleva a /alumno/tutor?mision=<id>. Debe verse como ayuda opcional, nunca como paso obligatorio.
  - Si `completada` ya es true: mostrá un aviso "¡Ya resolviste esta misión!" y dejá volver a verla/responderla; con botón "Siguiente misión" si corresponde.

2) RESULTADOS (siempre texto + color + ícono; role="status" o "alert" según corresponda; sin culpa)
  - 'correcta' → MODAL ANIMADO de éxito (ver punto 3).
  - 'entregada' → mismo modal pero con el texto "¡Entregaste tu misión! Tu docente la va a leer." (no dice "correcta": estas no se corrigen solas).
  - 'incorrecta' → mensaje amable inline: "Todavía no, ¡probá de nuevo!" + sugerencia de la pista o de hablar con Chasqui. NUNCA mostrar la respuesta correcta, puntaje, "mal", "error", ni cantidad de intentos. El campo conserva lo escrito y recupera el foco.
  - 'formato_invalido' → "Escribí un número, por ejemplo 3,5" (adaptá al tipo). No cuenta como intento.
  - 'demasiados_intentos' → "Probaste muchas veces seguidas. Descansá un ratito y volvé en {segundosEspera} segundos." con cuenta regresiva y el botón deshabilitado hasta que termine.
  - 'sin_permiso' o `sinConsentimiento` → mismo cartel de falta de permiso de la familia que ya usa el tutor (reutilizalo), sin campo de respuesta.
  - 'error' → "No pudimos comprobar tu respuesta. Revisá tu conexión y probá de nuevo" con "Reintentar".

3) MODAL DE ÉXITO ANIMADO
  - Diálogo accesible (role="dialog", aria-modal, foco al abrir, foco atrapado, Escape lo cierra, devuelve el foco).
  - Animación festiva pero corta (≈1,5 s): entrada con escala/fade y un destello o confeti liviano hecho con CSS (sin librerías nuevas). RESPETÁ prefers-reduced-motion: sin movimiento, solo fade o nada. La información no puede depender de la animación.
  - Contenido: "¡Muy bien!" (o "¡Entregada!"), `explicacion` si viene (en un párrafo), y dos botones:
      "Siguiente misión" (principal; lleva a /alumno/mision/<siguiente.id>; muestra el título de `siguiente`)
      "Volver al inicio"
    Si `siguiente` es null: en vez de "Siguiente misión" mostrá "¡Terminaste las misiones de este proyecto!" y solo "Volver al inicio".
  - Prohibido: puntos, estrellas contadas, niveles, rankings, comparaciones con otros ni "perfecto/genio". El festejo es del esfuerzo, no un puntaje.
  - Al pasar a la siguiente misión el estado (campo, pista, resultado) se reinicia por completo.

4) INICIO DEL ALUMNO (/alumno) — que se entienda de qué proyecto es cada misión
  - Agrupá las misiones por proyecto usando `proyectos` y `proyectoId`: un bloque por proyecto con su NOMBRE como título (h2), su avance en texto ("2 de 4 misiones") + barra, y debajo sus misiones por `orden`.
  - Cada card de misión: número ("Misión 2"), título, materia, duración, estado (Completada / Pendiente con ícono y texto) y el TIPO en palabras simples ("Número", "Texto corto", "Elegí una opción", "Contá lo que pensaste") — no solo ícono.
  - TODA la card (o su botón principal "Resolver") lleva a /alumno/mision/<id>. Sacá el botón "Ya la terminé" (ahora el servidor exige responder) y que "Resolver con Chasqui" deje de ser el camino principal: el chat queda accesible desde la propia pantalla de la misión.
  - Si hay un solo proyecto, igual se muestra su nombre. Si no hay proyectos, estado vacío amable.
  - Resaltá la próxima misión pendiente del primer proyecto con un "Seguí por acá" (texto, no solo color).
  - Podés dejar de usar `proyecto` (deprecated); usá `proyectos`.

5) CHAT OPCIONAL
  - /alumno/tutor acepta `?mision=<id>`: leelo y, si existe, mostrá arriba el título de esa misión ("Estás con: <título>") y un botón "Volver a la misión". El guion del tutor puede seguir siendo el actual (el tutor real lo conecta Claude después): no inventes respuestas ni pistas. 
  - Sin `?mision` el tutor funciona como hoy.

6) ESTADOS, RESPONSIVO Y ACCESIBILIDAD
  - Pantalla de misión con los 4 estados: cargando (esqueleto), no encontrada/sin acceso ("Esta misión no está disponible" + volver), error de red (reintentar), y normal.
  - Responsivo 360 / 390 / 768 / 1280 (celular y compu): en lg la misión puede ir en una columna centrada de ancho máx. ~3xl; el modal en base ocupa casi todo el ancho y desde md queda centrado con ancho máx. Sin overflow horizontal.
  - Textos ≥12 px (≥16 px el enunciado y las respuestas), zonas táctiles ≥44 px (≥48 px en primaria), contraste AA. Lighthouse accesibilidad 100 en /alumno/mision/sim-1, sim-2 y sim-4 y en /alumno.
  - Sin librerías nuevas. Tokens de siempre. Textos en español rioplatense (vos), cortos y cálidos. Los textos fijos de la UI en un solo lugar si ya existe una convención.

7) DIRECCIÓN VISUAL: ESTÉTICA "TIPO DUOLINGO" PARA EL ALUMNO (aplica a la pantalla de misión, el modal y el inicio del alumno)
  Inspiración: lúdica, clara, de una sola acción por pantalla. Copiá el LENGUAJE VISUAL, no las mecánicas de competencia.
  - Una sola cosa por pantalla: enunciado grande arriba, respuesta en el medio, botón principal fijo abajo (en celular, barra inferior con safe-area; en compu, debajo del contenido y centrado). Mucho aire.
  - Barra de progreso del proyecto arriba, gruesa (≥12 px), redondeada, con relleno animado suave al avanzar ("Misión 2 de 4" en texto también).
  - Botones "gordos": radio grande (≥16 px), peso tipográfico fuerte, borde inferior más grueso/oscuro como "sombra de apoyo" (box-shadow sólida sin blur, ej. 0 4px 0 <tono más oscuro>) que se aplasta 2–4 px al presionar (:active). Primario en el color de acento; secundario con fondo claro y borde. Deshabilitado = gris legible, no invisible.
  - Opciones de respuesta como tarjetas grandes con borde de 2 px; seleccionada = borde y fondo teñidos del color de acento + check; nunca solo color.
  - Feedback inmediato en una franja inferior que sube desde abajo (estilo "bottom sheet"): al acertar, franja verde suave con ícono ✓ y "¡Muy bien!"; al no acertar, franja cálida (ámbar/naranja suave, NO rojo) con "Todavía no, ¡probá de nuevo!". Siempre con texto + ícono. El modal de éxito del punto 3 puede ser esa misma franja ampliada o un diálogo, pero con la misma estética.
  - Mascota: Chasqui como personaje amigable (usá el avatar/ilustración que ya exista; si no hay, un SVG simple propio) que aparece en la pantalla de misión, festeja en el éxito (rebote corto) y "acompaña" en el estado vacío. Con reduced-motion, queda quieta.
  - Esquinas redondeadas, colores planos y saturados dentro de la paleta de tokens existente (no hardcodear colores: si falta un tono más oscuro para la "sombra de apoyo", derivalo de un token con color-mix() o agregá el token en un solo lugar). Tipografía redonda y amigable ya definida en los tokens; títulos en peso extra-bold.
  - Micro-animaciones breves (≤300 ms) en tocar, seleccionar y cambiar de pantalla; todas desactivadas con prefers-reduced-motion.
  - LO QUE NO SE COPIA (reglas del producto): sin rachas, sin puntos/XP, sin vidas ni "perdiste un corazón", sin ligas/rankings, sin comparación con otros, sin presión de tiempo, sin notificaciones de culpa ("no vuelvas a fallar"). El progreso es "avanzar en el proyecto", nada más.
  - Modo secundaria: misma estructura pero sobria (menos mascota, colores más calmos, tipografía más chica); el modo primaria es el lúdico.

CRITERIOS DE ACEPTACIÓN (los voy a verificar en Chrome)
  h. La pantalla de misión se ve lúdica y de una sola acción: barra de progreso gruesa arriba, botón "gordo" con sombra de apoyo que se hunde al presionar, franja de feedback que sube desde abajo, mascota presente y quieta con reduced-motion. No aparece ninguna mecánica de puntos, rachas ni vidas.
  a. /alumno muestra un bloque por proyecto con nombre y avance, misiones numeradas y tipo en palabras; cada card abre la misión.
  b. En sim-1 (número, correcta 3,5): "3,5", "7/2" y "3.5" abren el modal; "2" muestra "Todavía no" sin revelar nada; "abc" muestra formato inválido.
  c. En sim-2 (opción): se elige con teclado (flechas/espacio) y Comprobar funciona; sim-3 texto; sim-4 abierta "Entregar" con modal de entrega.
  d. El modal anima, atrapa foco, cierra con Escape y respeta reduced-motion; "Siguiente misión" avanza y reinicia todo.
  e. La pista aparece solo al pedirla; el chat solo al tocar "Hablar con Chasqui".
  f. Ningún texto de la pantalla contiene puntajes, "error/mal" dirigidos al alumno ni la respuesta correcta.
  g. build y typecheck en 0; consola limpia.

Al informar: medí en el navegador (no calcules) y listá lo que NO pudiste probar.
```
