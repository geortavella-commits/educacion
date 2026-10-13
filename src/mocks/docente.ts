export interface MetricasDocente {
  activosEstaSemana: number;
  totalAlumnos: number;
  proyectosEnCurso: number;
  necesitanApoyo: number;
}

export interface AvanceMisionMateria {
  materia: string;
  porcentaje: number;
  colorClass: string;
}

export interface ProyectoEnFoco {
  id: string;
  titulo: string;
  curso: string;
  materiasTexto: string;
  alineacionNap: string;
  avanceMisiones: AvanceMisionMateria[];
  loQueVioElTutor: string;
}

export interface GrupoResumen {
  id: string;
  codigo: string;
  nombre: string;
  info: string;
  porcentaje: number;
  colorBg: string;
  colorText: string;
  cursoId?: string;
}

export interface ResumenInicioDocente {
  docenteNombre: string;
  escuela: string;
  fechaTexto: string;
  metricas: MetricasDocente;
  proyectoEnFoco: ProyectoEnFoco;
  misGrupos: GrupoResumen[];
}

export type EstadoHipotesis = 'pendiente' | 'confirmada' | 'corregida' | 'descartada';

export interface AlumnoApoyo {
  id: string;
  nombre: string;
  curso: string;
  motivoObservacion: string;
  estadoHipotesis: EstadoHipotesis;
  textoCorregido?: string;
}

export interface HipotesisPerfil {
  id: string;
  texto: string;
  estado: EstadoHipotesis;
  textoCorregido?: string;
}

export interface ActividadRecientePerfil {
  /** Lo que el alumno escribió en una misión abierta (solo la docente lo ve). */
  respuesta?: string;
  /** Misión a la que corresponde (para valorarla). Ausente en los datos de ejemplo. */
  misionId?: string;
  /** Estado de la misión y si la docente la cerró porque se resolvió en papel. */
  estado?: 'pendiente' | 'en_curso' | 'completada';
  enPapel?: boolean;
  /** Marca y mensaje de la docente sobre esta misión, si ya los dejó. */
  valoracion?: { marca: 'encaminado' | 'repensar' | 'conversar'; mensaje: string };
  id: string;
  periodo: string;
  actividad: string;
  hecho: string;
}

export interface MensajeChat {
  emisor: 'alumno' | 'tutor';
  contenido: string;
  hora: string;
}

export interface SesionChasqui {
  id: string;
  fecha: string;
  mision: string;
  resumenIA: string;
  mensajes: MensajeChat[];
}

export interface PerfilAlumnoDocente {
  id: string;
  nombre: string;
  curso: string;
  intereses: string;
  iniciales: string;
  avanceMisiones: { materia: string; porcentaje: number; bgClass: string }[];
  hipotesis: HipotesisPerfil[];
  actividadReciente: ActividadRecientePerfil[];
  /** Resumen del diagnóstico inicial por área (aciertos de total). Solo lo ve la docente. */
  diagnostico?: { area: 'matematica' | 'lengua'; aciertos: number; total: number }[];
  /** Misiones del curso que el alumno todavía no completó: la docente puede cerrarlas si las resolvió en papel. */
  misionesPendientes?: { misionId: string; titulo: string; proyecto: string }[];
  conversaciones: SesionChasqui[];
}

export interface EtapaProyecto {
  numero: number;
  titulo: string;
  materia: string;
  materiaTagBg: string;
}

export interface NivelRubrica {
  nivel: 'En inicio' | 'En proceso' | 'Logrado';
  descripcion: string;
}

export interface ContenidoCurricular {
  id: string;
  area: string;
  estado: 'cubierto' | 'falta';
  descripcion: string;
  detalle?: string;
}

export interface ProyectoDetalle {
  id: string;
  paso: string;
  titulo: string;
  curso: string;
  materiasChips: string[];
  etapas: EtapaProyecto[];
  rubricaEnFoco: {
    criterio: string;
    niveles: NivelRubrica[];
  };
  coberturaCurricular: {
    titulo: string;
    resumen: string;
    areas: { nombre: string; cubiertos: number; total: number; colorBg: string }[];
    contenidos: ContenidoCurricular[];
  };
}

