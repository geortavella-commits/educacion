/**
 * Hojas imprimibles de misiones: UNA POR SEMANA, con todas las misiones de esa semana.
 * Módulo puro (sin red) para poder probarlo: agrupa filas planas (de la base) en hojas.
 */

export type TipoRespuestaHoja = 'abierta' | 'numero' | 'texto' | 'opcion';

export interface MisionDeHoja {
  id: string;
  orden: number;
  titulo: string;
  enunciado: string;
  tipo: TipoRespuestaHoja;
  opciones: { id: string; texto: string }[];
  /** SOLO en la hoja de la docente (con claves): lo que se espera como respuesta, ya en texto legible. */
  respuestaEsperada?: string[];
}

export interface HojaSemana {
  proyectoId: string;
  proyectoTitulo: string;
  /** null = misiones sin semana (se ven desde el principio). */
  semana: number | null;
  titulo: string;
  objetivo: string;
  curso: string;
  escuela: string;
  /** Nombre del alumno (hoja de la familia). La docente imprime sin nombre: cada chico lo escribe. */
  alumno?: string;
  misiones: MisionDeHoja[];
}

export interface FilaHoja {
  proyecto_id: string;
  proyecto_titulo: string;
  semana: number | null;
  etapa_titulo: string | null;
  etapa_objetivo: string | null;
  mision_id: string;
  orden: number;
  titulo: string;
  consigna: string | null;
  tipo_respuesta: string;
  opciones: { id: string; texto: string }[] | null;
  curso_nombre: string;
  escuela_nombre: string;
  alumno_nombre?: string | null;
}

const TIPOS: TipoRespuestaHoja[] = ['abierta', 'numero', 'texto', 'opcion'];

/** Agrupa las filas (ya ordenadas por proyecto, semana y orden) en hojas: una por proyecto y semana. */
export function agruparEnHojas(filas: readonly FilaHoja[]): HojaSemana[] {
  const hojas = new Map<string, HojaSemana>();
  for (const f of filas) {
    const clave = `${f.proyecto_id}:${f.semana ?? 'sin'}`;
    let h = hojas.get(clave);
    if (!h) {
      h = {
        proyectoId: f.proyecto_id,
        proyectoTitulo: f.proyecto_titulo,
        semana: f.semana,
        titulo: f.semana == null ? 'Misiones del proyecto' : f.etapa_titulo ?? `Semana ${f.semana}`,
        objetivo: f.etapa_objetivo ?? '',
        curso: f.curso_nombre,
        escuela: f.escuela_nombre,
        alumno: f.alumno_nombre ?? undefined,
        misiones: [],
      };
      hojas.set(clave, h);
    }
    h.misiones.push({
      id: f.mision_id,
      orden: f.orden,
      titulo: f.titulo,
      enunciado: f.consigna ?? '',
      tipo: (TIPOS as string[]).includes(f.tipo_respuesta) ? (f.tipo_respuesta as TipoRespuestaHoja) : 'abierta',
      opciones: Array.isArray(f.opciones) ? f.opciones : [],
    });
  }
  for (const h of hojas.values()) h.misiones.sort((a, b) => a.orden - b.orden);
  return [...hojas.values()].sort((a, b) => a.proyectoTitulo.localeCompare(b.proyectoTitulo, 'es') || (a.semana ?? 99) - (b.semana ?? 99));
}

export const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** "Semana 2 · Investigando el crecimiento" (o el título de la hoja sin semana). */
export const rotuloDeHoja = (h: HojaSemana): string => (h.semana == null ? h.titulo : `Semana ${h.semana} · ${h.titulo}`);

/** Pasa las claves guardadas (ids de opción o textos) a texto legible para la hoja de la docente. */
export function respuestaLegible(tipo: TipoRespuestaHoja, opciones: { id: string; texto: string }[], respuestas: string[]): string[] {
  if (tipo !== 'opcion') return respuestas;
  return respuestas.map((r) => {
    const i = opciones.findIndex((o) => o.id === r);
    return i >= 0 ? `${LETRAS[i] ?? String(i + 1)}) ${opciones[i].texto}` : r;
  });
}
