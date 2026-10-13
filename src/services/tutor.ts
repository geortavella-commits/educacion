export interface MensajeChat {
  id: string;
  emisor: 'alumno' | 'tutor';
  contenido: string;
  hora?: string;
  ideasParaResponder?: string[];
}

export interface ConversacionGuion {
  id: string;
  materia: string;
  tema: string;
  mensajesIniciales: MensajeChat[];
  respuestasGuionadas: Record<
    string,
    {
      respuestaTutor: string;
      ideasParaResponder?: string[];
    }
  >;
}

export const GUION_PRACTICA_PENALES: ConversacionGuion = {
  id: 'guion-mate-penales',
  materia: 'Mate',
  tema: 'Proporciones con penales',
  mensajesIniciales: [
    {
      id: 'msg-1',
      emisor: 'tutor',
      contenido:
        'Si el delantero de la selección mete 2 de cada 3 penales que patea, ¿cómo podemos pensar cuántos goles metería si patea 6 penales en total?',
      hora: '10:14',
      ideasParaResponder: [
        'Dibujar los penales',
        'Agrupar de a 3',
        'Usar los dedos',
        'Sumar de a grupos',
      ],
    },
  ],
  respuestasGuionadas: {
    'Dibujar los penales': {
      respuestaTutor:
        '¡Excelente estrategia! Si dibujás 6 pelotas en tu cuaderno, ¿en cuántos grupitos de 3 las podés separar?',
      ideasParaResponder: [
        'Dibujar 6 pelotas',
        'Separar con una línea',
        'Contar cuántos grupos quedan',
      ],
    },
    'Agrupar de a 3': {
      respuestaTutor:
        '¡Bien pensado! ¿Cuántos grupos de 3 penales entran dentro de 6?',
      ideasParaResponder: [
        'Contar de 3 en 3',
        'Hacer grupitos con los dedos',
        'Pensar la tabla del 3',
      ],
    },
    'Usar los dedos': {
      respuestaTutor:
        '¡Me gusta! Levantá 6 dedos. Si juntás 3 en una mano, ¿cuántos te quedan en la otra?',
      ideasParaResponder: [
        'Mirar una mano y la otra',
        'Contar cuántos grupos de 3 armé',
        'Ver cuántos goles van en cada mano',
      ],
    },
    'Sumar de a grupos': {
      respuestaTutor:
        '¡Exacto, ese es el camino! Si en los primeros 3 penales mete 2 goles, ¿qué pasa en los siguientes 3 penales?',
      ideasParaResponder: [
        'Mirar lo que pasó en el primer grupo',
        'Dibujar los otros 3 penales',
        'Contar los dos grupos juntos',
      ],
    },
    '2': {
      respuestaTutor:
        '¡Bien! Hay 2 grupos de 3 penales. Si en cada grupo de 3 mete 2 goles, ¿cómo podemos pensar el total de goles?',
      ideasParaResponder: [
        'Dibujar los goles de cada grupo',
        'Contar de a uno',
        'Armar una tabla',
      ],
    },
    '4': {
      respuestaTutor:
        '¡Llegaste a la meta! 4 goles en total. ¿Qué camino o estrategia usaste para darte cuenta?',
      ideasParaResponder: [
        'Agrupé los penales de a 3',
        'Dibujé los goles en el cuaderno',
        'Fui contando los grupos',
      ],
    },
    default: {
      respuestaTutor:
        '¡Muy buen intento! Pensemos juntos: si patea 6 penales en total, ¿cómo podemos repartirlos en grupos de 3?',
      ideasParaResponder: [
        'Dibujar las 6 pelotas',
        'Contar de 3 en 3',
        'Usar los dedos',
      ],
    },
  },
};

export const tutorService = {
  async obtenerConversacion(): Promise<ConversacionGuion> {
    await new Promise((r) => setTimeout(r, 200));
    return GUION_PRACTICA_PENALES;
  },

  async responderMensaje(textoAlumno: string): Promise<{
    respuestaTutor: string;
    ideasParaResponder?: string[];
  }> {
    // Simulación de tiempo de pensamiento socrático
    await new Promise((r) => setTimeout(r, 500));

    const normalizado = textoAlumno.trim();
    const match = GUION_PRACTICA_PENALES.respuestasGuionadas[normalizado];
    if (match) return match;

    if (normalizado === '4' || normalizado.toLowerCase().includes('cuatro')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['4'];
    }

    if (normalizado === '2' || normalizado.toLowerCase().includes('dos grupos')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['2'];
    }

    if (normalizado.toLowerCase().includes('dibuj')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['Dibujar los penales'];
    }

    if (normalizado.toLowerCase().includes('agrup') || normalizado.toLowerCase().includes('grupo')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['Agrupar de a 3'];
    }

    if (normalizado.toLowerCase().includes('dedo') || normalizado.toLowerCase().includes('mano')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['Usar los dedos'];
    }

    if (normalizado.toLowerCase().includes('sum')) {
      return GUION_PRACTICA_PENALES.respuestasGuionadas['Sumar de a grupos'];
    }

    return GUION_PRACTICA_PENALES.respuestasGuionadas['default'];
  },
};
