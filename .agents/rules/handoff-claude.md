---
trigger: always_on
---

# Configuración en Antigravity (Customizations)

Se crea desde el panel **Customizations**: `Rules → + Workspace` y `Workflows → + Workspace`. Usar "Workspace" (no "Global") para que valga solo en este proyecto.

---

## 1) Rule (Workspace) — nombre sugerido: `handoff-claude`

Activación: **Always On** (siempre activa). Pegar este texto:

```
Este proyecto se trabaja en ciclos con un revisor (Claude). El canal es el archivo docs/handoff/HANDOFF.md.

Al empezar CUALQUIER sesión o tarea:
1. Leé docs/handoff/HANDOFF.md completo antes de tocar código.
2. Seguí el "Protocolo" de ese archivo al pie de la letra.
3. Si ESTADO es CORRECCIONES_PENDIENTES, trabajá SOLO los puntos de "Correcciones de Claude". No agregues funciones nuevas ni rehagas lo que ya está aprobado.
4. Antes de dar algo por terminado corré `npm run build` y `npm run typecheck`. Si fallan, arreglalo; no pases a revisión.
5. Al terminar completá "Informe de Gemini" con honestidad (qué hiciste por cada punto, qué NO pudiste probar) y poné ESTADO: LISTO_PARA_REVISION.

Reglas fijas del producto: leé docs/prompts-gemini/00-contexto.md. Si una corrección las contradice, gana ese archivo y lo avisás en el informe.
Nunca pongas claves, datos reales de alumnos ni apellidos de alumnos en ningún archivo.
```

