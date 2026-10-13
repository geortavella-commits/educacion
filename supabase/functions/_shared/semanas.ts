// Reglas puras de las semanas de un proyecto (sin dependencias, para poder probarlas con vitest).

/** Hoy en Córdoba (YYYY-MM-DD): las semanas de un proyecto empiezan a medianoche de ahí, no en UTC. */
export function hoyEnCordoba(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

/** ¿Ya se habilitó? Sin fecha de inicio o sin etapa: siempre. Con etapa: desde el primer día de su semana. (Misma regla que mision_habilitada en la base.) */
export function estaHabilitada(fechaInicio: string | null | undefined, semana: number | null | undefined, hoy = hoyEnCordoba()): boolean {
  if (!fechaInicio || !semana) return true;
  const inicio = new Date(`${fechaInicio}T00:00:00Z`).getTime() + (semana - 1) * 7 * 86400000;
  return new Date(`${hoy}T00:00:00Z`).getTime() >= inicio;
}
