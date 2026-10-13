# Prompt 2 — Componentes compartidos

Adjuntar: `docs/maqueta/pantallas/1a.html`, `2a.html`, `3a.html` (referencia de cómo se ven en uso).

```
Tarea: crear los componentes compartidos en src/components/, usando solo tokens.

Componentes: Button (primary, secondary, ghost, icon), Card (con kicker, título, cuerpo, meta), Tag/Chip (accent, accent-2, neutral, outline), ProgressBar (con etiqueta "Avance de misiones"), Avatar (iniciales o ilustración, nunca foto), Input/Textarea con label, Radio, SegmentedControl, Table simple, Dialog/Modal, EmptyState, ErrorState, LoadingSkeleton, ChatBubble (alumno / tutor), SelloSinSpoilers ("Sin spoilers: te ayuda a pensar sin darte la respuesta servida"), HipotesisItem (texto de hipótesis + botón "Corregir"), NavLateral (docente/directivo) y BarraInferior (alumno móvil).

Cada componente:
- funciona en modo base y en modo primaria (data-modo) sin props extra
- tiene foco visible y es operable por teclado
- se muestra en /sistema con todas sus variantes y estados (hover, disabled, foco)

Criterio de aceptación: /sistema lista todos los componentes en ambos modos; ningún componente contiene colores ni px de diseño hardcodeados; sin errores de consola.
```
