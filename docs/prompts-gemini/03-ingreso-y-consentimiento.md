# Prompt 3 — Ingreso por código y consentimiento familiar

Adjuntar: `docs/maqueta/pantallas/3d.html` y `3e.html`.

```
Tarea: replicar dos pantallas.

A) 3d · Primaria · Ingreso con código o QR → src/features/alumno/IngresoCodigo.tsx (modo primaria)
B) 3e · Consentimiento familiar → src/features/familia/Consentimiento.tsx (modo base)

Datos: src/services/ingreso.ts y src/services/consentimiento.ts devuelven mocks tipados. El ingreso NO valida nada de verdad: simula "código válido", "código vencido", "código incorrecto" y "demasiados intentos" según el valor tipeado, para poder ver todos los estados.

Estados a resolver (además del feliz): cargando, error de red, código vencido, código incorrecto, demasiados intentos (bloqueo temporal con cuenta regresiva), "esperando aprobación de tu seño/o" tras ingresar el código, y en consentimiento: ya otorgado, revocado y sin permiso.

Correcciones respecto de la maqueta:
- El código tiene 6 casillas (la maqueta muestra 5) y el texto dice "6 letras o números". Mostrá el vencimiento.
- El flujo es: poner código → elegir nombre visible y avatar (sin apellido ni mail) → "esperá que tu seño/o te apruebe" → entrar. Agregá esa pantalla de espera y la elección de avatar.
- Escanear QR: solo el botón y un estado "pedir permiso de cámara"; sin implementar el escaneo.
- Consentimiento: reemplazá "Valentina" por un nombre ficticio sin apellido y la escuela por "Escuela Ficticia, Córdoba". Mantené "[proveedor a definir]" tal cual: es un pendiente legal, no lo inventes. Agregá cómo se revoca y que el tutor usa IA de terceros y puede equivocarse.
- La "Nota de diseño · no se muestra a usuarios" de la maqueta NO va en la pantalla.
- Casilla de aceptación SIN premarcar; el botón "Autorizo" queda deshabilitado hasta marcarla.

Criterio de aceptación: se puede recorrer cada estado desde una página de pruebas (/sistema/estados), en móvil (390 px) y escritorio, sin errores de consola.
```
