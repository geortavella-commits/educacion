---
name: diseno-integracion
description: >
  Usar cuando se reciba o se vaya a implementar un diseño de la plataforma
  educativa: capturas o HTML de Claude Design o Google Stitch, un design
  system, una maqueta de pantalla (panel docente, misión del alumno, ingreso,
  vista de familia, directivo), y haya que convertirlo en React + Tailwind.
  También activar cuando el usuario diga "armá esta pantalla", "pasá la
  maqueta a código", "implementá este diseño" o "ajustá la UI a la maqueta" —
  incluso si no menciona el origen del diseño. Reemplaza a `stitch-integration`
  en este proyecto: la estética es la de Claude Design (clara y simple) y de
  Stitch solo se toman funciones.
---

# Skill: Integración de diseño → React

> Nota: esta skill se escribió sin tener a mano `stitch-integration` del ERP.
> Si esa skill tiene un procedimiento de conversión que te sirve (por ejemplo,
> cómo leer el YAML del design system), incorporalo acá.

## Cuándo usar esta skill

Al convertir una maqueta (capturas, HTML exportado o descripción) en
componentes React del proyecto. Se complementa con `datos-menores-ia` (qué
datos puede mostrar una pantalla) y `tutor-agentes` (qué puede decir Chasqui).

## Dirección de diseño (decidida)

- **Estética:** clara y simple, mucho espacio en blanco, pocas tarjetas por
  pantalla, textos cortos, una acción principal por vista.
- **De Stitch solo se toman funciones:** sello "Sin spoilers", ideas para
  responder, intereses editables, misiones del día, actividad del equipo,
  comentario del docente, rúbrica en foco. **No** su densidad ni su jerga.
- Sin jerga pedagógica pesada en el panel docente: priorizar "qué hago hoy".
- Español rioplatense.

## Dos modos de experiencia

| | Primaria (5º-6º) | Secundaria (3º-4º año) |
|---|---|---|
| Controles | Botones grandes, íconos, voz, opciones para tocar | Chat abierto, campos de texto |
| Texto | Corto, una idea por pantalla | Más denso, argumentación |
| Gamificación | Estrellas y racha simple | Sobria; sin niveles ni títulos que clasifiquen |
| Ingreso | Código o QR | Cuenta propia |

Implementar como un solo núcleo con **variantes por modo**, no dos apps. El
modo sale del curso del alumno (`cursos.nivel`).

## Flujo de trabajo

1. **Inventario:** listar las pantallas recibidas y qué roles las ven.
   Confirmar si llegó el design system (colores, tipografía, espacios), el
   HTML o solo capturas.
2. **Tokens primero:** extraer colores, tipografía, radios y espacios a
   variables de Tailwind (`tailwind.config`) antes de armar pantallas. No
   hardcodear colores en componentes.
3. **Componentes compartidos:** botón, tarjeta, chip, barra de progreso,
   campo de chat, mensaje del tutor, avatar, tabla simple. Guardarlos en
   `src/components/`.
4. **Pantalla por feature:** en `src/features/<rol>/...`, usando los
   componentes compartidos.
5. **Datos por `services/`:** los componentes no llaman a Supabase. Mientras
   no exista la base, usar datos ficticios tipados en un archivo de mocks.
6. **Estados reales:** cargando, vacío, error y sin permiso, no solo el
   camino feliz de la maqueta.
7. **Accesibilidad:** contraste suficiente, tamaños táctiles amplios en
   primaria, foco visible, etiquetas en campos, no depender solo del color.
8. **Verificar en el navegador:** ofrecer revisar en pantalla real (consola,
   capturas, formularios) en móvil y escritorio antes de darlo por terminado.

## Revisión de contenido de cada pantalla (antes de implementar)

Cosas que las maquetas ya mostraron y hay que corregir al implementar:

- Los porcentajes de avance se rotulan **"Avance de misiones"** (no son notas).
- **Nada que clasifique al alumno:** sin "Nivel 4 · Explorador", sin etiquetas
  de perfil. En secundaria, gamificación sobria.
- Las observaciones sobre un alumno se presentan como **hipótesis** ("Según su
  actividad reciente…") con un botón **Corregir**, y el aviso "La calificación
  la decidís vos".
- Los grupos muestran un **nombre neutro** a los alumnos; la etiqueta interna
  (por ejemplo "Refuerzo") la ve solo el docente.
- "Necesitan apoyo" abre una lista con el motivo de cada alumno como
  hipótesis editable.
- No usar fotos de chicos reales: avatares o ilustraciones.
- Evitar nombres de personas reales en ejemplos; usar descripciones.
- Los textos de consentimiento deben decir con precisión qué pasa con la voz
  y que el tutor usa IA; validar con asesoría legal.
- Números coherentes entre pantallas (cursos, alumnos, porcentajes).
- No mostrar calificaciones oficiales generadas por la app.
- Revisar el contenido pedagógico que figura en la maqueta (ejemplos de
  física, matemática): puede tener errores; no copiarlo como verdad.
- Códigos de clase de 6 caracteres o más, con vencimiento y aprobación del
  docente (la maqueta mostraba un código corto).

## Estructura sugerida

```
src/components/     botones, tarjetas, chips, progreso, chat
src/features/
  docente/          panel, crear proyecto, grupos, perfil de alumno
  alumno/           inicio, misión con tutor, proyecto, mini-diagnóstico
  familia/          resumen, consentimiento
  directivo/        panel de escuela, altas
src/services/       llamadas a Supabase (los componentes no las hacen)
src/mocks/          datos ficticios tipados mientras no hay base
```

## Reglas que nunca se omiten

- No hardcodear colores ni espacios: todo por tokens de Tailwind.
- Los componentes no llaman a Supabase directo; van por `services/`.
- Ninguna pantalla muestra datos que la matriz de acceso no permite a ese rol.
- Los textos que genera el tutor se muestran tal como los entrega el revisor.
- No copiar a código contenido pedagógico de una maqueta sin validarlo.
- Antes de modificar un componente existente: mostrar el cambio y pedir confirmación.

## Checklist final

- [ ] Tokens extraídos y usados en todos los componentes
- [ ] Variantes primaria y secundaria funcionando desde `cursos.nivel`
- [ ] Estados de carga, vacío, error y sin permiso resueltos
- [ ] Revisión de contenido de la pantalla aplicada (lista de arriba)
- [ ] Probada en móvil y escritorio, con consola sin errores
- [ ] Sin datos ni imágenes reales de alumnos
