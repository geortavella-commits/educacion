// Comparación de respuestas de las misiones. Funciones PURAS (sin Deno ni red): se prueban con vitest (src/lib/respuestas.test.ts).
// Corre SOLO en el servidor: el navegador del alumno nunca ve las respuestas correctas ni hace esta comparación.

export type TipoRespuesta = 'abierta' | 'numero' | 'texto' | 'opcion';

const EPSILON = 1e-9;

/**
 * Lee un número escrito como lo escriben los chicos en Argentina: "3,5" o "3.5", "1.000" (mil), "7/2", "1 1/2", "-4".
 * Devuelve null si no es un número (o si es una fracción con denominador 0).
 */
export function parsearNumero(texto: string): number | null {
  const t = texto.trim();
  if (!t || t.length > 40) return null;

  // Número mixto: "1 1/2"
  const mixto = /^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (mixto) {
    const entero = Number(mixto[1]);
    const num = Number(mixto[2]);
    const den = Number(mixto[3]);
    if (den === 0) return null;
    const parte = num / den;
    return entero < 0 || mixto[1].startsWith('-') ? entero - parte : entero + parte;
  }

  // Fracción: "7/2" (también "3,5/2")
  const fraccion = /^(-?[\d.,]+)\s*\/\s*([\d.,]+)$/.exec(t);
  if (fraccion) {
    const a = parsearDecimal(fraccion[1]);
    const b = parsearDecimal(fraccion[2]);
    if (a === null || b === null || b === 0) return null;
    return a / b;
  }
  return parsearDecimal(t);
}

function parsearDecimal(crudo: string): number | null {
  let t = crudo.trim();
  // Sin espacios en el medio: "3 4" NO es 34 (los espacios solo se aceptan en el número mixto "1 1/2", que se lee antes).
  if (!t || /\s/.test(t)) return null;
  if (t.includes(',')) {
    // En Argentina la coma es el decimal y el punto separa miles: "1.234,5"
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.000" o "12.345.678": puntos de miles
    t = t.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Para comparar textos cortos: sin mayúsculas, tildes, puntuación ni espacios de más. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export interface OpcionMision {
  id: string;
  texto: string;
}

/**
 * ¿La respuesta tiene un formato que se puede comparar? Si no, se le pide al alumno que la escriba de otra forma
 * y NO cuenta como intento (por ejemplo, escribió letras en una misión de número).
 */
export function respuestaConFormatoValido(tipo: TipoRespuesta, respuesta: string, opciones: OpcionMision[] | null): boolean {
  const r = respuesta.trim();
  if (tipo === 'numero') return parsearNumero(r) !== null;
  if (tipo === 'texto') return normalizarTexto(r).length > 0 && r.length <= 200;
  if (tipo === 'opcion') return !!opciones?.some((o) => o.id === r);
  return r.length >= 1 && r.length <= 2000; // abierta
}

/** Compara con las respuestas aceptadas. Las misiones 'abierta' no se corrigen: devuelve null. */
export function esRespuestaCorrecta(
  tipo: TipoRespuesta,
  respuesta: string,
  respuestasAceptadas: string[],
  tolerancia = 0,
): boolean | null {
  const r = respuesta.trim();
  if (tipo === 'abierta') return null;
  if (tipo === 'opcion') return respuestasAceptadas.length === 1 && r === respuestasAceptadas[0];
  if (tipo === 'texto') {
    const buscada = normalizarTexto(r);
    return buscada.length > 0 && respuestasAceptadas.some((a) => normalizarTexto(a) === buscada);
  }
  // numero
  const n = parsearNumero(r);
  if (n === null) return false;
  return respuestasAceptadas.some((a) => {
    const esperado = parsearNumero(a);
    return esperado !== null && Math.abs(n - esperado) <= tolerancia + EPSILON;
  });
}
