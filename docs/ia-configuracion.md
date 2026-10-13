# Ayuda de la IA: cómo activarla y cómo funciona

Hoy hay tres ayudas para la docente, las tres como **borrador que ella revisa y decide**:
1. **Sugerir un proyecto** (Nuevo proyecto › "Pedir ayuda a la IA"): título, descripción y misiones a partir de una idea.
2. **Sugerir un borrador de mensaje** para un alumno (perfil del alumno › Mensajes › "Sugerir un borrador con IA").
3. **Ponerles nombre a los grupos sugeridos** (Nuevo grupo › sugerencias › "Ponerles nombres con IA"). El armado de los grupos NO usa IA: lo hace un algoritmo en el navegador de la docente (intereses, grupos variados o ritmo de avance). La IA solo propone los nombres.

Todo pasa por funciones del servidor (`ia-sugerir-proyecto`, `ia-borrador-devolucion`, `ia-nombrar-grupos`). Si se agrega una función nueva, hay que reiniciar el servidor de funciones para que la detecte. **El navegador nunca habla con OpenAI ni conoce la clave.**

## Activarla con tu clave de OpenAI

> **No pegues la clave en el chat, ni en el código, ni en ningún archivo dentro de la carpeta del proyecto** (está en OneDrive y se sincroniza a la nube).

1. Creá la carpeta `C:\Users\dario\.chasqui` (está fuera de OneDrive). Ahí hay una plantilla llamada `ia.env.ejemplo`.
2. Copiala como **`ia.env`** y reemplazá `PEGA-ACA-TU-CLAVE` por tu clave. El archivo queda así:
   ```
   OPENAI_API_KEY=sk-...tu clave...
   OPENAI_MODEL=gpt-4o-mini
   IA_MAX_POR_DIA=30
   ```
3. Levantá las funciones con el script (desde la carpeta del proyecto):
   ```
   powershell -ExecutionPolicy Bypass -File scripts\serve-funciones.ps1
   ```
   Si encuentra `ia.env`, lo usa. Si no, las funciones de IA responden "todavía no está activada" y lo demás funciona igual.
4. Probá: entrá como docente › Proyectos › Crear proyecto › "Pedir ayuda a la IA".

Recomendaciones sobre la clave:
- Creá una **clave solo para este proyecto** en el panel de OpenAI y ponele un **límite de gasto mensual** ahí (es la red de seguridad real; el tope de la app es adicional).
- Si la clave se filtra (la pegaste en un chat, en un archivo sincronizado, etc.), **revocala y creá otra**.
- `OPENAI_MODEL` tiene que ser un modelo que acepte "salida estructurada" (JSON con esquema), como `gpt-4o-mini`. Si más adelante cambiás de modelo, solo se cambia esa línea.
- `IA_MAX_POR_DIA` es el tope de pedidos por docente cada 24 horas (por defecto 30).

## "¿Para quién es la propuesta?": se etiqueta la actividad, nunca al chico

El panel pregunta cómo querés pensar la propuesta: **para todo el curso**, **con más acompañamiento** (el mismo contenido con pasos más cortos, preguntas guía y pistas) o **con desafío extra** (más abierta: justificar, comparar, crear).

Por qué no se pregunta por "grupos avanzados / medios / retrasados": una de las reglas fijas del proyecto es que **nada clasifica a un chico**. Una etiqueta de nivel sobre personas puede terminar visible para los alumnos y las familias, y los chicos se la creen. La necesidad pedagógica (no todos necesitan lo mismo) se cubre igual, pero la etiqueta va en la **propuesta**, y solo la docente sabe qué chico hace qué versión.

- Esa elección **no se guarda** en el proyecto (los alumnos pueden leer sus proyectos) ni se muestra en ninguna pantalla de chicos o familias. Solo orienta a la IA.
- La IA tiene prohibido escribir que algo es "para los atrasados / avanzados / lentos / de nivel bajo". Y aunque lo hiciera, el filtro lo descarta (misión por misión) y la pantalla avisa cuántas descartó.
- Si querés organizar a los chicos en grupos de trabajo, la **etiqueta interna del grupo** ("Refuerzo · fracciones") ya es solo para la docente y nunca se muestra a alumnos ni familias.

