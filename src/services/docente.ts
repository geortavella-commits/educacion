// Fachada del servicio del docente.
//  - Producción (o VITE_USAR_SUPABASE=true): Supabase real.
//  - Solo desarrollo con el interruptor apagado: datos de ejemplo (src/mocks), cargados con import dinámico
//    dentro de `import.meta.env.DEV` para que NO viajen en el paquete de producción.
import { usarSupabase } from './modo';
import { docenteSupabase } from './docente.supabase';
import type { DocenteService } from './docente.tipos';

export type { EstadoCarga, CursoDocente, AlumnoCurso, ContenidoElegible, SolicitudIngreso, ConsentimientoAlumno, NuevoGrupo, NuevoProyecto, DocenteService,
  EstadoProyectoDocente, GrupoLista, MiembroGrupo, GrupoDetalle, ProyectoGestionItem, ProyectoGestion, AlumnoConAvance, TipoDevolucion, Devolucion, ProyectoSugerido, EnfoquePropuesta, ContextoCurricular, PlanSugerido, EtapaNueva, CoberturaProyecto } from './docente.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./docente.simulado') : null;

const implementacion = async (): Promise<DocenteService> => {
  if (simulado) return (await simulado).docenteService;
  return docenteSupabase;
};

// Cada método delega en la implementación elegida (todos son asíncronos).
export const docenteService = new Proxy({} as DocenteService, {
  get:
    (_destino, nombre: string) =>
    async (...args: unknown[]) => {
      const impl = (await implementacion()) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
      return impl[nombre](...args);
    },
});
