import React, { useEffect, useMemo, useState } from 'react';
import { docenteService, type ContextoCurricular as Contexto } from '@/services/docente';
import { ErrorState, LoadingSkeleton } from '@/components/States';
import { BookOpen, ChevronDown, Info } from 'lucide-react';

const GRADOS = [1, 2, 3, 4, 5, 6];

/**
 * Referencia curricular por grado (Metas → Aprendizajes y contenidos → Indicadores de logro, del Ministerio de Córdoba).
 * Es solo lectura y orienta a la docente al armar grupos y proyectos; no califica ni clasifica a nadie.
 */
export const ContextoCurricular: React.FC<{ gradoInicial?: number }> = ({ gradoInicial }) => {
  const [abierto, setAbierto] = useState(false);
  const [grado, setGrado] = useState(gradoInicial && gradoInicial >= 1 && gradoInicial <= 6 ? gradoInicial : 5);
  const [ctx, setCtx] = useState<Contexto | null>(null);
  const [materiaId, setMateriaId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (gradoInicial && gradoInicial >= 1 && gradoInicial <= 6) setGrado(gradoInicial);
  }, [gradoInicial]);

  const cargar = () => {
    setCargando(true);
    setError(false);
    docenteService
      .obtenerContextoCurricular(grado)
      .then((c) => {
        setCtx(c);
        setMateriaId((actual) => (c.materias.some((m) => m.id === actual) ? actual : (c.materias[0]?.id ?? '')));
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, grado]); // eslint-disable-line react-hooks/exhaustive-deps

  const materia = useMemo(() => ctx?.materias.find((m) => m.id === materiaId), [ctx, materiaId]);

  return (
    <section aria-labelledby="ctx-curricular" className="bg-surface border border-divider min-w-0">
      <h2 id="ctx-curricular" className="m-0">
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-controls="ctx-curricular-panel"
          className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2 font-heading font-extrabold text-text">
            <BookOpen className="w-5 h-5 text-accent-strong shrink-0" aria-hidden="true" />
            Contexto curricular por grado
          </span>
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h2>

      {abierto && (
        <div id="ctx-curricular-panel" className="px-4 pb-4 space-y-4 border-t border-divider pt-4">
          <div className="flex flex-col gap-1.5 max-w-xs">
            <label htmlFor="ctx-grado" className="text-xs font-heading font-semibold text-text/80">
              Grado
            </label>
            <select id="ctx-grado" value={grado} onChange={(e) => setGrado(Number(e.target.value))} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
              {GRADOS.map((g) => (
                <option key={g} value={g}>
                  {g}.º grado
                </option>
              ))}
            </select>
          </div>

          {cargando && <LoadingSkeleton type="row" count={3} />}
          {error && !cargando && <ErrorState title="No pudimos cargar el contexto curricular" message="Revisá tu conexión y reintentá." onRetry={cargar} />}

          {!cargando && !error && ctx && (
            <>
              <p className="flex items-start gap-2 text-xs text-text/80 bg-neutral-100 border border-divider p-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {ctx.validada ? 'Referencia validada.' : 'Referencia oficial del Ministerio (versión en consulta 2025), todavía sin validar por la escuela.'} Orienta la planificación; la evaluación y las decisiones son siempre tuyas.
                </span>
              </p>

              {ctx.materias.length === 0 ? (
                <p className="text-sm text-text/75">Todavía no hay contenidos cargados para este grado.</p>
              ) : (
                <>
                  <div role="group" aria-label="Materia" className="flex flex-wrap gap-2">
                    {ctx.materias.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMateriaId(m.id)}
                        aria-pressed={materiaId === m.id}
                        className={`min-h-[44px] px-3 text-sm font-heading font-bold border cursor-pointer ${materiaId === m.id ? 'bg-text text-surface border-text' : 'bg-surface text-text border-divider hover:border-text'}`}
                      >
                        {m.nombre}
                      </button>
                    ))}
                  </div>

                  {materia && (
                    <div className="space-y-5">
                      {materia.metas.map((meta) => {
                        const deLaMeta = materia.aprendizajes.filter((a) => a.metaId === meta.id);
                        if (deLaMeta.length === 0) return null;
                        return (
                          <div key={meta.id} className="space-y-2 min-w-0">
                            <p className="text-sm font-heading font-extrabold text-text break-words">
                              <span className="text-xs font-semibold text-text/70 block">Meta del ciclo ({meta.ciclo})</span>
                              {meta.texto}
                            </p>
                            <ul className="space-y-2">
                              {deLaMeta.map((a) => (
                                <li key={a.id} className="border border-divider bg-neutral-100 min-w-0">
                                  <details>
                                    <summary className="px-3 py-2.5 min-h-[44px] text-sm text-text cursor-pointer break-words">{a.descripcion}</summary>
                                    {a.indicadores.length > 0 && (
                                      <div className="px-3 pb-3">
                                        <p className="text-xs font-heading font-bold text-text/75 mb-1">Indicadores de logro</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-text">
                                          {a.indicadores.map((t, i) => (
                                            <li key={i} className="break-words">
                                              {t}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </details>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};
