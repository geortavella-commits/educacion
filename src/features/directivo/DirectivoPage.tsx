import React from 'react';
import { Building2 } from 'lucide-react';

export const DirectivoPage: React.FC = () => {
  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text break-words">
          Panel de Dirección Escolar
        </h1>
        <p className="text-text/70 text-sm md:text-base mt-1 break-words">
          Visión panorámica de cursos, adopción de misiones y proyectos interdisciplinarios (Fase 2).
        </p>
      </div>

      <div className="p-4 md:p-5 bg-surface border-2 border-divider space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent-strong" aria-hidden="true" />
          <h2 className="text-base md:text-lg font-heading font-bold">
            Resumen institucional
          </h2>
        </div>
        <p className="text-xs md:text-sm text-text/80 break-words">
          Piloto Córdoba: 2 cursos activos (5º Grado Primaria y 3º Año Secundaria).
        </p>
      </div>
    </div>
  );
};
