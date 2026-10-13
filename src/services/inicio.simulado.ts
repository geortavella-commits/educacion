import { diagnosticoService } from './diagnostico';
import type { DatosInicioAlumno, InicioService } from './inicio.tipos';

export const DATOS_INICIO_DEFAULT: DatosInicioAlumno = {
  alumnoNombre: 'Mateo',
  estrellas: 12,
  pasiones: ['futbol', 'dibujo'],
  misiones: [
    {
      id: 'mis-1',
      materias: ['Lengua', 'Historia'],
      titulo: 'Glosario futbolero: ¿de dónde viene “offside”?',
      duracionMinutos: 5,
      estado: 'Completada',
      proyectoId: 'proy-cancha',
      proyectoNombre: 'La cancha del barrio',
      orden: 1,
      tipo: 'abierta',
    },
    {
      id: 'mis-2',
      materias: ['Mate', 'Ed. Física'],
      titulo: 'Medí el arco con pasos',
      duracionMinutos: 10,
      estado: 'Pendiente',
      proyectoId: 'proy-cancha',
      proyectoNombre: 'La cancha del barrio',
      orden: 2,
      tipo: 'numero',
    },
    {
      id: 'mis-3',
      materias: ['Cs. Nat.'],
      titulo: '¿Qué necesita una planta para crecer?',
      duracionMinutos: 10,
      estado: 'Pendiente',
      proyectoId: 'proy-huerta',
      proyectoNombre: 'La huerta de la escuela',
      orden: 1,
      tipo: 'opcion',
    },
    {
      id: 'mis-4',
      materias: ['Mate'],
      titulo: 'Medí cómo crece tu planta',
      duracionMinutos: 10,
      estado: 'Pendiente',
      proyectoId: 'proy-huerta',
      proyectoNombre: 'La huerta de la escuela',
      orden: 2,
      tipo: 'numero',
    },
  ],
  proyectos: [
    { id: 'proy-cancha', nombre: 'La cancha del barrio', misionesCompletadas: 1, misionesTotales: 2 },
    { id: 'proy-huerta', nombre: 'La huerta de la escuela', misionesCompletadas: 0, misionesTotales: 2 },
  ],
  proyecto: {
    id: 'proy-cancha',
    nombre: 'La cancha del barrio',
    misionesCompletadas: 3,
    misionesTotales: 5,
  },
};

export const inicioService: InicioService = {
  async getDatosInicio(estadoSimulado?: 'feliz' | 'vacio' | 'error' | 'sin_permiso'): Promise<DatosInicioAlumno> {
    await new Promise((r) => setTimeout(r, 300));

    if (estadoSimulado === 'error') {
      throw new Error('Error al conectar con la escuela. Verificá tu red.');
    }

    if (estadoSimulado === 'sin_permiso') {
      throw new Error('Sin permiso familiar');
    }

    const pasionesGuardadas = diagnosticoService.getInteresesGuardados();

    if (estadoSimulado === 'vacio') {
      return {
        alumnoNombre: 'Mateo',
        estrellas: 12,
        pasiones: pasionesGuardadas,
        misiones: [],
        proyectos: [],
        proyecto: {
          id: 'proy-cancha',
          nombre: 'La cancha del barrio',
          misionesCompletadas: 0,
          misionesTotales: 0,
        },
      };
    }

    return {
      ...DATOS_INICIO_DEFAULT,
      pasiones: pasionesGuardadas.length > 0 ? pasionesGuardadas : DATOS_INICIO_DEFAULT.pasiones,
    };
  },

  async actualizarPasiones(nuevasPasiones: string[]): Promise<void> {
    diagnosticoService.setInteresesGuardados(nuevasPasiones);
  },

  async listarMensajesDocente() {
    return [];
  },

  async completarMision(misionId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    const m = DATOS_INICIO_DEFAULT.misiones.find((x) => x.id === misionId);
    if (m) m.estado = 'Completada';
  },
};
