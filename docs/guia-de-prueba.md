# Guía para probar la app vos mismo

Escrita para Darío. Tiempo estimado: 40 a 60 minutos para el recorrido completo.

## 0. Antes de empezar (lo que tenés que saber)

- **Hoy la app usa la base real** (`VITE_USAR_SUPABASE=true` en `.env.local`): el login consulta Supabase y lo que hacés queda guardado. Necesitás Docker y, en la carpeta del proyecto, `supabase start` y `supabase functions serve` (en otra terminal). El mail de recuperación de contraseña llega a Mailpit: http://127.0.0.1:54324.
- **Dos bases para elegir** (las dos borran todo lo que hubiera):
  - *Completa* (64 alumnos, 3 cursos, proyectos y grupos de ejemplo; la que usan las pruebas automáticas): `supabase db reset`.
  - *Mínima* (para armar todo desde cero: 1 escuela, el curso 5º B, un usuario por rol, el currículo de ejemplo y el código de clase `COR5B2`): `supabase db reset --no-seed` y después `docker exec -i supabase_db_educacion psql -U postgres -v ON_ERROR_STOP=1 < supabase/seeds/minimo.sql`. Usuarios (contraseña `educacion123`): `docente.laura@`, `directivo@`, `alumno.mateo@` y `familia.mateo@ficticio.test`.
- La sesión sobrevive a F5. Para volver al estado inicial del seed: `supabase db reset`.
- Con `VITE_USAR_SUPABASE=false` volvés a la versión simulada (datos de ejemplo, sin Docker), útil solo para ver el diseño. Esa versión pierde la sesión al recargar.
- Pantallas nuevas para recorrer: `/docente/alumnos`, `/docente/grupos` (y entrá a un grupo), `/docente/grupos/nuevo`, `/docente/proyectos` (y entrá a uno), `/docente/proyectos/nuevo`, `/docente/ingresos`, `/docente/consentimientos`, `/familia`, `/familia/invitacion`, `/restablecer`.
- **Recorrido sugerido como docente (Laura):** Inicio → ves proyectos y grupos con su avance → Grupos → pestaña "En borrador" → abrí un grupo → "Agregar alumnos" → "Aprobar grupo" → "Dejar un mensaje" a un alumno (tipo: logro, motivación o sugerencia) → entrá como ese alumno (`alumno.bruno.5b@ficticio.test`) y mirá "Un mensaje de tu seño" en su inicio. En un proyecto: "Editar", "Agregar misión" y "Nuevo grupo".
- **Para probar las sugerencias de grupos** hacen falta varios alumnos: `docker exec -i supabase_db_educacion psql -U postgres -v ON_ERROR_STOP=1 < supabase/seeds/alumnos-extra.sql` suma 10 alumnos ficticios (con intereses y avance distintos) a la base mínima, sin borrar nada y sin duplicar si lo repetís. Después: Grupos › Nuevo grupo › elegí el proyecto › "¿Querés una sugerencia para armar los grupos?".
- Los mensajes de la docente no llevan nota ni puntaje a propósito: la evaluación oficial es de la docente fuera de la app.

### Levantar la app
1. Abrí una terminal en la carpeta del proyecto (`educacion`).
2. `npm run dev`
3. Abrí **http://localhost:5173** en Chrome.

### Verla como celular
En Chrome: `F12` → ícono del celular (arriba a la izquierda de las herramientas) → elegí "iPhone 12" o "Responsive" con 360 px de ancho. Las pantallas de alumno están pensadas para celular.

### Probarla en tu celular de verdad (opcional)
1. Celular y compu en el mismo WiFi.
2. Frená el servidor y levantalo con `npm run dev -- --host`.
3. En el celular abrí `http://192.168.0.9:5173` (tu IP puede cambiar; mirala con `ipconfig`).
4. Si no abre, es el firewall de Windows: permití Node.js en redes privadas.

## 1. Cuentas de prueba (solo versión simulada)

Contraseña de todas: `educacion123`

| Mail | Rol | A dónde te lleva |
|---|---|---|
| docente.laura@ficticio.test | Docente | /docente |
| docente.julian@ficticio.test | Docente | /docente |
| directivo@ficticio.test | Directivo | /directivo |
| familia.mateo@ficticio.test | Familia | /familia |
| alumno.mateo@ficticio.test | Alumno | /alumno |

