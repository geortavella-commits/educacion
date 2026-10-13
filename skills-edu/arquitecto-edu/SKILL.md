---
name: arquitecto-edu
description: >
  Cargar SIEMPRE como primera y única skill al iniciar cualquier sesión de la
  plataforma educativa (primaria y secundaria, con IA, Supabase + Vite PWA).
  Es el punto de entrada: detecta el contexto, pregunta antes de actuar y
  carga otras skills SOLO cuando son necesarias. Diseñada para minimizar uso
  de tokens. Funciona en proyecto nuevo o existente. No usar en el repositorio
  del ERP: allí corresponde `arquitecto`.
---

# Arquitecto — Plataforma educativa

## Principios de operación

1. **Preguntar antes de asumir:** nunca cargar una skill sin confirmar con el usuario.
2. **Carga diferida:** leer otras skills solo cuando la tarea las requiere.
3. **Una skill a la vez**, salvo que la tarea lo exija.
4. **Mínimo contexto suficiente:** leer solo las secciones relevantes.
5. **Hay menores de por medio:** ante la duda sobre un dato de alumnos, no
   recolectarlo y consultar.

## Contexto fijo del proyecto

- Plataforma educativa con IA para primaria y secundaria en Argentina; entrada
  por la escuela, el docente es el punto de entrada.
- Fase actual: núcleo con primaria (5º-6º) y un docente piloto; secundaria en fase 2.
- Stack: Vite + React + TypeScript + Tailwind (PWA), Supabase (una sola base,
  aislamiento por `escuela_id`), Vercel.
- Estética: clara y simple (maqueta de Claude Design); de Stitch solo funciones.
- Documento de la idea del proyecto: ver `docs/`.

## Inicio de sesión — siempre hacer esto primero

Al arrancar, hacer UNA sola pregunta:

> "¿En qué estamos trabajando hoy?"
> - [ ] Feature nueva o modificación de código
> - [ ] Base de datos o RLS
> - [ ] Tutor, agentes o prompts
> - [ ] Currículo (carga, cobertura, exportación)
> - [ ] Datos de alumnos, consentimiento o IA
> - [ ] Implementar un diseño (maqueta → React)
> - [ ] Deploy o configuración de Vercel
> - [ ] Auditoría de seguridad
> - [ ] Configurar el proyecto
> - [ ] Crear o revisar una skill

Con la respuesta, seguir el flujo que corresponde. No leer ninguna skill todavía.

## Flujos por tarea

### Feature nueva / modificación de código
1. Preguntar: ¿toca la base, el tutor/IA, datos de alumnos o solo la interfaz?
   - Solo interfaz → trabajar directo; si hay maqueta, ofrecer `diseno-integracion`.
   - Toca la base → ofrecer `supabase-educacion-multiescuela`.
   - Toca el tutor o IA → ofrecer `tutor-agentes` y `datos-menores-ia`.
   - Toca datos de alumnos → ofrecer `datos-menores-ia`.
2. Al terminar un cambio de UI: ofrecer "¿Lo verifico en el navegador antes de
   darlo por terminado?" → si sí, cargar `chrome-devtools-mcp` (global).

### Base de datos / RLS
1. Preguntar: ¿schema nuevo, modificación o debugging de políticas?
2. Ofrecer: "Tengo una skill específica, ¿la uso?" → `supabase-educacion-multiescuela`.
3. Al final: "¿Querés que genere los tests de RLS por rol para estos cambios?"

### Tutor, agentes o prompts
1. Preguntar: ¿regla nueva, cambio de prompt, revisor o un error de contenido?
2. Ofrecer `tutor-agentes`. Todo cambio lleva su caso de prueba.
3. Si el cambio afecta qué datos llegan al modelo → ofrecer también `datos-menores-ia`.

### Currículo
1. Preguntar: ¿cargar una provincia, vincular proyectos, cobertura o exportar?
2. Ofrecer `curriculo-datos`. Nada se marca vigente sin validación humana.

### Datos de alumnos, consentimiento o IA
1. Ofrecer `datos-menores-ia` antes de guardar, mostrar o enviar cualquier
   dato nuevo de un alumno.

### Implementar un diseño
1. Confirmar: ¿llegaron capturas, HTML, design system o varios?
2. Ofrecer `diseno-integracion`.

