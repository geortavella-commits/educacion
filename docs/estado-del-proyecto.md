# Estado del proyecto — 2026-10-14

Para retomar rápido. Todo lo marcado como "verificado" se probó de verdad; lo que no, está en "Qué NO se probó".

## En una mirada

| | |
|---|---|
| Qué es | Plataforma educativa con IA para primaria/secundaria (piloto Córdoba). Docente arma proyectos por semanas con misiones; el alumno las resuelve con pistas; la familia ve resumen y consiente. |
| Repo | https://github.com/geortavella-commits/educacion (rama `main`) |
| Front en producción | Vercel, proyecto `educacion` (cuenta `geortavella-4008s-projects`, plan Pasatiempo) |
| Base en la nube | Supabase `educacion`, ref `bhzfxwveiqenskwqxlug`, Oregon (cuenta org `mdjxgsilkjtavqdgkykm`) |
| Base local | Supabase en Docker (`supabase start`): API 54321, DB 54322, Studio 54323 |
| Reglas fijas | Nada califica ni clasifica al alumno. La IA solo propone; la docente decide. Datos de menores al mínimo. Detalle en `docs/prompts-gemini/00-contexto.md` |

## Cómo se trabaja (comandos)

```
npm ci                               # una vez
supabase start                       # base local
powershell -ExecutionPolicy Bypass -File scripts\serve-funciones.ps1   # funciones locales (lee C:\Users\dario\.chasqui\ia.env)
npm run dev                          # front contra el LOCAL (.env.local)
npm run dev -- --mode production     # front contra la NUBE sin editar nada (.env.production)
npm run build                        # build de producción → usa .env.production (nube)
```

Verificación habitual: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run src/lib src/components`, `supabase test db`, y los scripts `scripts/prueba-misiones.py` (40), `scripts/prueba-planificacion.py` (25). En Windows, los scripts con acentos necesitan `PYTHONIOENCODING=utf-8` y `python -I`; los heredocs con comillas dan problemas: escribir el `.py` a archivo y correrlo.

### Llevar cambios a la nube (siempre desde el local, ya probado)
1. Migración nueva en `supabase/migrations/`, probar con `supabase migration up` + `supabase test db`.
2. `supabase db push --linked --dry-run` y después sin `--dry-run`.
3. Funciones: `supabase functions deploy --project-ref bhzfxwveiqenskwqxlug --use-api`.
4. Front: `git push` a `main` → Vercel construye solo.
5. Los datos **no** se sincronizan entre local y nube (hay un procedimiento de copia en `skills-edu/supabase-educacion-multiescuela/SKILL.md`).

### Git y Vercel (importante)
- En el plan Pasatiempo, Vercel **bloquea** los commits cuyo autor no sea la cuenta dueña. Los commits de este repo tienen que estar firmados como `geortavella-commits <geortavella-commits@users.noreply.github.com>` (ya configurado en el repo, no en el global).
- Variables del proyecto Vercel (públicas): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_USAR_SUPABASE=true`. `.env.*` está ignorado por git; `.env.production` es solo local.
- `vercel.json` ya tiene: reescritura a `index.html` (rutas del navegador), caché de PWA y cabeceras de seguridad con CSP en modo "solo reportar".

## Qué hay construido

**Base (19 migraciones, 41 tablas, RLS por rol, 108 pruebas pgTAP)**: organización y roles; ingreso de primaria por código; invitaciones de familia; grupos por proyecto; devoluciones; acceso nuevo de alumno; registro de uso de IA; misiones con respuesta y claves secretas (`misiones_claves`, hasta **3 pistas** en `pistas`); currículo por metas/aprendizajes/indicadores; planificación por semanas (`etapas`, `mision_habilitada`); valoración por misión (`valoraciones_mision`); misión "hecha en papel"; diagnóstico por año (`diagnostico_items`/`diagnostico_resultados`); cierre de funciones a `anon` (m. 19).

**Funciones (16)**: `completar-mision`, `verificar-respuesta` (siempre corrige), `pedir-pista` (de a una: `accion` = `ver` | `siguiente`), `consentimiento`, `canjear-codigo`, `aprobar-ingreso`, `reclamar-ingreso`, `invitar-familia`, `canjear-invitacion`, `generar-acceso`, `canjear-acceso`, `generar-codigo-clase`, y las de IA: `ia-sugerir-proyecto`, `ia-planificar-proyecto` (propone también tipo de respuesta, respuesta correcta y 3 pistas, con filtros), `ia-borrador-devolucion`, `ia-nombrar-grupos`. Públicas (sin JWT): `canjear-codigo`, `reclamar-ingreso`, `canjear-invitacion`, `canjear-acceso`.

**Currículo cargado**: Progresiones de Aprendizaje de Córdoba 2025 (versión en consulta, **sin validar**): 73 metas, 607 aprendizajes, 2.844 indicadores, 9 áreas. Importador: `scripts/importar-curriculo.py`.

