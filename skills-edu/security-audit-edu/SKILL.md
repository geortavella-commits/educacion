---
name: security-audit-edu
description: >
  Usar cuando el usuario pida revisar la seguridad de la plataforma educativa
  o antes de cualquier push, deploy o piloto con una escuela: keys o tokens
  expuestos, variables de entorno en git, políticas RLS de Supabase, aislamiento
  entre escuelas y roles, .gitignore, configuración de MCP, datos de menores,
  llamadas a IA, monitoreo con datos personales, consentimiento. También
  activar si se detectan credenciales en cualquier archivo, si aparece un
  `service_role` fuera de una Edge Function, o si el usuario dice "¿está listo
  para mostrarle a la escuela?" o "antes de subir a producción".
  Adaptación de `security-audit`: mismas 5 capas más una sexta (menores e IA).
---

# Skill: Auditoría de Seguridad — Plataforma educativa

## Cuándo usar esta skill

Antes de push a main, antes de cada piloto, al detectar credenciales y cuando
se pida revisar seguridad. Con menores de por medio, la capa 4 (RLS) y la
capa 6 (menores e IA) son las más críticas.

## Las 6 capas (siempre en este orden)

Cada capa tiene su detalle en `references/`. Leer el archivo de la capa al
llegar a ella; no cargar todas juntas.

### CAPA 1 — Secretos expuestos en archivos del proyecto
Keys o tokens en código, `CLAUDE.md`/`AGENTS.md`, `.mcp.json`, `settings.json`.
Ver `references/capa-1-secretos.md` (heredada de `security-audit`).
Agregar: claves del proveedor de IA y `service_role` fuera de Edge Functions.

### CAPA 2 — `.gitignore` y `.claudeignore`
Cobertura de env files, certificados, `node_modules`, seeds con datos reales.
Ver `references/capa-2-gitignore.md` (heredada).

### CAPA 3 — Git history (el más peligroso)
Secretos commiteados alguna vez, aunque ya no estén en el árbol de trabajo.
Ver `references/capa-3-git-history.md` (heredada).
⚠️ Puede recomendar reescribir historial o force-push: nunca ejecutarlo sin
mostrar el hallazgo y esperar confirmación explícita.

### CAPA 4 — RLS, aislamiento por escuela y por rol
Ver `references/capa-4-rls-edu.md` (queries de control, patrones
problemáticos, matriz de intrusión).

### CAPA 5 — MCP y Claude Code
`.mcp.json` y `.claude/settings.json` sin keys literales.
Ver `references/capa-5-mcp.md` (heredada).

### CAPA 6 — Menores e IA
Consentimiento, datos mínimos, llamadas al modelo, monitoreo, entornos de
prueba. Ver `references/capa-6-menores-ia.md`.

## Referencias heredadas

Las capas 1, 2, 3 y 5 reutilizan los archivos `references/capa-1-secretos.md`,
`capa-2-gitignore.md`, `capa-3-git-history.md` y `capa-5-mcp.md` de la skill
`security-audit` original. **Copiarlos a esta carpeta** al instalar esta
skill; no están duplicados acá. Si no existen, pedir al usuario que los
agregue y continuar con las capas 4 y 6.

## Formato del reporte

```markdown
## Reporte de Seguridad — [proyecto] — [fecha]

### CAPA 1: Secretos
- [ ] ✅/❌ Sin keys en src/ ni en docs
- [ ] ✅/❌ `service_role` solo en Edge Functions y tests
- [ ] ✅/❌ Clave del proveedor de IA solo en el servidor

### CAPA 2: Archivos ignorados
- [ ] ✅/❌ .gitignore cubre .env y variantes
- [ ] ✅/❌ Seeds y dumps con datos reales no versionados

### CAPA 3: Git history
- [ ] ✅/❌ Sin secretos en el historial
- [ ] ✅/❌ pre-commit hook instalado

### CAPA 4: RLS y aislamiento
- [ ] ✅/❌ Todas las tablas de public con RLS
- [ ] ✅/❌ Funciones security definer con search_path fijo
- [ ] ✅/❌ Tests por rol pasan (alumno, docente, familia, directivo, entre escuelas)
- [ ] ✅/❌ El cliente no puede escribir en tablas de escritura sensible
- [ ] ✅/❌ Vistas con security_invoker; políticas de Storage

### CAPA 5: Claude Code / MCP
- [ ] ✅/❌ .mcp.json sin keys literales
- [ ] ✅/❌ settings.json bloquea .env

### CAPA 6: Menores e IA
- [ ] ✅/❌ Consentimiento registrado y texto validado
- [ ] ✅/❌ Ninguna llamada al modelo desde el cliente
- [ ] ✅/❌ Revisor obligatorio y registro de lo mostrado
- [ ] ✅/❌ Monitoreo sin datos personales ni conversaciones
- [ ] ✅/❌ Staging y preview con datos ficticios
- [ ] ✅/❌ Ingreso por código con vencimiento y aprobación del docente

### Hallazgos críticos (acción inmediata)
### Hallazgos medios (antes del próximo deploy o piloto)
### Recomendaciones
```

## Reglas que nunca se omiten

- Nunca ejecutar acciones destructivas (reescribir historial, rotar claves,
  borrar datos) sin mostrar el hallazgo y esperar confirmación.
- Un `service_role` fuera de una Edge Function es hallazgo crítico.
- Una tabla con datos de alumnos sin RLS es hallazgo crítico.
- Datos reales de alumnos en un entorno de prueba es hallazgo crítico.
- No pegar claves o tokens reales en el reporte; usar placeholders.
