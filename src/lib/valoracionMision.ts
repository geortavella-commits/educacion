export type MarcaValoracion = 'encaminado' | 'repensar' | 'conversar';

export interface ValoracionMision {
  marca: MarcaValoracion;
  mensaje: string;
}

/**
 * Marcas suaves de la docente sobre un ejercicio. No son una nota ni una escala: nunca se suman ni se comparan entre alumnos.
 * `docente` es lo que ella elige; `alumno` es cómo lo lee el chico (siempre en tono de aliento, sin rojo).
 */
export const MARCAS_VALORACION: { valor: MarcaValoracion; docente: string; alumno: string }[] = [
  { valor: 'encaminado', docente: 'Bien encaminado', alumno: '¡Vas muy bien con esta misión!' },
  { valor: 'repensar', docente: 'Pensalo un poco más', alumno: 'Tu seño te invita a pensarla un poquito más' },
  { valor: 'conversar', docente: 'Hablemos', alumno: 'Tu seño quiere charlar con vos sobre esta misión' },
];

export const marcaDe = (valor: MarcaValoracion) => MARCAS_VALORACION.find((m) => m.valor === valor) ?? MARCAS_VALORACION[0];