**Docente**
- Proyecto por semanas con acordeón, "Todo el curso" + grupos, cobertura curricular con buscador, planificación con IA (3–4 semanas), estados (en curso / cerrar / anular), misiones con tipo de respuesta (abierta, número, texto, opción) y 3 pistas.
- Cuando la IA propone un plan, la docente lo ve en el formulario con la respuesta y las pistas; **crear el proyecto = aprobarlo todo**.
- Hoja imprimible por semana (`/docente/proyectos/:id/imprimir`) con opción de respuestas solo para ella; familia: `/familia/imprimir?hijo=`.
- Por misión de un alumno: marca suave (bien encaminado / pensalo más / hablemos) + mensaje; "marcar como hecha en papel"; sin notas.
- Perfil del alumno: avance, hipótesis, actividad, **punto de partida del diagnóstico** (aciertos de total por área, solo para la docente).

**Alumno**: inicio con misiones agrupadas por proyecto y aviso "Tu seño te dejó un mensaje" en la tarjeta; misión con tipo de respuesta propio y **pistas de a una (hasta 3)**; diagnóstico con preguntas del año (primaria 1º–6º, 3 por año) más gustos y forma de aprender. **El chat de Chasqui se sacó** (era un guion sin IA); la ruta `/alumno/tutor` redirige al inicio.

**Familia**: resumen del hijo, consentimiento, invitación por WhatsApp, acceso en otro dispositivo, imprimir misiones de las semanas habilitadas.

**Tema visual**: `.tema-adultos` (docente, directivo, familia, ingreso, portada) y `.tema-alumno` (Gemini). Clases `btn-3d*`, `nav-item-activo`, `.pulso-llamado`.

## Qué NO se probó
- Pantalla del alumno con pistas **en Chrome sobre un proyecto habilitado real**: se verificó contra la función y en una misión (3 de 3), no el recorrido completo.
- Imprimir: no se abrió el diálogo de impresión ni se generó un PDF real; no se vio el corte de páginas con una semana muy larga.
- La IA con secretos cargados **en la nube** (la clave la carga el usuario). En local se probó con el modelo real.
- Reglas de `valoraciones_mision` y `marcar_mision_en_papel` para una misión de **otro curso** (hay un solo curso en la base).
- Secundaria: no hay banco de diagnóstico ni validación de pantallas.
- La suite `npm run test:e2e` no se corrió después de los últimos cambios (exige `supabase db reset`).

## Decisiones y pendientes del usuario
1. **Secretos en Supabase (nube)**: `OPENAI_API_KEY`, `OPENAI_MODEL`, `IA_MAX_POR_DIA`. Los carga la persona, nunca el asistente.
2. **Auth en el panel**: Site URL y Redirect URLs con la URL de Vercel; apagar el registro abierto; protección de contraseñas filtradas; SMTP propio para mails.
3. **Cuentas ficticias abiertas en la nube** (`@ficticio.test`, contraseña `educacion123`): borrarlas o cambiarlas antes de cargar chicos reales.
4. **Diagnóstico**: el usuario pidió marcar "retrasado/avanzado frente a la media"; **no se hizo** (choca con la regla de no clasificar y 3 preguntas por área no lo sostienen). Pendiente decidir si el resultado por área alimenta el enfoque de las propuestas o queda solo como información. Un docente debería validar el banco de 18 preguntas.
5. **Chat con IA**: decidido sacarlo hasta que haya IA que oriente. Alternativa evaluada: chat detrás de las pistas.
6. **Idea abierta — refuerzo en casa**: familias suben 2–3 fotos de la tarea y la IA arma misiones de práctica. Recomendación dada: producto aparte, no guardar fotos, mostrar "lo que entendí" editable, ejercicios análogos (no resolver la tarea), clave solo para el adulto. Sin decidir.
7. **Texto de consentimiento** con asesoría legal (Ley 25.326): hoy dice "[proveedor a definir]". Falta también retención/borrado y guardar resultados del diagnóstico como dato nuevo del alumno.
8. **Validación humana del currículo** de Córdoba.
9. **Calidad de la IA**: a veces devuelve menos semanas de las pedidas (hay un reintento) y propone respuestas a revisar; siempre las revisa la docente.

## Limitaciones conocidas del plan de IA
- Para ideas de ciencias casi todas las misiones salen "abiertas"; las respuestas verificables aparecen sobre todo en matemática.
- La validación descarta pistas que contienen la respuesta y respuestas con valores distintos; aun así son un borrador a revisar.

## Cómo trabajamos
- Gemini hace front del alumno con el ciclo `docs/handoff/HANDOFF.md` (reglas en `.agents/rules/handoff-claude.md`, workflow `/ronda`). Claude revisa en Chrome real, es dueño de Supabase, seguridad y funciones, y puede tocar el front cuando conviene.
- El navegador de pruebas (MCP chrome) es **el mismo** que usa el usuario: los logins de Claude le pisan la sesión.
- Guía de prueba manual: `docs/guia-de-prueba.md`. Configuración de IA: `docs/ia-configuracion.md`.
- Skills: `skills-edu/supabase-educacion-multiescuela` (base y entornos), `skills-edu/vercel-deploy` (deploy), `skills-edu/security-audit-edu`.