export interface GrupoSugerido {
  id: string;
  nombreVisible: string;
  etiquetaDocente: string;
  alumnosCount: number;
  alumnosIniciales: string[];
  alumnosNombres: string[];
  explicacionTutor: string;
  estado: 'borrador' | 'aprobado';
}

export interface ProyectoListItem {
  id: string;
  titulo: string;
  curso: string;
  materias: string;
  cobertura: string;
  estado: 'en_curso' | 'planificado' | 'finalizado';
}

export const mockDocenteInicio: ResumenInicioDocente = {
  docenteNombre: 'Laura',
  escuela: 'Escuela N° 14, Córdoba',
  fechaTexto: 'Jueves 8 de octubre',
  metricas: {
    activosEstaSemana: 58,
    totalAlumnos: 64,
    proyectosEnCurso: 3,
    necesitanApoyo: 7,
  },
  proyectoEnFoco: {
    id: 'cancha-barrio',
    titulo: 'Proyecto: La cancha del barrio',
    curso: '5º B',
    materiasTexto: '5º B · Matemática + Ciencias + Lengua',
    alineacionNap:
      'Geometría y Medida (Mat.), Materiales y energía (Cs. Nat.), Escritura de textos expositivos (Lengua)',
    avanceMisiones: [
      { materia: 'Matemática · medir y calcular el campo', porcentaje: 82, colorClass: 'bg-accent' },
      { materia: 'Ciencias · el césped y el suelo', porcentaje: 56, colorClass: 'bg-[oklch(0.62_0.12_195)]' },
      { materia: 'Lengua · carta al intendente', porcentaje: 31, colorClass: 'bg-[oklch(0.55_0.15_260)]' },
    ],
    loQueVioElTutor:
      'Varios chicos confunden perímetro con área. El tutor les propuso medir el arco con pasos antes de calcular. Sugerencia: retomar en clase con la cancha dibujada.',
  },
  misGrupos: [
    {
      id: '5b',
      codigo: '5B',
      nombre: '5º B · Primaria',
      info: '24 alumnos · 2 necesitan apoyo',
      porcentaje: 74,
      colorBg: 'bg-accent-700',
      colorText: 'text-white',
      cursoId: 'cur-pri-5b',
    },
    {
      id: '6a',
      codigo: '6A',
      nombre: '6º A · Primaria',
      info: '22 alumnos · 1 necesita apoyo',
      porcentaje: 68,
      colorBg: 'bg-[oklch(0.40_0.10_195)]',
      colorText: 'text-white',
    },
    {
      id: '3a',
      codigo: '3°',
      nombre: '3º año · Secundaria',
      info: '18 alumnos · 4 necesitan apoyo',
      porcentaje: 61,
      colorBg: 'bg-[oklch(0.40_0.14_260)]',
      colorText: 'text-white',
      cursoId: 'cur-sec-3a',
    },
    {
      id: 'ref-frac',
      codigo: 'Eq',
      nombre: 'Grupo de refuerzo · Fracciones',
      info: 'Armado por vos · 6 alumnos',
      porcentaje: 48,
      colorBg: 'bg-[oklch(0.90_0.12_90)]',
      colorText: 'text-text',
    },
  ],
};

export const mockAlumnosApoyo: AlumnoApoyo[] = [
  {
    id: 'santi',
    nombre: 'Santi',
    curso: '5º B',
    motivoObservacion: "Usó 3 pistas seguidas en 'Perímetro vs. área' (ayer).",
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'bruno',
    nombre: 'Bruno',
    curso: '5º B',
    motivoObservacion: 'No entró a ninguna misión en 5 días.',
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'ailen',
    nombre: 'Ailén',
    curso: '6º A',
    motivoObservacion: 'Dejó incompleta dos veces la misión de fracciones.',
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'lara',
    nombre: 'Lara',
    curso: '3º año',
    motivoObservacion: 'Cambió 4 veces su respuesta en Movimiento.',
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'joaquin',
    nombre: 'Joaquín',
    curso: '3º año',
    motivoObservacion: 'Sin actividad en el proyecto esta semana.',
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'nicolas',
    nombre: 'Nicolás',
    curso: '3º año',
    motivoObservacion: 'Pidió ejemplo parecido 5 veces en Física.',
    estadoHipotesis: 'pendiente',
  },
  {
    id: 'abril',
    nombre: 'Abril',
    curso: '3º año',
    motivoObservacion: 'Las etapas del proyecto van atrasadas.',
    estadoHipotesis: 'pendiente',
  },
];