Casos especiales: `bloqueado@ficticio.test` (simula demasiados intentos) y `sinred@ficticio.test` (simula sin conexión). Cualquier otra combinación = "no coinciden".

Atajo: en **/sistema/estados** hay un bloque "Cuentas de prueba" que rellena el formulario.

---

## 2. Recorrido

Marcá cada punto. Si algo no coincide con lo que decimos acá, anotalo (ver sección 5).

### A. Login — `/ingresar`
- [ ] Probá mail con mala clave y mail que no existe: **el mensaje tiene que ser exactamente el mismo** ("El mail o la contraseña no coinciden"). Nunca debe decir "usuario no encontrado".
- [ ] Mail mal escrito (`pepe`): avisa del formato antes de enviar.
- [ ] `bloqueado@ficticio.test` con cualquier clave: aparece una cuenta regresiva y los campos se traban.
- [ ] `sinred@ficticio.test`: aparece "Reintentar".
- [ ] Botón del ojo: muestra y oculta la contraseña.
- [ ] Enter dentro del formulario envía.
- [ ] Tab: el foco recorre mail → contraseña → ojo → Ingresar en orden lógico.
- [ ] Debajo hay un botón grande "Entrar con el código de mi clase" (para primaria) y se lee **completo** en el celular.
- [ ] "Olvidé mi contraseña": con un mail registrado y con uno inventado, **el mensaje es el mismo**.

### B. Seguridad de rutas
- [ ] Sin sesión, escribí en la barra `localhost:5173/docente`: te manda a `/ingresar` con un aviso.
- [ ] Ingresá como docente y escribí `/directivo` en la barra: te tiene que sacar con un aviso de "sin permiso". (Ojo: al escribir la URL se recarga y se pierde la sesión; para probar el cruce, navegá desde la app o volvé a loguearte y probá enseguida.)
- [ ] "Cerrar sesión" aparece en los cuatro roles, pide confirmación y te devuelve al login.

### C. Docente (Laura) — `/docente`
**Panel de inicio**
- [ ] Números: **58 / 64** activos, **3** proyectos, **7** necesitan apoyo.
- [ ] Las barras dicen **"Avance de misiones"**, nunca "notas".
- [ ] En la barra lateral, **un solo ítem** aparece seleccionado.

**Necesitan apoyo (7)**
- [ ] Hay 7 alumnos, **solo nombre de pila**.
- [ ] Arriba dice que son **hipótesis** de la app.
- [ ] "Corregir": abre un diálogo con 3 opciones (es correcta / corregir el texto / descartar) y el estado se ve en la fila después.
- [ ] Escape cierra el diálogo.

**Perfil de un alumno** (entrá a Santi y después a Lara)
- [ ] El nombre es el correcto en toda la pantalla (no debe aparecer otro).
- [ ] "Avance de misiones (no son notas)".
- [ ] Las observaciones empiezan como hipótesis y tienen "Corregir".
- [ ] "Ver conversación completa" muestra todo el diálogo con Chasqui. "Resumen IA" dice **"puede tener errores"**.
- [ ] Dice en algún lado que **"La calificación la decidís vos"**.

**Proyecto "La cancha del barrio"**
- [ ] Cobertura: **9 de 12**; la lista de "Falta" tiene **3** ítems.
- [ ] Los contenidos dicen **"de ejemplo (a validar con el diseño curricular de Córdoba)"**.
- [ ] Rúbrica con "La evaluación oficial es tuya. La app no califica ni genera notas."

**Grupos sugeridos**
- [ ] Cada grupo arranca en **BORRADOR**. "Aprobar" lo pasa a APROBADO.
- [ ] Cada tarjeta muestra dos cosas: "Alumnos ven: …" (nombre neutro) y "Solo docente: …" (etiqueta interna).
- [ ] "Editar" → escribí "Grupo de refuerzo nivel bajo": tiene que aparecer un aviso de que ese nombre clasifica.

