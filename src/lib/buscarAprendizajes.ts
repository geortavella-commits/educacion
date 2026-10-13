/**
 * Búsqueda flexible entre los aprendizajes del currículo (y sus indicadores).
 * - No distingue mayúsculas ni tildes ("medicion" encuentra "Medición").
 * - Las palabras pueden venir en cualquier orden y TODAS tienen que aparecer (en la materia, el aprendizaje o un indicador).
 * - Tolera plurales y variantes: busca por la raíz de cada palabra ("fracciones" encuentra "fraccionarias", "sumar" encuentra "suma").
 * - Ordena primero lo que coincide en el texto del aprendizaje, después en la materia y al final en los indicadores.
 */
export interface AprendizajeBuscable {
  materia: string;
  descripcion: string;
  indicadores: string[];
}

export const normalizar = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const palabras = (t: string): string[] => normalizar(t).split(/[^a-z0-9]+/).filter(Boolean);

/** Raíz de una palabra buscada: cuanto más larga, más se recorta (tolera plurales, géneros y derivados). */
function raiz(p: string): string {
  if (p.length <= 4) return p;
  if (p.length <= 6) return p.slice(0, p.length - 1);
  return p.slice(0, p.length - 3);
}

/** Palabras de la consulta que importan (se ignoran las de una sola letra y los conectores más comunes). */
const SIN_VALOR = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'en', 'y', 'o', 'a', 'un', 'una', 'con', 'por', 'para', 'al', 'se']);

export function palabrasDeConsulta(consulta: string): string[] {
  return palabras(consulta).filter((p) => p.length > 1 && !SIN_VALOR.has(p));
}

const contiene = (palabrasDelTexto: string[], r: string) => palabrasDelTexto.some((w) => w.startsWith(r));

export function buscarAprendizajes<T extends AprendizajeBuscable>(lista: readonly T[], consulta: string): T[] {
  const buscadas = palabrasDeConsulta(consulta);
  if (buscadas.length === 0) return [...lista];
  const raices = buscadas.map(raiz);
  const frase = normalizar(consulta).trim();

  const puntuados: { item: T; puntos: number; orden: number }[] = [];
  lista.forEach((item, orden) => {
    const enDescripcion = palabras(item.descripcion);
    const enMateria = palabras(item.materia);
    const enIndicadores = palabras(item.indicadores.join(' '));
    let puntos = 0;
    for (const r of raices) {
      if (contiene(enDescripcion, r)) puntos += 3;
      else if (contiene(enMateria, r)) puntos += 2;
      else if (contiene(enIndicadores, r)) puntos += 1;
      else return; // falta una palabra: no coincide
    }
    if (frase.length > 3 && normalizar(item.descripcion).includes(frase)) puntos += 5; // la frase completa, tal cual
    puntuados.push({ item, puntos, orden });
  });
  return puntuados.sort((a, b) => b.puntos - a.puntos || a.orden - b.orden).map((x) => x.item);
}