export const mockPerfilAlumnoValentina: PerfilAlumnoDocente = {
  id: 'valentina',
  nombre: 'Valentina',
  curso: '5º B',
  intereses: 'fútbol, dibujo',
  iniciales: 'VA',
  avanceMisiones: [
    { materia: 'Mate', porcentaje: 72, bgClass: 'bg-accent-100' },
    { materia: 'Cs. Nat.', porcentaje: 58, bgClass: 'bg-[oklch(0.93_0.04_260)]' },
    { materia: 'Lengua', porcentaje: 85, bgClass: 'bg-[oklch(0.95_0.08_90)]' },
  ],
  hipotesis: [
    {
      id: 'hip-1',
      texto: 'Parece responder mejor con ejemplos de fútbol (4 de sus últimas 5 actividades).',
      estado: 'pendiente',
    },
    {
      id: 'hip-2',
      texto: 'En “Perímetro vs. área” (ayer) usó 3 pistas antes de llegar al cálculo.',
      estado: 'pendiente',
    },
  ],
  actividadReciente: [
    { id: 'act-1', periodo: 'Hoy', actividad: 'Área del arco: usó 1 pista', hecho: 'Completó la misión' },
    { id: 'act-2', periodo: 'Ayer', actividad: 'Perímetro vs. área: usó 3 pistas', hecho: 'En exploración' },
    { id: 'act-3', periodo: 'Lun', actividad: 'Fracciones de la cancha', hecho: 'Completó la misión' },
  ],
  conversaciones: [
    {
      id: 'conv-1',
      fecha: 'Hoy, 10:15',
      mision: 'Área del arco',
      resumenIA:
        'Valentina midió las dimensiones del arco utilizando pasos y calculó la superficie rectangular sin dificultades mayores.',
      mensajes: [
        { emisor: 'tutor', contenido: '¡Hola Valentina! ¿Te acordás cuánto medía el travesaño del arco que medimos?', hora: '10:15' },
        { emisor: 'alumno', contenido: 'Sí, medía como 7 pasos míos de largo y 2 de alto.', hora: '10:16' },
        { emisor: 'tutor', contenido: '¡Bien observado! Y si quisiéramos cubrir toda esa entrada con una red, ¿cómo calcularías el espacio total que ocupa?', hora: '10:16' },
        { emisor: 'alumno', contenido: 'Multiplico el largo por el alto: 7 por 2 = 14 pasos cuadrados.', hora: '10:17' },
        { emisor: 'tutor', contenido: '¡Exacto! Acabás de calcular el área del frente del arco. ¿Se te ocurre qué unidad oficial podríamos usar en vez de pasos?', hora: '10:18' },
      ],
    },
    {
      id: 'conv-2',
      fecha: 'Ayer, 14:30',
      mision: 'Perímetro vs. área',
      resumenIA:
        'Valentina exploró la diferencia entre el contorno de la cancha (perímetro) y la superficie del pasto (área). Requirió 3 preguntas guía para relacionar la multiplicación de lados con el área total.',
      mensajes: [
        { emisor: 'tutor', contenido: 'Valentina, si corremos alrededor de la cancha por la línea blanca, ¿estamos recorriendo el perímetro o el área?', hora: '14:30' },
        { emisor: 'alumno', contenido: 'El área porque estamos dentro de la cancha.', hora: '14:31' },
        { emisor: 'tutor', contenido: 'Pensemos juntos: el contorno que rodea algo se llama perímetro. Si pisás solo las líneas de afuera, ¿qué estás midiendo?', hora: '14:32' },
        { emisor: 'alumno', contenido: 'Ah, el perímetro! Porque es solo el borde.', hora: '14:33' },
        { emisor: 'tutor', contenido: '¡Exactamente! ¿Y todo el pasto verde que queda adentro?', hora: '14:34' },
        { emisor: 'alumno', contenido: 'El área.', hora: '14:35' },
      ],
    },
    {
      id: 'conv-3',
      fecha: 'Lun 5 oct, 11:00',
      mision: 'Fracciones de la cancha',
      resumenIA:
        'Dividió el campo en mitades y cuartos para ubicar las posiciones de juego, comprendiendo fracciones como partes de un entero.',
      mensajes: [
        { emisor: 'tutor', contenido: 'Si la mitad de la cancha es de un equipo, ¿qué fracción representa?', hora: '11:00' },
        { emisor: 'alumno', contenido: 'Un medio, 1/2.', hora: '11:01' },
        { emisor: 'tutor', contenido: '¡Muy bien! ¿Y el área chica respecto a toda la mitad?', hora: '11:02' },
        { emisor: 'alumno', contenido: 'Es una parte más chiquita, como 1/4 de la mitad.', hora: '11:03' },
      ],
    },
  ],
};

