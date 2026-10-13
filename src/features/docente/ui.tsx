import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** Camino de migas: dice siempre dónde estás y deja volver a cualquier nivel. */
export const Migas: React.FC<{ pasos: { texto: string; to?: string }[] }> = ({ pasos }) => (
  <nav aria-label="Dónde estás" className="mb-1">
    <ol className="flex flex-wrap items-center gap-x-1 text-sm text-text/75">
      {pasos.map((p, i) => (
        <li key={`${p.texto}-${i}`} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
          {p.to ? (
            <Link to={p.to} className="inline-flex items-center min-h-[44px] font-bold text-accent-strong hover:underline">
              {p.texto}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-text break-words">
              {p.texto}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export const BarraAvance: React.FC<{ valor: number; etiqueta: string }> = ({ valor, etiqueta }) => (
  <div className="flex items-center gap-2 min-w-0">
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${etiqueta}: ${valor}%`}
      className="flex-1 h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-divider min-w-[60px]"
    >
      <div className="h-full bg-accent-strong rounded-full" style={{ width: `${valor}%` }} />
    </div>
    <span className="font-mono text-sm font-bold text-text shrink-0 w-10 text-right">{valor}%</span>
  </div>
);

/** Estado de un grupo con texto (nunca solo color). */
export const EtiquetaGrupo: React.FC<{ estado: 'borrador' | 'aprobado' }> = ({ estado }) => (
  <span
    className={
      estado === 'aprobado'
        ? 'inline-flex items-center px-2.5 py-1 text-xs font-heading font-bold rounded-full bg-accent-100 text-accent-900 border border-accent-300'
        : 'inline-flex items-center px-2.5 py-1 text-xs font-heading font-bold rounded-full bg-neutral-200 text-neutral-900 border border-divider'
    }
  >
    {estado === 'aprobado' ? 'Aprobado' : 'En borrador'}
  </span>
);

export const ETIQUETA_PROYECTO: Record<string, string> = {
  borrador: 'Borrador',
  activo: 'En curso',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
};
