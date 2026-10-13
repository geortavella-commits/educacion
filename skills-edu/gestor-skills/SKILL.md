---
name: gestor-skills
description: >
  Usar SIEMPRE que el usuario quiera crear una skill nueva para la plataforma
  educativa, revisar o auditar una skill existente (arquitecto-edu,
  supabase-educacion-multiescuela, datos-menores-ia, tutor-agentes,
  curriculo-datos, security-audit-edu, vercel-deploy, diseno-integracion),
  detectar solapamientos entre skills, o cuando pregunte "¿esto debería ser
  una skill?", "revisá mis skills", "¿cómo armo una skill para X?" u
  "optimizá el trigger de esta skill". También activar proactivamente si el
  usuario describe un procedimiento repetitivo de más de 3 pasos (candidato a
  nueva skill). Meta-nivel: no reemplaza a `arquitecto-edu`.
---

# Gestor de Skills — Meta-skill de la plataforma educativa

Esta skill NO reemplaza a `arquitecto-edu`. `arquitecto-edu` decide qué skill
de trabajo cargar en el día a día. Esta skill se activa cuando el usuario quiere
**crear, auditar o mejorar** las skills en sí.

## Inventario actual del proyecto

| Skill | Rol | Riesgo de solapamiento |
|-------|-----|------------------------|
| `arquitecto-edu` | Orquestador / punto de entrada | Con todas: sus flujos deben reflejar las descriptions de las demás |
| `supabase-educacion-multiescuela` | Schema, RLS y roles multi-escuela | Con `security-audit-edu` capa 4 |
| `datos-menores-ia` | Datos de menores, consentimiento, IA | Con `tutor-agentes` (qué llega al modelo) y `security-audit-edu` capa 6 |
| `tutor-agentes` | Reglas del tutor, revisor, casos de prueba | Con `datos-menores-ia` |
| `curriculo-datos` | Currículo versionado, cobertura, exportación | Con `supabase-educacion-multiescuela` (tablas) |
| `security-audit-edu` | Auditoría en 6 capas | Con `supabase-educacion-multiescuela` y `datos-menores-ia` |
| `vercel-deploy` | Deploy, headers, staging, monitoreo | Con `security-audit-edu` |
| `diseno-integracion` | Maqueta → React | Ninguno relevante |
| `gestor-skills` | Meta-skill | Con `arquitecto-edu` (no compiten) |

**Fuera de este proyecto** (viven en el repo del ERP): `arquitecto`,
`clonar-proyecto`, `supabase-comercio-multilocal`, `meta-ad-specifications`,
`stitch-integration`. No ofrecerlas ni mezclarlas acá.

Cuando el usuario pida auditar o crear, releer el SKILL.md real de la skill
en cuestión; no confiar en esta tabla si el usuario la actualizó.

## Precedencias entre skills que se tocan

- Cambios de base con datos de alumnos: `supabase-educacion-multiescuela`
  para schema y políticas; `datos-menores-ia` para qué datos se guardan.
- Contenido del tutor: `tutor-agentes` para reglas y pruebas;
  `datos-menores-ia` para qué datos llegan al modelo.
- Auditoría: `security-audit-edu` orquesta; sus capas 4 y 6 remiten a las
  otras dos.

## Modo A — Auditar una skill existente

Mostrar resultado como tabla ✅/⚠️/❌:

### 1. Frontmatter
- [ ] `name` coincide con el nombre de carpeta
- [ ] `description` dice QUÉ hace y CUÁNDO usarla
- [ ] `description` es "pushy": incluye frases que el usuario diría sin usar la
      palabra clave obvia

### 2. Longitud y estructura
- [ ] SKILL.md < 500 líneas; si se pasa, mover detalle a `references/` con
      punteros claros de cuándo leer cada archivo
- [ ] Bloques de código largos reutilizables → `references/` o `scripts/`
- [ ] Los pasos numerados no saltan lógica ni asumen contexto no explicado

### 3. Solapamiento
- [ ] Ver si dos skills podrían activarse para el mismo pedido; definir
      precedencia y anotarla en ambas descriptions

### 4. Seguridad y menores
- [ ] Ningún ejemplo trae una key o token real (usar `<REF>`, `<TOKEN>`)
- [ ] Las reglas de "nunca hacer X" están reforzadas, no mencionadas una vez
- [ ] Ningún ejemplo usa datos reales de alumnos
- [ ] Las reglas de menores e IA de `arquitecto-edu` no están contradichas

### 5. Verificabilidad
- [ ] Output verificable (código, SQL, checklist) → sugerir 2-3 test prompts
- [ ] Output subjetivo → no forzar test cases

Entregar:
```markdown
## Auditoría — [skill] — [fecha]
### ✅ Está bien
### ⚠️ Mejorable (no urgente)
### ❌ Corregir antes de seguir usándola
### Sugerencias de refactor
```

## Modo B — Crear una skill nueva

### Paso 1 — Entrevista (una sola tanda)
1. ¿Qué tarea repetitiva querés capturar? (un ejemplo reciente)
2. ¿Con qué frases debería activarse? (3-4 variantes, incluyendo cómo lo
   pedirías SIN pensar en el nombre)
3. ¿Cuál es el output esperado?
4. ¿Se solapa con alguna skill del inventario? ¿Reemplaza, complementa o es
   un caso especial?
5. ¿El resultado es verificable objetivamente?
6. ¿Toca datos de alumnos o IA? Si sí, debe respetar `datos-menores-ia`.

### Paso 2 — Draft del SKILL.md

```markdown
---
name: nombre-skill
description: >
  [Qué hace] + [cuándo usarla, con variantes de frases, pushy]
---

# Skill: [Nombre legible]

## Cuándo usar esta skill
## [Checklist previa si aplica]
## Pasos / Fases
## Reglas que nunca se omiten
## Señales de alerta
## Checklist final
```

### Paso 3 — Ubicar solapamientos
- Reemplaza → marcar la vieja como deprecated apuntando a la nueva
- Complementa → línea cruzada en ambas descriptions
- Caso especial → precedencia explícita

### Paso 4 — Actualizar `arquitecto-edu`
Agregar la fila a su tabla "Skills disponibles" y, si corresponde, un flujo
nuevo. Es el error más común: crear una skill y que nunca se ofrezca.

### Paso 5 — Test prompts
Proponer 2-3 prompts realistas y simular el resultado leyendo el SKILL.md
como lo haría una sesión nueva. Mostrar el resultado antes de darla por terminada.

## Reglas fijas de este meta-skill

- Nunca crear una skill sin chequear el inventario de solapamientos.
- Nunca dejar una `description` que solo repita el nombre de la skill.
- Siempre preguntar si la skill nueva debe registrarse en `arquitecto-edu`.
- Si una skill supera ~500 líneas, proponer el split a `references/`.
- Toda skill que afecte al tutor o a datos de alumnos incluye su checklist
  de menores e IA.
