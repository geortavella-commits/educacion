export type EstadoIngreso =
  | 'idle'
  | 'cargando'
  | 'valido'
  | 'vencido'
  | 'incorrecto'
  | 'demasiados_intentos'
  | 'error_red'
  | 'esperando_aprobacion'
  | 'aprobado';

export interface ValidacionCodigoResult {
  estado: EstadoIngreso;
  mensaje?: string;
  cursoInfo?: {
    id: string;
    nombre: string;
    anio: string;
    docente: string;
    vencimiento: string;
  };
  segundosBloqueo?: number;
}

export type EstadoSolicitud = 'sin_solicitud' | 'pendiente' | 'aprobada' | 'rechazada' | 'error';

export interface IngresoService {
  validarCodigo(codigo: string): Promise<ValidacionCodigoResult>;
  solicitarIngresoAlumno(
    codigo: string,
    nombre: string,
    avatarId: string
  ): Promise<{ exito: boolean; estado: EstadoIngreso; mensaje?: string; segundosBloqueo?: number }>;
  /** ¿Hay una solicitud de este dispositivo esperando aprobación? (para retomar si se recarga la página) */
  haySolicitudEnEspera(): boolean;
  /** Pregunta al servidor si la docente ya resolvió. Si fue aprobada, abre la sesión del alumno. */
  consultarEstadoSolicitud(): Promise<EstadoSolicitud>;
  /** Alumno que ya tiene cuenta: canjea el código de acceso que le dio su docente o su familia y recupera su sesión. */
  entrarConCodigoAcceso(codigo: string): Promise<{ exito: boolean; motivo?: 'invalido' | 'vencido' | 'bloqueado' | 'red' }>;
}