## Qué datos le llegan al modelo (y cuáles no)

| Ayuda | Le llega | NO le llega |
|---|---|---|
| Proyecto sugerido | La idea que escribió la docente, el año y nivel del curso, los contenidos del diseño curricular y, si la docente lo deja tildado, los **intereses más comunes del curso** (solo si los comparten 5 o más chicos y el curso tiene al menos 10) | Nombres, mails, ids ni datos de ningún alumno en particular |
| Nombres de grupos | El título del proyecto, el año, los **temas** que comparten los chicos de cada grupo (de una lista cerrada: fútbol, dibujo…) y **cuántos** chicos tiene cada grupo | Nombres, ids, avance ni ningún dato de ningún alumno. Cuesta unos 470 tokens por pedido (una fracción de centavo) |
| Borrador de mensaje | El tipo de mensaje, el título del proyecto, **cuántas** misiones hizo el chico y la idea que escribió la docente **con el nombre del chico tapado** (`[NOMBRE]`) | El nombre, el id, los intereses, las conversaciones ni nada de la familia |

Qué se guarda de cada uso: **solo** quién lo pidió, para qué función y cuántos tokens gastó (`ia_usos`) y una línea de auditoría. **Nunca** el texto enviado ni el recibido.

## Barandas

- **La IA propone, la docente decide.** Nada se guarda ni se envía solo.
- Lo que devuelve el modelo se **filtra**: se descartan calificaciones, puntajes, rankings, comparaciones entre chicos, etiquetas de nivel sobre personas, enlaces, mails y teléfonos (en los mensajes a un alumno, también la palabra "nota"; en las consignas de un proyecto no, porque "tomá nota" o "calculá el promedio" son frases normales); los ids de currículo inventados se anulan; los textos se recortan.
- La idea de la docente se trata como **dato**, no como instrucción (defensa contra "ignorá tus reglas").
- Solo la docente del curso (o del alumno) puede pedirlo. Alumnos, familias y otras docentes reciben "no existe".
- **Tope diario** por docente y **tiempo máximo** de espera (45 s). Si el proveedor falla o está saturado, la pantalla lo explica y siempre queda la opción de hacerlo a mano.
- Los errores hacia afuera son genéricos: nunca se muestra el detalle del proveedor.

## Probar sin gastar (OpenAI falso)

Para desarrollar o probar sin clave ni costo:
1. En una terminal: `set FALSO_REGISTRO=C:\ruta\a\una\carpeta` y luego `node scripts\openai-falso.mjs` (escucha en el puerto 4010).
2. Creá un archivo (fuera del proyecto) con:
   ```
   OPENAI_API_KEY=cualquiera
   OPENAI_BASE_URL=http://host.docker.internal:4010/v1
   OPENAI_MODEL=modelo-de-prueba
   IA_MAX_POR_DIA=30
   ```
   y levantá `supabase functions serve --env-file <ese archivo>`.
3. `python scripts/prueba-ia.py` (con `FALSO_REGISTRO` apuntando a la misma carpeta) hace 26 comprobaciones: caso feliz, barandas, permisos, que el nombre del alumno no llegue al modelo y el tope diario.

## Pendiente antes de usarla con datos reales de chicos

- El texto del consentimiento de las familias todavía dice "[proveedor a definir]": hay que **actualizarlo con OpenAI** y validarlo con asesoría legal (Ley 25.326; los datos viajan a un proveedor en el exterior). El proyecto sugerido no usa datos de menores; el borrador de mensaje usa datos mínimos y sin nombre, pero igual cuenta.
- Revisar con OpenAI la política de retención de datos de la API y, si hace falta, pedir retención cero.
- Validar los contenidos del diseño curricular de Córdoba: hoy son de ejemplo, y las sugerencias se apoyan en ellos.
- Falta una prueba con la API real: hasta ahora todo se verificó contra el servidor falso (con la forma documentada de la API de OpenAI). Al usar tu clave por primera vez, si algo falla, mirá el mensaje que muestra la pantalla y avisame.
