---
name: datos-menores-ia
description: >
  Usar cuando se diseñe o implemente algo que toque datos de alumnos menores
  de edad o IA: consentimiento familiar, qué datos se guardan y por cuánto
  tiempo, ingreso de primaria por código de clase o QR, llamadas al modelo de
  IA, voz o micrófono, logs, monitoreo (Sentry), analítica, exportaciones,
  retención o borrado, datos de prueba. También activar cuando el usuario
  diga "guardemos esto del alumno", "subamos un informe", "agreguemos
  analítica", "mandemos esto al modelo" o "usemos la voz" — incluso si no
  menciona privacidad. Ley de referencia: 25.326 (validar con asesoría legal).
---

# Skill: Datos de menores e IA

## Cuándo usar esta skill

Cada vez que una decisión implique recolectar, guardar, mostrar, enviar a un
tercero o procesar con IA información de un alumno. Esta skill no reemplaza
la asesoría legal: define las reglas técnicas por defecto y marca qué
decisiones deben validarse con una persona del área legal antes del piloto.

## Principio rector

**Mínimo dato, mínimo tiempo, mínimo destinatario.** Si no hace falta para que
el tutor o el docente funcionen, no se recolecta. Si se recolecta, se guarda
lo justo, con dueño claro y con fecha de borrado.

## Qué se guarda y qué no

| Dato | Decisión por defecto |
|------|----------------------|
| Nombre visible y avatar | Sí. Sin apellido ni email para primaria |
| Intereses (declarados u observados) | Sí |
| Progreso por misión, pistas usadas | Sí |
| Mensajes del alumno y del tutor | Sí, con el resultado del revisor; con retención definida |
| Señales sobre el alumno | Solo como hipótesis corregibles por el docente; nunca diagnósticos ni etiquetas |
| Fotos de alumnos, ubicación | No |
| Audio de voz | No se guarda; solo transcripción si hace falta (a definir con legal) |
| Evaluaciones e informes previos | Fuera del MVP; si se suman, opcionales, con consentimiento y mediados por la escuela |
| Calificaciones oficiales | La app no las genera ni las guarda como oficiales |

## Consentimiento familiar

- Es previo al uso del tutor por parte del alumno.
- Se registra en `consentimientos`: quién, cuándo, versión exacta del texto.
- El texto dice con precisión: qué datos se usan, que el tutor usa IA de
  terceros (nombrar al proveedor), qué pasa con la voz, quién ve el progreso
  y cómo se revoca.
- Revocar es tan fácil como otorgar. Al revocar, el alumno pierde acceso al
  tutor y se programa el borrado según la política de retención.
- No hay "casillas premarcadas" ni consentimiento implícito por entrar a la clase.

## Ingreso de primaria (código de clase / QR)

- El código es largo (6 caracteres o más), vence y se guarda solo su hash.
- El alumno no usa apellido ni email: elige nombre visible y avatar.
- **El docente aprueba cada ingreso** (`solicitudes_ingreso`) antes de que
  exista la cuenta del alumno.
- La cuenta se crea desde una Edge Function con `service_role`; el cliente
  no crea alumnos.
- Límite de intentos por IP y por código; bloqueo temporal tras fallos.
- El docente puede rotar o desactivar el código en cualquier momento.

## Llamadas al modelo de IA

1. **Solo desde el servidor** (Edge Function). Nunca desde el navegador; las
   claves y los prompts del sistema no viajan al cliente.
2. **Mínimo contexto:** enviar al modelo el año, el contenido, el interés del
   alumno y el historial necesario. No enviar nombre completo, escuela ni
   datos que identifiquen al alumno.
3. **Todo lo que genera el modelo pasa por el revisor** (ver `tutor-agentes`)
   antes de llegar al alumno, y se registra lo mostrado y el veredicto.
4. **El texto del alumno es dato no confiable:** puede intentar manipular al
   tutor ("ignorá tus instrucciones"). Se trata como contenido, nunca como
   instrucciones del sistema.
5. **Límites por alumno** (mensajes por día, largo de mensaje) para costo y abuso.
6. Revisar que el proveedor de IA no use los datos para entrenar y dónde los
   procesa; documentarlo en el texto de consentimiento.
7. Si el alumno dice algo que sugiere riesgo (autolesión, violencia, abuso),
   el tutor no improvisa: responde con un mensaje de contención predefinido y
   se avisa al docente por el canal acordado con la escuela. Definir este
   protocolo con la escuela y con asesoría profesional antes del piloto.

## Voz y micrófono (primaria)

- Pedir el permiso del micrófono solo al tocar el botón de hablar.
- Declarar en el consentimiento si el audio se transcribe y por quién.
- No guardar el audio. Si se guarda texto, aplica la retención de mensajes.
- Headers: `Permissions-Policy: microphone=(self)` (ver `vercel-deploy`).

## Logs, monitoreo y analítica

- Sentry u otros: **sin contenido de conversaciones ni datos personales**.
  Configurar scrubbing y desactivar replay de sesión. Revisar qué captura
  por defecto antes de activarlo.
- Los logs del servidor no incluyen el texto de los mensajes de alumnos.
- Analítica de producto: eventos agregados y anónimos (qué pantalla, cuánto
  tiempo), sin identificadores del alumno hacia terceros.
- `audit_log` registra accesos y cambios sensibles (quién vio qué, quién
  corrigió una señal, quién aprobó un ingreso).

## Retención y borrado

Definir y documentar (con legal) antes del piloto:
- cuánto se conservan los mensajes del tutor
- qué pasa al terminar el ciclo lectivo
- qué pasa cuando una familia revoca o pide borrar
- cómo se borra de la base y de los backups

Implementar el borrado como proceso verificable, no como promesa.

## Entornos de prueba

- Staging, preview y desarrollo usan **solo datos ficticios** (seed).
- Prohibido copiar producción a otro entorno.
- Las capturas y demos para escuelas usan alumnos inventados.

## Reglas que nunca se omiten

- Nada de datos reales de alumnos fuera de producción.
- Ninguna llamada al modelo sale del cliente.
- Sin consentimiento registrado, el alumno no usa el tutor.
- El tutor no etiqueta, no diagnostica y no genera calificaciones oficiales.
- No se guardan fotos, ubicación ni audio de alumnos.
- No se envía contenido de conversaciones a monitoreo ni analítica.
- Ante la duda sobre un dato nuevo: no recolectarlo y consultar.

## Señales de alerta — detener y consultar

- Pedido de guardar informes psicopedagógicos, diagnósticos o notas
- Pedido de "perfilar" a un alumno con una etiqueta
- Un tercero nuevo que recibiría datos de alumnos (analítica, IA, email)
- Texto de consentimiento que no menciona la IA o la voz
- Copiar datos de producción a un entorno de prueba

## Checklist final (antes de cada piloto)

- [ ] Texto de consentimiento validado con asesoría legal (Ley 25.326)
- [ ] Política de retención y borrado definida e implementada
- [ ] Proveedor de IA revisado (uso de datos, ubicación, entrenamiento)
- [ ] Monitoreo sin datos personales ni contenido de conversaciones
- [ ] Ingreso por código con vencimiento, límite de intentos y aprobación docente
- [ ] Protocolo ante señales de riesgo acordado con la escuela
- [ ] Staging con datos ficticios
