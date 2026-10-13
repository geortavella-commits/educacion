// Fachada del servicio de misiones del alumno (Supabase real en producción; datos de ejemplo solo en desarrollo con el interruptor apagado).
import { usarSupabase } from './modo';
import { misionSupabase } from './mision.supabase';
import type { MisionService } from './mision.tipos';

export type { TipoRespuesta, OpcionMision, MisionParaResolver, EstadoRespuesta, ResultadoRespuesta, MisionService } from './mision.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./mision.simulado') : null;

export const misionService: MisionService = {
  obtenerMision: async (id) => (simulado ? (await simulado).misionService : misionSupabase).obtenerMision(id),
  enviarRespuesta: async (id, r) => (simulado ? (await simulado).misionService : misionSupabase).enviarRespuesta(id, r),
  pedirPista: async (id, otra) => (simulado ? (await simulado).misionService : misionSupabase).pedirPista(id, otra),
};
