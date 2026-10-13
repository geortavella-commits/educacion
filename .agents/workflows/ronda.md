---
description: 
---

Hacé una ronda del ciclo de revisión:
1. Leé docs/handoff/HANDOFF.md.
2. Si ESTADO no es CORRECCIONES_PENDIENTES (por ejemplo ya está APROBADO o LISTO_PARA_REVISION), no hagas nada y decime qué estado hay.
3. Si es CORRECCIONES_PENDIENTES: poné ESTADO: GEMINI_TRABAJANDO, resolvé cada punto numerado de "Correcciones de Claude", corré npm run build y npm run typecheck, completá "Informe de Gemini" y poné ESTADO: LISTO_PARA_REVISION.
4. Terminá avisándome en una línea: "Ronda N lista para revisión".
