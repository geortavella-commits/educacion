import { describe, it, expect } from 'vitest';
import { cantidadDeGrupos, hayDiferenciasDeAvance, resumenParaNombrar, sugerirGrupos, type AlumnoParaGrupos } from './sugerirGrupos';
import { nombreClasifica } from './nombreGrupo';

const etiqueta = (id: string) => ({ futbol: 'Fútbol', dibujo: 'Dibujo', musica: 'Música', cocina: 'Cocina' } as Record<string, string>)[id] ?? id;

const alumno = (n: number, intereses: string[], completadas: number): AlumnoParaGrupos => ({ id: `a${n}`, nombre: `Alumno${String(n).padStart(2, '0')}`, intereses, completadas });

// 12 chicos: 4 con fútbol, 4 con dibujo, 2 con cocina, 2 sin intereses; avance de 0 a 4
const CURSO: AlumnoParaGrupos[] = [
  alumno(1, ['futbol'], 4), alumno(2, ['futbol', 'dibujo'], 3), alumno(3, ['futbol'], 0), alumno(4, ['futbol'], 1),
  alumno(5, ['dibujo'], 2), alumno(6, ['dibujo'], 4), alumno(7, ['dibujo', 'musica'], 1), alumno(8, ['dibujo'], 0),
  alumno(9, ['cocina'], 2), alumno(10, ['cocina'], 3), alumno(11, [], 1), alumno(12, [], 4),
];

const opciones = (criterio: 'intereses' | 'mezcla' | 'ritmo', tamano = 4) => ({ criterio, tamano, totalMisiones: 4, etiquetaInteres: etiqueta });

function todosUnaVez(grupos: ReturnType<typeof sugerirGrupos>, alumnos: AlumnoParaGrupos[]) {
  const ids = grupos.flatMap((g) => g.alumnoIds).sort();
  expect(ids).toEqual(alumnos.map((a) => a.id).sort());
}

