---
name: vercel-deploy
description: >
  Usar cuando se va a configurar o hacer deploy a Vercel de la plataforma
  educativa (PWA con Vite + React + Supabase). Cubre: vercel.json, headers de
  caché para PWA y Service Worker, headers de seguridad (CSP, permisos de
  micrófono), variables de entorno por ambiente, staging con datos ficticios,
  monitoreo (Sentry) sin datos de alumnos, CI con tests de RLS, y checklist
  pre-deploy. También activar cuando "la app no se actualiza" después de un
  deploy, cuando el preview se conecta a la base equivocada, o cuando se
  vaya a mostrar la app a una escuela. Versión adaptada para este proyecto
  (educación, menores); no usar la versión del ERP.
---

# Skill: Deploy a Vercel — PWA educativa (Vite + Supabase)

## Cuándo usar esta skill

Primer deploy, cambios de configuración, problemas de producción o de
actualización de la PWA, y antes de cada piloto.

## Qué cambia respecto del deploy del ERP

1. **Headers de seguridad** además de los de caché (CSP, Permissions-Policy
   con micrófono para primaria, Referrer-Policy).
2. **Staging y preview con datos ficticios, siempre.** Nunca datos de alumnos
   fuera de producción.
3. **Monitoreo sin datos personales ni contenido de conversaciones.**
4. **Las claves de IA no están en Vercel ni en `VITE_*`:** viven como secretos
   de las Edge Functions en Supabase.
5. **Dispositivos compartidos de la escuela:** el service worker no cachea
   respuestas autenticadas con datos de alumnos.

## 1. `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), geolocation=(), microphone=(self)" },
        { "key": "Content-Security-Policy-Report-Only", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://<REF>.supabase.co wss://<REF>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" },
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ],
  "rewrites": [
    { "source": "/((?!api/.*).*)", "destination": "/index.html" }
  ]
}
```

Notas:
- Reemplazar `<REF>` por el project-ref de Supabase de cada ambiente.
- La CSP arranca en **Report-Only**: revisar la consola, ajustar (fuentes,
  Sentry, servicios de voz si se agregan) y recién entonces pasar a
  `Content-Security-Policy`. Una CSP mal ajustada rompe la app.
- `sw.js` y `*.html` no se cachean; `/assets/` sí (Vite les pone hash).
- `microphone=(self)` es para la voz en primaria; el resto de los permisos
  queda cerrado.
- Verificar los valores contra la documentación vigente de Vercel antes de
  usar, porque el formato de headers puede cambiar.

## 2. Variables de entorno

Vercel → Settings → Environment Variables. Tres ambientes.

| Variable | Producción | Preview / Development |
|----------|------------|-----------------------|
| `VITE_SUPABASE_URL` | Proyecto de producción | Proyecto de **staging** |
| `VITE_SUPABASE_ANON_KEY` | Anon key de producción | Anon key de **staging** |
| `VITE_APP_VERSION` | Versión | Versión |
| `VITE_SENTRY_DSN` (si se usa) | DSN de producción | DSN de staging |
| `SENTRY_AUTH_TOKEN` (si se usa) | Solo producción, **sin** prefijo `VITE_` | — |

Nunca van en Vercel ni con `VITE_`:
- `service_role` de Supabase
- claves del proveedor de IA (son secretos de Edge Functions en Supabase)

⚠️ Preview **nunca** apunta al proyecto de producción. Staging es un proyecto
Supabase separado, con seed de datos **ficticios**.

## 3. Staging con datos ficticios

- Mantener un seed versionado (`supabase/seed.sql` o script) con escuelas,
  docentes, alumnos y familias inventados.
- Prohibido restaurar un backup de producción en staging.
- Las demos para escuelas usan este mismo seed.
- Verificar en cada preview que el proyecto de Supabase conectado es el de
  staging (mostrar el ambiente en una esquina en no-producción).

## 4. Monitoreo sin datos de alumnos

Si se usa Sentry u otro:
- Sin replay de sesión ni captura de formularios.
- Sin datos del usuario (`sendDefaultPii: false`) y con limpieza previa al envío:

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend(event) {
    delete event.user
    if (event.request) delete event.request.data
    return event
  },
})
```

- No loguear texto de mensajes de alumnos ni nombres en la consola de
  producción.
- Revisar qué captura la herramienta por defecto antes de activarla; la
  configuración exacta depende de la versión del SDK.

## 5. PWA en dispositivos compartidos de la escuela

- El service worker cachea solo archivos estáticos (la app), **no**
  respuestas autenticadas de la API con datos de alumnos.
- Cerrar sesión limpia el almacenamiento local de la sesión.
- Sesiones de alumnos con vencimiento corto en primaria; el docente puede
  cerrar sesiones del curso.
- Definir qué funciona sin conexión: ver misiones ya cargadas sí; hablar con
  el tutor no.

## 6. CI: tests antes del deploy

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase start
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Tests de RLS por rol
        run: npm run test:rls
      - name: Tests pgTAP
        run: supabase test db
      - name: Casos de prueba del tutor (solo si cambió el prompt o el modelo)
        run: npm run test:tutor
```

Vercel despliega por su integración con GitHub; este job bloquea el merge si
los tests fallan. Los tests usan claves del Supabase **local**, nunca de
producción ni de staging.

## 7. Checklist pre-deploy (antes de cada push a main)

```bash
npm run test:rls            # 1. RLS por rol
npm run build               # 2. Build sin errores
npm run preview             # 3. Verificar la PWA en http://localhost:4173
# DevTools → Application: service worker "activated", manifest sin errores
# DevTools → Console: sin violaciones de CSP (mientras esté en Report-Only)
supabase db diff            # 4. Migraciones pendientes
supabase db push            # 5. Aplicar a producción DESPUÉS del deploy
```

## 8. Problemas comunes

- **La app no se actualiza:** `sw.js` cacheado, o pestañas viejas abiertas.
  Verificar el header de `sw.js` y agregar `registerSW` con aviso de
  actualización (`virtual:pwa-register`).
- **Preview conectado a producción:** revisar variables de Preview.
- **Error de source maps de Sentry:** `SENTRY_AUTH_TOKEN` sin `VITE_` y solo
  en producción.
- **La PWA no se instala:** manifest con `Content-Type` correcto, íconos
  192 y 512, HTTPS, `start_url` y `display: standalone`.
- **El micrófono no funciona en primaria:** revisar `Permissions-Policy` y que
  el permiso se pida desde un gesto del usuario.
- **CSP bloquea algo legítimo:** ajustar en Report-Only antes de pasar a modo
  de bloqueo.

## Reglas que nunca se omiten

- Preview y staging nunca apuntan a producción y solo tienen datos ficticios.
- `service_role` y claves de IA nunca en Vercel ni en `VITE_*`.
- No cachear en el service worker respuestas con datos de alumnos.
- Monitoreo sin datos personales ni conversaciones.
- Antes de mostrar la app a una escuela: ofrecer correr `security-audit-edu`.
- Push a main solo con tests de RLS pasando.

## Checklist final

- [ ] `vercel.json` con headers de seguridad y de caché
- [ ] CSP revisada en Report-Only y luego activada
- [ ] Variables por ambiente correctas; Preview → staging
- [ ] Seed ficticio en staging; sin dumps de producción
- [ ] Monitoreo configurado sin datos personales
- [ ] CI corre RLS, pgTAP y casos del tutor
- [ ] Service worker no cachea respuestas autenticadas
