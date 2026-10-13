import { Curso } from '@/lib/types';

export const mockCursos: Curso[] = [
  {
    id: 'cur-pri-5b',
    nombre: '5º Grado "B" — Turno Mañana',
    anio: '5º Grado',
    nivel: 'primaria',
    codigoClase: 'COR-5B26',
    codigoVencimiento: '30 de Noviembre de 2026',
    docenteTitularId: 'usr-doc-1',
    cantidadAlumnos: 24,
  },
  {
    id: 'cur-sec-3a',
    nombre: '3º Año "A" — Ciencias Naturales',
    anio: '3º Año',
    nivel: 'secundaria',
    codigoClase: 'CBA-3A88',
    codigoVencimiento: '30 de Noviembre de 2026',
    docenteTitularId: 'usr-doc-1',
    cantidadAlumnos: 28,
  },
];
