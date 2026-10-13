---
name: curriculo-datos
description: >
  Usar cuando se trabaje con el currículo oficial como datos: cargar o
  actualizar el diseño curricular de una provincia, NAP (Núcleos de
  Aprendizajes Prioritarios), áreas, ejes y contenidos por año, versionado
  del currículo, vincular proyectos y misiones con contenidos, tablero de
  cobertura curricular, exportar planificaciones, contenidos propios del
  docente. También activar cuando el usuario diga "cargá el diseño curricular
  de [provincia]", "qué contenidos cubre este proyecto", "se actualizó el
  diseño", "importá la planificación del docente" o "mapeá esto a los NAP".
---

# Skill: Currículo como datos

## Cuándo usar esta skill

Todo lo que cargue, consulte, valide o vincule contenidos curriculares. Es la
base de lo que más reduce la resistencia al cambio de las escuelas: cada
proyecto se puede mostrar alineado al currículo oficial.

## Principios

1. **El currículo son datos versionados, no código ni prompt.** Vive en
   `curriculo_versiones`, `areas` y `curriculo_contenidos`. Los agentes lo
   consultan con una herramienta cuando lo necesitan.
2. **Alcance acotado:** una provincia, los años del piloto, 3 o 4 áreas
   (Matemática, Lengua, Ciencias Naturales, Ciencias Sociales). No se carga
   "todo el sistema educativo argentino".
3. **La IA puede ayudar a extraer, una persona valida.** Todo lo que se cargue
   con ayuda de IA lo revisa alguien con criterio pedagógico antes de marcar
   la versión como vigente. Un error acá lo heredan todos los agentes.
4. **Dos capas normativas:** nacional (Ley de Educación Nacional 26.206,
   acuerdos del Consejo Federal de Educación, NAP) y provincial (diseño
   curricular y régimen académico). Para el día a día manda el provincial.
5. **La normativa cambia.** Antes de cargar, verificar en la fuente oficial la
   versión vigente y anotarla (nombre, resolución, fecha).
6. **La app no toca la evaluación oficial:** genera evidencia (progreso,
   portfolio, informes), la calificación es del docente.

## Modelo (ver el schema en `supabase-educacion-multiescuela`)

```
Jurisdicción → Versión de currículo → Área → Contenido (nivel, año, eje, es_nap)
Proyecto ↔ Contenidos (muchos a muchos)     Misión → Contenido
```

- `curriculo_versiones`: jurisdicción, nombre, `vigente`, `validada_por`,
  `validada_en`.
- `curriculo_contenidos`: nivel, año, eje, descripción, `es_nap`, y
  `escuela_id` nulo si es oficial o con valor si es contenido propio del docente.
- Nunca se edita una versión vigente en el lugar: se crea una versión nueva y
  se migran los vínculos. Así no se rompen proyectos viejos.

## Flujo de trabajo

### Cargar una provincia
1. Confirmar provincia, años y áreas del piloto.
2. Reunir los documentos oficiales y anotar fuente, fecha y resolución.
3. Leer `references/proceso-carga.md` y extraer a un archivo intermedio
   (CSV o JSON) revisable.
4. **Revisión humana** del archivo intermedio, contenido por contenido.
5. Importar a una versión nueva con `vigente = false`.
6. Probar consultas del agente (`buscar_contenidos`) sobre los datos cargados.
7. Registrar `validada_por` y `validada_en` y recién entonces marcar `vigente`.

### Vincular proyectos y calcular cobertura
1. El planificador propone contenidos para un proyecto; el docente acepta o quita.
2. Se guardan en `proyecto_contenidos`.
3. Cobertura = contenidos del año y áreas del curso vinculados a algún
   proyecto, sobre el total esperado. Mostrar qué falta y sugerir actividades.
4. El tablero muestra solo contenidos de la versión vigente del curso.

### Exportar planificación
1. Tomar proyecto, contenidos, etapas y misiones.
2. Generar la secuencia en el formato que usa la escuela (pedirlo al docente
   o a la dirección y guardarlo como plantilla).
3. El docente la edita antes de descargarla. Nunca se envía sola.

### Importar la planificación del docente
- El docente sube su planificación o sus guías (archivo o foto).
- La app detecta contenidos y los propone; el docente confirma.
- Lo subido se guarda en un bucket privado con ruta por escuela y con
  políticas de Storage; nunca se manda al modelo con datos de alumnos.

## Reglas que nunca se omiten

- Nada se marca como vigente sin validación humana registrada.
- No se edita una versión vigente: se versiona.
- Los agentes leen el currículo por consulta; no se pega en prompts.
- El contenido propio del docente queda separado del oficial (`escuela_id`).
- La app no calcula ni guarda calificaciones oficiales.
- Fuente y fecha de cada carga quedan documentadas en la versión.

## Señales de alerta — detener y consultar

- Contenidos cargados sin fuente oficial identificable
- Una versión vigente editada en el lugar
- Cobertura calculada con contenidos de una versión no vigente
- Pedido de que la app "califique" con base en el currículo

## Checklist final

- [ ] Fuente oficial, resolución y fecha anotadas en la versión
- [ ] Revisión humana registrada (`validada_por`, `validada_en`)
- [ ] Consultas de prueba del agente devuelven los contenidos esperados
- [ ] Proyectos existentes siguen apuntando a la versión correcta
- [ ] Tablero de cobertura coincide con un conteo manual de una muestra
