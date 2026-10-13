import { describe, it, expect } from 'vitest';
import { aDatosRespuesta, desdeSugerida, respuestaVacia, validarBorrador, type BorradorRespuesta } from './borradorRespuesta';

const con = (parcial: Partial<BorradorRespuesta>): BorradorRespuesta => ({ ...respuestaVacia(), ...parcial });

describe('respuesta de una misión que carga la docente', () => {
  it('una entrega libre no necesita respuesta', () => {
    expect(validarBorrador(respuestaVacia())).toBeNull();
    expect(aDatosRespuesta(respuestaVacia())).toEqual({ tipoRespuesta: 'abierta', pistas: undefined, explicacion: undefined });
  });

  describe('número', () => {
    it('acepta números escritos de varias formas, separados por ;', () => {
      const b = con({ tipo: 'numero', respuestas: '3,5; 7/2 ; 1 1/2' });
      expect(validarBorrador(b)).toBeNull();
      expect(aDatosRespuesta(b)).toMatchObject({ tipoRespuesta: 'numero', respuestas: ['3,5', '7/2', '1 1/2'], tolerancia: 0 });
    });
    it('exige al menos una respuesta y que sean números', () => {
      expect(validarBorrador(con({ tipo: 'numero' }))).toMatch(/respuesta correcta/);
      expect(validarBorrador(con({ tipo: 'numero', respuestas: 'tres' }))).toMatch(/números/);
      expect(validarBorrador(con({ tipo: 'numero', respuestas: '3 4' }))).toMatch(/números/);
    });
    it('la tolerancia tiene que ser un número no negativo', () => {
      expect(validarBorrador(con({ tipo: 'numero', respuestas: '3', tolerancia: '0,05' }))).toBeNull();
      expect(aDatosRespuesta(con({ tipo: 'numero', respuestas: '3', tolerancia: '0,05' }))).toMatchObject({ tolerancia: 0.05 });
      expect(validarBorrador(con({ tipo: 'numero', respuestas: '3', tolerancia: '-1' }))).toMatch(/tolerancia/);
      expect(validarBorrador(con({ tipo: 'numero', respuestas: '3', tolerancia: 'mucha' }))).toMatch(/tolerancia/);
    });
  });

  describe('texto corto', () => {
    it('acepta varias formas válidas', () => {
      const b = con({ tipo: 'texto', respuestas: 'Córdoba; Provincia de Córdoba' });
      expect(validarBorrador(b)).toBeNull();
      expect(aDatosRespuesta(b)).toMatchObject({ tipoRespuesta: 'texto', respuestas: ['Córdoba', 'Provincia de Córdoba'] });
    });
    it('exige una respuesta con letras o números', () => {
      expect(validarBorrador(con({ tipo: 'texto', respuestas: ' ; ' }))).toMatch(/respuesta correcta/);
      expect(validarBorrador(con({ tipo: 'texto', respuestas: '!!!' }))).toMatch(/letras o números/);
    });
  });

  describe('opción múltiple', () => {
    it('arma los ids (a, b, c…) y marca la correcta', () => {
      const b = con({ tipo: 'opcion', opciones: ['Rosario', 'Córdoba', 'Salta'], correcta: 1 });
      expect(validarBorrador(b)).toBeNull();
      expect(aDatosRespuesta(b)).toMatchObject({
        tipoRespuesta: 'opcion',
        opciones: [{ id: 'a', texto: 'Rosario' }, { id: 'b', texto: 'Córdoba' }, { id: 'c', texto: 'Salta' }],
        respuestas: ['b'],
      });
    });
    it('exige entre 2 y 6 opciones completas y distintas, con una correcta', () => {
      expect(validarBorrador(con({ tipo: 'opcion', opciones: ['Sola'] }))).toMatch(/entre 2 y 6/);
      expect(validarBorrador(con({ tipo: 'opcion', opciones: Array(7).fill('x').map((x, i) => x + i) }))).toMatch(/entre 2 y 6/);
      expect(validarBorrador(con({ tipo: 'opcion', opciones: ['Una', ''] }))).toMatch(/Completá/);
      expect(validarBorrador(con({ tipo: 'opcion', opciones: ['Igual', ' igual '] }))).toMatch(/repetidas/);
      expect(validarBorrador(con({ tipo: 'opcion', opciones: ['Una', 'Otra'], correcta: 5 }))).toMatch(/correcta/);
    });
  });

  describe('pista y explicación', () => {
    it('son opcionales pero, si están, tienen entre 3 y 400 letras', () => {
      expect(validarBorrador(con({ pistas: ['Pensá en la mitad.', '', ''] }))).toBeNull();
      expect(validarBorrador(con({ pistas: ['', 'ab', ''] }))).toMatch(/pista/);
      expect(validarBorrador(con({ explicacion: 'x'.repeat(401) }))).toMatch(/explicación/);
    });
    it('viajan recortadas, y vacías no viajan', () => {
      expect(aDatosRespuesta(con({ pistas: ['  Pensá  ', '', 'Probá con un ejemplo'], explicacion: '   ' }))).toMatchObject({ pistas: ['Pensá', 'Probá con un ejemplo'], explicacion: undefined });
    });
  });

  describe('lo que propone la IA', () => {
    it('una opción múltiple sugerida llega con su opción correcta marcada y 3 pistas', () => {
      const b = desdeSugerida({
        tipoRespuesta: 'opcion', respuestas: ['b'], tolerancia: 0, explicacion: 'Porque sí.',
        opciones: [{ id: 'a', texto: 'Rosario' }, { id: 'b', texto: 'Córdoba' }],
        pistas: ['Pensá en el nombre de la provincia', 'Es la ciudad capital'],
      });
      expect(b).toMatchObject({ tipo: 'opcion', correcta: 1, opciones: ['Rosario', 'Córdoba'], explicacion: 'Porque sí.' });
      expect(b.pistas).toEqual(['Pensá en el nombre de la provincia', 'Es la ciudad capital', '']);
      expect(validarBorrador(b)).toBeNull();
    });

    it('un número sugerido llega como respuesta correcta y pasa la validación', () => {
      const b = desdeSugerida({ tipoRespuesta: 'numero', respuestas: ['8', '8,0'], tolerancia: 0, opciones: null, pistas: [], explicacion: null });
      expect(b).toMatchObject({ tipo: 'numero', respuestas: '8; 8,0' });
      expect(validarBorrador(b)).toBeNull();
    });

    it('sin propuesta queda una entrega libre vacía', () => {
      expect(desdeSugerida(null)).toEqual(respuestaVacia());
    });
  });
});