export const mockPerfilAlumnoSanti: PerfilAlumnoDocente = {
  id: 'santi',
  nombre: 'Santi',
  curso: '5º B',
  intereses: 'fútbol, videojuegos',
  iniciales: 'SA',
  avanceMisiones: [
    { materia: 'Mate', porcentaje: 68, bgClass: 'bg-accent-100' },
    { materia: 'Cs. Nat.', porcentaje: 60, bgClass: 'bg-[oklch(0.93_0.04_260)]' },
    { materia: 'Lengua', porcentaje: 75, bgClass: 'bg-[oklch(0.95_0.08_90)]' },
  ],
  hipotesis: [
    {
      id: 'hip-s1',
      texto: 'En “Perímetro vs. área” (ayer) usó 3 pistas antes de llegar al cálculo.',
      estado: 'pendiente',
    },
    {
      id: 'hip-s2',
      texto: 'Se entusiasma con desafíos que involucren armar estrategias de juego y gráficos.',
      estado: 'pendiente',
    },
  ],
  actividadReciente: [
    { id: 'act-s1', periodo: 'Hoy', actividad: 'Líneas del campo: usó 1 pista', hecho: 'Completó la misión' },
    { id: 'act-s2', periodo: 'Ayer', actividad: 'Perímetro vs. área: usó 3 pistas', hecho: 'En exploración' },
    { id: 'act-s3', periodo: 'Lun', actividad: 'Fracciones de la cancha', hecho: 'Completó la misión' },
  ],
  conversaciones: [
    {
      id: 'conv-s1',
      fecha: 'Hoy, 10:30',
      mision: 'Líneas del campo',
      resumenIA:
        'Santi midió el contorno de la cancha y calculó los metros totales de línea blanca recorriendo el perímetro.',
      mensajes: [
        { emisor: 'tutor', contenido: '¡Hola Santi! ¿Pudiste recorrer las líneas exteriores de la cancha?', hora: '10:30' },
        { emisor: 'alumno', contenido: 'Sí, conté los pasos a lo largo y a lo ancho.', hora: '10:31' },
        { emisor: 'tutor', contenido: '¡Excelente! ¿Y sumaste todos los lados para tener el contorno completo?', hora: '10:32' },
        { emisor: 'alumno', contenido: 'Sí, sumé los 4 lados y me dio 120 metros en total.', hora: '10:33' },
        { emisor: 'tutor', contenido: '¡Impecable Santi! Ese contorno total es el perímetro.', hora: '10:34' },
      ],
    },
    {
      id: 'conv-s2',
      fecha: 'Ayer, 14:15',
      mision: 'Perímetro vs. área',
      resumenIA:
        'Santi exploró la diferencia entre el contorno de la cancha y la superficie interior. Requirió 3 preguntas guía para relacionar el área con la multiplicación de dimensiones.',
      mensajes: [
        { emisor: 'tutor', contenido: 'Santi, si corremos alrededor de la cancha por la línea blanca, ¿estamos recorriendo el perímetro o el área?', hora: '14:15' },
        { emisor: 'alumno', contenido: 'El área porque estamos jugando adentro.', hora: '14:16' },
        { emisor: 'tutor', contenido: 'Pensemos juntos: el borde que rodea algo se llama perímetro. Si pisás solo las líneas de afuera, ¿qué medís?', hora: '14:17' },
        { emisor: 'alumno', contenido: 'Ah, el perímetro! Porque es solo el contorno.', hora: '14:18' },
        { emisor: 'tutor', contenido: '¡Exactamente Santi! ¿Y todo el pasto que queda en el centro?', hora: '14:19' },
        { emisor: 'alumno', contenido: 'El área.', hora: '14:20' },
      ],
    },
  ],
};

