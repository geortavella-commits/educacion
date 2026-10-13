import { describe, it, expect } from 'vitest';
import { agruparEnHojas, respuestaLegible, rotuloDeHoja, type FilaHoja } from './hojasImprimibles';

const fila = (extra: Partial<FilaHoja>): FilaHoja => ({
  proyecto_id: 'p1', proyecto_titulo: 'La huerta', semana: 1, etapa_titulo: 'Explorando', etapa_objetivo: 'Mirar y registrar.',
  mision_id: 'm1', orden: 1, titulo: 'Observá', consigna: 'Mirá el patio.', tipo_respuesta: 'abierta', opciones: null,
  curso_nombre: '5º B', escuela_nombre: 'Escuela 14', alumno_nombre: 'Mateo', ...extra,
});

describe('hojas imprimibles: una hoja por semana', () => {
  it('agrupa las misiones de una semana en una sola hoja, ordenadas', () => {
    const hojas = agruparEnHojas([fila({ mision_id: 'b', orden: 2 }), fila({ mision_id: 'a', orden: 1 })]);
    expect(hojas).toHaveLength(1);
    expect(hojas[0].misiones.map((m) => m.id)).toEqual(['a', 'b']);
    expect(hojas[0].alumno).toBe('Mateo');
  });

  it('separa semanas y proyectos distintos, y deja las misiones sin semana al final de su proyecto', () => {
    const hojas = agruparEnHojas([
      fila({ semana: 2, etapa_titulo: 'Investigando', mision_id: 'c' }),
      fila({ semana: 1, mision_id: 'a' }),
      fila({ semana: null, etapa_titulo: null, etapa_objetivo: null, mision_id: 'z' }),
      fila({ proyecto_id: 'p0', proyecto_titulo: 'Agua', semana: 1, mision_id: 'q' }),
    ]);
    expect(hojas.map((h) => `${h.proyectoTitulo}/${h.semana}`)).toEqual(['Agua/1', 'La huerta/1', 'La huerta/2', 'La huerta/null']);
  });

  it('rotula con la semana, y un tipo desconocido se trata como entrega libre', () => {
    const h = agruparEnHojas([fila({ tipo_respuesta: 'raro' })])[0];
    expect(rotuloDeHoja(h)).toBe('Semana 1 · Explorando');
    expect(h.misiones[0].tipo).toBe('abierta');
    expect(rotuloDeHoja(agruparEnHojas([fila({ semana: null, etapa_titulo: null })])[0])).toBe('Misiones del proyecto');
  });

  it('en opción múltiple, la respuesta esperada sale con su letra y texto', () => {
    const ops = [{ id: 'a', texto: 'Agua' }, { id: 'b', texto: 'Paja' }];
    expect(respuestaLegible('opcion', ops, ['b'])).toEqual(['B) Paja']);
    expect(respuestaLegible('numero', [], ['3,5'])).toEqual(['3,5']);
  });
});
