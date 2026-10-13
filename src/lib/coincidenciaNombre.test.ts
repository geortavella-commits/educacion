import { describe, it, expect } from 'vitest';
import { buscarCoincidencias, normalizarNombre } from './coincidenciaNombre';

describe('coincidencia de nombres en un curso', () => {
  it('ignora mayúsculas, tildes y espacios de más', () => {
    expect(normalizarNombre('  VÍCO  ')).toBe('vico');
    expect(normalizarNombre('María  José')).toBe('maria jose');
  });

  it('encuentra al alumno ya inscripto con el mismo nombre', () => {
    const candidatos = [
      { id: 'a1', nombre: 'Vico', tipo: 'alumno' as const },
      { id: 'a2', nombre: 'Mateo', tipo: 'alumno' as const },
    ];
    expect(buscarCoincidencias('vico', candidatos)).toEqual([{ id: 'a1', nombre: 'Vico', tipo: 'alumno' }]);
  });

  it('también marca otro pedido pendiente con el mismo nombre', () => {
    const candidatos = [{ id: 'p9', nombre: 'Sofía', tipo: 'pedido' as const }];
    expect(buscarCoincidencias('SOFIA', candidatos)).toHaveLength(1);
  });

  it('no confunde nombres distintos ni parecidos', () => {
    const candidatos = [{ id: 'a1', nombre: 'Vicente', tipo: 'alumno' as const }];
    expect(buscarCoincidencias('Vico', candidatos)).toEqual([]);
  });

  it('sin nombre no hay coincidencias', () => {
    expect(buscarCoincidencias('   ', [{ id: 'a1', nombre: '', tipo: 'alumno' }])).toEqual([]);
  });
});
