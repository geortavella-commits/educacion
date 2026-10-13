# Capa 6 — Menores e IA

Leer al llegar a la capa 6 de la auditoría. Reglas detalladas en la skill
`datos-menores-ia`.

## Qué se audita y cómo

### Consentimiento
- Existe tabla `consentimientos` con versión del texto, quién y cuándo.
- La Edge Function del tutor **rechaza** la sesión si no hay consentimiento
  `otorgado` vigente. Probarlo.
- El texto menciona IA de terceros, voz y quién ve el progreso. Validado con
  asesoría legal.

### Llamadas al modelo
```bash
# Buscar usos del proveedor o claves en el código del cliente
grep -rniE "api[_-]?key|sk-|anthropic|openai|generativelanguage" src/ --include=*.ts --include=*.tsx
# Buscar variables de entorno expuestas
grep -rn "VITE_" src/ .env.example | grep -iE "key|secret|token|service"
```
- Ninguna llamada al modelo desde `src/`: deben estar en `supabase/functions/`.
- Variables de IA sin prefijo `VITE_`.
- Límites por alumno implementados (mensajes por día, largo máximo).
- El texto del alumno nunca se concatena al prompt del sistema.

### Revisor
- Todo mensaje del tutor tiene `revision` no nula en `tutor_mensajes`.
- Existe un set de casos de prueba (ver `tutor-agentes/references/casos-de-prueba.md`)
  corriendo y con resultados guardados por versión.

### Datos mínimos
- Revisar el schema: no hay columnas de apellido, email, foto, ubicación ni
  diagnóstico para alumnos de primaria.
- Las señales se guardan como `hipotesis`.
- No se guarda audio.

### Monitoreo y analítica
- Sentry u otros: scrubbing de datos personales, sin replay de sesión, sin
  contenido de conversaciones.
- Logs del servidor sin texto de mensajes de alumnos.
- Analítica sin identificadores del alumno hacia terceros.

### Entornos
- Staging, preview y desarrollo con seeds ficticios.
- Ningún dump de producción en el repo ni en entornos de prueba.
- Variables de Preview apuntan al proyecto de staging, no al de producción.

### Ingreso de primaria
- Código con 6 caracteres o más, con vencimiento, guardado como hash.
- Límite de intentos; aprobación del docente antes de crear la cuenta.
- La cuenta se crea desde Edge Function con `service_role`.

### Retención y borrado
- Política de retención definida y documentada.
- Existe un proceso de borrado verificable para revocación y fin de ciclo.

## Severidad

| Hallazgo | Severidad |
|----------|-----------|
| Llamada al modelo desde el cliente o clave de IA en el bundle | Crítico |
| Datos reales de alumnos en staging o en el repo | Crítico |
| Tutor funciona sin consentimiento | Crítico |
| Mensajes del tutor sin pasar por el revisor | Crítico |
| Monitoreo recibe contenido de conversaciones | Alto |
| Sin política de retención | Alto |
| Código de clase sin vencimiento o corto | Alto |
| Texto de consentimiento sin validación legal | Alto (bloquea el piloto) |
