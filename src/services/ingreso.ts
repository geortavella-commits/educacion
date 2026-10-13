// Fachada del ingreso por código (Supabase real en producción; simulado solo en desarrollo).
import { usarSupabase } from './modo';
import { ingresoSupabase } from './ingreso.supabase';
import type { IngresoService } from './ingreso.tipos';

export type { EstadoIngreso, ValidacionCodigoResult, EstadoSolicitud, IngresoService } from './ingreso.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./ingreso.simulado') : null;

export const ingresoService: IngresoService = {
  validarCodigo: async (c) => (simulado ? (await simulado).ingresoService : ingresoSupabase).validarCodigo(c),
  solicitarIngresoAlumno: async (c, n, a) => (simulado ? (await simulado).ingresoService : ingresoSupabase).solicitarIngresoAlumno(c, n, a),
  // Esta consulta es sincrónica: en modo simulado nunca hay solicitud real en espera.
  haySolicitudEnEspera: () => (simulado ? false : ingresoSupabase.haySolicitudEnEspera()),
  consultarEstadoSolicitud: async () => (simulado ? (await simulado).ingresoService : ingresoSupabase).consultarEstadoSolicitud(),
  entrarConCodigoAcceso: async (c) => (simulado ? (await simulado).ingresoService : ingresoSupabase).entrarConCodigoAcceso(c),
};
