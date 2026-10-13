import type { CoincidenciaNombre } from '@/lib/coincidenciaNombre';
import type { AlumnoParaGrupos } from '@/lib/sugerirGrupos';
import type { DatosRespuestaMision, RespuestaSugeridaIA } from '@/lib/borradorRespuesta';
import type { HojaSemana } from '@/lib/hojasImprimibles';
import type { MarcaValoracion } from '@/lib/valoracionMision';
import type {
  AlumnoApoyo,
  EstadoHipotesis,
  GrupoSugerido,
  PerfilAlumnoDocente,
  ProyectoDetalle,
  ProyectoListItem,
  ResumenInicioDocente,
} from '@/mocks/docente';

export type EstadoCarga = 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';

/** Qué aprendizajes del grado ya se trabajaron en los proyectos del curso (y cuáles faltan). Para el tablero de cobertura de un proyecto. */
export interface CoberturaProyecto {
  /** "5.º grado" / "2.º año". */
  etiquetaGrado: string;
  /** Si el contenido ya fue validado por la escuela (hoy son contenidos del Ministerio en versión de consulta). */
  validada: boolean;
  materias: { id: string; nombre: string; total: number; cubiertos: number; enEsteProyecto: number }[];
  aprendizajes: {
    id: string;
    materiaId: string;
    materia: string;
    descripcion: string;
    indicadores: string[];
    cubierto: boolean;
    /** Dónde se trabaja: "Misión 3 · semana 2", "Planificado en la semana 2" o "En otro proyecto del curso". */
    detalle: string | null;
  }[];
}

/** Material de referencia del Ministerio para un grado: metas del ciclo y aprendizajes con sus indicadores, por materia. */
export interface ContextoCurricular {
  /** Nombre de la versión cargada y si una docente ya la validó (hoy es la "versión en consulta 2025": sin validar). */
  version: string;
  validada: boolean;
  materias: {
    id: string;
    nombre: string;
    metas: { id: string; texto: string; ciclo: string }[];
    aprendizajes: { id: string; metaId: string | null; descripcion: string; indicadores: string[] }[];
  }[];
}

export interface CursoDocente {
  id: string;
  nombre: string;
  anio: number;
  nivel: 'primaria' | 'secundaria';
}

export interface AlumnoCurso {
  id: string;
  nombre: string;
}

export interface ContenidoElegible {
  id: string;
  area: string;
  descripcion: string;
}

export interface SolicitudIngreso {
  id: string;
  cursoId: string;
  curso: string;
  nombreVisible: string;
  avatar: string | null;
  creadaEn: string;
  /** Alumnos del curso (o pedidos pendientes) con el mismo nombre: la docente decide si es la misma persona. */
  coincidencias: CoincidenciaNombre[];
}

export interface ConsentimientoAlumno {
  alumnoId: string;
  nombre: string;
  curso: string;
  estado: 'pendiente' | 'otorgado' | 'revocado' | 'sin_registro';
  familiaVinculada: boolean;
  invitacionVigente: boolean;
}

export interface NuevoGrupo {
  cursoId: string;
  /** Proyecto del que cuelga el grupo (tiene que ser del mismo curso). */
  proyectoId?: string;
  nombreVisible: string;
  etiquetaDocente: string;
  alumnoIds: string[];
  explicacion?: string;
}

/** Una semana de la planificación de un proyecto: objetivo, aprendizajes que cubre y (por la semana de cada misión) qué se habilita. */
export interface EtapaNueva {
  semana: number;
  titulo: string;
  objetivo?: string;
  contenidoIds: string[];
}

export interface NuevoProyecto {
  cursoId: string;
  titulo: string;
  descripcion?: string;
  contenidoIds: string[];
  /** `semana` (1..N) ubica la misión en una etapa: se habilita ese día de inicio + (semana-1)*7. Sin semana, se ve desde el principio. */
  misiones: { titulo: string; consigna?: string; contenidoId?: string; respuesta?: DatosRespuestaMision; semana?: number }[];
  /** Planificación por semanas (opcional): requiere `fechaInicio` (YYYY-MM-DD) para que las semanas se habiliten en su momento. */
  etapas?: EtapaNueva[];
  fechaInicio?: string;
  publicar: boolean;
}

