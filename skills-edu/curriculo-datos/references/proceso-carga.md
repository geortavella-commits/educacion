# Proceso de carga del currículo

Leer al cargar o actualizar el diseño curricular de una provincia.

## 1. Preparación

- Provincia: ______
- Años y nivel del piloto: ______ (ej. primaria 5º y 6º)
- Áreas: ______ (ej. Matemática, Lengua, Ciencias Naturales, Ciencias Sociales)
- Documentos oficiales (nombre, resolución, fecha, enlace): ______
- Persona que valida (nombre y rol pedagógico): ______

La estructura de los años varía por provincia (la primaria dura 6 o 7 años
según la jurisdicción): confirmar cómo se numeran los años antes de cargar.

## 2. Archivo intermedio

Extraer a un CSV con estas columnas (una fila por contenido):

```
area,nivel,anio,eje,descripcion,es_nap,fuente,pagina
```

- `es_nap` = `true` solo si el documento lo identifica como NAP.
- `fuente` y `pagina` permiten que quien valida verifique cada fila.
- Dejar las dudas marcadas en una columna extra `duda` en lugar de decidir.

## 3. Revisión humana

Quien valida:
- compara una muestra amplia (idealmente todo) contra el documento oficial
- corrige descripciones, años y ejes
- elimina filas de otros años o áreas
- firma la validación (nombre y fecha)

## 4. Importación

- Crear la fila en `curriculo_versiones` con `vigente = false`.
- Insertar `areas` y `curriculo_contenidos` desde el CSV validado, con script
  versionado en el repo (no a mano en producción).
- El script es idempotente y falla si hay áreas o años inconsistentes.

## 5. Verificación

- Conteo por área y año coincide con el CSV.
- Consulta de ejemplo: contenidos de Ciencias Naturales de 5º año.
- Un proyecto de prueba se vincula y el tablero de cobertura calcula bien.

## 6. Puesta en vigencia

- Registrar `validada_por` y `validada_en`.
- Pasar `vigente = true` y apagar la versión anterior del mismo ámbito.
- Anotar el cambio en `docs/` (qué versión, por qué, quién).

## Actualizaciones

Cuando cambia el diseño: nueva versión, comparación contra la anterior
(contenidos agregados, quitados, modificados), migración de vínculos con
revisión del docente y aviso a las escuelas.
