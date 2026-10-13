import React from 'react';
import { ETIQUETAS_TIPO, type BorradorRespuesta, type TipoRespuestaForm } from '@/lib/borradorRespuesta';
import { Input, Textarea } from '@/components/Input';
import { Plus, Trash2 } from 'lucide-react';

const TIPOS: TipoRespuestaForm[] = ['abierta', 'numero', 'texto', 'opcion'];

const AYUDA_TIPO: Record<TipoRespuestaForm, string> = {
  abierta: 'El alumno escribe lo que piensa y lo entrega. No se corrige solo: lo leés vos.',
  numero: 'El alumno escribe un número y el sistema lo compara con tu respuesta. Acepta 3,5 o 3.5 o 7/2.',
  texto: 'El alumno escribe una palabra o frase corta. No distingue mayúsculas, tildes ni puntuación.',
  opcion: 'El alumno elige una opción entre las que cargues (de 2 a 6). Marcá cuál es la correcta.',
};

/**
 * Cómo se responde una misión y cuál es la respuesta correcta. La respuesta correcta, la pista y la explicación las lee
 * únicamente la docente: el alumno nunca las recibe en su pantalla; las compara el servidor.
 */
export const CamposRespuesta: React.FC<{
  idBase: string;
  valor: BorradorRespuesta;
  alCambiar: (nuevo: BorradorRespuesta) => void;
  error?: string | null;
}> = ({ idBase, valor, alCambiar, error }) => {
  const cambiar = (parcial: Partial<BorradorRespuesta>) => alCambiar({ ...valor, ...parcial });
  const cambiarOpcion = (i: number, texto: string) => cambiar({ opciones: valor.opciones.map((o, n) => (n === i ? texto : o)) });
  const quitarOpcion = (i: number) =>
    cambiar({ opciones: valor.opciones.filter((_, n) => n !== i), correcta: valor.correcta === i ? 0 : valor.correcta > i ? valor.correcta - 1 : valor.correcta });

  return (
    <fieldset className="space-y-3 p-3 bg-neutral-100 border border-divider min-w-0">
      <legend className="px-1 text-xs font-heading font-extrabold text-text/80">¿Cómo responde el alumno?</legend>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idBase}-tipo`} className="text-xs font-heading font-semibold text-text/80">
          Tipo de respuesta
        </label>
        <select id={`${idBase}-tipo`} value={valor.tipo} onChange={(e) => cambiar({ tipo: e.target.value as TipoRespuestaForm })} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {ETIQUETAS_TIPO[t]}
            </option>
          ))}
        </select>
        <p className="text-xs text-text/75">{AYUDA_TIPO[valor.tipo]}</p>
      </div>

      {(valor.tipo === 'numero' || valor.tipo === 'texto') && (
        <Input
          label={valor.tipo === 'numero' ? 'Respuesta correcta' : 'Respuesta correcta (si hay varias formas válidas, separalas con ;)'}
          value={valor.respuestas}
          onChange={(e) => cambiar({ respuestas: e.target.value })}
          maxLength={200}
          placeholder={valor.tipo === 'numero' ? 'Ej.: 3,5   (también podés cargar 7/2 ; 1 1/2)' : 'Ej.: Córdoba ; Provincia de Córdoba'}
          hint="El alumno no ve esta respuesta: la compara el sistema."
        />
      )}

      {valor.tipo === 'numero' && (
        <Input label="Tolerancia (opcional)" value={valor.tolerancia} onChange={(e) => cambiar({ tolerancia: e.target.value })} maxLength={10} placeholder="0" hint="Cuánto se puede alejar del valor y seguir siendo correcto. Vacío = exacto." />
      )}

      {valor.tipo === 'opcion' && (
        <div className="space-y-2">
          <p className="text-xs font-heading font-semibold text-text/80">Opciones (elegí con el círculo cuál es la correcta)</p>
          <ul className="space-y-2">
            {valor.opciones.map((texto, i) => (
              <li key={i} className="flex items-center gap-2 min-w-0">
                <input
                  type="radio"
                  name={`${idBase}-correcta`}
                  checked={valor.correcta === i}
                  onChange={() => cambiar({ correcta: i })}
                  aria-label={`La opción ${i + 1} es la correcta`}
                  className="w-5 h-5 shrink-0 accent-[var(--color-accent-strong)]"
                />
                <div className="flex-1 min-w-0">
                  <Input label={`Opción ${i + 1}`} value={texto} onChange={(e) => cambiarOpcion(i, e.target.value)} maxLength={100} />
                </div>
                {valor.opciones.length > 2 && (
                  <button type="button" onClick={() => quitarOpcion(i)} aria-label={`Quitar la opción ${i + 1}`} className="w-11 h-11 mt-5 shrink-0 flex items-center justify-center text-text/70 hover:text-text">
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {valor.opciones.length < 6 && (
            <button type="button" onClick={() => cambiar({ opciones: [...valor.opciones, ''] })} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-heading font-bold text-accent-strong border border-divider bg-surface hover:border-accent-strong">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Agregar opción</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-heading font-semibold text-text/80">Pistas (opcional: hasta 3, de menos a más ayuda)</p>
        {[0, 1, 2].map((n) => (
          <Textarea
            key={n}
            label={`Pista ${n + 1}${n === 0 ? ': orienta qué mirar' : n === 1 ? ': acota el camino' : ': ayuda casi todo, sin dar la respuesta'}`}
            value={valor.pistas[n] ?? ''}
            onChange={(e) => cambiar({ pistas: [0, 1, 2].map((i) => (i === n ? e.target.value : valor.pistas[i] ?? '')) })}
            maxLength={400}
            rows={2}
            hint={n === 0 ? 'El alumno las ve de a una, solo si las pide.' : undefined}
          />
        ))}
      </div>
      <Textarea label="Explicación al acertar (opcional)" value={valor.explicacion} onChange={(e) => cambiar({ explicacion: e.target.value })} maxLength={400} rows={2} placeholder="Una frase corta que se muestra cuando acierta." />

      {error && (
        <p role="alert" className="text-xs text-accent-strong font-semibold">
          {error}
        </p>
      )}
    </fieldset>
  );
};
