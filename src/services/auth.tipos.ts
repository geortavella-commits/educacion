export type RolUsuario = 'docente' | 'directivo' | 'familia' | 'alumno';

export interface Sesion {
  usuarioId: string;
  nombreVisible: string;
  rol: RolUsuario;
  escuelaId: string;
  /** Nombre de la escuela para mostrar en pantalla (opcional). */
  escuelaNombre?: string;
}

export type ResultadoIngreso =
  | { ok: true; sesion: Sesion }
  | { ok: false; motivo: 'credenciales' | 'bloqueado' | 'red'; segundosEspera?: number };

export interface CuentaPrueba {
  email: string;
  nombreVisible: string;
  rol: RolUsuario;
  descripcion: string;
}