export const mockPerfilAlumnoBruno: PerfilAlumnoDocente = {
  id: 'bruno',
  nombre: 'Bruno',
  curso: '5º B',
  intereses: 'robótica, dibujo',
  iniciales: 'BR',
  avanceMisiones: [
    { materia: 'Mate', porcentaje: 52, bgClass: 'bg-accent-100' },
    { materia: 'Cs. Nat.', porcentaje: 65, bgClass: 'bg-[oklch(0.93_0.04_260)]' },
    { materia: 'Lengua', porcentaje: 50, bgClass: 'bg-[oklch(0.95_0.08_90)]' },
  ],
  hipotesis: [
    {
      id: 'hip-b1',
      texto: 'No entró a ninguna misión en 5 días. Conviene consultar si tuvo problemas de conectividad.',
      estado: 'pendiente',
    },
    {
      id: 'hip-b2',
      texto: 'Responde con entusiasmo cuando las consignas proponen diseñar planos o esquemas.',
      estado: 'pendiente',
    },
  ],
  actividadReciente: [
    { id: 'act-b1', periodo: 'Hace 5 días', actividad: 'Plano del campo', hecho: 'Completó la misión' },
    { id: 'act-b2', periodo: 'Hace 6 días', actividad: 'Exploración inicial', hecho: 'En exploración' },
  ],
  conversaciones: [
    {
      id: 'conv-b1',
      fecha: 'Hace 5 días, 11:20',
      mision: 'Plano del campo',
      resumenIA:
        'Bruno identificó figuras geométricas simples dentro del plano y relacionó los lados con las medidas reales.',
      mensajes: [
        { emisor: 'tutor', contenido: '¡Hola Bruno! ¿Qué figuras geométricas ves en el plano de la cancha?', hora: '11:20' },
        { emisor: 'alumno', contenido: 'Veo rectángulos y el círculo central.', hora: '11:21' },
        { emisor: 'tutor', contenido: '¡Muy bien Bruno! ¿Y cómo calcularías el espacio de uno de los rectángulos?', hora: '11:22' },
        { emisor: 'alumno', contenido: 'Multiplicando la base por la altura.', hora: '11:23' },
      ],
    },
  ],
};

export const mockPerfilAlumnoAilen: PerfilAlumnoDocente = {
  id: 'ailen',
  nombre: 'Ailén',
  curso: '6º A',
  intereses: 'música, ciencias naturales',
  iniciales: 'AI',
  avanceMisiones: [
    { materia: 'Mate', porcentaje: 58, bgClass: 'bg-accent-100' },
    { materia: 'Cs. Nat.', porcentaje: 78, bgClass: 'bg-[oklch(0.93_0.04_260)]' },
    { materia: 'Lengua', porcentaje: 82, bgClass: 'bg-[oklch(0.95_0.08_90)]' },
  ],
  hipotesis: [
    {
      id: 'hip-a1',
      texto: 'Dejó incompleta dos veces la misión de fracciones. Puede servir usar tiras gráficas de apoyo.',
      estado: 'pendiente',
    },
    {
      id: 'hip-a2',
      texto: 'Demuestra muy buena capacidad de argumentación en temas vinculados al medio ambiente.',
      estado: 'pendiente',
    },
  ],
  actividadReciente: [
    { id: 'act-a1', periodo: 'Ayer', actividad: 'Fracciones en la huerta', hecho: 'En exploración' },
    { id: 'act-a2', periodo: 'Mar', actividad: 'Tipos de suelo', hecho: 'Completó la misión' },
  ],
  conversaciones: [
    {
      id: 'conv-a1',
      fecha: 'Ayer, 16:00',
      mision: 'Fracciones en la huerta',
      resumenIA:
        'Ailén exploró la división de parcelas en partes iguales para sembrar distintas hortalizas.',
      mensajes: [
        { emisor: 'tutor', contenido: '¡Hola Ailén! Si dividimos el cantero en 4 partes iguales y sembramos lechuga en 3, ¿qué fracción ocupamos?', hora: '16:00' },
        { emisor: 'alumno', contenido: 'Tres cuartos, 3/4.', hora: '16:01' },
        { emisor: 'tutor', contenido: '¡Exacto Ailén! ¿Y cuánto queda libre para las zanahorias?', hora: '16:02' },
        { emisor: 'alumno', contenido: 'Un cuarto, 1/4.', hora: '16:03' },
      ],
    },
  ],
};

