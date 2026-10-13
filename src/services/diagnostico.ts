import { getSupabase } from '@/lib/supabase';
import { usarSupabase } from './modo';

export interface PreguntaOpcion {
  id: string;
  texto: string;
}

export interface PreguntaDiagnostico {
  id: string;
  pasoNumero: number;
  totalPasos: number;
  tipo: 'opcion_multiple' | 'intereses';
  subtitulo?: string;
  enunciado: string;
  aclaracion?: string;
  opciones?: PreguntaOpcion[];
}

export interface InteresItem {
  id: string;
  etiqueta: string;
  enFrase: string;
  color?: string;
}

export const LISTA_INTERESES: InteresItem[] = [
  { id: 'futbol', etiqueta: 'Fútbol', enFrase: 'fútbol', color: 'oklch(0.93 0.05 195)' },
  { id: 'dibujo', etiqueta: 'Dibujo', enFrase: 'dibujo', color: 'oklch(0.93 0.04 260)' },
  { id: 'cocina', etiqueta: 'Cocinar', enFrase: 'cocina' },
  { id: 'videojuegos', etiqueta: 'Videojuegos', enFrase: 'videojuegos' },
  { id: 'musica', etiqueta: 'Música', enFrase: 'música' },
  { id: 'animales', etiqueta: 'Animales', enFrase: 'animales' },
  { id: 'robotica', etiqueta: 'Robótica', enFrase: 'robótica' },
  { id: 'espacio', etiqueta: 'El Espacio', enFrase: 'el espacio' },
];

export const INTERESES_DISPONIBLES = LISTA_INTERESES;

export function obtenerEtiquetaInteres(id: string): string | undefined {
  const item = LISTA_INTERESES.find((i) => i.id.toLowerCase() === id.toLowerCase());
  return item ? item.etiqueta : undefined;
}

export function obtenerInteresEnFrase(id: string): string | undefined {
  const item = LISTA_INTERESES.find((i) => i.id.toLowerCase() === id.toLowerCase());
  return item ? item.enFrase : undefined;
}

export function formatearInteresesTexto(ids: string[]): string {
  if (!ids || ids.length === 0) return 'fútbol y dibujo';
  const uniqueIds = Array.from(new Set(ids));
  const frases = uniqueIds
    .map((id) => obtenerInteresEnFrase(id))
    .filter((f): f is string => Boolean(f));
  
  if (frases.length === 0) return 'fútbol y dibujo';
  if (frases.length === 1) {
    return frases[0];
  }
  if (frases.length === 2) {
    const union = frases[1].toLowerCase().startsWith('i') || frases[1].toLowerCase().startsWith('hi') ? 'e' : 'y';
    return `${frases[0]} ${union} ${frases[1]}`;
  }
  
  const primeros = frases.slice(0, -1).join(', ');
  const ultimo = frases[frases.length - 1];
  const union = ultimo.toLowerCase().startsWith('i') || ultimo.toLowerCase().startsWith('hi') ? 'e' : 'y';
  return `${primeros} ${union} ${ultimo}`;
}

