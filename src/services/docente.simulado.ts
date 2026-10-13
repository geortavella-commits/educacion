import {
  ResumenInicioDocente,
  mockDocenteInicio,
  AlumnoApoyo,
  mockAlumnosApoyo,
  PerfilAlumnoDocente,
  obtenerMockPerfilPorAlumno,
  ProyectoDetalle,
  mockProyectoCanchaBarrio,
  GrupoSugerido,
  mockGruposSugeridos,
  ProyectoListItem,
  mockProyectosLista,
  EstadoHipotesis,
} from '@/mocks/docente';

import type { DocenteService } from './docente.tipos';

// En memoria para la sesión
let alumnosApoyoState = [...mockAlumnosApoyo];
let gruposSugeridosState = [...mockGruposSugeridos];
const perfilesCache: Record<string, PerfilAlumnoDocente> = {};

const simularDemora = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

const soloConBaseReal = async (): Promise<never> => {
  throw new Error('Esta función solo está disponible con la base real (VITE_USAR_SUPABASE=true).');
};

export const docenteService: DocenteService & { reiniciarDatos(): void } = {
  // Gestión de grupos por proyecto, alumnos y devoluciones: sin datos de ejemplo.
  obtenerContextoCurricular: soloConBaseReal,
  obtenerCoberturaProyecto: soloConBaseReal,
  obtenerHojasProyecto: soloConBaseReal,
  valorarMision: soloConBaseReal,
  quitarValoracionMision: soloConBaseReal,
  marcarMisionEnPapel: soloConBaseReal,
  desmarcarMisionEnPapel: soloConBaseReal,
  listarGrupos: soloConBaseReal,
  obtenerGrupo: soloConBaseReal,
  agregarAlumnosAGrupo: soloConBaseReal,
  quitarAlumnoDeGrupo: soloConBaseReal,
  eliminarGrupo: soloConBaseReal,
  listarProyectosGestion: soloConBaseReal,
  obtenerProyectoGestion: soloConBaseReal,
  actualizarProyecto: soloConBaseReal,
  agregarMision: soloConBaseReal,
  eliminarProyecto: soloConBaseReal,
  datosParaSugerirGrupos: soloConBaseReal,
  generarAcceso: soloConBaseReal,
  estadoCodigoClase: soloConBaseReal,
  generarCodigoClase: soloConBaseReal,
  sugerirProyecto: soloConBaseReal,
  planificarProyecto: soloConBaseReal,
  sugerirBorradorMensaje: soloConBaseReal,
  sugerirNombresGrupos: soloConBaseReal,
  listarAlumnos: soloConBaseReal,
  listarDevoluciones: soloConBaseReal,
  crearDevolucion: soloConBaseReal,
  eliminarDevolucion: soloConBaseReal,

  async obtenerInicio(): Promise<ResumenInicioDocente> {
    await simularDemora();
    return JSON.parse(JSON.stringify(mockDocenteInicio));
  },

  async obtenerAlumnosApoyo(): Promise<AlumnoApoyo[]> {
    await simularDemora();
    return JSON.parse(JSON.stringify(alumnosApoyoState));
  },

  async actualizarHipotesisApoyo(
    alumnoId: string,
    estado: EstadoHipotesis,
    textoCorregido?: string
  ): Promise<AlumnoApoyo> {
    await simularDemora();
    const index = alumnosApoyoState.findIndex((a) => a.id === alumnoId);
    if (index === -1) throw new Error('Alumno no encontrado');

    alumnosApoyoState[index] = {
      ...alumnosApoyoState[index],
      estadoHipotesis: estado,
      textoCorregido: textoCorregido ?? alumnosApoyoState[index].textoCorregido,
    };

    // Si el perfil ya fue cargado en memoria, sincronizamos también su hipótesis
    if (perfilesCache[alumnoId]) {
      const hip = perfilesCache[alumnoId].hipotesis[0];
      if (hip) {
        hip.estado = estado;
        if (textoCorregido) hip.textoCorregido = textoCorregido;
      }
    }

    return alumnosApoyoState[index];
  },

  async obtenerPerfilAlumno(alumnoId: string): Promise<PerfilAlumnoDocente> {
    await simularDemora();
    if (!perfilesCache[alumnoId]) {
      perfilesCache[alumnoId] = obtenerMockPerfilPorAlumno(alumnoId);
    }
    return JSON.parse(JSON.stringify(perfilesCache[alumnoId]));
  },

  async actualizarHipotesisPerfil(
    hipotesisId: string,
    estado: EstadoHipotesis,
    textoCorregido?: string
  ): Promise<void> {
    await simularDemora();
    for (const perfil of Object.values(perfilesCache)) {
      const hip = perfil.hipotesis.find((h) => h.id === hipotesisId);
      if (hip) {
        hip.estado = estado;
        if (textoCorregido) hip.textoCorregido = textoCorregido;
        break;
      }
    }
  },

  async obtenerProyecto(proyectoId: string): Promise<ProyectoDetalle> {
    await simularDemora();
    if (proyectoId === 'cancha-barrio' || proyectoId === 'actual' || !proyectoId) {
      return JSON.parse(JSON.stringify(mockProyectoCanchaBarrio));
    }
    return {
      ...mockProyectoCanchaBarrio,
      id: proyectoId,
      titulo: 'Proyecto en curso',
    };
  },

  async obtenerGruposSugeridos(_proyectoId?: string): Promise<GrupoSugerido[]> {
    await simularDemora();
    return JSON.parse(JSON.stringify(gruposSugeridosState));
  },

  async cambiarEstadoGrupo(grupoId: string, nuevoEstado: 'borrador' | 'aprobado'): Promise<GrupoSugerido> {
    await simularDemora();
    const index = gruposSugeridosState.findIndex((g) => g.id === grupoId);
    if (index === -1) throw new Error('Grupo no encontrado');

    gruposSugeridosState[index] = {
      ...gruposSugeridosState[index],
      estado: nuevoEstado,
    };
    return gruposSugeridosState[index];
  },

  async editarGrupo(
    grupoId: string,
    datos: { nombreVisible: string; etiquetaDocente: string }
  ): Promise<GrupoSugerido> {
    await simularDemora();
    const index = gruposSugeridosState.findIndex((g) => g.id === grupoId);
    if (index === -1) throw new Error('Grupo no encontrado');

    gruposSugeridosState[index] = {
      ...gruposSugeridosState[index],
      nombreVisible: datos.nombreVisible,
      etiquetaDocente: datos.etiquetaDocente,
    };
    return gruposSugeridosState[index];
  },

  async obtenerProyectos(): Promise<ProyectoListItem[]> {
    await simularDemora();
    return JSON.parse(JSON.stringify(mockProyectosLista));
  },

  // — Gestión (en modo simulado, datos mínimos de ejemplo) —
  async listarCursos() {
    await simularDemora();
    return [
      { id: 'cur-5b', nombre: '5º B', anio: 5, nivel: 'primaria' as const },
      { id: 'cur-6a', nombre: '6º A', anio: 6, nivel: 'primaria' as const },
    ];
  },
  async listarAlumnosDeCurso() {
    await simularDemora();
    return ['Mateo', 'Sofía', 'Valentina', 'Tomás', 'Camila', 'Lucas'].map((n, i) => ({ id: `al-${i}`, nombre: n }));
  },
  async listarContenidosDelCurso() {
    await simularDemora();
    return [
      { id: 'k1', area: 'Matemática', descripcion: 'Calcular perímetro y área de figuras compuestas' },
      { id: 'k2', area: 'Ciencias Naturales', descripcion: 'Propiedades de los materiales y su uso' },
    ];
  },
  async crearGrupo(datos) {
    await simularDemora();
    const nuevo = {
      id: `g-${Date.now()}`,
      nombreVisible: datos.nombreVisible,
      etiquetaDocente: datos.etiquetaDocente,
      alumnosCount: datos.alumnoIds.length,
      alumnosIniciales: datos.alumnoIds.map((id) => id.slice(-2).toUpperCase()),
      alumnosNombres: datos.alumnoIds,
      explicacionTutor: datos.explicacion ?? 'Grupo armado por vos.',
      estado: 'borrador' as const,
    };
    gruposSugeridosState = [...gruposSugeridosState, nuevo];
    return nuevo;
  },
  async crearProyecto() {
    await simularDemora();
    return { id: 'cancha-barrio' };
  },
  async listarSolicitudesIngreso() {
    await simularDemora();
    return [];
  },
  async resolverSolicitudIngreso() {
    await simularDemora();
  },
  async listarConsentimientos() {
    await simularDemora();
    return [];
  },
  async invitarFamilia() {
    await simularDemora();
    return { codigo: 'EJEMPLO7', venceEn: new Date(Date.now() + 7 * 86400000).toISOString() };
  },

  reiniciarDatos(): void {
    alumnosApoyoState = [...mockAlumnosApoyo];
    gruposSugeridosState = [...mockGruposSugeridos];
    Object.keys(perfilesCache).forEach((k) => delete perfilesCache[k]);
  },
};
