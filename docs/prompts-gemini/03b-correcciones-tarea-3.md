# Prompt 3b — Correcciones a la Tarea 3 (pegar en el mismo hilo)

```
Probé la app en un navegador real (Chrome, 390 px). Lo que está bien: no hay scroll horizontal en /, /alumno, /docente, /familia ni /directivo; el flujo código → nombre y avatar → espera de aprobación funciona; los estados de consentimiento (otorgado, revocado, sin permiso) y los errores de código vencido, incorrecto y de red se ven bien; Lighthouse: Accesibilidad 100 y Buenas prácticas 100.

Quedan estos puntos:

1. BUG — "Demasiados intentos": al forzar ese estado, las 6 casillas y el botón "Entrar" quedan deshabilitados pero NO aparece ningún mensaje ni cuenta regresiva. El alumno ve un formulario muerto. Mostrá un aviso con role="alert": "Probaste muchas veces. Esperá 1 minuto y volvé a intentar." con cuenta regresiva visible (mm:ss) que, al llegar a cero, habilita de nuevo las casillas.

2. En /sistema, la tabla se pasa 4 px del ancho en 390 px (scroll horizontal). Envolvela en un contenedor con overflow-x-auto.

3. En /alumno, el título "Chasqui Alumno" se corta con puntos suspensivos en 390 px. Dejá que el título haga salto de línea o acortalo a "Chasqui" y mostrá el rol debajo.

4. Consola: hay un aviso "No label associated with a form field" (2 campos). Encontralos (probablemente en /sistema) y asociales su <label> o aria-label.

5. Los dos avisos de React Router (v7_startTransition y v7_relativeSplatPath): activá esos future flags en el router para limpiar la consola.

6. Avatares del ingreso: usás emojis (🦊🦉🚀🎨⭐⚽). Está bien como ilustración, pero se ven distinto en cada sistema operativo. Dejalo anotado como pendiente (reemplazar por SVG propios antes del piloto); no lo cambies ahora.

Pegame: salida de `npm run build` y confirmá en qué anchos (360, 390, 768, 1280) verificaste que no hay scroll horizontal.
```