/** Helper para obtener o generar perfil coherente por alumno */
export function obtenerMockPerfilPorAlumno(alumnoId: string): PerfilAlumnoDocente {
  if (alumnoId === 'santi') return JSON.parse(JSON.stringify(mockPerfilAlumnoSanti));
  if (alumnoId === 'bruno') return JSON.parse(JSON.stringify(mockPerfilAlumnoBruno));
  if (alumnoId === 'ailen') return JSON.parse(JSON.stringify(mockPerfilAlumnoAilen));
  if (alumnoId === 'valentina') return JSON.parse(JSON.stringify(mockPerfilAlumnoValentina));

  const matching = mockAlumnosApoyo.find((a) => a.id === alumnoId);
  const nombre = matching?.nombre || alumnoId.charAt(0).toUpperCase() + alumnoId.slice(1);
  const curso = matching?.curso || '5º B';
  const obs = matching?.motivoObservacion || 'Actividad reciente en seguimiento pedagógico.';

  return {
    id: alumnoId,
    nombre,
    curso,
    intereses: 'exploración, ciencias',
    iniciales: nombre.slice(0, 2).toUpperCase(),
    avanceMisiones: [
      { materia: 'Mate', porcentaje: 65, bgClass: 'bg-accent-100' },
      { materia: 'Cs. Nat.', porcentaje: 62, bgClass: 'bg-[oklch(0.93_0.04_260)]' },
      { materia: 'Lengua', porcentaje: 70, bgClass: 'bg-[oklch(0.95_0.08_90)]' },
    ],
    hipotesis: [
      {
        id: `hip-${alumnoId}-1`,
        texto: obs,
        estado: 'pendiente',
      },
      {
        id: `hip-${alumnoId}-2`,
        texto: `${nombre} responde con buen interés a los ejemplos prácticos del entorno escolar.`,
        estado: 'pendiente',
      },
    ],
    actividadReciente: [
      { id: `act-${alumnoId}-1`, periodo: 'Esta semana', actividad: 'Misión en curso', hecho: 'En exploración' },
      { id: `act-${alumnoId}-2`, periodo: 'Semana pasada', actividad: 'Actividad de integración', hecho: 'Completó la misión' },
    ],
    conversaciones: [
      {
        id: `conv-${alumnoId}-1`,
        fecha: 'Ayer, 11:00',
        mision: 'Exploración de campo',
        resumenIA: `${nombre} participó de la sesión de diálogo sobre las dimensiones del proyecto.`,
        mensajes: [
          { emisor: 'tutor', contenido: `¡Hola ${nombre}! ¿Cómo venís con el desafío de hoy?`, hora: '11:00' },
          { emisor: 'alumno', contenido: 'Vengo bien, estuve revisando los pasos de la misión.', hora: '11:01' },
          { emisor: 'tutor', contenido: `¡Buenísimo ${nombre}! Si necesitás una pregunta guía, avisame.`, hora: '11:02' },
        ],
      },
    ],
  };
}

