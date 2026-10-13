import React, { useState } from 'react';
import { docenteService, type EnfoquePropuesta, type ProyectoSugerido } from '@/services/docente';
import { mensajeErrorIA } from '@/lib/mensajesIA';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { Sparkles } from 'lucide-react';

const OPCIONES_ENFOQUE: { valor: EnfoquePropuesta; titulo: string; ayuda: string }[] = [
  { valor: 'todos', titulo: 'Para todo el curso', ayuda: 'Una propuesta común que puede hacer cualquier chico.' },
  { valor: 'apoyo', titulo: 'Con más acompañamiento', ayuda: 'El mismo contenido, con pasos más cortos, preguntas guía y pistas para empezar.' },
  { valor: 'desafio', titulo: 'Con desafío extra', ayuda: 'El mismo contenido, más abierto: invita a justificar, comparar o crear.' },
];

/**
 * Panel opcional de "Nuevo proyecto": la docente cuenta una idea y la IA propone un BORRADOR (título, descripción y
 * misiones). Nada se guarda: la propuesta llena el formulario de abajo para que ella la corrija. Ella decide todo.
 */
export const AyudaIAProyecto: React.FC<{
  cursoId: string;
  hayContenido: boolean;
  alSugerir: (s: ProyectoSugerido) => void;
}> = ({ cursoId, hayContenido, alSugerir }) => {
  const [abierto, setAbierto] = useState(false);
  const [idea, setIdea] = useState('');
  const [cantidad, setCantidad] = useState(4);
  const [intereses, setIntereses] = useState(true);
  const [enfoque, setEnfoque] = useState<EnfoquePropuesta>('todos');
  const [pensando, setPensando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [listo, setListo] = useState<{ intereses: string[]; descartadas: number } | null>(null);

  const pedir = async () => {
    if (idea.trim().length < 3 || pensando) return;
    setPensando(true);
    setMensaje('');
    setListo(null);
    try {
      const s = await docenteService.sugerirProyecto({ cursoId, idea: idea.trim(), cantidad, usarIntereses: intereses, enfoque });
      alSugerir(s);
      setListo({ intereses: s.interesesUsados, descartadas: s.descartadas });
    } catch (e) {
      setMensaje(mensajeErrorIA(e instanceof Error ? e.message : ''));
    } finally {
      setPensando(false);
    }
  };

  return (
    <section aria-labelledby="t-ia" className="p-4 bg-accent-100 border-2 border-accent-300 rounded-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="t-ia" className="font-heading font-extrabold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-strong" aria-hidden="true" />
          <span>¿Querés una idea de punto de partida?</span>
        </h2>
        {!abierto && (
          <Button variant="secondary" size="sm" onClick={() => setAbierto(true)}>
            Pedir ayuda a la IA
          </Button>
        )}
      </div>

      {!abierto ? (
        <p className="text-sm text-text/80">
          Contás la idea en una frase y la IA te arma un <strong>borrador</strong> con misiones. Vos lo revisás, lo cambiás y decidís.
        </p>
      ) : (
        <div className="space-y-3">
          <Textarea
            label="Contale la idea en una o dos frases"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ej.: Armar una huerta en el patio y medir cómo crecen las plantas."
            hint={`${idea.length}/500`}
          />
          <fieldset className="space-y-2">
            <legend className="text-xs font-heading font-semibold text-text/80">¿Cómo querés pensar la propuesta?</legend>
            {OPCIONES_ENFOQUE.map((o) => (
              <label
                key={o.valor}
                className={`flex items-start gap-3 p-3 border-2 cursor-pointer min-h-[44px] ${enfoque === o.valor ? 'border-accent-strong bg-surface' : 'border-divider bg-surface/60'}`}
              >
                <input type="radio" name="enfoque-ia" value={o.valor} checked={enfoque === o.valor} onChange={() => setEnfoque(o.valor)} className="mt-1 w-5 h-5 accent-[var(--color-accent-strong)] shrink-0" />
                <span className="text-sm">
                  <strong>{o.titulo}</strong>
                  <span className="block text-text/75">{o.ayuda}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-text/75">
              Esto cambia <strong>cómo se propone la actividad</strong>, no etiqueta a ningún chico. No se guarda ni lo ven los alumnos o las familias: vos decidís quién hace cada versión.
            </p>
          </fieldset>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1.5 sm:w-48">
              <label htmlFor="cantidad-misiones" className="text-xs font-heading font-semibold text-text/80">Cantidad de misiones</label>
              <select
                id="cantidad-misiones"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm"
              >
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <label className="flex gap-2 text-sm cursor-pointer min-h-[44px] items-center">
              <input type="checkbox" checked={intereses} onChange={(e) => setIntereses(e.target.checked)} className="w-5 h-5 accent-[var(--color-accent-strong)] shrink-0" />
              <span>Tener en cuenta los intereses más comunes del curso <span className="text-text/70">(solo datos agrupados, sin nombres)</span></span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={pedir} disabled={idea.trim().length < 3 || pensando} isLoading={pensando}>
              {pensando ? 'Pensando…' : 'Sugerir proyecto'}
            </Button>
            <Button variant="secondary" onClick={() => setAbierto(false)} disabled={pensando}>
              Cerrar
            </Button>
          </div>
          {hayContenido && <p className="text-xs text-text/75">Si ya escribiste algo abajo, la sugerencia lo reemplaza.</p>}

          {mensaje && <p role="alert" className="p-3 bg-surface border border-accent-300 text-sm font-semibold">{mensaje}</p>}
          {listo && (
            <p role="status" className="p-3 bg-surface border border-accent-300 text-sm">
              <strong>Listo: te dejé un borrador más abajo.</strong> Es una sugerencia de la IA y puede tener errores: revisalo y cambiá lo que quieras antes de guardarlo.
              {listo.intereses.length > 0 ? ` Tuve en cuenta los intereses más comunes del curso (${listo.intereses.join(', ')}).` : ''}
              {listo.descartadas > 0 ? ` Descarté ${listo.descartadas} ${listo.descartadas === 1 ? 'misión' : 'misiones'} que no cumplían las reglas de la plataforma (por ejemplo, hablaban de notas o comparaban chicos): podés agregar las tuyas.` : ''}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
