import type { TipoRespuesta } from './mision.tipos';

export interface MisionAlumno {
  id: string;
  materias: string[];
  titulo: string;
  duracionMinutos: number;
  estado: 'Completada' | 'Pendiente';
  /** A qué proyecto pertenece (el alumno puede tener varios proyectos activos a la vez). */
  proyectoId: string;
  proyectoNombre: string;
  /** Posición dentro de su proyecto (1, 2, 3…). */
  orden: number;
  /** Cómo se responde: texto libre, número, texto corto u opción múltiple. */
  tipo: TipoRespuesta;
  /** La docente le dejó un mensaje en esta misión (se lee al abrirla). */
  mensajeDocente?: boolean;
}

export interface ProyectoAlumno {
  id: string;
  nombre: string;
  misionesCompletadas: number;
  misionesTotales: number;
  /** Si el proyecto está planificado por semanas y todavía no empezó: el día (YYYY-MM-DD) en que se habilita la primera misión. */
  empiezaEl?: string | null;
}

export interface DatosInicioAlumno {
  alumnoNombre: string;
  estrellas: number;
  pasiones: string[];
  misiones: MisionAlumno[];
  /** Todos los proyectos activos del curso, con su avance (el más antiguo primero). */
  proyectos: ProyectoAlumno[];
  /** @deprecated Es solo el primero de `proyectos`: usar `proyectos`. Se mantiene hasta que las pantallas se actualicen. */
  proyecto: ProyectoAlumno;
  /** true si la familia todavía no autorizó a Chasqui (el alumno no puede avanzar). */
  sinConsentimiento?: boolean;
}

/** Mensaje cualitativo que la docente le dejó al alumno (sin notas ni puntajes). */
export interface MensajeDocente {
  id: string;
  tipo: 'motivacion' | 'sugerencia' | 'logro';
  texto: string;
  creadoEn: string;
}

export interface InicioService {
  listarMensajesDocente(): Promise<MensajeDocente[]>;
  getDatosInicio(estadoSimulado?: 'feliz' | 'vacio' | 'error' | 'sin_permiso'): Promise<DatosInicioAlumno>;
  actualizarPasiones(nuevasPasiones: string[]): Promise<void>;
  completarMision(misionId: string, opciones?: { pistasUsadas?: number }): Promise<void>;
}
