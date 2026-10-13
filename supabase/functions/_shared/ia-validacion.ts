// Validaciones PURAS (sin Deno ni red) de lo que devuelve el modelo y de lo que escribe la docente.
// Se prueban con vitest (src/lib/iaValidacion.test.ts). Regla de oro: el modelo propone, esto filtra; la docente decide.

import { normalizarTexto, parsearNumero } from './respuestas.ts';

/**
 * Respuesta correcta y pistas que PROPONE la IA para una misión. Es un borrador: la docente lo revisa y, al aprobar el proyecto,
 * queda aprobado. Nunca llega al alumno por este camino (las claves viven en una tabla que solo leen las docentes).
 */
export interface RespuestaSugerida {
  tipo_respuesta: 'abierta' | 'numero' | 'texto' | 'opcion';
  /** numero/texto: respuestas aceptadas; opcion: el id de la opción correcta (["b"]); abierta: []. */
  respuestas: string[];
  tolerancia: number;
  opciones: { id: string; texto: string }[] | null;
  /** De menos a más ayuda, hasta 3. Ninguna contiene la respuesta correcta. */
  pistas: string[];
  explicacion: string | null;
}

export interface MisionSugerida {
  titulo: string;
  consigna: string;
  contenido_id: string | null;
  respuesta: RespuestaSugerida | null;
}
export interface ProyectoSugerido {
  titulo: string;
  descripcion: string;
  misiones: MisionSugerida[];
  /** Misiones que propuso el modelo y se descartaron por no cumplir las reglas (se le avisa a la docente). */
  descartadas: number;
}

export class SalidaInvalida extends Error {
  constructor(public motivo: string) {
    super(motivo);
  }
}

