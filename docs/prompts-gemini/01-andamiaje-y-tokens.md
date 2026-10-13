# Prompt 1 — Andamiaje, tokens y modos

Adjuntar: `docs/maqueta/tokens.css` (tokens base de la maqueta, sistema "Modernist").

```
Tarea: crear el proyecto base y el sistema de tokens.

1. Proyecto Vite + React + TypeScript + Tailwind + vite-plugin-pwa con las carpetas del contexto. React Router para las rutas. Fuente Archivo (pesos 400-800) desde Google Fonts.
2. tailwind.config: convertir en tokens los valores de tokens.css adjunto (colores bg, surface, text, accent, accent-2 con sus rampas 100-900, neutrales 100-900, espacios, sombras). NO uses colores fuera de estos tokens.
3. Modo base (docente, directivo, familia, secundaria) = estilo de la maqueta: radios 0, bordes de 1-2 px marcados, acento rojo #ec3013.
4. Modo primaria = estilo SUAVE, aplicado con [data-modo="primaria"] sobreescribiendo variables CSS:
   - radios: sm 8px, md 16px, lg 24px
   - bordes: 1px, color de divisor más claro
   - acento: el coral accent-2 (#e15b47) en lugar del rojo #ec3013; fondo más cálido (#fbf7f4); superficie #fff
   - botones y zonas táctiles de mínimo 48 px de alto, tipografía de cuerpo 17-18 px
   - más espacio entre elementos (usar space-4 y space-6 como base)
   Los tokens de Tailwind deben leer variables CSS (var(--color-accent), var(--radius-md)…) para que el cambio de modo funcione sin tocar componentes.
5. Un componente <ModoProvider nivel="primaria|secundaria"> que pone data-modo en el contenedor raíz.
6. Una página /sistema (solo desarrollo) que muestre los tokens en ambos modos, lado a lado, para revisarlos visualmente.
7. Layouts vacíos con rutas: /docente, /alumno, /familia, /directivo.
8. src/services/ y src/mocks/ con un primer ejemplo tipado (curso, usuario) para fijar el patrón.

No hagas todavía pantallas ni componentes de UI (viene en el próximo prompt).
Criterio de aceptación: `npm run dev` levanta, /sistema muestra los dos modos, no hay colores hardcodeados en ningún componente, y `npm run build` pasa sin errores de TypeScript.
```