export type EstadoProyectoDocente = 'borrador' | 'activo' | 'finalizado' | 'archivado';

/** Grupo dentro de un proyecto (o, si es anterior, un grupo del curso sin proyecto). */
export interface GrupoLista {
  id: string;
  nombreVisible: string;
  etiquetaDocente: string;
  estado: 'borrador' | 'aprobado';
  proyectoId: string | null;
  proyectoTitulo: string | null;
  cursoId: string;
  curso: string;
  alumnos: number;
  /** Porcentaje de misiones completadas por los miembros en el proyecto del grupo. */
  avance: number;
}

export interface MiembroGrupo {
  id: string;
  nombre: string;
  completadas: number;
  total: number;
}

export interface GrupoDetalle extends GrupoLista {
  miembros: MiembroGrupo[];
  /** Alumnos inscriptos en el curso que todavía no están en el grupo. */
  candidatos: AlumnoCurso[];
}

export interface ProyectoGestionItem {
  id: string;
  titulo: string;
  estado: EstadoProyectoDocente;
  cursoId: string;
  curso: string;
  /** Alumnos del curso: el proyecto los abarca a todos; los grupos son una forma de organizarlos. */
  alumnos: number;
  avance: number;
  misiones: number;
  grupos: number;
}

export interface ProyectoGestion extends ProyectoGestionItem {
  descripcion: string;
  misionesDetalle: { id: string; orden: number; titulo: string; consigna: string; alumnosQueCompletaron: number; tipoRespuesta: 'abierta' | 'numero' | 'texto' | 'opcion'; semana: number | null }[];
  /** Planificación por semanas (vacía si el proyecto se ve completo desde el principio). */
  etapas: { semana: number; titulo: string; objetivo: string }[];
  /** Día en que empieza la semana 1 (YYYY-MM-DD). */
  fechaInicio: string | null;
  gruposLista: GrupoLista[];
  /** Todos los alumnos del curso, con su avance en este proyecto (estén o no en un grupo). */
  participantes: MiembroGrupo[];
}

export interface AlumnoConAvance {
  id: string;
  nombre: string;
  cursoId: string;
  curso: string;
  completadas: number;
  total: number;
}

export type TipoDevolucion = 'motivacion' | 'sugerencia' | 'logro';

/**
 * A quién apunta la PROPUESTA (no a qué chico): nunca se guarda ni se muestra a alumnos o familias.
 * 'todos' = para todo el curso; 'apoyo' = con más acompañamiento (pasos cortos, pistas); 'desafio' = con desafío extra.
 */
export type EnfoquePropuesta = 'todos' | 'apoyo' | 'desafio';

/** Borrador de proyecto que propone la IA. Nunca se guarda solo: la docente lo revisa y lo edita en el formulario. */
export interface ProyectoSugerido {
  titulo: string;
  descripcion: string;
  misiones: { titulo: string; consigna: string; contenidoId: string | null; respuesta: RespuestaSugeridaIA | null }[];
  /** Intereses del curso (solo agrupados, 5 o más chicos) que se tuvieron en cuenta. */
  interesesUsados: string[];
  /** Misiones que la IA propuso y se descartaron por no cumplir las reglas de la plataforma. */
  descartadas: number;
}

/** Planificación de 3 o 4 semanas que propone la IA. Nunca se guarda sola: la docente la revisa y la edita en el formulario. */
export interface PlanSugerido {
  titulo: string;
  descripcion: string;
  semanas: number;
  etapas: { semana: number; titulo: string; objetivo: string; contenidoIds: string[]; misiones: { titulo: string; consigna: string; contenidoId: string | null; respuesta: RespuestaSugeridaIA | null }[] }[];
  interesesUsados: string[];
  descartadas: number;
}

