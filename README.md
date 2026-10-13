# Plataforma educativa con IA (piloto Córdoba)

Tutoría y proyectos por misiones para primaria y secundaria. Front Vite + React + TypeScript + Tailwind (PWA), base y funciones en Supabase.

Reglas fijas del producto: nada califica ni clasifica a los alumnos, la IA solo propone (la docente decide), y los datos de menores se reducen al mínimo.

## Correr en local

```
npm ci
supabase start                       # base local (Docker)
npm run dev                          # usa .env.local → Supabase local
```

Cuentas de prueba (solo ficticias): `docente.laura@ficticio.test`, `alumno.mateo@ficticio.test`, `familia.mateo@ficticio.test`, `directivo@ficticio.test`, contraseña `educacion123`.

## Entornos

| | Local | Nube |
|---|---|---|
| API | `http://127.0.0.1:54321` | `https://bhzfxwveiqenskwqxlug.supabase.co` |
| Front | `npm run dev` (`.env.local`) | `npm run build` (`.env.production` o variables de Vercel) |

Variables del front (todas públicas): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_USAR_SUPABASE`.
Los secretos de las funciones (`OPENAI_API_KEY`, `OPENAI_MODEL`, `IA_MAX_POR_DIA`) viven en Supabase, nunca en el front ni en este repo.

## Cambios de base y funciones

```
supabase migration up && supabase test db      # probar en local
supabase db push --linked --dry-run            # ver qué aplicaría en la nube
supabase functions deploy --project-ref bhzfxwveiqenskwqxlug --use-api
```

Detalle en `skills-edu/supabase-educacion-multiescuela/SKILL.md` y `docs/`.
