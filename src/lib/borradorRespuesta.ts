import { normalizarTexto, parsearNumero } from '../../supabase/functions/_shared/respuestas';

/**
 * Lo que la docente completa en el formulario para una misión: de qué tipo es y cuál es la respuesta correcta.
 * Se valida acá (para avisarle en el momento) y otra vez en la base (trigger), que es la barrera real.
 */
export type TipoRespuestaForm = 'abierta' | 'numero' | 'texto' | 'opcion';

export interface BorradorRespuesta {
  tipo: TipoRespuestaForm;
  /** 'numero' y 'texto': respuestas aceptadas separadas por ";" (por ejemplo "3,5; 7/2"). */
  respuestas: string;
  /** 'numero': diferencia máxima que se acepta (vacío o 0 = exacto). */
  tolerancia: string;
  /** 'opcion': entre 2 y 6 textos. */
  opciones: string[];
  /** 'opcion': posición de la opción correcta. */
  correcta: number;
  /** Hasta 3, de menos a más ayuda (las vacías no se guardan). */
  pistas: string[];
  explicacion: string;
}

export interface DatosRespuestaMision {
  tipoRespuesta: TipoRespuestaForm;
  opciones?: { id: string; texto: string }[];
  respuestas?: string[];
  tolerancia?: number;
  pistas?: string[];
  explicacion?: string;
}

/** Respuesta correcta y pistas que propone la IA para una misión (borrador: la docente lo aprueba al crear el proyecto). */
export interface RespuestaSugeridaIA {
  tipoRespuesta: TipoRespuestaForm;
  respuestas: string[];
  tolerancia: number;
  opciones: { id: string; texto: string }[] | null;
  pistas: string[];
  explicacion: string | null;
}

export const CANTIDAD_PISTAS = 3;

export const ETIQUETAS_TIPO: Record<TipoRespuestaForm, string> = {
  abierta: 'Entrega libre (la lee la docente)',
  numero: 'Número',
  texto: 'Texto corto',
  opcion: 'Opción múltiple',
};

export const respuestaVacia = (): BorradorRespuesta => ({ tipo: 'abierta', respuestas: '', tolerancia: '', opciones: ['', ''], correcta: 0, pistas: ['', '', ''], explicacion: '' });

/** Lo que propuso la IA, listo para mostrar y editar en el formulario. Sin propuesta, queda una entrega libre vacía. */
export function desdeSugerida(r: RespuestaSugeridaIA | null | undefined): BorradorRespuesta {
  const base = respuestaVacia();
  if (!r) return base;
  const pistas = [...r.pistas.slice(0, CANTIDAD_PISTAS)];
  while (pistas.length < CANTIDAD_PISTAS) pistas.push('');
  const comun = { pistas, explicacion: r.explicacion ?? '' };
  if (r.tipoRespuesta === 'opcion' && r.opciones && r.opciones.length >= 2) {
    const correcta = Math.max(0, r.opciones.findIndex((o) => o.id === r.respuestas[0]));
    return { ...base, ...comun, tipo: 'opcion', opciones: r.opciones.map((o) => o.texto), correcta };
  }
  if (r.tipoRespuesta === 'numero') return { ...base, ...comun, tipo: 'numero', respuestas: r.respuestas.join('; '), tolerancia: r.tolerancia ? String(r.tolerancia) : '' };
  if (r.tipoRespuesta === 'texto') return { ...base, ...comun, tipo: 'texto', respuestas: r.respuestas.join('; ') };
  return { ...base, ...comun };
}

/** ¿La IA propuso algo (respuesta o pistas)? Para avisarle a la docente que lo revise. */
export const traePropuesta = (r: RespuestaSugeridaIA | null | undefined): boolean => !!r && (r.tipoRespuesta !== 'abierta' || r.pistas.length > 0 || !!r.explicacion);

const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f'];
const partir = (t: string) => t.split(';').map((x) => x.trim()).filter(Boolean);

/** Mensaje para la docente si algo falta o está mal; null si está bien. */
export function validarBorrador(b: BorradorRespuesta): string | null {
  const explicacion = b.explicacion.trim();
  if (b.pistas.some((p) => p.trim() && (p.trim().length < 3 || p.trim().length > 400))) return 'Cada pista tiene que tener entre 3 y 400 letras.';
  if (explicacion && (explicacion.length < 3 || explicacion.length > 400)) return 'La explicación tiene que tener entre 3 y 400 letras.';

  if (b.tipo === 'abierta') return null;

  if (b.tipo === 'opcion') {
    const textos = b.opciones.map((o) => o.trim());
    if (textos.length < 2 || textos.length > 6) return 'Cargá entre 2 y 6 opciones.';
    if (textos.some((t) => !t)) return 'Completá el texto de todas las opciones (o quitá las que sobran).';
    if (new Set(textos.map(normalizarTexto)).size !== textos.length) return 'Hay opciones repetidas.';
    if (!Number.isInteger(b.correcta) || b.correcta < 0 || b.correcta >= textos.length) return 'Marcá cuál es la opción correcta.';
    return null;
  }

  const lista = partir(b.respuestas);
  if (lista.length === 0) return 'Escribí la respuesta correcta (si hay varias formas válidas, separalas con ;).';
  if (lista.length > 10) return 'Cargá hasta 10 respuestas válidas.';
  if (b.tipo === 'numero') {
    if (lista.some((r) => parsearNumero(r) === null)) return 'Las respuestas de una misión de número tienen que ser números (por ejemplo 3,5 o 7/2).';
    const tol = b.tolerancia.trim();
    if (tol && (parsearNumero(tol) === null || (parsearNumero(tol) as number) < 0)) return 'La tolerancia tiene que ser un número igual o mayor que 0.';
  } else if (lista.some((r) => normalizarTexto(r).length === 0 || r.length > 200)) {
    return 'Cada respuesta tiene que tener letras o números y hasta 200 caracteres.';
  }
  return null;
}

/** Convierte lo que completó la docente en lo que recibe el servicio (asume que `validarBorrador` dio null). */
export function aDatosRespuesta(b: BorradorRespuesta): DatosRespuestaMision {
  const pistas = b.pistas.map((p) => p.trim()).filter(Boolean).slice(0, CANTIDAD_PISTAS);
  const base = { pistas: pistas.length > 0 ? pistas : undefined, explicacion: b.explicacion.trim() || undefined };
  if (b.tipo === 'abierta') return { tipoRespuesta: 'abierta', ...base };
  if (b.tipo === 'opcion') {
    const opciones = b.opciones.map((texto, i) => ({ id: LETRAS[i], texto: texto.trim() }));
    return { tipoRespuesta: 'opcion', opciones, respuestas: [opciones[b.correcta].id], ...base };
  }
  if (b.tipo === 'numero') {
    const tol = b.tolerancia.trim() ? (parsearNumero(b.tolerancia) as number) : 0;
    return { tipoRespuesta: 'numero', respuestas: partir(b.respuestas), tolerancia: tol, ...base };
  }
  return { tipoRespuesta: 'texto', respuestas: partir(b.respuestas), ...base };
}