/** Texto libre de la docente: sin caracteres de control, espacios colapsados y con tope de largo. Es DATO, nunca instrucción. */
export function sanitizarEntrada(texto: unknown, max: number): string {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const recortar = (v: unknown, max: number) => sanitizarEntrada(v, max);

// Cosas que NUNCA deben aparecer en un texto que va a un chico o a su familia: notas, rankings, comparaciones, contactos.
// Para consignas de un proyecto: solo calificaciones de verdad. "Tomá nota" o "calculá el promedio" son frases normales de una consigna.
const CALIFICACION = /\b(puntaje|puntajes|calificaci[oó]n|calificaciones|sobresaliente|desaprobad[oa]|insuficiente|ranking)\b|\b\d+\s*\/\s*10\b|\b\d+\s*(puntos|pts)\b/i;
// Para mensajes a un alumno: más estricto, porque ahí "nota" casi siempre es una calificación.
const PALABRAS_NOTA = /\b(nota|notas|puntaje|puntajes|calificaci[oó]n|calificaciones|sobresaliente|desaprobad[oa]|aprobad[oa]|insuficiente|ranking|promedio)\b|\b\d+\s*\/\s*10\b|\b\d+\s*(puntos|pts)\b/i;
// Etiquetas de nivel sobre PERSONAS ("chicos atrasados", "grupo avanzado", "nivel bajo"): la plataforma nunca clasifica a un chico.
// Solo se bloquea cuando la palabra describe a personas (no "un proceso lento" ni "avanzar").
const ETIQUETA_NIVEL = /\b(alumnos?|chic[oa]s?|ni[nñ][oa]s?|estudiantes?|grupos?|compa[nñ]eros?)\s+(atrasad|retrasad|rezagad|lent[oa]s?\b|avanzad|de nivel (bajo|medio|alto))|\b(los|las)\s+(m[aá]s\s+)?(atrasad|retrasad|rezagad|lent[oa]s\b|avanzad)|\bnivel\s+(bajo|medio|alto)\b|\b(fl[oa]j[oa]s?|brillantes)\b/i;
const COMPARACIONES = /\b(mejor que|peor que|el mejor|la mejor|el peor|la peor|los dem[aá]s|tus compa[nñ]eros|el resto de la clase|m[aá]s que (el|la|los|las) (resto|dem[aá]s))\b/i;
const CONTACTOS = /https?:\/\/|www\.|@[a-z0-9._-]+\.[a-z]{2,}|\b\d{8,}\b/i;

/**
 * Borrador de un mensaje para un alumno: corto, cálido y sin notas, comparaciones ni contactos.
 * Si no cumple, se rechaza (la docente puede pedir otro o escribirlo ella).
 */
export function limpiarBorrador(crudo: unknown): string {
  const texto = recortar(typeof crudo === 'object' && crudo !== null ? (crudo as Record<string, unknown>).texto : crudo, 600);
  if (texto.length < 10) throw new SalidaInvalida('borrador_vacio');
  if (PALABRAS_NOTA.test(texto)) throw new SalidaInvalida('borrador_con_nota');
  if (COMPARACIONES.test(texto)) throw new SalidaInvalida('borrador_compara');
  if (CONTACTOS.test(texto)) throw new SalidaInvalida('borrador_con_contacto');
  if (ETIQUETA_NIVEL.test(texto)) throw new SalidaInvalida('borrador_etiqueta_nivel');
  return texto;
}

/**
 * Proyecto sugerido: limpia textos, descarta ids de contenido que no existan (el modelo no puede inventar currículo)
 * y exige al menos una misión. Las misiones con notas, comparaciones o contactos se descartan.
 */
export function limpiarProyecto(crudo: unknown, idsPermitidos: ReadonlySet<string>): ProyectoSugerido {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const titulo = recortar(o.titulo, 80);
  const descripcion = recortar(o.descripcion, 400);
  if (titulo.length < 3) throw new SalidaInvalida('proyecto_sin_titulo');
  if (CALIFICACION.test(`${titulo} ${descripcion}`) || CONTACTOS.test(`${titulo} ${descripcion}`) || ETIQUETA_NIVEL.test(`${titulo} ${descripcion}`)) throw new SalidaInvalida('proyecto_invalido');

  const lista = Array.isArray(o.misiones) ? o.misiones : [];
  const misiones: MisionSugerida[] = [];
  const propuestas = lista.slice(0, 6);
  for (const m of propuestas) {
    const x = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
    const t = recortar(x.titulo, 80);
    const consigna = recortar(x.consigna, 400);
    if (t.length < 3) continue;
    const completo = `${t} ${consigna}`;
    if (CALIFICACION.test(completo) || COMPARACIONES.test(completo) || CONTACTOS.test(completo) || ETIQUETA_NIVEL.test(completo)) continue;
    const id = typeof x.contenido_id === 'string' && idsPermitidos.has(x.contenido_id) ? x.contenido_id : null;
    misiones.push({ titulo: t, consigna, contenido_id: id, respuesta: limpiarRespuesta(x) });
  }
  if (misiones.length === 0) throw new SalidaInvalida('proyecto_sin_misiones');
  return { titulo, descripcion, misiones, descartadas: propuestas.length - misiones.length };
}

export interface EtapaSugerida {
  semana: number;
  titulo: string;
  objetivo: string;
  contenido_ids: string[];
  misiones: MisionSugerida[];
}
export interface PlanSugerido {
  titulo: string;
  descripcion: string;
  etapas: EtapaSugerida[];
  descartadas: number;
}

const PROHIBIDO = (t: string) => CALIFICACION.test(t) || COMPARACIONES.test(t) || CONTACTOS.test(t) || ETIQUETA_NIVEL.test(t);

const LETRAS_OPCION = ['a', 'b', 'c', 'd', 'e', 'f'];

/** ¿La pista contiene la respuesta correcta? Una pista orienta, nunca entrega la respuesta. */
function pistaDelataRespuesta(pista: string, tipo: string, respuestas: string[], opciones: { id: string; texto: string }[] | null): boolean {
  if (tipo === 'numero') {
    const valores = respuestas.map((r) => parsearNumero(r)).filter((v): v is number => v !== null);
    const encontrados = pista.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g) ?? [];
    return encontrados.some((n) => {
      const v = parsearNumero(n.replace(/\s+/g, ''));
      return v !== null && valores.some((x) => Math.abs(x - v) < 1e-9);
    });
  }
  const buscadas =
    tipo === 'opcion' ? [opciones?.find((o) => o.id === respuestas[0])?.texto ?? ''] : tipo === 'texto' ? respuestas : [];
  const p = ` ${normalizarTexto(pista)} `;
  return buscadas.map((b) => normalizarTexto(b)).some((b) => b.length >= 3 && p.includes(` ${b} `));
}

