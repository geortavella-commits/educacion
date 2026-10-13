import { describe, it, expect } from 'vitest';
import { estaHabilitada, hoyEnCordoba } from '../../supabase/functions/_shared/semanas';

describe('semanas de un proyecto: cuándo se habilita cada misión', () => {
  it('sin fecha de inicio o sin etapa se ve siempre (como los proyectos de antes)', () => {
    expect(estaHabilitada(null, 3, '2026-01-01')).toBe(true);
    expect(estaHabilitada('2026-10-19', null, '2026-01-01')).toBe(true);
    expect(estaHabilitada(undefined, undefined)).toBe(true);
  });
  it('la semana 1 se habilita el día de inicio, y no antes', () => {
    expect(estaHabilitada('2026-10-19', 1, '2026-10-18')).toBe(false);
    expect(estaHabilitada('2026-10-19', 1, '2026-10-19')).toBe(true);
  });
  it('cada semana siguiente se habilita 7 días después', () => {
    expect(estaHabilitada('2026-10-19', 2, '2026-10-25')).toBe(false);
    expect(estaHabilitada('2026-10-19', 2, '2026-10-26')).toBe(true);
    expect(estaHabilitada('2026-10-19', 4, '2026-11-08')).toBe(false);
    expect(estaHabilitada('2026-10-19', 4, '2026-11-09')).toBe(true);
  });
  it('lo ya habilitado sigue habilitado', () => {
    expect(estaHabilitada('2026-10-19', 1, '2026-12-31')).toBe(true);
  });
  it('"hoy" se calcula con la hora de Córdoba (UTC-3), no la de UTC', () => {
    // 02:00 UTC del 20/10 son las 23:00 del 19/10 en Córdoba.
    expect(hoyEnCordoba(new Date('2026-10-20T02:00:00Z'))).toBe('2026-10-19');
    expect(hoyEnCordoba(new Date('2026-10-20T03:00:00Z'))).toBe('2026-10-20');
  });
});
