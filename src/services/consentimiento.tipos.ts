export type EstadoConsentimiento =
  | 'pendiente'
  | 'otorgado'
  | 'revocado'
  | 'sin_permiso'
  | 'cargando'
  | 'error_red';

export interface ConsentimientoData {
  id: string;
  alumnoNombre: string; // Solo nombre sin apellido
  escuela: string;
  tutorNombre: string;
  estado: EstadoConsentimiento;
  fechaOtorgado?: string;
  fechaRevocado?: string;
}

export interface ConsentimientoService {
  obtenerConsentimiento(id?: string): Promise<ConsentimientoData>;
  otorgarConsentimiento(id: string): Promise<ConsentimientoData>;
  revocarConsentimiento(id: string): Promise<ConsentimientoData>;
}