/**
 * Respuesta y pistas que sugirió el modelo, ya depuradas. Si la respuesta no es coherente con el tipo (número que no es número,
 * opciones repetidas, correcta fuera de rango) la misión queda 'abierta' (la lee la docente) y se conservan las pistas.
 * Las pistas que contienen la respuesta correcta se descartan. Devuelve null si no hay nada que proponer.
 */
export function limpiarRespuesta(crudo: unknown): RespuestaSugerida | null {
  if (!crudo || typeof crudo !== 'object') return null;
  const x = crudo as Record<string, unknown>;
  const lista = (v: unknown, max: number) => (Array.isArray(v) ? v : []).map((i) => recortar(i, max)).filter((i) => i.length > 0);

  let tipo = ['numero', 'texto', 'opcion'].includes(String(x.tipo_respuesta)) ? (String(x.tipo_respuesta) as RespuestaSugerida['tipo_respuesta']) : 'abierta';
  let respuestas: string[] = [];
  let opciones: { id: string; texto: string }[] | null = null;

  if (tipo === 'opcion') {
    const textos = lista(x.opciones, 100);
    const unicas = new Set(textos.map(normalizarTexto));
    const correcta = Number(x.correcta);
    if (textos.length >= 2 && textos.length <= 6 && unicas.size === textos.length && Number.isInteger(correcta) && correcta >= 0 && correcta < textos.length) {
      opciones = textos.map((texto, i) => ({ id: LETRAS_OPCION[i], texto }));
      respuestas = [LETRAS_OPCION[correcta]];
    } else tipo = 'abierta';
  } else if (tipo === 'numero') {
    // Una cuenta tiene UN resultado: "respuestas" son formas equivalentes de escribirlo (8 / 8,0 / 16/2). Si el modelo listó valores
    // distintos, no hay respuesta verificable: casi cualquier número saldría "correcto". Queda como entrega libre.
    const valores = lista(x.respuestas, 40).map((r) => ({ r, v: parsearNumero(r) })).filter((e): e is { r: string; v: number } => e.v !== null);
    if (valores.length === 0 || valores.some((e) => Math.abs(e.v - valores[0].v) > 1e-9)) tipo = 'abierta';
    else respuestas = [...new Set(valores.map((e) => e.r))].slice(0, 5);
  } else if (tipo === 'texto') {
    // Pocas formas de escribir lo mismo (sinónimos). Una lista larga indica que hay varias respuestas posibles: no es verificable.
    respuestas = [...new Set(lista(x.respuestas, 200).filter((r) => normalizarTexto(r).length > 0))];
    if (respuestas.length === 0 || respuestas.length > 3) {
      respuestas = [];
      tipo = 'abierta';
    }
  }

  const pistas = lista(x.pistas, 400)
    .filter((p) => p.length >= 3 && !PROHIBIDO(p) && !pistaDelataRespuesta(p, tipo, respuestas, opciones))
    .slice(0, 3);
  const expl = recortar(x.explicacion, 400);
  const explicacion = expl.length >= 3 && !PROHIBIDO(expl) ? expl : null;

  if (tipo === 'abierta' && pistas.length === 0 && !explicacion) return null;
  return { tipo_respuesta: tipo, respuestas, tolerancia: 0, opciones, pistas, explicacion };
}

/** Fragmento del esquema JSON (modo estricto) con la respuesta y las pistas de cada misión. */
export const ESQUEMA_RESPUESTA_MISION = {
  tipo_respuesta: { type: 'string', enum: ['abierta', 'numero', 'texto', 'opcion'] },
  respuestas: { type: 'array', items: { type: 'string' } },
  opciones: { type: 'array', items: { type: 'string' } },
  correcta: { type: ['integer', 'null'] },
  pistas: { type: 'array', items: { type: 'string' } },
  explicacion: { type: ['string', 'null'] },
};
export const REQUERIDOS_RESPUESTA_MISION = ['tipo_respuesta', 'respuestas', 'opciones', 'correcta', 'pistas', 'explicacion'];

