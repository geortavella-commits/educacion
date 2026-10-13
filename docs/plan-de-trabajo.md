# Plan de trabajo — Plataforma educativa con IA (Fase 1: primaria + docente piloto)

Fuentes leídas: documento de la idea (PDF, 28 págs.), `Maqueta Educativa.html`, `supabase/config.toml` (local, `project_id = educacion`, sin migraciones todavía) y las 8 skills de `skills-edu/`.

## 1. Qué hay y qué falta

| Pieza | Estado |
|---|---|
| Documento de la idea | Completo. Define alcance, roles, matriz de acceso, plan de 10 pasos, MVP y reglas. |
| Maqueta HTML | ~22 pantallas en 4 tableros (docente, alumno móvil, directivo/primer uso/diagnóstico/escalera, ingreso/familia). Viene empaquetada (HTML comprimido en base64): no se puede copiar y pegar tal cual a Gemini, hay que extraerla. |
| Supabase local | Solo `config.toml`. Sin `migrations/`, sin seed. |
| Schema | 26 tablas escritas en `skills-edu/supabase-educacion-multiescuela/references/schema.sql`. **No fue ejecutado nunca.** |
| Repo del front | No existe (sin Vite, sin `src/`, sin git). |
| Skills | 8 listas. `arquitecto-edu` es la puerta de entrada; `diseno-integracion` rige el trabajo con la maqueta. |

## 2. Decisiones tomadas y pendientes

**Tomadas**
1. **Estilo:** se respeta la maqueta (Modernist: Archivo, acento rojo `#ec3013`) para docente, directivo y familia. **Para primaria se suaviza:** radios redondeados, bordes finos, acento menos agresivo (rojo más cálido/coral o complementar con un segundo color amigable), botones y zonas táctiles grandes, más espacio. Implementación: un solo conjunto de tokens con una variante `data-modo="primaria"` que sobreescribe radios, bordes y acento; el modo sale de `cursos.nivel`. Secundaria usa los tokens base.
2. **Provincia del piloto:** Córdoba. Se carga el diseño curricular de Córdoba (años 5º-6º, 3-4 áreas) más los NAP nacionales. La normativa vigente se verifica en la fuente oficial antes de cargar. En la maqueta, "Escuela N° 14, Rosario" pasa a una escuela ficticia de Córdoba.
3. **Transcripciones:** el docente ve la conversación completa del tutor (coincide con la política RLS del schema). Además, opción de un resumen generado por IA. El directivo ve solo el resumen, nunca la transcripción (la política RLS de `tutor_mensajes` ya no lo incluye; el resumen se guarda aparte). El alumno de secundaria debe saber qué ve el docente.
4. **Organización:** dos carriles en paralelo (front con Gemini + mocks / base y seguridad conmigo).

**Pendientes**
- **Proveedor de voz/IA: sin resolver.** Se diseña con una capa intercambiable (Edge Function con interfaz propia para el modelo y la transcripción) para no atarse a nadie. Para decidir: dónde procesa los datos, si entrena con ellos, costo, calidad en español rioplatense. Hasta decidirlo, el texto de consentimiento queda con `[proveedor a definir]` y el piloto no arranca sin cerrarlo con asesoría legal (Ley 25.326).
- **Resumen con IA:** al ser una llamada más al modelo, sigue las reglas de `datos-menores-ia`: solo desde servidor, mínimo contexto sin identificar al alumno, se registra qué se generó, y se menciona en el consentimiento.
- **Alcance de pantallas:** la maqueta incluye secundaria, directivo y escalera de impacto (fase 2 en el documento). Se replican igual, pero se conectan después.

## 3. Correcciones de contenido que la maqueta necesita (según `diseno-integracion`)

Detectadas al leerla; hay que aplicarlas **al replicar**, no copiarlas:

