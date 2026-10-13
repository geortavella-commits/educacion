/** Palabras que, en el nombre que VEN los alumnos, pueden clasificarlos. */
const PALABRAS_QUE_CLASIFICAN = ['refuerzo', 'nivel', 'bajo', 'avanzado', 'apoyo', 'facil', 'fácil', 'dificil', 'difícil', 'lento', 'rapido', 'rápido', 'mejor', 'peor'];

export function nombreClasifica(nombre: string): boolean {
  const n = nombre.toLowerCase();
  return PALABRAS_QUE_CLASIFICAN.some((p) => new RegExp(`(^|[^\\p{L}])${p}([^\\p{L}]|$)`, 'u').test(n));
}