/** Reglas para el modelo sobre tipo de respuesta, respuesta correcta y pistas (se agregan al prompt de sistema). */
export const REGLAS_RESPUESTA_Y_PISTAS = `- Para cada misión definí "tipo_respuesta":
  · "numero": SOLO si la consigna es una cuenta o problema AUTOCONTENIDO: el enunciado trae todos los datos y el resultado es un único número (por ejemplo "Tenías 30 semillas y sembraste 15: ¿cuántas quedan?"). Poné ese único número en "respuestas" (como máximo con otra forma de escribirlo, por ejemplo "3,5" y "7/2"). Hacé la cuenta con mucho cuidado. Si la consigna pide contar, medir u observar algo real (la huerta, el patio, la casa), el resultado depende de cada chico: usá "abierta".
  · "texto": una palabra o frase corta con UNA respuesta clara (por ejemplo una capital). Poné en "respuestas" solo formas equivalentes de escribirla. Nunca varias respuestas distintas.
  · "opcion": elegir entre 2 a 4 opciones: escribí los textos en "opciones" y el número de la correcta (empieza en 0) en "correcta". Los distractores tienen que ser razonables.
  · "abierta": observar, crear, explicar o argumentar con las propias palabras. Es el tipo más común: dejá "respuestas" y "opciones" vacíos y "correcta" en null.
- "explicacion": una frase breve para mostrar cuando acierta (o null).
- "pistas": SIEMPRE 3 pistas por misión, de menor a mayor ayuda, de 1 o 2 oraciones y en voseo. La 1ª orienta qué mirar o recordar; la 2ª acota el camino o propone un primer paso; la 3ª ayuda casi todo con un ejemplo parecido, pero NUNCA dice la respuesta. Ninguna pista contiene la respuesta correcta.`;
/**
 * Plan de varias semanas: una etapa por semana (1..semanas, sin repetir) con su objetivo, los aprendizajes que cubre y sus misiones.
 * El modelo no puede inventar currículo (ids que no existan se descartan), ni pasar de las semanas pedidas, ni colar notas, comparaciones,
 * etiquetas de nivel o contactos. Exige al menos una etapa con una misión. Las etapas salen ordenadas por semana.
 */
export function limpiarPlan(crudo: unknown, idsPermitidos: ReadonlySet<string>, semanas: number, maxMisionesPorSemana = 5): PlanSugerido {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const titulo = recortar(o.titulo, 80);
  const descripcion = recortar(o.descripcion, 400);
  if (titulo.length < 3) throw new SalidaInvalida('plan_sin_titulo');
  if (PROHIBIDO(`${titulo} ${descripcion}`)) throw new SalidaInvalida('plan_invalido');

  const etapas: EtapaSugerida[] = [];
  const vistas = new Set<number>();
  let descartadas = 0;
  for (const e of Array.isArray(o.etapas) ? o.etapas.slice(0, 8) : []) {
    const x = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
    const semana = Number(x.semana);
    if (!Number.isInteger(semana) || semana < 1 || semana > semanas || vistas.has(semana)) { descartadas++; continue; }
    const t = recortar(x.titulo, 80);
    const objetivo = recortar(x.objetivo, 400);
    if (t.length < 3 || PROHIBIDO(`${t} ${objetivo}`)) { descartadas++; continue; }

    const propuestas = Array.isArray(x.misiones) ? x.misiones.slice(0, maxMisionesPorSemana) : [];
    const misiones: MisionSugerida[] = [];
    for (const m of propuestas) {
      const y = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
      const mt = recortar(y.titulo, 80);
      const consigna = recortar(y.consigna, 400);
      if (mt.length < 3 || PROHIBIDO(`${mt} ${consigna}`)) { descartadas++; continue; }
      misiones.push({ titulo: mt, consigna, contenido_id: typeof y.contenido_id === 'string' && idsPermitidos.has(y.contenido_id) ? y.contenido_id : null, respuesta: limpiarRespuesta(y) });
    }
    if (misiones.length === 0) { descartadas++; continue; }
    const ids = [...new Set((Array.isArray(x.contenido_ids) ? x.contenido_ids : []).filter((i): i is string => typeof i === 'string' && idsPermitidos.has(i)))].slice(0, 12);
    vistas.add(semana);
    etapas.push({ semana, titulo: t, objetivo, contenido_ids: ids, misiones });
  }
  if (etapas.length === 0) throw new SalidaInvalida('plan_sin_etapas');
  etapas.sort((a, b) => a.semana - b.semana);
  return { titulo, descripcion, etapas, descartadas };
}