- **Códigos de clase:** la pantalla 3d muestra 5 casillas ("F U T 5 K") pero el texto dice "6 letras". La regla es 6+ caracteres, con vencimiento y aprobación docente. Usar 6 casillas.
- **Rosario:** la maqueta ubica la escuela en Rosario; el piloto es en Córdoba.
- **Nombres y mails que parecen reales** (Mariana Ríos, Laura Medina, `mrios@escuela14.edu.ar`, alumnos con apellido como "Santi Giménez" o "Valentina Acosta"): reemplazar por datos claramente ficticios y, para alumnos de primaria, solo `nombre_visible` (sin apellido).
- **Rótulos tipo nota:** en el perfil del alumno (3c) aparecen "Logrado / En proceso" por actividad, y en la rúbrica "En inicio / En proceso / Logrado". Revisar que no se lean como calificación; mantener "La calificación la decidís vos".
- **Etiquetas de grupo:** el alumno ve solo el nombre neutro ("Los goleadores del área"); "Refuerzo · Área y perímetro" es solo del docente (`grupos_internos`). Mantener esa separación en la UI y en los mocks.
- **Hipótesis con "Corregir":** todas las observaciones sobre un alumno van como hipótesis editables (ya está en la maqueta; replicarlo en cada pantalla donde aparezca).
- **Avance:** rotular siempre "Avance de misiones" (no son notas).
- **Contenido pedagógico de ejemplo** (física de frenado, matemática de la pantalla 6c): son textos de maqueta, no verdad curricular. No cargarlos como contenido real.
- **Números coherentes:** hoy cierran (64 alumnos = 24+22+18; 7 que necesitan apoyo = 2+1+4; 9 NAP de 12; 9 consentimientos = 3+2+4). Mantenerlos en los mocks compartidos.
- **Sin gamificación que clasifique:** en primaria alcanzan estrellas y racha; en secundaria nada de niveles ni títulos.

## 4. Mapa de pantallas de la maqueta (para repartir en prompts)

| Bloque | Pantallas | Rol | Fase |
|---|---|---|---|
| A. Base | Tokens + componentes (botón, tarjeta, chip, tabla, campo, diálogo, barra de progreso, avatar) | Todos | 1 |
| B. Ingreso | 3d Ingreso por código/QR (primaria) · 3e Consentimiento familiar | Alumno / Familia | 1 |
| C. Diagnóstico | 6a Mini-diagnóstico (mate) · 6b Intereses · 6d Final · 6c versión secundaria | Alumno | 1 (6c fase 2) |
| D. Alumno primaria | 2a Inicio · 2b Tutor con voz | Alumno | 1 |
| E. Docente núcleo | 1a Panel · 5a Cargar planificación · 3a Crear proyecto + cobertura · 3b Sugerencias de grupos · 3c Perfil del alumno · 4c Lista "Necesitan apoyo" · 5b Exportar planificación | Docente | 1 |
| F. Familia | 3f Vista de familia | Familia | 1 (secundaria en la idea original, pero está diseñada) |
| G. Secundaria | 2c Tutor abierto · 2d Proyecto · 7 Escalera de impacto | Alumno | 2 |
| H. Directivo | 4a Panel de escuela · 4b Alta de docentes y cursos | Directivo | 2 |

## 5. Plan de trabajo por etapas

El documento fija un orden "de lo que sostiene todo a lo que se ve". Como el front lo hace Gemini y lo de Supabase lo hacemos acá, se puede avanzar **en paralelo** con dos carriles.

### Etapa 0 — Preparación (esta semana)
- Extraer la maqueta a archivos útiles: un `tokens.css`, y un HTML por pantalla en `docs/maqueta/`. Es la referencia que se le pasa a Gemini (el HTML actual está comprimido y no sirve como entrada directa).
- Inicializar git y crear el repo; guardar el contexto del proyecto (`CLAUDE.md`/`AGENTS.md`, el texto ya está en el PDF, p. 21-22).
- Resolver las decisiones 1 y 2 de la sección 2.
- Crear los dos proyectos Supabase (desarrollo y staging, **solo datos ficticios**) y el proyecto en Vercel.

