import { describe, it, expect } from 'vitest';
import { esRespuestaCorrecta, normalizarTexto, parsearNumero, respuestaConFormatoValido } from '../../supabase/functions/_shared/respuestas';

describe('números como los escriben los chicos en Argentina', () => {
  it.each([
    ['3,5', 3.5],
    ['3.5', 3.5],
    ['  12 ', 12],
    ['-4', -4],
    ['1.000', 1000],
    ['12.345.678', 12345678],
    ['1.234,5', 1234.5],
    ['0,25', 0.25],
    ['7/2', 3.5],
    ['1/4', 0.25],
    ['1 1/2', 1.5],
    ['-1 1/2', -1.5],
    ['3,5/2', 1.75],
  ])('"%s" vale %s', (texto, esperado) => {
    expect(parsearNumero(texto)).toBeCloseTo(esperado, 9);
  });

  it.each(['', 'abc', '3,5,2', '1/0', '1..5', '3 4', '--3', '50%', '1e5', 'tres', '1/', '/2', 'x'.repeat(50)])('"%s" no es un número', (texto) => {
    expect(parsearNumero(texto)).toBeNull();
  });

  it('un número con punto y tres decimales se lee como miles (convención argentina)', () => {
    expect(parsearNumero('1.500')).toBe(1500);
  });
});

describe('textos cortos', () => {
  it('ignora mayúsculas, tildes, puntuación y espacios de más', () => {
    expect(normalizarTexto('  ¡CÓRDOBA!  ')).toBe('cordoba');
    expect(normalizarTexto('San   Martín.')).toBe('san martin');
  });
});

describe('corrección de respuestas', () => {
  describe('número', () => {
    it('acepta la misma cantidad escrita de distintas formas', () => {
      expect(esRespuestaCorrecta('numero', '3,5', ['7/2'])).toBe(true);
      expect(esRespuestaCorrecta('numero', '7/2', ['3.5'])).toBe(true);
      expect(esRespuestaCorrecta('numero', '1 1/2', ['1,5'])).toBe(true);
      expect(esRespuestaCorrecta('numero', '1.000', ['1000'])).toBe(true);
    });

    it('rechaza un número distinto, texto o vacío', () => {
      expect(esRespuestaCorrecta('numero', '3,6', ['3,5'])).toBe(false);
      expect(esRespuestaCorrecta('numero', 'tres', ['3'])).toBe(false);
      expect(esRespuestaCorrecta('numero', '', ['3'])).toBe(false);
    });

    it('con tolerancia acepta valores cercanos y no más', () => {
      expect(esRespuestaCorrecta('numero', '3,48', ['3,5'], 0.05)).toBe(true);
      expect(esRespuestaCorrecta('numero', '3,40', ['3,5'], 0.05)).toBe(false);
    });

    it('acepta cualquiera de varias respuestas válidas', () => {
      expect(esRespuestaCorrecta('numero', '4', ['3', '4'])).toBe(true);
    });

    it('0,1 + 0,2 no falla por errores de redondeo', () => {
      expect(esRespuestaCorrecta('numero', '0,3', ['0,1+0,2'].map(() => '0,3'))).toBe(true);
      expect(esRespuestaCorrecta('numero', '1/3', ['0,333333333333'], 1e-6)).toBe(true);
    });
  });

  describe('texto corto', () => {
    it('compara sin importar tildes, mayúsculas ni puntuación', () => {
      expect(esRespuestaCorrecta('texto', 'cordoba', ['Córdoba'])).toBe(true);
      expect(esRespuestaCorrecta('texto', ' CÓRDOBA. ', ['Córdoba'])).toBe(true);
    });
    it('rechaza otra palabra y no acepta "contiene"', () => {
      expect(esRespuestaCorrecta('texto', 'Córdoba capital', ['Córdoba'])).toBe(false);
      expect(esRespuestaCorrecta('texto', 'Rosario', ['Córdoba'])).toBe(false);
      expect(esRespuestaCorrecta('texto', '...', ['Córdoba'])).toBe(false);
    });
    it('acepta varias formas válidas', () => {
      expect(esRespuestaCorrecta('texto', 'el sol', ['sol', 'el sol'])).toBe(true);
    });
  });

  describe('opción múltiple', () => {
    it('solo la opción correcta (por id) es correcta', () => {
      expect(esRespuestaCorrecta('opcion', 'b', ['b'])).toBe(true);
      expect(esRespuestaCorrecta('opcion', 'a', ['b'])).toBe(false);
      expect(esRespuestaCorrecta('opcion', 'B', ['b'])).toBe(false);
    });
    it('sin una única opción correcta configurada, nada es correcto', () => {
      expect(esRespuestaCorrecta('opcion', 'a', [])).toBe(false);
      expect(esRespuestaCorrecta('opcion', 'a', ['a', 'b'])).toBe(false);
    });
  });

  it('una misión abierta no se corrige', () => {
    expect(esRespuestaCorrecta('abierta', 'cualquier cosa', [])).toBeNull();
  });
});

describe('formato de la respuesta (si no se puede comparar, no cuenta como intento)', () => {
  const opciones = [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos' }];
  it('número: tiene que ser un número', () => {
    expect(respuestaConFormatoValido('numero', '3,5', null)).toBe(true);
    expect(respuestaConFormatoValido('numero', 'tres', null)).toBe(false);
  });
  it('texto: no vacío y corto', () => {
    expect(respuestaConFormatoValido('texto', 'sol', null)).toBe(true);
    expect(respuestaConFormatoValido('texto', '!!!', null)).toBe(false);
    expect(respuestaConFormatoValido('texto', 'x'.repeat(201), null)).toBe(false);
  });
  it('opción: tiene que ser una de las opciones', () => {
    expect(respuestaConFormatoValido('opcion', 'a', opciones)).toBe(true);
    expect(respuestaConFormatoValido('opcion', 'z', opciones)).toBe(false);
    expect(respuestaConFormatoValido('opcion', 'a', null)).toBe(false);
  });
  it('abierta: entre 1 y 2000 caracteres', () => {
    expect(respuestaConFormatoValido('abierta', 'Mi respuesta', null)).toBe(true);
    expect(respuestaConFormatoValido('abierta', '', null)).toBe(false);
    expect(respuestaConFormatoValido('abierta', 'x'.repeat(2001), null)).toBe(false);
  });
});