/** Intereses del curso que se pueden mencionar sin identificar a nadie: solo los que comparten al menos `minimo` chicos. */
export function interesesAgregados(conteos: ReadonlyMap<string, number>, totalAlumnos: number, minimo = 5, maximo = 3): string[] {
  if (totalAlumnos < minimo * 2) return []; // cursos muy chicos: no se comparte ni el agregado
  return [...conteos.entries()]
    .filter(([, n]) => n >= minimo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maximo)
    .map(([id]) => id);
}

const escaparRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Cambia el nombre del alumno por [NOMBRE] (sin importar mayúsculas ni tildes) para que el modelo nunca lo vea.
 * Solo reemplaza palabras completas: "Vico" no toca "Vicente".
 */
export function ocultarNombre(texto: string, nombre: string): string {
  const descompuesto = (t: string) => t.normalize('NFD');
  const sinTildes = (t: string) => descompuesto(t).replace(/\p{Diacritic}/gu, '');
  let salida = descompuesto(texto);
  for (const parte of sinTildes(nombre).split(/\s+/).filter((p) => p.length >= 2)) {
    // En el texto descompuesto, cada letra puede venir seguida de marcas de tilde.
    const patron = [...parte].map(escaparRegex).join('\\p{M}*') + '\\p{M}*';
    salida = salida.replace(new RegExp(`(?<![\\p{L}\\p{M}])${patron}(?![\\p{L}\\p{M}])`, 'giu'), '[NOMBRE]');
  }
  return salida.normalize('NFC');
}

// Nombres de grupo: lo ven los chicos y las familias. Tienen que ser PAREJOS: nada que suene a ranking ni a nivel de aprendizaje.
const RANKING_NOMBRE = /\b(campe[oó]n(es)?|ganador(es)?|mejor(es)?|l[ií]der(es)?|primer(?:[oa]s?)?|segund[oa]s?|tercer(?:[oa]s?)?|[uú]ltim[oa]s?|top|ranking|invencibles?|supremos?|r[aá]pid[oa]s?|veloz|velocistas?)\b/i;
const NOMBRE_GRUPO_VALIDO = /^[\p{L}][\p{L} '’-]{2,27}$/u;

/**
 * Nombres de grupo que devolvió el modelo: se aceptan solo los que cumplen las reglas (cortos, sin números ni letras para
 * ordenar, sin ranking ni etiquetas de nivel, sin contactos, todos distintos) y solo para las claves que se pidieron.
 * Lo que no cumple se omite: la pantalla conserva el nombre neutro original de ese grupo.
 */
export function limpiarNombresGrupos(crudo: unknown, clavesEsperadas: ReadonlySet<string>): Record<string, string> {
  const lista = crudo && typeof crudo === 'object' && Array.isArray((crudo as Record<string, unknown>).nombres) ? ((crudo as Record<string, unknown>).nombres as unknown[]) : [];
  const salida: Record<string, string> = {};
  const vistos = new Set<string>();
  for (const item of lista) {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const clave = typeof o.clave === 'string' ? o.clave : '';
    const nombre = sanitizarEntrada(o.nombre, 40);
    if (!clavesEsperadas.has(clave) || clave in salida) continue;
    if (!NOMBRE_GRUPO_VALIDO.test(nombre)) continue;
    if (RANKING_NOMBRE.test(nombre) || ETIQUETA_NIVEL.test(nombre) || CONTACTOS.test(nombre)) continue;
    const unico = nombre.toLocaleLowerCase('es');
    if (vistos.has(unico)) continue;
    vistos.add(unico);
    salida[clave] = nombre;
  }
  if (Object.keys(salida).length === 0) throw new SalidaInvalida('nombres_sin_validos');
  return salida;
}