### Carril A — Front con Gemini (mocks, sin base)
1. **A1 · Andamiaje:** Vite + React + TS + Tailwind + PWA, estructura `src/{app,features,services,components,mocks,lib}`. Tokens de la maqueta a `tailwind.config`. *(Prompt 1)*
2. **A2 · Componentes compartidos** (bloque A). *(Prompt 2)*
3. **A3 · Ingreso y consentimiento** (bloque B) con estados cargando/vacío/error/sin permiso. *(Prompt 3)*
4. **A4 · Diagnóstico + alumno primaria** (bloques C y D). Variante por `cursos.nivel`. *(Prompts 4-5)*
5. **A5 · Docente núcleo** (bloque E). *(Prompts 6-8, una pantalla grande por prompt)*
6. **A6 · Familia** (bloque F). *(Prompt 9)*
7. Revisión en navegador (móvil + escritorio, consola limpia) tras cada bloque.
8. Fase 2: bloques G y H.

Todo lee datos de `src/services/` que, por ahora, devuelve `src/mocks/` tipados; después se cambia por Supabase sin tocar los componentes.

### Carril B — Base de datos y seguridad (con skills de Supabase)
1. **B1 · Migración inicial** desde `schema.sql`: correrla en el Supabase local (`supabase start`, necesita Docker, que ya está instalado), revisar políticas y completar las faltantes (Storage, vistas `security_invoker`).
2. **B2 · Tests de RLS por rol** (pgTAP): alumno, docente, familia, directivo, entre escuelas. Es condición para dar B1 por terminado.
3. **B3 · Seed ficticio** que replique los números de la maqueta (así el front real se ve igual a la maqueta).
4. **B4 · Edge Functions:** ingreso por código (valida código, crea cuenta tras aprobación docente), consentimientos.
5. **B5 · Tutor:** Edge Function con reglas socráticas + revisor obligatorio + registro; casos de prueba del aula.
6. **B6 · Currículo:** una provincia, 3-4 áreas, carga con validación humana antes de marcar vigente.
7. Cuando B1-B3 estén: generar tipos TS desde el schema y reemplazar los mocks por servicios reales (A→B).

### Etapa final — Cierre de fase 1
- Auditoría `security-audit-edu` (6 capas) antes de cualquier push a main o demo a una escuela.
- Deploy a staging con `vercel-deploy` (headers, `Permissions-Policy: microphone=(self)`).
- Pendientes no técnicos del piloto: texto de consentimiento validado, política de retención, protocolo ante señales de riesgo, elegir docente piloto.

## 6. Cómo trabajamos con Gemini (prompts ordenados)

Propuesta: una carpeta `docs/prompts-gemini/` con prompts numerados que se pegan **en orden**, cada uno autocontenido pero apoyado en los anteriores.

- **Prompt 0 — Contexto fijo** (se pega siempre al inicio de la sesión): qué es el producto, stack, reglas que nunca se omiten (versión corta de `arquitecto-edu` y `diseno-integracion`), tono (español rioplatense), regla de no copiar contenido pedagógico de la maqueta, datos ficticios.
- **Prompts 1…N — Uno por bloque o pantalla.** Cada uno lleva: objetivo, pantalla de referencia (HTML de la maqueta adjunto), rol y modo (primaria/secundaria), datos mock que debe usar, estados a cubrir, **correcciones de contenido** de la sección 3 que apliquen, criterios de aceptación.
- **Prompt de revisión** al cierre de cada bloque: checklist de `diseno-integracion` (tokens, estados, accesibilidad, sin colores hardcodeados, sin llamadas directas a Supabase).

Plantilla de cada prompt:

```
Contexto: [pegar Prompt 0]
Tarea: replicar la pantalla "<id y nombre>" del HTML de referencia adjunto.
Ruta/archivo: src/features/<rol>/<Pantalla>.tsx
Modo: primaria | secundaria | ambos
Datos: usar src/mocks/<archivo>.ts (tipado). Sin llamadas a Supabase.
Estados: cargando, vacío, error, sin permiso.
Correcciones respecto de la maqueta: <lista de la sección 3 que aplica>
No hacer: colores/espacios hardcodeados, fotos reales, textos de calificación.
Entregable: componente + mock + nota de qué decisiones tomaste.
```

## 7. Próximos pasos inmediatos

1. Definir el proveedor de voz/IA (único bloqueante grande, no frena el front ni la base).
2. Extraer la maqueta a `docs/maqueta/` (tokens + un HTML por pantalla).
3. Redactar el Prompt 0 y los prompts 1-3 para Gemini.
4. En paralelo, arrancar el Carril B corriendo el schema en Supabase local.
