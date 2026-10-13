/** Qué le decimos a la docente cuando la ayuda de la IA no se puede dar. Siempre queda la opción de hacerlo a mano. */
const MENSAJES: Record<string, string> = {
  ia_no_configurada: 'La ayuda de la IA todavía no está activada en esta escuela. Podés armarlo a mano.',
  cupo_diario: 'Llegaste al máximo de sugerencias de hoy. Probá mañana o armalo a mano.',
  ia_saturada: 'El servicio de IA está muy ocupado. Probá de nuevo en un minuto.',
  ia_respuesta_invalida: 'La sugerencia no cumplió las reglas de la plataforma (por ejemplo, traía notas o comparaciones). Probá de nuevo o escribilo vos.',
  sin_curriculo: 'Todavía no hay contenidos del Ministerio cargados para este año. Podés armar el proyecto a mano.',
  datos_invalidos: 'Revisá lo que escribiste e intentá de nuevo.',
};

export function mensajeErrorIA(codigo: unknown): string {
  return (typeof codigo === 'string' && MENSAJES[codigo]) || 'No pudimos pedir la sugerencia ahora. Probá de nuevo o hacelo a mano.';
}

/** Saca el código de error de la respuesta de una Edge Function ({ ok:false, error:'codigo' }). */
export async function codigoDeErrorFuncion(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response } | null)?.context;
  try {
    const cuerpo = await ctx?.clone().json();
    return typeof cuerpo?.error === 'string' ? cuerpo.error : 'desconocido';
  } catch {
    return 'desconocido';
  }
}
