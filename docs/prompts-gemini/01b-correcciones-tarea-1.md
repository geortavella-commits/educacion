# Prompt 1b — Correcciones a la Tarea 1 (pegar en el mismo hilo, antes del Prompt 2)

```
Revisé la Tarea 1. La estructura, los tokens y el selector de modos están bien. Hay que corregir esto antes de seguir:

1. `npm run build` FALLA (dijiste que pasaba). Error: src/components/Card.tsx(4,18) TS2430: CardProps extiende HTMLAttributes<HTMLDivElement> pero `title` es ReactNode (el original es string). Usá Omit<HTMLAttributes<HTMLDivElement>, 'title'> o renombrá la prop. Corré `npm run build` y pegame la salida completa; no marques nada como terminado sin eso.

2. Hiciste componentes (Button, Card, Tag, ProgressBar) que no te pedí en esta tarea. Los dejo, pero se revisan en el Prompt 2: no los des por cerrados.

3. Contraste (accesibilidad). Texto claro sobre el acento no llega a 4,5:1:
   - modo base: #f3f2f2 sobre #ec3013 = 3,76
   - modo primaria: #fbf7f4 sobre #e15b47 = 3,41
   Corregí SOLO con tokens:
   - base: los botones primarios usan fondo accent-600 (#dd2b0f) y texto blanco (#ffffff) o, mejor, definí --color-accent-strong = #c42a10 (blanco sobre él = 5,7).
   - primaria: --color-accent-strong = #bf4231 (blanco sobre él = 5,2) para fondo de botones; el coral #e15b47 queda para decoración (íconos, bordes, fondos suaves), NUNCA para texto chico.
   - agregá --color-on-accent (blanco) y usalo en lugar de text-bg para texto sobre acento.
   - el acento usado como COLOR DE TEXTO (kicker, enlaces) debe usar accent-700 o accent-strong, no el acento puro.

4. Tamaños de letra: usaste text-[9px], text-[10px] y text-[11px]. Mínimo 12 px en todo el producto (14 px en primaria). Reemplazalos por una escala en tailwind.config (fontSize: xs, sm, base, lg…) leyendo variables CSS, y quitá los text-[Npx] y min-h-[48px] arbitrarios (usá la clase de token de la altura táctil: min-h-touch).

5. Faltan archivos que referenciás:
   - /avatars/*.svg (los mocks apuntan a esos archivos y no existen): creá avatares ilustrados SVG simples (formas y colores de los tokens, NO personas fotográficas) en /public/avatars/.
   - íconos PWA pwa-192x192.png y pwa-512x512.png, favicon.ico, apple-touch-icon.png en /public (sirven de placeholder, un cuadrado con el acento).
   Después verificá en el navegador que no haya 404 en la consola.

6. Mocks:
   - 'Carlos Familia' como nombre no tiene sentido: poné un nombre ficticio de adulto (ej. "Marcelo", "Andrea") y usá solo el nombre visible en pantalla.
   - Los alumnos están bien (sin apellido). Mantenelo.

7. Agregá un .gitignore (node_modules, dist, .env*, *.local, supabase/.temp, .DS_Store) y un .env.example vacío con un comentario: "nunca poner claves aquí con prefijo VITE_".

8. Agregá scripts: "lint" (eslint), "typecheck" (tsc --noEmit) y "test" (vitest) con un test mínimo que verifique que ModoProvider pone data-modo="primaria" para nivel primaria.

Cuando termines: pegame (a) la salida de `npm run build`, (b) la de `npm run typecheck`, (c) una lista de lo que cambiaste por cada punto.
```