export const PREGUNTAS_MOCK: PreguntaDiagnostico[] = [
  {
    id: 'diag-1',
    pasoNumero: 1,
    totalPasos: 6,
    tipo: 'opcion_multiple',
    subtitulo: 'Sin notas, es un juego para conocerte.',
    enunciado: 'Si tenés que armar una torre muy alta con bloques, ¿por dónde empezarías?',
    opciones: [
      { id: 'op-1', texto: 'Por una base ancha y firme' },
      { id: 'op-2', texto: 'Por los bloques más livianos' },
      { id: 'op-3', texto: 'Por los colores que más me gustan' },
      { id: 'op-4', texto: 'Poniendo un bloque sobre otro rápido' },
    ],
  },
  {
    id: 'diag-2',
    pasoNumero: 2,
    totalPasos: 6,
    tipo: 'opcion_multiple',
    subtitulo: 'Sin notas, es un juego para conocerte.',
    enunciado: 'Hay 12 figuritas. Repartís en partes iguales entre 3 amigos. ¿Cuántas le tocan a cada uno?',
    opciones: [
      { id: 'op-1', texto: '3' },
      { id: 'op-2', texto: '4' },
      { id: 'op-3', texto: '6' },
      { id: 'op-4', texto: '9' },
    ],
  },
  {
    id: 'diag-3',
    pasoNumero: 3,
    totalPasos: 6,
    tipo: 'opcion_multiple',
    subtitulo: 'Sin notas, es un juego para conocerte.',
    enunciado: 'Cuando leés un cuento o ves una peli, ¿qué te gusta más descubrir?',
    opciones: [
      { id: 'op-1', texto: 'Cómo los personajes resuelven el misterio' },
      { id: 'op-2', texto: 'Los dibujos y cómo está creado el mundo' },
      { id: 'op-3', texto: 'Los datos curiosos y reales' },
      { id: 'op-4', texto: 'La acción y las aventuras rápidas' },
    ],
  },
  {
    id: 'diag-4',
    pasoNumero: 4,
    totalPasos: 6,
    tipo: 'opcion_multiple',
    subtitulo: 'Sin notas, es un juego para conocerte.',
    enunciado: 'Para medir el largo del patio de la escuela antes del recreo, ¿qué preferís usar?',
    opciones: [
      { id: 'op-1', texto: 'Dar pasos largos contándolos' },
      { id: 'op-2', texto: 'Una cinta métrica de la seño' },
      { id: 'op-3', texto: 'Comparar con baldosas del piso' },
      { id: 'op-4', texto: 'Una regla de 30 centímetros' },
    ],
  },
  {
    id: 'diag-5',
    pasoNumero: 5,
    totalPasos: 6,
    tipo: 'intereses',
    subtitulo: 'Elegí hasta 3. Chasqui las usa para explicar.',
    enunciado: '¿Qué te gusta hacer en tu tiempo libre?',
    aclaracion: 'Podés elegir hasta 3 pasiones. Chasqui adaptará los ejemplos a lo que te divierte.',
  },
  {
    id: 'diag-6',
    pasoNumero: 6,
    totalPasos: 6,
    tipo: 'opcion_multiple',
    subtitulo: 'Última pregunta antes de empezar.',
    enunciado: '¿Cómo te resulta más fácil entender algo nuevo cuando estás en clase?',
    opciones: [
      { id: 'op-1', texto: 'Con ejemplos de cosas cotidianas' },
      { id: 'op-2', texto: 'Dibujando o haciendo esquemas' },
      { id: 'op-3', texto: 'Probando y equivocándome primero' },
      { id: 'op-4', texto: 'Charlando con mis compañeros' },
    ],
  },
];


// Intereses del alumno que inició sesión (modo real). En modo real NO se usa localStorage: en una
// compu/tablet compartida del aula los intereses de un chico no pueden quedar para el siguiente.
let cacheIntereses: string[] | null = null;

async function leerInteresesDB(): Promise<string[]> {
  const sb = getSupabase();
  const { data: ses } = await sb.auth.getSession();
  if (!ses.session) return [];
  const { data, error } = await sb.from('intereses_alumno').select('interes').eq('alumno_id', ses.session.user.id).eq('origen', 'declarado');
  if (error) throw new Error(error.message);
  cacheIntereses = (data ?? []).map((r) => r.interes as string).filter((id) => LISTA_INTERESES.some((i) => i.id === id));
  return cacheIntereses;
}

export async function guardarInteresesDB(ids: string[]): Promise<void> {
  const sb = getSupabase();
  const { data: ses } = await sb.auth.getSession();
  if (!ses.session) throw new Error('sin_sesion');
  const uid = ses.session.user.id;
  const validos = [...new Set(ids.filter((id) => LISTA_INTERESES.some((i) => i.id === id)))].slice(0, 3);
  const borrar = await sb.from('intereses_alumno').delete().eq('alumno_id', uid).eq('origen', 'declarado');
  if (borrar.error) throw new Error(borrar.error.message);
  if (validos.length) {
    const ins = await sb.from('intereses_alumno').insert(validos.map((interes) => ({ alumno_id: uid, interes, origen: 'declarado' })));
    if (ins.error) throw new Error(ins.error.message);
  }
  cacheIntereses = validos;
}

