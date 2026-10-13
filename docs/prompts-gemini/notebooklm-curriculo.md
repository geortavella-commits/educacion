# Prompts para NotebookLM: ordenar el currículo de primaria

Sirven para que NotebookLM lea los documentos curriculares que subas como fuentes y devuelva los contenidos en una tabla que se puede cargar a la base de Chasqui. **Lo que devuelve es un borrador**: una persona tiene que revisarlo contra el documento original antes de marcarlo como vigente.

## Cómo usarlos
1. Creá un cuaderno nuevo en NotebookLM solo para **primaria** y subí los PDF oficiales como fuentes (solo documentos públicos: diseños curriculares, NAP, etc.).
2. Pegá el **Prompt 1** (inventario) y leé la respuesta. Corregila si algo está mal.
3. Con el **Prompt 1b** aclarás las dudas que dejó el inventario. Con el **Prompt 2** pedí **una materia y un tramo por vez** (cambiá `{MATERIA}` y `{TRAMO}`). Pegá cada resultado en un archivo `.csv` dentro de una carpeta.
4. Con el **Prompt 3**, pedí el control de cada materia y grado.
5. Pasame la ruta de la carpeta. No pegues el contenido en el chat.

---

## Prompt 1: Inventario de las fuentes

```
Quiero ordenar los documentos curriculares que subí para cargarlos en una base de datos. No inventes nada: respondé SOLO con lo que está en las fuentes y citá siempre el documento y la página.

Hacé un INVENTARIO y todavía NO extraigas contenidos:

1. Por cada documento: título exacto, jurisdicción (nacional o provincia), año de publicación o resolución, nivel (primaria, inicial, secundaria) y si parece ser la versión vigente o una anterior.
2. Cómo está organizado cada documento: por GRADO (1.º a 6.º), por CICLO (por ejemplo primer ciclo 1.º a 3.º, segundo ciclo 4.º a 6.º) o ambos; y en qué unidades se divide el contenido (ejes, bloques, núcleos, capítulos, etc.).
3. Una tabla con todas las ÁREAS o MATERIAS que aparecen (por ejemplo Lengua, Matemática, Ciencias Sociales, Ciencias Naturales, Educación Tecnológica, Educación Artística y sus lenguajes, Educación Física, Formación Ética y Ciudadana, Lenguas Extranjeras, otras), indicando para cada una en qué grados o ciclos aparece y en qué páginas.
4. Qué NO está en las fuentes: avisame si falta alguna materia o algún grado.
5. Cómo se llaman las cosas en cada documento: ¿hablan de "contenidos", "aprendizajes", "saberes", "NAP", "indicadores de avance", "capacidades"? Decime cuál es la unidad que mejor representa lo que un docente enseña (por ejemplo "Núcleo de Aprendizaje Prioritario") y si tienen código o numeración.
6. Cualquier contradicción o ambigüedad entre documentos (dos versiones de la misma materia, grados que no coinciden, etc.).

Terminá con las preguntas que necesites que yo responda antes de extraer los contenidos.
```

---

## Prompt 1b: Aclaraciones (después del inventario)

```
Necesito que verifiques cinco cosas en las fuentes, citando documento y página, y copiando el texto TEXTUAL cuando lo haya. Si algo no está escrito, decí "no figura" en vez de suponerlo. Tus dos inventarios anteriores se contradicen en algunos puntos: resolvelos mirando el texto.

1. ESTADO DE LOS DOCUMENTOS: afirmaste que los documentos son la "versión vigente", pero también que "Metas por ciclo" se presentó como "Versión en consulta 2025" y que las progresiones se "sistematizaron tras consultas a docentes". Copiá textualmente cualquier frase que diga si cada documento (Marco Curricular Común, Metas por ciclo y cada Progresión) está aprobado, vigente, en consulta, en borrador o es una propuesta, y si cita una resolución o norma (número y año). Si no figura, escribí "no figura". No escribas "vigente" si no hay una frase que lo diga.
2. GRADO O TRAMO: en Primaria, en el cuadro de Matemática de 5.º y 6.º grado, ¿los "Aprendizajes y contenidos" de 5.º están SEPARADOS de los de 6.º (por columnas, bloques o títulos) o aparecen UNIFICADOS para todo el tramo? Decime lo mismo para Lengua y Literatura, Ciencias Naturales y Ciencias Sociales. Mostrá un ejemplo textual con página de cada caso. Si hay contenidos asignados a un solo grado dentro del tramo, mostrá ejemplos.
3. RELACIÓN ENTRE LOS TRES COMPONENTES: ¿cada "Indicador de logro" aparece junto a un "Aprendizaje y contenido" concreto (misma fila, mismo bloque, misma viñeta) o son listas separadas? Mostrame un ejemplo real de Matemática 5.º y 6.º grado con su página. ¿A qué grados se refieren exactamente las "Metas por ciclo" de ese tramo?
4. TÍTULOS INTERNOS: para Matemática, Lengua y Literatura, Ciencias Naturales y Ciencias Sociales, tramo 5.º y 6.º grado, listá los títulos o subtítulos que aparecen DENTRO del cuadro exactamente como figuran, con su página.
5. METAS POR CICLO vs PROGRESIONES: comparé el texto de las metas de Matemática 5.º y 6.º grado en el PDF "Metas por ciclo" con el de la Progresión de Matemática. ¿Son idénticos, o hay diferencias? Mostrame las diferencias textuales con página.
```

