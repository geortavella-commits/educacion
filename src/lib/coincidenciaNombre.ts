/** Alguien que ya figura en el curso (o tiene un pedido pendiente) con un nombre igual al de un pedido de ingreso. */
export interface CoincidenciaNombre {
  id: string;
  nombre: string;
  /** 'alumno': ya está inscripto en el curso. 'pedido': otro pedido de ingreso todavía sin resolver. */
  tipo: 'alumno' | 'pedido';
}

/** Mayúsculas, tildes y espacios de más no cuentan: "Vico", "vico " y "VÍCO" son el mismo nombre. */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

/** Candidatos del mismo curso cuyo nombre coincide con el del pedido. La docente decide si es la misma persona. */
export function buscarCoincidencias(nombre: string, candidatos: CoincidenciaNombre[]): CoincidenciaNombre[] {
  const buscado = normalizarNombre(nombre);
  if (!buscado) return [];
  return candidatos.filter((c) => normalizarNombre(c.nombre) === buscado);
}
