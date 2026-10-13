import { describe, it, expect } from 'vitest';
import { buscarAprendizajes, normalizar, palabrasDeConsulta, type AprendizajeBuscable } from './buscarAprendizajes';

const a = (materia: string, descripcion: string, indicadores: string[] = []): AprendizajeBuscable => ({ materia, descripcion, indicadores });

const LISTA = [
  a('Matemática', 'Uso de la suma y la resta con expresiones fraccionarias y decimales.', ['Compara procedimientos de cálculo']),
  a('Matemática', 'Medición de longitudes con unidades convencionales.', ['Mide con regla graduada']),
  a('Matemática', 'Propiedades de triángulos y cuadriláteros.', []),
  a('Ciencias Naturales', 'Clasificación de materiales según su origen.', ['Experimenta con la medición de temperatura']),
  a('Lengua', 'Producción de textos de opinión y cartas formales.', []),
];

describe('buscador de aprendizajes', () => {
  it('no distingue mayúsculas ni tildes', () => {
    expect(buscarAprendizajes(LISTA, 'MEDICION')[0].descripcion).toMatch(/^Medición de longitudes/);
    expect(buscarAprendizajes(LISTA, 'triangulos')).toHaveLength(1);
    expect(normalizar('Ñandú Córdoba')).toBe('nandu cordoba'); // la ñ se busca como n
  });

  it('tolera plurales, géneros y derivados (busca por la raíz)', () => {
    expect(buscarAprendizajes(LISTA, 'fracciones')).toHaveLength(1); // "fraccionarias"
    expect(buscarAprendizajes(LISTA, 'sumar')).toHaveLength(1); // "suma"
    expect(buscarAprendizajes(LISTA, 'cuadrilatero')).toHaveLength(1);
    expect(buscarAprendizajes(LISTA, 'texto')).toHaveLength(1);
  });

  it('exige todas las palabras, en cualquier orden', () => {
    expect(buscarAprendizajes(LISTA, 'resta suma')).toHaveLength(1);
    expect(buscarAprendizajes(LISTA, 'suma triangulos')).toHaveLength(0);
    expect(buscarAprendizajes(LISTA, 'cartas opinion')).toHaveLength(1);
  });

  it('busca también en la materia y en los indicadores', () => {
    expect(buscarAprendizajes(LISTA, 'lengua cartas')).toHaveLength(1);
    expect(buscarAprendizajes(LISTA, 'regla graduada')).toHaveLength(1);
  });

  it('pone primero lo que coincide en el aprendizaje, después la materia, al final los indicadores', () => {
    const r = buscarAprendizajes(LISTA, 'medicion');
    expect(r[0].materia).toBe('Matemática'); // en el texto del aprendizaje
    expect(r[1].materia).toBe('Ciencias Naturales'); // solo en un indicador
  });

  it('una consulta vacía o de conectores devuelve todo; sin coincidencias, nada', () => {
    expect(buscarAprendizajes(LISTA, '')).toHaveLength(LISTA.length);
    expect(buscarAprendizajes(LISTA, '  de la  ')).toHaveLength(LISTA.length);
    expect(buscarAprendizajes(LISTA, 'astronomia')).toHaveLength(0);
  });

  it('ignora los conectores de la consulta', () => {
    expect(palabrasDeConsulta('Uso de la suma y la resta')).toEqual(['uso', 'suma', 'resta']);
    expect(buscarAprendizajes(LISTA, 'suma y la resta')).toHaveLength(1);
  });

  it('no modifica la lista original', () => {
    const copia = [...LISTA];
    buscarAprendizajes(LISTA, 'suma');
    expect(LISTA).toEqual(copia);
  });
});
