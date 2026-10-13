import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModoProvider } from '../ModoProvider';

describe('ModoProvider', () => {
  it('aplica el atributo data-modo="primaria" cuando se pasa nivel="primaria"', () => {
    const { container } = render(
      <ModoProvider nivel="primaria">
        <div data-testid="contenido-test">Contenido de prueba</div>
      </ModoProvider>
    );

    const elemento = container.querySelector('[data-modo]');
    expect(elemento).not.toBeNull();
    expect(elemento?.getAttribute('data-modo')).toBe('primaria');
    expect(screen.getByTestId('contenido-test')).not.toBeNull();
  });

  it('aplica el atributo data-modo="secundaria" por defecto', () => {
    const { container } = render(
      <ModoProvider>
        <div>Contenido secundaria</div>
      </ModoProvider>
    );

    const elemento = container.querySelector('[data-modo]');
    expect(elemento).not.toBeNull();
    expect(elemento?.getAttribute('data-modo')).toBe('secundaria');
  });
});