### Deploy / Vercel
1. Preguntar: ¿primer deploy, problema en producción, variables, o demo para una escuela?
2. Ofrecer `vercel-deploy`.
3. Antes de cualquier push a main o de mostrar la app a una escuela:
   "¿Querés que haga una auditoría de seguridad primero?" → `security-audit-edu`.

### Auditoría de seguridad
1. Ofrecer: "La auditoría cubre 6 capas: keys, .gitignore, git history, RLS y
   aislamiento, MCP, y menores e IA. ¿Arranco?" → `security-audit-edu`.

### Crear o revisar una skill
1. Ofrecer `gestor-skills`.

### Configurar el proyecto
1. Preguntar: ¿proyecto nuevo o existente?

   **Nuevo:**
   - Preguntar: ¿repo en GitHub, proyecto en Vercel y los dos proyectos de
     Supabase (desarrollo y staging) ya creados?
   - Proponer orden: archivo de contexto → `.mcp.json` → `.claudeignore` →
     esquema y RLS → tests de RLS → CI → Vercel → monitoreo sin datos personales.
   - Confirmar antes de cada paso.

   **Existente:**
   - Preguntar qué mejorar: seguridad, base, tests, deploy, tutor.
   - Proponer solo lo relevante.
   - Confirmar antes de modificar cualquier archivo existente.

## Skills disponibles — solo mencionar cuando son relevantes

| Skill | Cuándo ofrecer |
|-------|----------------|
| `supabase-educacion-multiescuela` | Schema, migraciones, roles, políticas RLS, aislamiento por escuela |
| `datos-menores-ia` | Cualquier dato de alumnos, consentimiento, voz, logs, llamadas a IA |
| `tutor-agentes` | Prompts, reglas del tutor, revisor, casos de prueba, errores de contenido |
| `curriculo-datos` | Cargar o versionar currículo, NAP, cobertura, exportar planificación |
| `diseno-integracion` | Pasar capturas o HTML de Claude Design o Stitch a React |
| `security-audit-edu` | Antes de push a main o de un piloto, al detectar credenciales |
| `vercel-deploy` | Deploy, variables, headers, PWA que no se actualiza |
| `gestor-skills` | Crear, auditar o actualizar skills |
| `chrome-devtools-mcp` (global) | Verificar un cambio de UI en pantalla real |

## Reglas que nunca se omiten (sin cargar otra skill)

- Nunca escribir keys o tokens en archivos de código.
- Nunca deshabilitar RLS; toda tabla con datos de alumnos lleva RLS y `escuela_id`.
- Nunca `service_role` ni claves de IA en el cliente ni en variables `VITE_*`.
- Ninguna llamada al modelo de IA sale del cliente; todo lo que genera el
  tutor pasa por el revisor antes de llegar al alumno.
- Toda llamada a Supabase va por `services/`; nunca directo desde componentes.
- Datos de prueba y staging: solo ficticios.
- La app no genera calificaciones oficiales; las señales sobre el alumno son
  hipótesis que el docente puede corregir.
- Antes de modificar un archivo existente: mostrar el cambio y pedir confirmación.

## Señales de alerta — detener y consultar siempre

- JWT (`eyJ...`) o clave de IA hardcodeados
- Pedido de deshabilitar RLS o de usar `SECURITY DEFINER` sin justificación
- Datos reales de alumnos en un entorno de prueba, en un seed o en el repo
- Pedido de guardar informes, diagnósticos o de "etiquetar" a un alumno
- Un tercero nuevo que recibiría datos de alumnos (analítica, IA, email)
- Cambios directos en la base de producción
- Contenido del tutor con la respuesta final de una consigna
- Push a main sin tests de RLS pasando

## Generar el archivo de contexto — cuando no existe

Si en la raíz no hay `CLAUDE.md` / `AGENTS.md` (según la herramienta):

> "No encontré un archivo de contexto en este proyecto. ¿Querés que lo genere?"

Si acepta, preguntar en UNA tanda:
1. ¿Nombre del proyecto y fase actual?
2. ¿Supabase project-ref de desarrollo y de staging?
3. ¿Provincia y años del piloto?
4. ¿Qué roles y módulos están activos?
5. ¿Qué decisiones pendientes hay (por ejemplo, transcripciones del tutor)?

Combinar con lo que se pueda leer del proyecto (`package.json`, estructura de
`src/`, `.env.example`) y mostrar el archivo para aprobación antes de crearlo.
Estructura mínima: identidad y fase, stack, estructura de carpetas, roles,
reglas que nunca se omiten, señales de alerta, pendientes, decisiones tomadas.
