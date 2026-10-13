import { Usuario, Rol } from '@/lib/types';
import { mockUsuarios } from '@/mocks/usuarios';

// Simula llamadas asincrónicas a la capa de datos
export const usuarioService = {
  async obtenerUsuarioActual(): Promise<Usuario> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockUsuarios[0]; // Retorna el docente por defecto
  },

  async obtenerUsuariosPorRol(rol: Rol): Promise<Usuario[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockUsuarios.filter((u) => u.rol === rol);
  },

  async obtenerAlumnosPorCurso(cursoId: string): Promise<Usuario[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockUsuarios.filter((u) => u.rol === 'alumno' && u.cursoId === cursoId);
  },
};
