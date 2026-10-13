// Fachada del servicio de inicio del alumno (Supabase real en producción; datos de ejemplo solo en desarrollo).
import { usarSupabase } from './modo';
import { inicioSupabase } from './inicio.supabase';
import type { InicioService } from './inicio.tipos';

export type { MisionAlumno, ProyectoAlumno, DatosInicioAlumno, InicioService, MensajeDocente } from './inicio.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./inicio.simulado') : null;

export const inicioService: InicioService = {
  getDatosInicio: async (estado) => (simulado ? (await simulado).inicioService : inicioSupabase).getDatosInicio(estado),
  actualizarPasiones: async (p) => (simulado ? (await simulado).inicioService : inicioSupabase).actualizarPasiones(p),
  listarMensajesDocente: async () => (simulado ? (await simulado).inicioService : inicioSupabase).listarMensajesDocente(),
  completarMision: async (id, o) => (simulado ? (await simulado).inicioService : inicioSupabase).completarMision(id, o),
};