export const mockProyectoCanchaBarrio: ProyectoDetalle = {
  id: 'cancha-barrio',
  paso: 'En curso',
  titulo: 'La cancha del barrio',
  curso: '5º B',
  materiasChips: ['Matemática', 'Cs. Naturales', 'Lengua', '+ Ed. Física'],
  etapas: [
    { numero: 1, titulo: 'Explorar: ¿cuánto mide una cancha?', materia: 'Mate', materiaTagBg: 'bg-[oklch(0.93_0.05_195)]' },
    { numero: 2, titulo: 'Medir y calcular el área', materia: 'Mate', materiaTagBg: 'bg-[oklch(0.93_0.05_195)]' },
    { numero: 3, titulo: 'El césped y el suelo', materia: 'Cs. Nat.', materiaTagBg: 'bg-[oklch(0.93_0.04_260)]' },
    { numero: 4, titulo: 'Carta al intendente', materia: 'Lengua', materiaTagBg: 'bg-[oklch(0.95_0.08_90)]' },
  ],
  rubricaEnFoco: {
    criterio: 'Usa datos de su propia medición para argumentar.',
    niveles: [
      { nivel: 'En inicio', descripcion: 'Registra medidas aisladas sin relacionarlas con el problema de la cancha.' },
      { nivel: 'En proceso', descripcion: 'Calcula área y perímetro con ayuda de preguntas guía del tutor.' },
      { nivel: 'Logrado', descripcion: 'Aplica medidas y cálculos exactos para fundamentar la solicitud en la carta.' },
    ],
  },
  coberturaCurricular: {
    titulo: 'Cobertura curricular · 5º grado',
    resumen: '9 de 12 NAP cubiertos',
    areas: [
      { nombre: 'Matemática', cubiertos: 3, total: 4, colorBg: 'bg-[oklch(0.40_0.10_195)]' },
      { nombre: 'Cs. Naturales', cubiertos: 2, total: 4, colorBg: 'bg-[oklch(0.40_0.14_260)]' },
      { nombre: 'Lengua', cubiertos: 4, total: 4, colorBg: 'bg-[oklch(0.90_0.12_90)]' },
    ],
    contenidos: [
      { id: 'c1', area: 'Mate', estado: 'cubierto', descripcion: 'Calcular perímetro y área de figuras compuestas', detalle: 'Cubierto en etapa 2' },
      { id: 'c2', area: 'Cs.', estado: 'cubierto', descripcion: 'Propiedades de los materiales y su uso', detalle: 'Cubierto en etapa 3' },
      { id: 'c3', area: 'Lengua', estado: 'cubierto', descripcion: 'Producción de textos de opinión y cartas formales', detalle: 'Cubierto en etapa 4' },
      { id: 'c4', area: 'Mate', estado: 'falta', descripcion: 'Mate · Proporcionalidad directa y escalas' },
      { id: 'c5', area: 'Cs.', estado: 'falta', descripcion: 'Cs. · Tipos de suelo y absorción de agua' },
      { id: 'c6', area: 'Cs.', estado: 'falta', descripcion: 'Cs. · El ciclo del agua y el impacto ambiental' },
    ],
  },
};

export const mockGruposSugeridos: GrupoSugerido[] = [
  {
    id: 'g1',
    nombreVisible: 'Los goleadores del área',
    etiquetaDocente: 'Refuerzo · Área y perímetro',
    alumnosCount: 4,
    alumnosIniciales: ['VA', 'TO', 'CA', 'LU'],
    alumnosNombres: ['Valentina', 'Tomás', 'Camila', 'Lucas'],
    explicacionTutor: 'Comparten la confusión perímetro/área. Pasan por la misma pregunta guía.',
    estado: 'borrador',
  },
  {
    id: 'g2',
    nombreVisible: 'Los cracks del barrio',
    etiquetaDocente: 'Equipo mixto',
    alumnosCount: 5,
    alumnosIniciales: ['SA', 'BR', 'MA', 'SO', 'FE'],
    alumnosNombres: ['Santi', 'Bruno', 'Mateo', 'Sofía', 'Felipe'],
    explicacionTutor: 'Mezcla niveles distintos y un interés común: fútbol. Ideal para la carta al intendente.',
    estado: 'borrador',
  },
  {
    id: 'g3',
    nombreVisible: 'Los arquitectos',
    etiquetaDocente: 'Desafío extra · Proporcionalidad',
    alumnosCount: 3,
    alumnosIniciales: ['JU', 'CA', 'EM'],
    alumnosNombres: ['Juan', 'Catalina', 'Emma'],
    explicacionTutor: 'Terminaron antes de tiempo. Se les propone escalar la cancha en un plano.',
    estado: 'borrador',
  },
];

export const mockProyectosLista: ProyectoListItem[] = [
  {
    id: 'cancha-barrio',
    titulo: 'La cancha del barrio',
    curso: '5º B',
    materias: 'Matemática + Cs. Naturales + Lengua',
    cobertura: '9 de 12 NAP',
    estado: 'en_curso',
  },
  {
    id: 'rio-ciudad',
    titulo: 'El río y la ciudad',
    curso: '6º A',
    materias: 'Ciencias Naturales + Ciencias Sociales',
    cobertura: '7 de 12 NAP',
    estado: 'en_curso',
  },
  {
    id: 'energia-movimiento',
    titulo: 'Energía y movimiento',
    curso: '3º año',
    materias: 'Física + Matemática',
    cobertura: '8 de 12 NAP',
    estado: 'en_curso',
  },
];
