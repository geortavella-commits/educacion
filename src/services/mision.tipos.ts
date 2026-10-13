export type TipoRespuesta = 'abierta' | 'numero' | 'texto' | 'opcion';

export interface OpcionMision {
  id: string;
  texto: string;
}

/** Todo lo que la pantalla necesita para mostrar UNA misión a resolver. La respuesta correcta NO viene nunca. */
export interface MisionParaResolver {
  id: string;
  titulo: string;
  /** El problema a resolver, tal como lo escribió la docente. */
  enunciado: string;
  tipo: TipoRespuesta;
  /** Solo si tipo === 'opcion' (entre 2 y 6). */
  opciones: OpcionMision[];
  /** Posición de esta misión dentro del proyecto (para "Misión 2 de 4"). */
  orden: number;
  total: number;
  proyectoNombre: string;
  completada: boolean;
  /** Solo 'abierta': lo que ya había entregado. */
  respuestaPrevia?: string;
  /** Marca y mensaje que la docente le dejó en esta misión (si lo hizo). */
  valoracionDocente?: { marca: 'encaminado' | 'repensar' | 'conversar'; mensaje: string };
  /** ¿La docente cargó pistas? (su texto se pide aparte, de a una). */
  hayPista: boolean;
  /** Cuántas pistas tiene (hasta 3) y cuántas ya pidió este alumno. */
  cantidadPistas?: number;
  pistasUsadas?: number;
  /** true si la familia todavía no dio el permiso: el alumno no puede responder. */
  sinConsentimiento?: boolean;
}

export type EstadoRespuesta =
  | 'correcta' // acertó: la misión queda completada
  | 'incorrecta' // todavía no: puede volver a intentar (sin límite ni puntaje)
  | 'entregada' // misión abierta: se guardó lo que escribió (no se corrige)
  | 'formato_invalido' // por ejemplo escribió letras en una misión de número: no cuenta como intento
  | 'demasiados_intentos' // probó muchísimas veces en poco tiempo: que espere un rato
  | 'sin_permiso' // falta el permiso de la familia
  | 'error'; // red u otro problema

export interface ResultadoRespuesta {
  estado: EstadoRespuesta;
  /** Texto corto que escribió la docente para mostrar al acertar (puede no haber). */
  explicacion?: string;
  /** Próxima misión sin completar (null = no quedan). Solo viene al acertar o entregar. */
  siguiente?: { id: string; titulo: string } | null;
  segundosEspera?: number;
}

export interface MisionService {
  obtenerMision(misionId: string): Promise<MisionParaResolver>;
  /** Para 'opcion', `respuesta` es el id de la opción elegida. */
  enviarRespuesta(misionId: string, respuesta: string): Promise<ResultadoRespuesta>;
  /**
   * Pistas desbloqueadas hasta ahora (de a una, de menos a más ayuda). Con `otra` desbloquea la siguiente; sin ella entrega la
   * primera o las que ya tenía. Lanza Error('sin_pista') si la misión no tiene.
   */
  pedirPista(misionId: string, otra?: boolean): Promise<{ pistas: string[]; total: number }>;
}