/** Mensaje cualitativo de la docente. Nunca lleva nota, puntaje ni escala. */
export interface Devolucion {
  id: string;
  alumnoId: string;
  tipo: TipoDevolucion;
  texto: string;
  proyectoTitulo: string | null;
  creadaEn: string;
}

/** Contrato común del servicio del docente (datos de ejemplo en desarrollo, Supabase real en producción). */
export interface DocenteService {
  obtenerInicio(): Promise<ResumenInicioDocente>;
  obtenerAlumnosApoyo(): Promise<AlumnoApoyo[]>;
  actualizarHipotesisApoyo(alumnoId: string, estado: EstadoHipotesis, textoCorregido?: string): Promise<AlumnoApoyo>;
  obtenerPerfilAlumno(alumnoId: string): Promise<PerfilAlumnoDocente>;
  actualizarHipotesisPerfil(hipotesisId: string, estado: EstadoHipotesis, textoCorregido?: string): Promise<void>;
  obtenerProyecto(proyectoId: string): Promise<ProyectoDetalle>;
  obtenerGruposSugeridos(proyectoId?: string): Promise<GrupoSugerido[]>;
  cambiarEstadoGrupo(grupoId: string, nuevoEstado: 'borrador' | 'aprobado'): Promise<GrupoSugerido>;
  editarGrupo(grupoId: string, datos: { nombreVisible: string; etiquetaDocente: string }): Promise<GrupoSugerido>;
  obtenerProyectos(): Promise<ProyectoListItem[]>;
  // — Formularios y gestión (pantallas nuevas) —
  listarCursos(): Promise<CursoDocente[]>;
  /** Metas, aprendizajes e indicadores oficiales de un grado de primaria (1 a 6). Solo lectura. */
  obtenerContextoCurricular(anio: number): Promise<ContextoCurricular>;
  listarAlumnosDeCurso(cursoId: string): Promise<AlumnoCurso[]>;
  listarContenidosDelCurso(cursoId: string): Promise<ContenidoElegible[]>;
  crearGrupo(datos: NuevoGrupo): Promise<GrupoSugerido>;
  crearProyecto(datos: NuevoProyecto): Promise<{ id: string }>;
  listarSolicitudesIngreso(): Promise<SolicitudIngreso[]>;
  resolverSolicitudIngreso(solicitudId: string, accion: 'aprobar' | 'rechazar'): Promise<void>;
  listarConsentimientos(): Promise<ConsentimientoAlumno[]>;
  invitarFamilia(alumnoId: string): Promise<{ codigo: string; venceEn: string }>;
  // — Panel, grupos por proyecto, alumnos y devoluciones (solo con la base real) —
  listarGrupos(): Promise<GrupoLista[]>;
  obtenerGrupo(grupoId: string): Promise<GrupoDetalle>;
  agregarAlumnosAGrupo(grupoId: string, alumnoIds: string[]): Promise<void>;
  quitarAlumnoDeGrupo(grupoId: string, alumnoId: string): Promise<void>;
  /** Borra el grupo y sus miembros. Los alumnos y el proyecto no se tocan. */
  eliminarGrupo(grupoId: string): Promise<void>;
  listarProyectosGestion(): Promise<ProyectoGestionItem[]>;
  obtenerProyectoGestion(proyectoId: string): Promise<ProyectoGestion>;
  /** `fechaInicio` (YYYY-MM-DD) mueve el día en que empieza la semana 1 de un proyecto planificado por semanas. */
  actualizarProyecto(proyectoId: string, datos: { titulo: string; descripcion: string; estado: EstadoProyectoDocente; fechaInicio?: string }): Promise<void>;
  /** `semana` ubica la misión en una semana del plan (si el proyecto tiene etapas). */
  agregarMision(proyectoId: string, datos: { titulo: string; consigna?: string; contenidoId?: string; respuesta?: DatosRespuestaMision; semana?: number }): Promise<void>;
  obtenerCoberturaProyecto(proyectoId: string): Promise<CoberturaProyecto>;
  /** Marca suave + mensaje corto de la docente sobre UNA misión de un alumno (sin nota ni puntaje). Vuelve a llamarla para cambiarla. */
  valorarMision(misionId: string, alumnoId: string, marca: MarcaValoracion, mensaje: string): Promise<void>;
  quitarValoracionMision(misionId: string, alumnoId: string): Promise<void>;
  /** La docente cierra una misión que el alumno resolvió en la hoja impresa. No pisa lo que ya hizo en pantalla. */
  marcarMisionEnPapel(misionId: string, alumnoId: string): Promise<void>;
  /** Deshace solo lo marcado en papel. */
  desmarcarMisionEnPapel(misionId: string, alumnoId: string): Promise<void>;
  /** Una hoja imprimible por semana (todas las misiones de la semana). Con `conClaves` incluye lo que se espera como respuesta: solo para la docente. */
  obtenerHojasProyecto(proyectoId: string, conClaves: boolean): Promise<HojaSemana[]>;
  /**
   * Borra el proyecto con sus misiones, avances y grupos. Si algún alumno ya conversó con el tutor sobre sus misiones
   * (o hay señales de apoyo ligadas), la base lo impide y se lanza Error('con_actividad'): ahí corresponde archivarlo.
   */
  eliminarProyecto(proyectoId: string): Promise<void>;
  /** Alumnos del curso con sus intereses y las misiones que completaron del proyecto: base para sugerir grupos (se calcula en el navegador). */
  datosParaSugerirGrupos(cursoId: string, proyectoId: string): Promise<{ alumnos: AlumnoParaGrupos[]; totalMisiones: number }>;
  /** Código de un solo uso (15 min) para que un alumno recupere su sesión en otro dispositivo. */
  generarAcceso(alumnoId: string): Promise<{ codigo: string; venceEn: string }>;
  /** ¿El curso tiene un código de clase vigente? (el código en sí no se puede volver a ver: solo se guarda su hash) */
  estadoCodigoClase(cursoId: string): Promise<{ vigente: boolean; venceEn: string | null }>;
  /** Genera un código de clase nuevo (anula el anterior). Se muestra una sola vez. */
  generarCodigoClase(cursoId: string): Promise<{ codigo: string; venceEn: string }>;
  /** Pide a la IA un borrador de proyecto a partir de una idea. Lanza Error(codigo) si no se puede (ver src/lib/mensajesIA.ts). */
  sugerirProyecto(datos: { cursoId: string; idea: string; cantidad?: number; contenidoIds?: string[]; usarIntereses?: boolean; enfoque?: EnfoquePropuesta }): Promise<ProyectoSugerido>;
  /** Pide a la IA una planificación de 3 o 4 semanas (etapas con aprendizajes del Ministerio y misiones). Lanza Error(codigo) si no se puede. */
  planificarProyecto(datos: { cursoId: string; idea: string; semanas: 3 | 4; misionesPorSemana: number; areaIds?: string[]; usarIntereses?: boolean; enfoque?: EnfoquePropuesta }): Promise<PlanSugerido>;
  /** Pide a la IA un borrador de mensaje para un alumno. Vuelve con el marcador [NOMBRE] donde va su nombre. */
  sugerirBorradorMensaje(datos: { alumnoId: string; tipo: TipoDevolucion; pista?: string }): Promise<string>;
  /**
   * Pide a la IA nombres para grupos YA armados. Solo viajan los temas (intereses) y la cantidad de chicos de cada grupo:
   * nunca nombres ni ids de alumnos. Devuelve { claveDelGrupo: nombre } solo para los nombres que cumplen las reglas.
   */
  sugerirNombresGrupos(datos: { cursoId: string; proyectoId?: string; grupos: { clave: string; temas: string[]; cantidad: number }[] }): Promise<Record<string, string>>;
  listarAlumnos(): Promise<AlumnoConAvance[]>;
  listarDevoluciones(alumnoId: string): Promise<Devolucion[]>;
  crearDevolucion(datos: { alumnoId: string; tipo: TipoDevolucion; texto: string; proyectoId?: string }): Promise<Devolucion>;
  eliminarDevolucion(devolucionId: string): Promise<void>;
}
