# Prompt 4b — Correcciones a la Tarea 4 (pegar en el mismo hilo)

```
Probé la Tarea 4 en un navegador real a 360 px. Lo que está bien: no hay scroll horizontal en ninguna ruta y ya no existe overflow-x-hidden; el diagnóstico recorre sus 6 pasos con progreso real, sin "correcto/incorrecto"; el aviso del 4º interés aparece; el diálogo de salida se cierra con Escape y devuelve el foco; la consola está limpia; Lighthouse de /alumno: Accesibilidad 100.

Hay que corregir:

1. Contenido: en el final del diagnóstico salió "Armé tus primeras misiones con dibujo y dibujar" (repetido). Causa: los intereses se llaman distinto en distintos lugares ("Dibujo" en el inicio, "Dibujar" en el menú). Definí UNA lista única de intereses con id estable y etiqueta (ej. { id: 'dibujo', etiqueta: 'Dibujo' }), usada por el menú, el inicio y el final. Guardá y comparás por id, nunca por texto. El texto final debe armarse bien con 1, 2 o 3 intereses ("fútbol", "fútbol y dibujo", "fútbol, dibujo y música").

2. Accesibilidad (Lighthouse del tutor: 89):
   a) El botón de ícono de arriba a la derecha del tutor (el del parlante) no tiene nombre accesible. Agregale aria-label ("Escuchar el último mensaje") y que haga eso.
   b) El nombre "Chasqui (Tutor)" y el rótulo de las burbujas usan el coral (#e15b47) sobre blanco: contraste 3,62:1. Usá --color-accent-strong (o accent-700) para texto.
   c) Hay un <main> dentro de otro <main> (el layout y el flujo del diagnóstico). Dejá UN solo <main> por página; el interior que sea <section>.

3. El tutor no debe darle la respuesta al alumno. Hoy:
   - La primera pregunta ("patea 3 penales y mete 2, ¿cuántos metió de cada 3?") trae el chip "Dos de tres" y el botón "2": son la respuesta final.
   - En la pregunta siguiente los botones ofrecen "2 grupos / 3 grupos / 6 grupos" y "Hay 2 grupos": una de esas opciones es la respuesta.
   Regla: las "Ideas para responder" son ESTRATEGIAS para empezar ("Dibujar los penales", "Contar de a 3", "Usar los dedos"), nunca un resultado. Si querés botones numéricos, que sean una forma de ESCRIBIR el número (teclado numérico) y no una lista de opciones que incluya la respuesta correcta. Ajustá el guion del tutor y los mocks para cumplirlo en todos los pasos.

4. En /alumno/diagnostico, mientras carga, se ve "1 de 0". Mostrá el esqueleto de carga (sin contador) hasta tener las preguntas.

5. Primaria: el rótulo "TUTOR PEDAGÓGICO SOCRÁTICO" de la tarjeta de inicio es jerga para un chico de 10 años. Cambialo por algo como "Tu compañero para pensar". Revisá que no haya otras palabras técnicas visibles para el alumno (socrático, pedagógico, diagnóstico).

6. Pantallas grandes (1280 px y más): hoy el contenido de docente y alumno queda en una columna centrada con mucho espacio vacío a los costados, y la maqueta no se ve así.
   - /alumno (primaria): en pantallas ≥ 768 px mostralo dentro de un marco de celular centrado (ancho máx. 420 px, borde y sombra suaves); en móvil, a pantalla completa.
   - /docente y /directivo: barra lateral fija de 232 px a la izquierda (componente NavLateral ya creado) y el contenido ocupando TODO el ancho restante, sin max-w. En móvil, la barra se convierte en un menú desplegable.
   Todavía no hace falta rehacer el contenido del panel docente (es del próximo prompt), solo el marco.

Pegame: salida de `npm run build`, y el resultado de Lighthouse de accesibilidad de /alumno/tutor (tiene que ser 100).
```
