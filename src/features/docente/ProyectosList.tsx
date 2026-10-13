import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docenteService, type ProyectoGestionItem } from '@/services/docente';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import { BarraAvance, ETIQUETA_PROYECTO, Migas } from './ui';
import { Plus, ArrowRight, Lock, Users, UsersRound } from 'lucide-react';

type Pestana = 'activo' | 'borrador' | 'terminados';
const PESTANAS: { id: Pestana; texto: string; vacio: string }[] = [
  { id: 'activo', texto: 'En curso', vacio: 'No tenés proyectos en curso. Publicá un borrador o creá uno nuevo.' },
  { id: 'borrador', texto: 'Borradores', vacio: 'No tenés borradores.' },
  { id: 'terminados', texto: 'Terminados', vacio: 'Todavía no terminaste ni anulaste ningún proyecto. Cuando cierres uno, queda guardado acá.' },
];
const enPestana = (p: ProyectoGestionItem, t: Pestana) => (t === 'terminados' ? p.estado === 'finalizado' || p.estado === 'archivado' : p.estado === t);

export interface ProyectosListProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
}

export const ProyectosList: React.FC<ProyectosListProps> = ({ forcedEstado }) => {
  const [proyectos, setProyectos] = useState<ProyectoGestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('activo');
  const [eligio, setEligio] = useState(false);

  const cargarDatos = () => {
    setLoading(true);
    setError(false);
    docenteService
      .listarProyectosGestion()
      .then((lista) => {
        setProyectos(lista);
        // Se abre en lo que se está trabajando; si no hay nada en curso, en la primera pestaña que tenga algo.
        if (!eligio) setPestana((actual) => (lista.some((p) => enPestana(p, actual)) ? actual : (PESTANAS.find((t) => lista.some((p) => enPestana(p, t.id)))?.id ?? 'activo')));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(cargarDatos, []);

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-4 w-full max-w-full">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={4} />
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return <ErrorState title="Error al cargar los proyectos" message="No pudimos obtener tus proyectos en este momento." onRetry={cargarDatos} />;
  }

  if (estadoEfectivo === 'sin_permiso') {
    return (
      <div className="p-8 bg-surface border-2 border-divider rounded-lg text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-accent-100 mx-auto flex items-center justify-center text-accent-strong">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-text">Acceso restringido</h2>
        <p className="text-sm text-text/70 max-w-md mx-auto">Solo los docentes pueden ver los proyectos de sus cursos.</p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || proyectos.length === 0) {
    return (
      <div className="space-y-4">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Proyectos' }]} />
        <EmptyState
          title="Todavía no tenés proyectos"
          description="Creá tu primer proyecto: abarca a todo el curso y después podés armar grupos adentro."
          actionText="Crear proyecto"
          onAction={() => navigate('/docente/proyectos/nuevo')}
        />
      </div>
    );
  }

  const visibles = proyectos.filter((p) => enPestana(p, pestana));

  return (
    <div className="space-y-6 w-full max-w-5xl min-w-0 font-body">
      <div className="border-b border-divider pb-4 space-y-2">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Proyectos' }]} />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">Proyectos</h1>
            <p className="text-sm text-text/75 mt-1 max-w-xl">Cada proyecto abarca a todo el curso. Entrá a uno para editarlo, ver el avance y armar grupos.</p>
          </div>
          <Link
            to="/docente/proyectos/nuevo"
            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] bg-accent-strong text-on-accent font-heading font-extrabold text-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Crear proyecto</span>
          </Link>
        </div>
      </div>

      <div role="tablist" aria-label="Estado de los proyectos" className="flex flex-wrap gap-2">
        {PESTANAS.map((t) => {
          const n = proyectos.filter((p) => enPestana(p, t.id)).length;
          const activa = pestana === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`pestana-${t.id}`}
              aria-selected={activa}
              aria-controls="panel-proyectos-lista"
              onClick={() => { setPestana(t.id); setEligio(true); }}
              className={`min-h-[44px] px-4 rounded-2xl border-2 text-sm font-extrabold cursor-pointer transition-colors ${activa ? 'bg-[#e5f8cf] border-[#58cc02] text-[#2b6c00]' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
            >
              {t.texto} <span className="font-black">({n})</span>
            </button>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <p role="status" className="p-5 bg-white border-2 border-slate-200 rounded-3xl text-sm font-semibold text-slate-700">
          {PESTANAS.find((t) => t.id === pestana)?.vacio}
        </p>
      )}

      <div id="panel-proyectos-lista" role="tabpanel" aria-labelledby={`pestana-${pestana}`}>
      <ul className="space-y-3">
        {visibles.map((p) => (
          <li key={p.id}>
            <Link
              to={`/docente/proyectos/${p.id}`}
              className="block p-4 bg-surface border-2 border-divider rounded-lg hover:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong min-w-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-heading font-extrabold text-text break-words">{p.titulo}</h2>
                  <p className="text-sm text-text/75">{p.curso}</p>
                </div>
                <span className="inline-flex px-2.5 py-1 text-xs font-heading font-bold rounded-full bg-neutral-200 text-neutral-900 border border-divider">
                  {ETIQUETA_PROYECTO[p.estado] ?? p.estado}
                </span>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" aria-hidden="true" />
                    Todo el curso ({p.alumnos})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="w-4 h-4" aria-hidden="true" />
                    {p.grupos} {p.grupos === 1 ? 'grupo' : 'grupos'}
                  </span>
                  <span>{p.misiones} {p.misiones === 1 ? 'misión' : 'misiones'}</span>
                </span>
                <div className="sm:w-64">
                  <BarraAvance valor={p.avance} etiqueta={`Avance de ${p.titulo}`} />
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-heading font-bold text-accent-strong">
                  Abrir proyecto <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
};
