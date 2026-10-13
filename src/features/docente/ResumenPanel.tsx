import React from 'react';
import { Link } from 'react-router-dom';
import type { GrupoLista, ProyectoGestionItem } from '@/services/docente';
import { BarraAvance, ETIQUETA_PROYECTO } from './ui';
import { ArrowRight } from 'lucide-react';

const MAX = 5;

/** Panel de inicio: los proyectos y los grupos de la docente, cada uno con su avance. */
export const ResumenPanel: React.FC<{ proyectos: ProyectoGestionItem[]; grupos: GrupoLista[] }> = ({ proyectos: todosLosProyectos, grupos: todosLosGrupos }) => {
  // El inicio muestra solo lo que se está trabajando: los terminados, anulados y borradores se ven en Proyectos.
  const proyectos = todosLosProyectos.filter((p) => p.estado === 'activo');
  const idsEnCurso = new Set(proyectos.map((p) => p.id));
  const grupos = todosLosGrupos.filter((g) => !g.proyectoId || idsEnCurso.has(g.proyectoId));
  const gruposOrdenados = grupos;
  return (
    <div className="lg:col-span-5 flex flex-col gap-6 min-w-0">
      <section aria-labelledby="panel-proyectos" className="bg-surface border-2 border-divider rounded-xl p-5 space-y-3 shadow-sm min-w-0">
        <h2 id="panel-proyectos" className="text-xl font-heading font-extrabold text-text">Mis proyectos · avance</h2>
        {proyectos.length === 0 ? (
          <p className="text-sm text-text/75">{todosLosProyectos.length > 0 ? 'No tenés proyectos en curso. Mirá tus borradores y los terminados en Proyectos.' : 'Todavía no tenés proyectos. Creá el primero con “Crear proyecto”.'}</p>
        ) : (
          <ul className="divide-y-2 divide-divider">
            {proyectos.slice(0, MAX).map((p) => (
              <li key={p.id}>
                <Link to={`/docente/proyectos/${p.id}`} className="block py-3 min-h-[44px] hover:bg-neutral-100 -mx-2 px-2 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-heading font-bold text-text break-words">{p.titulo}</span>
                    <span className="text-xs text-text/70">{p.curso} · {ETIQUETA_PROYECTO[p.estado] ?? p.estado}</span>
                  </div>
                  <BarraAvance valor={p.avance} etiqueta={`Avance de ${p.titulo}`} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/docente/proyectos" className="inline-flex items-center gap-1 min-h-[44px] text-sm font-heading font-bold text-accent-strong hover:underline">
          Ver todos los proyectos <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="panel-grupos" className="bg-surface border-2 border-divider rounded-xl p-5 space-y-3 shadow-sm min-w-0">
        <h2 id="panel-grupos" className="text-xl font-heading font-extrabold text-text">Mis grupos · avance</h2>
        {gruposOrdenados.length === 0 ? (
          <p className="text-sm text-text/75">Todavía no armaste grupos. Un proyecto abarca a todo el curso; los grupos son opcionales.</p>
        ) : (
          <ul className="divide-y-2 divide-divider">
            {gruposOrdenados.slice(0, MAX).map((g) => (
              <li key={g.id}>
                <Link to={`/docente/grupos/${g.id}`} className="block py-3 min-h-[44px] hover:bg-neutral-100 -mx-2 px-2 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="text-sm font-heading font-bold text-text break-words">{g.nombreVisible}</span>
                  </div>
                  <p className="text-xs text-text/70 mb-1 break-words">
                    {g.alumnos} {g.alumnos === 1 ? 'alumno' : 'alumnos'}{g.proyectoTitulo ? ` · ${g.proyectoTitulo}` : ''}
                  </p>
                  {g.proyectoId && <BarraAvance valor={g.avance} etiqueta={`Avance de ${g.nombreVisible}`} />}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/docente/grupos" className="inline-flex items-center gap-1 min-h-[44px] text-sm font-heading font-bold text-accent-strong hover:underline">
          {grupos.length > MAX ? `Ver los ${grupos.length} grupos` : 'Gestionar grupos'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
};
