import type { CuentaPrueba, ResultadoIngreso, RolUsuario, Sesion } from './auth.tipos';

// SOLO DESARROLLO: servicio de autenticación simulado (en memoria). No se incluye en producción.
// RolUsuario se importa para tipar las cuentas de prueba.
export type { RolUsuario };

export const CUENTAS_PRUEBA_DEV: CuentaPrueba[] = [
  {
    email: 'docente.laura@ficticio.test',
    nombreVisible: 'Seño Laura',
    rol: 'docente',
    descripcion: 'Docente titular de 5º grado',
  },
  {
    email: 'docente.julian@ficticio.test',
    nombreVisible: 'Seño Julián',
    rol: 'docente',
    descripcion: 'Docente titular de 6º grado',
  },
  {
    email: 'directivo@ficticio.test',
    nombreVisible: 'Dirección',
    rol: 'directivo',
    descripcion: 'Equipo de conducción directiva',
  },
  {
    email: 'familia.mateo@ficticio.test',
    nombreVisible: 'Familia de Mateo',
    rol: 'familia',
    descripcion: 'Acompañamiento familiar',
  },
  {
    email: 'alumno.mateo@ficticio.test',
    nombreVisible: 'Mateo',
    rol: 'alumno',
    descripcion: 'Estudiante con acceso web',
  },
];

const PASS_PRUEBA = 'educacion123';

// Sesión guardada SOLO en memoria (se pierde al recargar intencionalmente)
let sesionActual: Sesion | null = null;
const suscriptores = new Set<(s: Sesion | null) => void>();

const notificarSuscriptores = () => {
  suscriptores.forEach((callback) => {
    try {
      callback(sesionActual ? { ...sesionActual } : null);
    } catch {
      // Ignorar errores de callbacks externos
    }
  });
};

const simularDemora = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export async function iniciarSesion(email: string, password: string): Promise<ResultadoIngreso> {
  await simularDemora(600);

  const cleanEmail = email.trim().toLowerCase();

  // Simulación de estados especiales de prueba
  if (cleanEmail === 'bloqueado@ficticio.test') {
    return { ok: false, motivo: 'bloqueado', segundosEspera: 60 };
  }

  if (cleanEmail === 'sinred@ficticio.test') {
    return { ok: false, motivo: 'red' };
  }

  // Validación de credenciales
  const cuentaValida = CUENTAS_PRUEBA_DEV.find((c) => c.email.toLowerCase() === cleanEmail);

  if (!cuentaValida || password !== PASS_PRUEBA) {
    return { ok: false, motivo: 'credenciales' };
  }

  const nuevaSesion: Sesion = {
    usuarioId: `usr-${cuentaValida.rol}-${cuentaValida.nombreVisible.toLowerCase().replace(/\s+/g, '-')}`,
    nombreVisible: cuentaValida.nombreVisible,
    rol: cuentaValida.rol,
    escuelaId: 'esc-14-cba',
    escuelaNombre: 'Escuela N° 14, Córdoba',
  };

  sesionActual = nuevaSesion;
  notificarSuscriptores();

  return { ok: true, sesion: { ...nuevaSesion } };
}

export async function cerrarSesion(): Promise<void> {
  await simularDemora(200);
  sesionActual = null;
  notificarSuscriptores();
}

export async function obtenerSesion(): Promise<Sesion | null> {
  await simularDemora(100);
  return sesionActual ? { ...sesionActual } : null;
}

export async function solicitarRecuperacion(email: string): Promise<{ ok: boolean; motivo?: 'red' }> {
  await simularDemora(600);
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === 'sinred@ficticio.test') {
    return { ok: false, motivo: 'red' };
  }

  // Por seguridad, siempre responde ok exista o no el mail
  return { ok: true };
}

export function suscribirseASesion(callback: (s: Sesion | null) => void): () => void {
  suscriptores.add(callback);
  // Llamada inicial inmediata con el estado actual
  callback(sesionActual ? { ...sesionActual } : null);

  return () => {
    suscriptores.delete(callback);
  };
}

export const authService = {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  solicitarRecuperacion,
  suscribirseASesion,
};
