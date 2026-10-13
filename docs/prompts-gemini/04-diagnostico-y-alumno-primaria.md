# Prompt 4 — Mini-diagnóstico y alumno de primaria

Adjuntar: `docs/maqueta/pantallas/6a.html`, `6b.html`, `6d.html`, `2a.html`, `2b.html`.
(`6c` es la versión de secundaria: queda para la fase 2.)

```
Antes de empezar, una corrección de la tarea anterior: en 360 px de ancho, en /sistema, el SegmentedControl ("Ciencias | Lengua | Matemática") se corta por el borde derecho (queda tapado por overflow-x-hidden de los layouts). Hacé que haga salto de línea o scroll interno, y SACÁ overflow-x-hidden de los layouts: tapa los desbordes en lugar de arreglarlos. Verificá que sin él no haya scroll horizontal en 360, 390, 768 y 1280 px.

Tarea: replicar cinco pantallas del alumno de primaria (modo primaria, estilo suave).

A) 6a Mini-diagnóstico (pregunta con 4 opciones)   → src/features/alumno/diagnostico/Pregunta.tsx
B) 6b Pregunta de intereses (elegir hasta 3)        → src/features/alumno/diagnostico/Intereses.tsx
C) 6d Final del diagnóstico                         → src/features/alumno/diagnostico/Final.tsx
   Las tres forman un flujo: /alumno/diagnostico (progreso "2 de 6" real, botón cerrar con confirmación, volver atrás).
D) 2a Inicio del alumno                             → src/features/alumno/Inicio.tsx
E) 2b Tutor con voz (Chasqui)                       → src/features/alumno/Tutor.tsx

Datos: servicios en src/services/ (diagnostico.ts, inicio.ts, tutor.ts) que devuelven mocks tipados. El tutor responde con una conversación pre-armada (guion de mocks); NO llames a ningún modelo. La voz es SOLO interfaz: botón "Tocá y hablá" que alterna estados (escuchando, procesando) y botón "Escuchar de nuevo"; sin micrófono real ni síntesis de voz.

Estados (además del feliz): cargando, vacío (sin misiones hoy), error y sin permiso. En el tutor: "sin consentimiento familiar" (bloquea el chat y muestra "Pedile a tu familia que autorice a Chasqui" con un enlace a la pantalla de consentimiento), "Chasqui está pensando…", y "no pude escuchar, probá de nuevo".

Correcciones respecto de la maqueta:
- Diagnóstico: el texto debe decir que NO hay notas ("Sin notas, es un juego para conocerte"). La pregunta de 6a (figuritas) es relleno de ejemplo: guardala en un mock editable, NO la trates como contenido curricular. Al elegir una opción NO muestres "correcto/incorrecto" ni puntaje.
- Intereses: máximo 3, con aviso claro al intentar elegir un cuarto. Menú cerrado (sin texto libre). Podés cambiarlos después (botón "Cambiar" en el inicio).
- Final 6d: "Armé tus primeras misiones con fútbol y dibujo" debe usar los intereses elegidos.
- Inicio 2a: reemplazá "Valen" por "Mateo"; sin apellidos. "★ 12 estrellas" se mantiene como único elemento de juego (estrellas y racha simple); NO agregues niveles, títulos ni rankings. Las misiones muestran su estado ("Completada", "Pendiente") sin porcentajes que parezcan notas; el proyecto "La cancha del barrio 3/5" se rotula "Misiones del proyecto: 3 de 5".
- Tutor 2b: mantené el sello "Sin spoilers", las "Ideas para responder" (chips) y la regla de que Chasqui NUNCA da la respuesta: en el guion, cada respuesta de Chasqui es una pregunta o una pista, jamás el resultado final. El ejemplo de penales es relleno.
- Primaria: botones y zonas táctiles ≥ 48 px, una idea por pantalla, frases cortas, íconos de lucide-react (nada de emojis como íconos de interfaz).
- Mostrá los mensajes de Chasqui con el componente ChatBubble ya existente; no crees otro.

Criterio de aceptación: se recorre el flujo completo diagnóstico → final → inicio → tutor en 390 px y 360 px; sin scroll horizontal ni errores de consola; Lighthouse de accesibilidad 100 en /alumno y /alumno/tutor; el diálogo "cerrar diagnóstico" devuelve el foco y se cierra con Escape.
Pegame: salida de `npm run build` y lista de rutas nuevas.
```