---

## Prompt 2: Extraer una materia y un tramo (Progresiones de aprendizaje)

Cambiá `{MATERIA}` y `{TRAMO}` (por ejemplo Matemática y "5.º y 6.º grado"). Empezá por Matemática, 5.º y 6.º grado. Antes de usarlo, desmarcá en NotebookLM los PDF que no corresponden (incluido el duplicado de Formación para la Vida y el Trabajo y "Metas por ciclo").

```
Extraé TODO lo que figura para la materia {MATERIA}, tramo {TRAMO} de Educación Primaria, usando SOLO el PDF "Progresiones de Aprendizaje para {MATERIA}" (ignorá el PDF "Metas por ciclo", que es una versión preliminar en consulta, y los demás documentos). Extraé: las Metas por ciclo, los Aprendizajes y contenidos, y los Indicadores de logro.

REGLAS (obligatorias):
- Copiá cada texto con las palabras de la fuente. No lo resumas, no lo parafrasees, no lo mejores y no agregues nada que no esté escrito en las fuentes ni de otros documentos ni de tu conocimiento general.
- En estos documentos los Aprendizajes y contenidos están SEPARADOS por grado (5.º por un lado y 6.º por otro): una fila por contenido, con "desde" y "hasta" iguales a ese grado. Las Metas por ciclo son comunes a todo el tramo: poné desde=5 y hasta=6. Cada Indicador de logro pertenece al Aprendizaje y contenido de su misma caja, así que lleva el mismo grado que ese aprendizaje. NUNCA dupliques una fila para repartirla en dos grados.
- ORDEN de las filas, tal como aparecen en el documento: cada Meta, seguida de los aprendizajes de 5.º grado que figuran bajo esa meta, luego los de 6.º grado que figuran bajo la misma meta, y después la meta siguiente. Cada aprendizaje va seguido inmediatamente por TODOS sus indicadores de logro (copiá todos: en el PDF suelen estar en dos columnas, leelas completas, la columna izquierda y después la derecha).
- Si un renglón junta varias ideas (por ejemplo "Reconocer A, B y C"), separalo en filas de UNA idea cada una, conservando las palabras originales y repitiendo el verbo inicial si hace falta para que cada fila se entienda sola. Una frase de hasta unas 200 letras por fila.
- Respetá el orden del documento.
- Si algo no se lee bien, es ambiguo o creés que puede estar incompleto, escribí "REVISAR" al principio de la columna "descripcion" y explicalo en la sección DUDAS.
- Si no encontrás algo, decilo en vez de rellenar.

FORMATO: una tabla CSV en un solo bloque de código, con estas columnas exactas y en este orden (todos los textos entre comillas dobles):

tipo,area,nivel,desde,hasta,ciclo,meta,descripcion,vinculo,fuente

- tipo: "meta" (Meta por ciclo), "aprendizaje" (Aprendizaje y contenido) o "indicador" (Indicador de logro).
- area: la materia como figura en la fuente.
- nivel: siempre "primaria".
- desde / hasta: número del primer y del último grado a los que se refiere la fila (aprendizajes e indicadores: el mismo grado en ambos, por ejemplo 5 y 5; metas: 5 y 6).
- ciclo: cómo nombra la fuente el ciclo o tramo de esa fila (por ejemplo "5.º y 6.º grado"; vacío si no lo nombra).
- meta: SOLO en las filas "aprendizaje" (y en sus indicadores): el texto de la Meta del cuadro bajo la cual aparece ese aprendizaje, IDÉNTICO letra por letra al de la fila "meta" correspondiente. En las filas "meta", vacío.
- descripcion: el texto de la fila, con las palabras de la fuente.
- vinculo: SOLO para los indicadores: copiá el texto del aprendizaje y contenido de su misma caja, IDÉNTICO letra por letra al de la fila "aprendizaje" correspondiente (después se compara automáticamente: si difiere en una sola letra, la fila se rechaza). Si el aprendizaje se separó en varias filas, usá el texto completo del renglón original tal como está en la fila del aprendizaje que corresponde. En las filas "meta" y "aprendizaje", vacío.
- fuente: documento y página, por ejemplo "Progresiones de Aprendizaje para Matemática, p. 45".

Si hay más de 60 filas, entregá las primeras 60 y terminá con la palabra CONTINUA; cuando te escriba "continuá", seguí desde la fila siguiente sin repetir ninguna.

Después de la tabla agregá tres secciones cortas:
- RECUENTO: cuántas filas hay de cada tipo, por meta y por grado, y cuántos indicadores tiene cada aprendizaje.
- DUDAS: cada fila marcada REVISAR y por qué.
- NO EXTRAÍDO: partes de esa materia y tramo que viste pero no incluiste, y el motivo.
```

