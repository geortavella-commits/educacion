# Prompt 6 — Login y cierre de sesión (solo la interfaz)

Adjuntar: nada de la maqueta (no hay diseño previo). Usar los componentes y tokens existentes.
**No empezar antes de cerrar la Tarea 5** (ver `docs/handoff/HANDOFF.md`).

```
Seguimos con el ciclo de revisión (docs/handoff/HANDOFF.md). Esta es la TAREA 6. Al terminar seguí el protocolo: informe honesto en HANDOFF.md y ESTADO: LISTO_PARA_REVISION.

Tarea: armar SOLO la interfaz de ingreso con mail y contraseña, con un servicio SIMULADO. Yo (Claude) voy a reemplazar después el interior del servicio por la conexión real a Supabase, así que respetá el contrato de abajo al pie de la letra. NO instales ni importes ninguna librería de Supabase, NO guardes contraseñas ni tokens en ningún lado (ni localStorage ni sessionStorage), y NO escribas nada fuera de src/ y docs/.

PANTALLAS (modo base, estilo de la maqueta; todo en español rioplatense, mobile-first)
A) /ingresar — Pantalla de ingreso
   - Logo/nombre "Chasqui", título "Ingresá a tu cuenta".
   - Campos: Mail y Contraseña (con botón mostrar/ocultar contraseña accesible). Atributos correctos: type="email" autocomplete="username", type="password" autocomplete="current-password".
   - Botón "Ingresar" (deshabilitado mientras carga, con texto "Ingresando…").
   - Enlace "Olvidé mi contraseña" → /recuperar.
   - Separador y bloque "¿Sos alumno de primaria?" con un botón grande "Entrar con el código de mi clase" → /alumno/ingreso.
   - Pie: "Esta plataforma usa inteligencia artificial como apoyo. La calificación la decide siempre tu docente."
   - Estados: cargando; credenciales incorrectas; cuenta bloqueada temporalmente (con cuenta regresiva mm:ss, igual que en el ingreso por código); sin conexión con "Reintentar"; sesión vencida (aviso arriba cuando llega con ?motivo=vencida); sin permiso (cuando llega con ?motivo=sinpermiso).
   - SEGURIDAD EN LOS MENSAJES: nunca digas si un mail existe o no. Credenciales incorrectas siempre es el mismo texto: "El mail o la contraseña no coinciden." Validá el formato del mail antes de enviar.
B) /recuperar — Recuperar contraseña
   - Un campo de mail y el botón "Enviarme el enlace". Al enviar, SIEMPRE el mismo mensaje, exista o no el mail: "Si el mail está registrado, te enviamos un enlace para crear una contraseña nueva. Revisá también la carpeta de spam."
   - Estados: cargando, sin conexión.
C) Cierre de sesión
   - En la barra lateral del docente y del directivo (parte de abajo, donde está la tarjeta de usuario) y en el encabezado de familia y alumno: botón "Cerrar sesión" con confirmación simple. Al confirmar llama a cerrarSesion() y navega a /ingresar.
D) Protección de rutas (simulada)
   - Componente <RutaProtegida roles={[...]}> que usa obtenerSesion(): sin sesión → /ingresar?motivo=sinsesion; con sesión pero rol no permitido → /ingresar?motivo=sinpermiso. Aplicalo a /docente/*, /directivo/*, /familia/* y /alumno/* (excepto /alumno/ingreso). Las rutas /sistema y /sistema/estados quedan abiertas SOLO en desarrollo (import.meta.env.DEV).
   - Después de ingresar, redirigí según el rol: docente → /docente, directivo → /directivo, familia → /familia, alumno → /alumno.

CONTRATO DEL SERVICIO (src/services/auth.ts — respetá nombres y formas EXACTOS)

  export type RolUsuario = 'docente' | 'directivo' | 'familia' | 'alumno';
  export interface Sesion { usuarioId: string; nombreVisible: string; rol: RolUsuario; escuelaId: string; }
  export type ResultadoIngreso =
    | { ok: true; sesion: Sesion }
    | { ok: false; motivo: 'credenciales' | 'bloqueado' | 'red'; segundosEspera?: number };

  iniciarSesion(email: string, password: string): Promise<ResultadoIngreso>
  cerrarSesion(): Promise<void>
  obtenerSesion(): Promise<Sesion | null>
  solicitarRecuperacion(email: string): Promise<{ ok: boolean; motivo?: 'red' }>
  suscribirseASesion(callback: (s: Sesion | null) => void): () => void   // devuelve la función para cancelar

IMPLEMENTACIÓN SIMULADA (esto lo reemplazo yo después)
  - Guardá la sesión simulada SOLO en memoria (una variable del módulo, no en el navegador: se pierde al recargar y está bien).
  - Cuentas de prueba que deben funcionar (mismos mails y claves que la base local de desarrollo):
      docente.laura@ficticio.test   → docente   · "Seño Laura"
      docente.julian@ficticio.test  → docente   · "Seño Julián"
      directivo@ficticio.test       → directivo · "Dirección"
      familia.mateo@ficticio.test   → familia   · "Familia de Mateo"
      alumno.mateo@ficticio.test    → alumno    · "Mateo"
      contraseña de todas: educacion123
  - Simulá además: mail "bloqueado@ficticio.test" → motivo 'bloqueado' con segundosEspera 60; mail "sinred@ficticio.test" → motivo 'red'. Cualquier otra combinación → 'credenciales'. Latencia simulada de ~600 ms.
  - Estas cuentas y la contraseña NO pueden aparecer escritas en ninguna pantalla de producción. Mostralas solo en /sistema/estados, en un bloque "Cuentas de prueba (solo desarrollo)" con botones que rellenan el formulario.

CORRECCIONES / REGLAS QUE SE MANTIENEN
  - Ningún mensaje de error filtra información (ver arriba). No uses "usuario no encontrado" ni "contraseña incorrecta" por separado.
  - Cero llamadas a modelos de IA; cero claves en el código; sin datos reales de nadie.
  - Íconos de lucide-react. Un solo <main>. Texto ≥ 14 px. Contraste AA con los tokens (usar --color-accent-strong para texto sobre claro).
  - Teclado: Enter envía el formulario; el foco va al primer campo con error; los mensajes de error usan role="alert".
  - Sin overflow-x-hidden para tapar desbordes. Sin scroll horizontal en 360, 390, 768 y 1280 px.

CRITERIO DE ACEPTACIÓN
  - Se recorren en el navegador: ingreso correcto de cada rol (redirige bien), credenciales incorrectas, bloqueo con cuenta regresiva, sin conexión, recuperar contraseña, cierre de sesión, y entrar a /docente sin sesión (te manda a /ingresar).
  - Un docente que intenta abrir /directivo es enviado a /ingresar?motivo=sinpermiso.
  - Consola sin errores ni avisos. Lighthouse accesibilidad = 100 en /ingresar y /recuperar (si no lo podés medir, escribí "no verificado").
  - npm run build y npm run typecheck pasan.

Al terminar, completá el "Informe de Gemini" en HANDOFF.md: qué hiciste por pantalla, rutas nuevas, salida del build, y qué NO pudiste verificar.
```