/** Limpia lo que quedó en memoria al cerrar sesión (otro alumno puede usar el mismo equipo). */
export function olvidarInteresesEnMemoria(): void {
  cacheIntereses = null;
}

const STORAGE_KEY_INTERESES = 'chasqui_alumno_intereses';

export const diagnosticoService = {
  /**
   * Preguntas del diagnóstico. En modo real, las de contenido son las del AÑO del alumno (el servidor elige y no manda la
   * respuesta correcta); después van las de gustos y forma de aprender. Sin base (o sin banco para ese año) queda la versión de ejemplo.
   */
  async getPreguntas(): Promise<PreguntaDiagnostico[]> {
    if (!usarSupabase) {
      await new Promise((r) => setTimeout(r, 150));
      return PREGUNTAS_MOCK;
    }
    const { data, error } = await getSupabase().rpc('diagnostico_preguntas');
    if (error) throw new Error(error.message);
    const items = ((data ?? []) as { id: string; opciones: PreguntaOpcion[]; enunciado: string }[]).map((d) => ({
      id: d.id,
      tipo: 'opcion_multiple' as const,
      subtitulo: 'Sin notas, es un juego para conocerte.',
      enunciado: d.enunciado,
      opciones: d.opciones,
    }));
    if (items.length === 0) return PREGUNTAS_MOCK;
    // De las preguntas de gustos y forma de aprender se conservan las que no son de contenido (cuento, intereses, cómo aprendés).
    const gustos = PREGUNTAS_MOCK.filter((p) => p.id === 'diag-3' || p.id === 'diag-5' || p.id === 'diag-6');
    const todas = [...items, ...gustos];
    return todas.map((p, i) => ({ ...p, pasoNumero: i + 1, totalPasos: todas.length }));
  },

  async getInteresesDisponibles(): Promise<InteresItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    return INTERESES_DISPONIBLES;
  },

  /** Versión asíncrona: en modo real lee de la base. */
  async cargarInteresesGuardados(): Promise<string[]> {
    if (usarSupabase) return leerInteresesDB();
    return this.getInteresesGuardados();
  },

  getInteresesGuardados(): string[] {
    if (usarSupabase) return cacheIntereses ?? [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INTERESES);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const matchedIds = parsed
            .map((item) => {
              if (typeof item !== 'string') return null;
              const matched = LISTA_INTERESES.find(
                (i) =>
                  i.id.toLowerCase() === item.toLowerCase() ||
                  i.etiqueta.toLowerCase() === item.toLowerCase()
              );
              return matched ? matched.id : null;
            })
            .filter((id): id is string => Boolean(id));

          const unique = Array.from(new Set(matchedIds));
          if (unique.length > 0) {
            return unique;
          }
        }
      }
    } catch {
      // Fallback
    }
    return ['futbol', 'dibujo'];
  },

  setInteresesGuardados(intereses: string[]): void {
    if (usarSupabase) {
      cacheIntereses = intereses;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_INTERESES, JSON.stringify(intereses));
    } catch {
      // Ignore
    }
  },

  async guardarDiagnostico(
    _respuestas: Record<string, string>,
    intereses: string[]
  ): Promise<{ exito: boolean }> {
    // Se guarda solo un resumen por área (aciertos de total) que corrige el servidor, y los intereses elegidos.
    // Las respuestas pregunta por pregunta no se conservan.
    if (usarSupabase) {
      const deContenido = Object.fromEntries(Object.entries(_respuestas).filter(([id]) => /^[0-9a-f-]{36}$/i.test(id)));
      if (Object.keys(deContenido).length > 0) {
        const { error } = await getSupabase().rpc('diagnostico_enviar', { p_respuestas: deContenido });
        if (error) throw new Error(error.message);
      }
      if (intereses.length > 0) await guardarInteresesDB(intereses);
      return { exito: true };
    }
    await new Promise((r) => setTimeout(r, 300));
    if (intereses.length > 0) {
      this.setInteresesGuardados(intereses);
    }
    return { exito: true };
  },
};
