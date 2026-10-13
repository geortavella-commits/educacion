import { Usuario } from '@/lib/types';

export const mockUsuarios: Usuario[] = [
  {
    id: 'usr-doc-1',
    nombre: 'Laura',
    apellido: 'Martínez',
    rol: 'docente',
    avatarUrl: '/avatars/docente-1.svg',
    cursoId: 'cur-pri-5b',
  },
  {
    id: 'usr-alu-1',
    nombre: 'Mateo',
    rol: 'alumno',
    avatarUrl: '/avatars/alumno-1.svg',
    cursoId: 'cur-pri-5b',
  },
  {
    id: 'usr-alu-2',
    nombre: 'Sofía',
    rol: 'alumno',
    avatarUrl: '/avatars/alumno-2.svg',
    cursoId: 'cur-pri-5b',
  },
  {
    id: 'usr-alu-3',
    nombre: 'Lucas',
    rol: 'alumno',
    avatarUrl: '/avatars/alumno-3.svg',
    cursoId: 'cur-sec-3a',
  },
  {
    id: 'usr-fam-1',
    nombre: 'Marcelo',
    apellido: 'Pérez',
    rol: 'familia',
    avatarUrl: '/avatars/familia-1.svg',
    cursoId: 'cur-pri-5b',
  },
  {
    id: 'usr-dir-1',
    nombre: 'Graciela',
    apellido: 'Directora',
    rol: 'directivo',
    avatarUrl: '/avatars/directivo-1.svg',
  },
];
