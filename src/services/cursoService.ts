import { Curso, NivelEducativo } from '@/lib/types';
import { mockCursos } from '@/mocks/cursos';

export const cursoService = {
  async obtenerCursos(): Promise<Curso[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...mockCursos];
  },

  async obtenerCursoPorId(id: string): Promise<Curso | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const curso = mockCursos.find((c) => c.id === id);
    return curso ? { ...curso } : null;
  },

  async obtenerCursosPorNivel(nivel: NivelEducativo): Promise<Curso[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockCursos.filter((c) => c.nivel === nivel);
  },
};
