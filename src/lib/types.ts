export type Rol = 'docente' | 'alumno' | 'familia' | 'directivo';

export type NivelEducativo = 'primaria' | 'secundaria';

export interface Usuario {
  id: string;
  nombre: string;
  // En primaria no se muestra apellido, en otros roles puede estar disponible
  apellido?: string;
  rol: Rol;
  avatarUrl?: string;
  cursoId?: string;
}

export interface Curso {
  id: string;
  nombre: string;
  anio: string; // ej: "5º Grado B", "3º Año A"
  nivel: NivelEducativo;
  codigoClase: string;
  codigoVencimiento: string; // ISO date string o formato visible ej. "15 de Noviembre"
  docenteTitularId: string;
  cantidadAlumnos: number;
}