---

## Prompt 2 (versión corta, para cuando NotebookLM limita el largo)

Mismas reglas que el Prompt 2 completo, en 1267 caracteres. Si todavía es largo, usá la versión ultracorta (809 caracteres, sin la columna "ciclo").

```
Usá SOLO el PDF "Progresiones de Aprendizaje para {MATERIA}". Extraé del tramo {TRAMO} de Primaria las Metas, los Aprendizajes y contenidos y los Indicadores de logro, TEXTUAL (sin resumir, parafrasear ni agregar nada).

Salida: CSV en un bloque de código, todo entre comillas dobles, columnas exactas:
tipo,area,nivel,desde,hasta,ciclo,meta,descripcion,vinculo,fuente
- tipo: meta, aprendizaje o indicador
- area: la materia. nivel: primaria
- desde,hasta: grado de la fila (aprendizajes e indicadores: el mismo, ej. 5 y 5; metas: 5 y 6). No dupliques filas.
- ciclo: como lo nombra la fuente
- meta: en aprendizajes e indicadores, el texto IDÉNTICO de su meta; en metas, vacío
- descripcion: el texto
- vinculo: solo indicadores: texto IDÉNTICO de su aprendizaje
- fuente: "documento, p. N"

Orden del PDF: meta, sus aprendizajes de 5.º, los de 6.º, siguiente meta. Cada aprendizaje seguido de TODOS sus indicadores (leé las dos columnas).
Si una frase junta varias ideas, separala en filas de una idea con las mismas palabras.
Si algo es dudoso, "REVISAR" al inicio de descripcion.
Máximo 60 filas por respuesta; si faltan, terminá con CONTINUA y seguí cuando diga "continuá".
Al final: RECUENTO (filas por tipo, meta y grado; indicadores por aprendizaje) y DUDAS.
```

Versión ultracorta (columnas: `tipo,area,nivel,desde,hasta,meta,descripcion,vinculo,fuente`):

```
Usá SOLO el PDF "Progresiones de Aprendizaje para {MATERIA}", tramo {TRAMO} de Primaria. Extraé TEXTUAL (sin resumir ni agregar) metas, aprendizajes e indicadores como CSV en un bloque de código, todo entre comillas:
tipo,area,nivel,desde,hasta,meta,descripcion,vinculo,fuente
tipo=meta/aprendizaje/indicador; nivel=primaria; desde,hasta=grado (metas 5 y 6; el resto el mismo grado, sin duplicar); meta=texto IDÉNTICO de la meta de cada aprendizaje e indicador; vinculo=solo indicadores: texto IDÉNTICO de su aprendizaje; fuente="documento, p. N".
Orden del PDF: meta, aprendizajes de 5.º, de 6.º, siguiente meta; cada aprendizaje con TODOS sus indicadores (leé las dos columnas). Dudoso: "REVISAR" al inicio de descripcion. Máx. 60 filas; si faltan, terminá con CONTINUA. Al final, RECUENTO por tipo y grado.
```

---

## Prompt 3: Control de calidad (después de cada extracción)

```
Controlá la extracción que hiciste de {MATERIA}, tramo {TRAMO}, contra las fuentes:

1. Releé el apartado de esa materia y tramo en las fuentes y decime si quedó algo SIN extraer: listá los títulos, ejes o renglones que faltan y su página.
2. Marcá cualquier fila en que NO hayas respetado las palabras originales (resumen, parafraseo, agregado) y mostrame cómo dice textualmente la fuente.
3. Marcá filas repetidas o casi repetidas.
4. Verificá que cada fila tenga la página correcta y que el grado o ciclo sea el que dice la fuente.
5. Decime el total de contenidos que debería haber según la fuente y cuántos hay en tu tabla, y si no coinciden explicá por qué.

No corrijas nada todavía: solo informá. Citá siempre documento y página.
```
