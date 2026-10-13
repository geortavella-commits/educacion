import React, { useEffect, useState } from 'react';
import { docenteService, type EnfoquePropuesta, type PlanSugerido } from '@/services/docente';
import { mensajeErrorIA } from '@/lib/mensajesIA';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { CalendarRange } from 'lucide-react';

const ENFOQUES: { valor: EnfoquePropuesta; titulo: string }[] = [
  { valor: 'todos', titulo: 'Para todo el curso' },
  { valor: 'apoyo', titulo: 'Con más acompañamiento' },
  { valor: 'desafio', titulo: 'Con desafío extra' },
];

/**
 * Panel opcional de "Nuevo proyecto": la docente cuenta una idea y la IA propone un BORRADOR de planificación de 3 o 4 semanas
 * (etapas con objetivo, aprendizajes del Ministerio y misiones). Nada se guarda: el plan llena el formulario de abajo para que ella
 * lo corrija. Las misiones que propone son de entrega libre: la respuesta correcta, si hace falta, la carga ella.
 */
export const PlanificadorIA: React.FC<{
  cursoId: string;
  anio?: number;
  hayContenido: boolean;
  alPlanificar: (p: PlanSugerido) => void;
}> = ({ cursoId, anio, hayContenido, alPlanificar }) => {
  const [abierto, setAbierto] = useState(false);
  const [idea, setIdea] = useState('');
  const [semanas, setSemanas] = useState<3 | 4>(4);
  const [porSemana, setPorSemana] = useState(3);
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [intereses, setIntereses] = useState(true);
  const [enfoque, setEnfoque] = useState<EnfoquePropuesta>('todos');
  const [pensando, setPensando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [listo, setListo] = useState<{ descartadas: number; intereses: string[] } | null>(null);

  // Las materias con contenido del Ministerio para el año del curso.
  useEffect(() => {
    if (!abierto || !anio || anio < 1 || anio > 6) return;
    docenteService
      .obtenerContextoCurricular(anio)
      .then((c) => {
        const lista = c.materias.map((m) => ({ id: m.id, nombre: m.nombre }));
        setMaterias(lista);
        setElegidas((actual) => {
          const vigentes = actual.filter((id) => lista.some((m) => m.id === id));
          if (vigentes.length > 0) return vigentes;
          return lista.filter((m) => /matem|lengua/i.test(m.nombre)).map((m) => m.id).slice(0, 2);
        });
      })
      .catch(() => setMaterias([]));
  }, [abierto, anio]);

  const alternar = (id: string) => setElegidas((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 3 ? l : [...l, id]));

  const pedir = async () => {
    if (idea.trim().length < 3 || pensando || elegidas.length === 0) return;
    setPensando(true);
    setMensaje('');
    setListo(null);
    try {
      const p = await docenteService.planificarProyecto({ cursoId, idea: idea.trim(), semanas, misionesPorSemana: porSemana, areaIds: elegidas, usarIntereses: intereses, enfoque });
      alPlanificar(p);
      setListo({ descartadas: p.descartadas, intereses: p.interesesUsados });
    } catch (e) {
      setMensaje(mensajeErrorIA(e instanceof Error ? e.message : ''));
    } finally {
      setPensando(false);
    }
  };

  return (
    <section aria-labelledby="t-plan" className="p-4 bg-accent-100 border-2 border-accent-300 rounded-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="t-plan" className="font-heading font-extrabold text-lg flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-accent-strong" aria-hidden="true" />
          <span>¿Querés planificar varias semanas?</span>
        </h2>
        {!abierto && (
          <Button variant="secondary" size="sm" onClick={() => setAbierto(true)}>
            Planificar con la IA
          </Button>
        )}
      </div>
      <p className="text-sm text-text/80">
        Contás la idea y la IA propone un plan de 3 o 4 semanas con los aprendizajes del Ministerio. Las misiones se habilitan una semana por vez. Vos revisás y editás todo antes de guardar.
      </p>

      {abierto && (
        <div className="space-y-4">
          <Textarea label="¿Qué proyecto te gustaría hacer?" value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} maxLength={500} placeholder="Ej.: Una huerta en el patio: medir, comparar y registrar cómo crecen las plantas." />

          <div className="grid sm:grid-cols-2 gap-4">
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-heading font-semibold text-text/80">Duración</legend>
              <div className="flex gap-2">
                {([3, 4] as const).map((n) => (
                  <label key={n} className={`flex-1 min-h-[44px] px-3 flex items-center justify-center gap-2 border cursor-pointer text-sm font-heading font-bold ${semanas === n ? 'bg-text text-surface border-text' : 'bg-surface text-text border-divider'}`}>
                    <input type="radio" name="semanas-plan" checked={semanas === n} onChange={() => setSemanas(n)} className="sr-only" />
                    {n} semanas
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plan-por-semana" className="text-xs font-heading font-semibold text-text/80">
                Misiones por semana
              </label>
              <select id="plan-por-semana" value={porSemana} onChange={(e) => setPorSemana(Number(e.target.value))} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} misiones
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-xs font-heading font-semibold text-text/80">Materias que querés integrar (hasta 3)</legend>
            {materias.length === 0 ? (
              <p className="text-xs text-text/75">No hay contenidos del Ministerio cargados para este año.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {materias.map((m) => (
                  <label key={m.id} className={`min-h-[44px] px-3 flex items-center border cursor-pointer text-sm font-heading font-bold ${elegidas.includes(m.id) ? 'bg-text text-surface border-text' : 'bg-surface text-text border-divider'}`}>
                    <input type="checkbox" checked={elegidas.includes(m.id)} onChange={() => alternar(m.id)} className="sr-only" />
                    {m.nombre}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plan-enfoque" className="text-xs font-heading font-semibold text-text/80">
                Enfoque
              </label>
              <select id="plan-enfoque" value={enfoque} onChange={(e) => setEnfoque(e.target.value as EnfoquePropuesta)} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                {ENFOQUES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.titulo}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-start gap-3 min-h-[44px] cursor-pointer self-end pb-2">
              <input type="checkbox" checked={intereses} onChange={(e) => setIntereses(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[var(--color-accent-strong)] shrink-0" />
              <span className="text-sm">Usar los intereses más comunes del curso para los ejemplos (sin nombrar a nadie).</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" onClick={pedir} disabled={pensando || idea.trim().length < 3 || elegidas.length === 0}>
              {pensando ? 'Armando el plan… (puede tardar unos segundos)' : 'Armar el plan'}
            </Button>
            {hayContenido && <span className="text-xs text-text/75">Va a reemplazar lo que ya cargaste en el formulario.</span>}
          </div>

          <div aria-live="polite">
            {mensaje && (
              <p role="alert" className="p-3 bg-surface border border-accent-300 text-sm font-semibold">
                {mensaje}
              </p>
            )}
            {listo && (
              <p role="status" className="p-3 bg-surface border border-divider text-sm">
                Listo: abajo está el borrador del plan. Revisalo y editalo antes de guardar.
                {listo.intereses.length > 0 && <span> Usamos los intereses más comunes del curso.</span>}
                {listo.descartadas > 0 && <span> {listo.descartadas === 1 ? 'Se descartó una propuesta' : `Se descartaron ${listo.descartadas} propuestas`} que no cumplían las reglas de la plataforma.</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