### D. Alumno (Mateo) — `/alumno`
- [ ] En compu se ve **dentro de un marco de celular**; en el celular, a pantalla completa.
- [ ] Inicio: "Hola, Mateo", estrellas, "Tus pasiones", misiones. **No hay** niveles, rankings ni puntajes.
- [ ] **Juego de bienvenida (diagnóstico):** son 6 pasos. Elegí una opción: **no dice "correcto" ni "incorrecto"** ni da puntaje. Dice "Sin notas, es un juego".
- [ ] En intereses, intentá elegir un **cuarto**: debe avisarte que ya elegiste 3.
- [ ] La pantalla final dice "con fútbol, dibujo y …" bien armado.
- [ ] La "X" para salir pide confirmación y se cierra con Escape.
- [ ] **Chasqui (tutor):** tocá las "Ideas para responder". **Ninguna debería ser la respuesta**: son formas de empezar ("Dibujar los penales"). Probá escribir un número equivocado: Chasqui no te dice "mal", te hace pensar.
- [ ] Botón del micrófono: cambia de estado (escuchando → pensando). Es solo la interfaz, no graba nada.
- [ ] **Ingreso por código** (`/alumno/ingreso`): `ABC123` = válido; `VENCID` = código vencido; `BLOQUE` = bloqueo con cuenta regresiva; `REDERR` = error de red. Después pide nombre (sin apellido) y avatar, y queda "esperando que tu seño te apruebe".

### E. Familia — `/familia`
- [ ] Por ahora es un **esqueleto** (la pantalla definitiva está en la lista de pendientes).
- [ ] El consentimiento se ve en **/sistema/estados** (todavía no tiene ruta propia). Fijate: dice que Chasqui **usa IA y puede equivocarse**, qué pasa con la voz, que se puede **revocar**, y que "Autorizo" **no se habilita** hasta tildar la casilla (que arranca **sin** tildar). El texto "[proveedor a definir]" es un pendiente legal real: no es un error.

### F. Directivo — `/directivo`
- [ ] Por ahora es un esqueleto. Solo confirmá que entrás y que podés cerrar sesión.

### G. El laboratorio — `/sistema/estados`
- [ ] Botones para **forzar** estados (cargando, vacío, error, sin permiso) de cada pantalla. Si alguna se ve rota, es lo primero que querés reportar.

---

## 3. Qué tenés que fijarte siempre (en cualquier pantalla)

Estas son las reglas del producto; si ves una que no se cumple, es un **error serio**, no un detalle:

1. **Nada califica.** Ningún "nota", "puntaje", "nivel 4", "bajo/alto", "avanzado".
2. **Las observaciones sobre un chico son hipótesis** y se pueden corregir.
3. **El chico nunca ve la etiqueta interna de un grupo** (Refuerzo, Equipo mixto…).
4. **Sin apellidos de alumnos** ni mails reales en pantalla.
5. **El tutor no da la respuesta.** Ni escrita, ni como botón.
6. **Lenguaje simple** para los chicos: sin "socrático", "diagnóstico", "pedagógico".
7. **Cada pantalla se entiende en el celular**: nada cortado, botones grandes (para primaria), sin scroll horizontal.
8. **Estados raros:** ¿qué pasa si falla la conexión, si no hay datos, si no tenés permiso? Nunca una pantalla en blanco.

Chequeos técnicos rápidos (opcional): `F12` → pestaña **Console**: no tiene que haber errores en rojo. Pestaña **Lighthouse** → "Accessibility": debería dar 100.

## 4. Cosas que NO vas a poder probar todavía
- Login real contra la base (el servicio está hecho y probado, falta conectarlo).
- Datos reales del seed en las pantallas (64 alumnos, etc.).
- Crear de verdad un grupo, un proyecto o un alumno.
- Cargar o exportar planificación, la vista de familia definitiva, el panel del directivo y todo lo de secundaria.
- Voz real e IA real (hoy el tutor sigue un guion).

## 5. Cómo reportarme lo que encuentres
Para cada cosa, anotá: **la ruta** (ej. `/docente/apoyo`), **qué hiciste**, **qué esperabas** y **qué pasó**, con captura si podés. Mandámelo así, en lista, y lo convierto en las correcciones del próximo ciclo. Lo más útil: si algo te hace dudar como docente ("¿esto qué significa?"), anotalo aunque no sea un error: es una pista de qué texto hay que mejorar.