describe('sugerencias de grupos para la docente', () => {
  it('cantidad de grupos según el tamaño pedido', () => {
    expect(cantidadDeGrupos(12, 4)).toBe(3);
    expect(cantidadDeGrupos(10, 4)).toBe(3);
    expect(cantidadDeGrupos(2, 4)).toBe(1);
    expect(cantidadDeGrupos(0, 4)).toBe(0);
  });

  it('sin alumnos no hay sugerencias', () => {
    expect(sugerirGrupos([], opciones('intereses'))).toEqual([]);
  });

  describe('por intereses en común', () => {
    const grupos = sugerirGrupos(CURSO, opciones('intereses'));

    it('cada chico queda en exactamente un grupo', () => todosUnaVez(grupos, CURSO));

    it('los grupos por afinidad comparten de verdad el interés del que toman el nombre', () => {
      const futbol = grupos.find((g) => g.nombre === 'Equipo Fútbol')!;
      expect(futbol.alumnoIds.length).toBeGreaterThanOrEqual(2);
      for (const id of futbol.alumnoIds) expect(CURSO.find((a) => a.id === id)!.intereses).toContain('futbol');
      expect(futbol.explicacion).toContain('Fútbol');
    });

    it('los que no comparten nada se agrupan aparte, sin inventar una afinidad', () => {
      const mixto = grupos.find((g) => g.nombre.startsWith('Equipo mixto'));
      expect(mixto).toBeDefined();
      expect(mixto!.etiquetaInterna).toBe('Sin intereses en común');
    });

    it('ningún grupo supera el tamaño pedido', () => {
      for (const g of grupos) expect(g.alumnoIds.length).toBeLessThanOrEqual(4);
    });

    it('si nadie cargó intereses, lo dice y arma grupos mixtos', () => {
      const sinIntereses = CURSO.map((a) => ({ ...a, intereses: [] }));
      const r = sugerirGrupos(sinIntereses, opciones('intereses'));
      todosUnaVez(r, sinIntereses);
      expect(r.every((g) => g.explicacion.includes('nadie cargó'))).toBe(true);
    });

    it('si un interés lo comparten más chicos que el tamaño, arma varios grupos con numeración', () => {
      const muchos = Array.from({ length: 9 }, (_, i) => alumno(i + 1, ['futbol'], i));
      const r = sugerirGrupos(muchos, opciones('intereses', 4));
      todosUnaVez(r, muchos);
      expect(r.map((g) => g.nombre)).toContain('Equipo Fútbol');
      expect(r.map((g) => g.nombre)).toContain('Equipo Fútbol 2');
    });
  });

  describe('grupos variados (mezclar ritmos)', () => {
    const grupos = sugerirGrupos(CURSO, opciones('mezcla'));

    it('cada chico queda en exactamente un grupo y los tamaños son parejos', () => {
      todosUnaVez(grupos, CURSO);
      const tamanos = grupos.map((g) => g.alumnoIds.length);
      expect(Math.max(...tamanos) - Math.min(...tamanos)).toBeLessThanOrEqual(1);
    });

    it('cada grupo mezcla chicos de distinto avance (nadie queda en un grupo "de los que menos hicieron")', () => {
      for (const g of grupos) {
        const avances = g.alumnoIds.map((id) => CURSO.find((a) => a.id === id)!.completadas);
        expect(Math.max(...avances) - Math.min(...avances)).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('ritmo de avance parecido en este proyecto', () => {
    const grupos = sugerirGrupos(CURSO, opciones('ritmo'));

    it('cada chico queda en exactamente un grupo', () => todosUnaVez(grupos, CURSO));

    it('los grupos juntan avances parecidos y no se superponen', () => {
      const rangos = grupos.map((g) => {
        const av = g.alumnoIds.map((id) => CURSO.find((a) => a.id === id)!.completadas);
        return [Math.min(...av), Math.max(...av)];
      });
      rangos.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < rangos.length; i++) expect(rangos[i][0]).toBeGreaterThanOrEqual(rangos[i - 1][1]);
    });

    it('la explicación y la etiqueta interna dicen que es una foto de hoy, no una nota', () => {
      expect(grupos.every((g) => g.explicacion.includes('no es una nota ni un nivel'))).toBe(true);
      expect(grupos.every((g) => g.etiquetaInterna.startsWith('Ritmo parecido'))).toBe(true);
    });
  });

  describe('lo que ven los alumnos es siempre neutro (la plataforma no clasifica)', () => {
    it.each(['intereses', 'mezcla', 'ritmo'] as const)('el nombre de los grupos del criterio "%s" no clasifica ni revela el avance', (criterio) => {
      for (const g of sugerirGrupos(CURSO, opciones(criterio))) {
        expect(nombreClasifica(g.nombre)).toBe(false);
        expect(g.nombre).not.toMatch(/avanz|atras|retras|refuerzo|desaf|apoyo|lent|nivel/i);
        // el avance solo puede aparecer en lo que ve la docente
        expect(g.nombre).not.toMatch(/\d\s*(de|\/)\s*\d/);
      }
    });

    it('con ritmo, las letras no siguen el avance: "Equipo A" no es "el que más hizo" ni "el que menos hizo"', () => {
      // Si el nombre dependiera del avance, las letras saldrían SIEMPRE ordenadas por avance. Con varios cursos distintos
      // tiene que haber casos en que no lo estén.
      let desordenados = 0;
      for (let k = 0; k < 12; k++) {
        const curso = Array.from({ length: 12 }, (_, i) => alumno(i + 1 + k * 100, [], (i * 7 + k * 3) % 5));
        const g = sugerirGrupos(curso, opciones('ritmo'));
        const promedio = (x: (typeof g)[number]) => x.alumnoIds.reduce((sum, id) => sum + curso.find((a) => a.id === id)!.completadas, 0) / x.alumnoIds.length;
        const p = [...g].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(promedio);
        const ordenado = p.every((v, n) => n === 0 || v >= p[n - 1]) || p.every((v, n) => n === 0 || v <= p[n - 1]);
        if (!ordenado) desordenados++;
      }
      expect(desordenados).toBeGreaterThan(0);
    });
  });

  it('detecta si hay diferencias de avance', () => {
    expect(hayDiferenciasDeAvance(CURSO)).toBe(true);
    expect(hayDiferenciasDeAvance(CURSO.map((a) => ({ ...a, completadas: 0 })))).toBe(false);
  });

  it('con pocos chicos arma un solo grupo y no rompe', () => {
    const dos = [alumno(1, ['futbol'], 1), alumno(2, ['futbol'], 2)];
    for (const c of ['intereses', 'mezcla', 'ritmo'] as const) {
      const r = sugerirGrupos(dos, opciones(c));
      todosUnaVez(r, dos);
      expect(r).toHaveLength(1);
    }
  });

  describe('lo que se le cuenta a la IA para nombrar grupos (privacidad)', () => {
    it('solo viajan la clave, los temas que TODO el grupo comparte y la cantidad', () => {
      const grupos = sugerirGrupos(CURSO, opciones('intereses'));
      const r = resumenParaNombrar(grupos, CURSO);
      expect(r).toHaveLength(grupos.length);
      for (const x of r) expect(Object.keys(x).sort()).toEqual(['cantidad', 'clave', 'temas']);
      const futbol = r.find((x) => x.temas.includes('futbol'));
      expect(futbol?.cantidad).toBeGreaterThanOrEqual(2);
    });

    it('no contiene nombres ni ids de ningún chico', () => {
      const texto = JSON.stringify(resumenParaNombrar(sugerirGrupos(CURSO, opciones('ritmo')), CURSO));
      for (const a of CURSO) {
        expect(texto).not.toContain(a.nombre);
        expect(texto).not.toContain(`"${a.id}"`);
      }
    });

    it('un grupo armado por ritmo o mezcla (sin tema común) viaja sin temas', () => {
      const r = resumenParaNombrar(sugerirGrupos(CURSO.map((a) => ({ ...a, intereses: [] })), opciones('mezcla')), CURSO.map((a) => ({ ...a, intereses: [] })));
      expect(r.every((x) => x.temas.length === 0)).toBe(true);
    });
  });
});
