import React, { useMemo, useState } from 'react';
import type { ContenidoElegible } from '@/services/docente';
import { buscarAprendizajes } from '@/lib/buscarAprendizajes';
import { Button } from '@/components/Button';
import { Search, X } from 'lucide-react';

const PAGINA = 8;

/**
 * Elegir qué aprendizajes del grado cubre el proyecto. Son cientos: se ven los ya elegidos como fichas y el resto se busca
 * (por palabra, sin tildes, con plurales) o se filtra por materia.
 */
export const SelectorContenidos: React.FC<{
  contenidos: ContenidoElegible[];
  elegidos: string[];
  alCambiar: (ids: string[]) => void;
}> = ({ contenidos, elegidos, alCambiar }) => {
  const [consulta, setConsulta] = useState('');
  const [materia, setMateria] = useState('');
  const [limite, setLimite] = useState(PAGINA);

  const materias = useMemo(() => [...new Set(contenidos.map((c) => c.area))].sort((a, b) => a.localeCompare(b, 'es')), [contenidos]);
  const buscables = useMemo(() => contenidos.map((c) => ({ ...c, materia: c.area, indicadores: [] as string[] })), [contenidos]);
  const elegidosDetalle = elegidos.map((id) => contenidos.find((c) => c.id === id)).filter((c): c is ContenidoElegible => !!c);

  const resultados = useMemo(() => {
    const base = materia ? buscables.filter((c) => c.area === materia) : buscables;
    return buscarAprendizajes(base, consulta);
  }, [buscables, consulta, materia]);
  const buscando = consulta.trim().length > 0 || materia !== '';
  const alternar = (id: string) => alCambiar(elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-heading font-extrabold text-text mb-2">Elegidos ({elegidos.length})</h3>
        {elegidosDetalle.length === 0 ? (
          <p className="text-sm text-text/75">Todavía no elegiste ninguno. Es opcional: te sirve para ver después qué parte del año ya trabajaste.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {elegidosDetalle.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 p-2.5 bg-neutral-100 border border-divider min-w-0">
                <span className="text-sm break-words min-w-0">
                  <span className="text-xs font-heading font-extrabold px-2 py-0.5 border border-divider bg-surface mr-2">{c.area}</span>
                  {c.descripcion}
                </span>
                <button type="button" onClick={() => alternar(c.id)} aria-label={`Quitar: ${c.descripcion}`} className="w-11 h-11 -my-1 shrink-0 flex items-center justify-center text-text/70 hover:text-text cursor-pointer">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-divider pt-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="buscar-contenido" className="text-xs font-heading font-semibold text-text/80">
              Buscá un aprendizaje
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text/60" aria-hidden="true" />
              <input
                id="buscar-contenido"
                type="search"
                value={consulta}
                onChange={(e) => { setConsulta(e.target.value); setLimite(PAGINA); }}
                placeholder="Ej.: fracciones, medición, textos de opinión…"
                className="w-full min-h-[44px] pl-9 pr-3 bg-surface text-text border border-divider rounded-md text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="materia-contenido" className="text-xs font-heading font-semibold text-text/80">
              Materia
            </label>
            <select id="materia-contenido" value={materia} onChange={(e) => { setMateria(e.target.value); setLimite(PAGINA); }} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
              <option value="">Todas</option>
              {materias.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p role="status" className="text-sm text-text/80">
          {contenidos.length === 0
            ? 'Todavía no hay contenidos cargados para este año.'
            : buscando
              ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`
              : `Hay ${contenidos.length} aprendizajes en este grado. Buscá por palabra o elegí una materia.`}
        </p>

        {buscando && resultados.length > 0 && (
          <ul className="space-y-1.5">
            {resultados.slice(0, limite).map((c) => (
              <li key={c.id}>
                <label className="flex items-start gap-3 p-2.5 bg-surface border border-divider rounded-md cursor-pointer min-h-[44px] hover:border-accent-strong">
                  <input type="checkbox" checked={elegidos.includes(c.id)} onChange={() => alternar(c.id)} className="w-5 h-5 mt-0.5 accent-[var(--color-accent-strong)] shrink-0" />
                  <span className="text-sm break-words min-w-0">
                    <span className="text-xs font-heading font-extrabold px-2 py-0.5 border border-divider bg-neutral-100 mr-2">{c.area}</span>
                    {c.descripcion}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {buscando && resultados.length > limite && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setLimite((l) => l + PAGINA)}>
            Mostrar más ({resultados.length - limite} restantes)
          </Button>
        )}
      </div>
    </div>
  );
};
