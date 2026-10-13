# Prompt 2b — Correcciones a la Tarea 2 (pegar en el mismo hilo, antes del Prompt 3)

```
Revisé la Tarea 2 corriendo la app y sacando capturas. La galería /sistema se ve bien y los dos modos se distinguen claramente. `npm run build` pasa. Pero quedan problemas, y las correcciones del Prompt 1b NO están aplicadas (no existe public/, ni .gitignore, ni los tokens de contraste). Aplicá TODO el Prompt 1b y además esto:

1. BUG en móvil (390 px de ancho): la página /alumno se desborda horizontalmente. El texto "¿Listo para explorar las misiones de hoy con C…", la barra "Fase 1: Ciencia…", los botones "Continuar con Chasqui" y "Ver cuaderno de notas" y el link "← Inicio" quedan cortados por el borde derecho. Causas probables: contenedores sin min-w-0, anchos fijos o padding horizontal doble. Corregí para que NO haya scroll horizontal en 360, 390 y 768 px, y el encabezado se acomode (el selector de modo no debe empujar el título: pasalo debajo en móvil).
   Revisá lo mismo en /docente, /familia, /directivo y /sistema.

2. Contraste de los botones y de los textos sobre acento (ver 1b, punto 3): en las capturas el texto blanco sobre el rojo/coral sigue sin llegar a 4,5:1. Usá --color-accent-strong y --color-on-accent.

3. Textos de 11 px (kickers, labels de la barra inferior, "Fase 1: Ciencia…"): subir a 12 px mínimo (14 px en primaria). Quitar los text-[Npx] y los min-h-[…]/min-w-[48px] arbitrarios.

4. Íconos: estás usando emojis (🚀, 📖, 💡, ⚠) como íconos de interfaz. Reemplazalos por íconos de lucide-react (ya está instalado) con aria-hidden y un texto accesible cuando el ícono solo comunica algo.

5. Estado deshabilitado: el botón "Deshabilitado" (opacidad 50 %) no se lee. Agregá un estilo de deshabilitado con contraste suficiente (fondo neutral, texto neutral-700) en lugar de bajar la opacidad.

6. En la tabla del /sistema, los estados "Al día", "Completado", "En progreso" parecen calificaciones. Cambialos por "Avance de misiones: 4 de 5" sin etiquetas valorativas, o por "Sin novedades / Completó todo / Está avanzando". No uses "Al día".

7. Probá con teclado: Tab recorre Button, Radio, SegmentedControl y Dialog en orden lógico; el Dialog devuelve el foco al botón que lo abrió al cerrarse y atrapa el foco mientras está abierto. Si no lo hace, implementalo.

Al terminar pegame: la salida de `npm run build`, de `npm run typecheck`, y una captura mental/lista de los anchos donde verificaste que no hay scroll horizontal.
```
