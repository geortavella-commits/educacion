import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docenteService, type GrupoLista, type ProyectoGestionItem } from '@/services/docente';
import { ResumenInicioDocente } from '@/mocks/docente';
import { Button } from '@/components/Button';
import { ResumenPanel } from './ResumenPanel';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import {
  Users,
  FolderKanban,
  AlertTriangle,
  ArrowRight,
  Plus,
  Lock,
  Sparkles,
} from 'lucide-react';

export interface InicioDocenteProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
}

export const Inicio: React.FC<InicioDocenteProps> = ({ forcedEstado }) => {
  const [data, setData] = useState<ResumenInicioDocente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [panel, setPanel] = useState<{ proyectos: ProyectoGestionItem[]; grupos: GrupoLista[] } | null>(null);

  const navigate = useNavigate();

  const cargarDatos = () => {
    setLoading(true);
    setError(false);
    docenteService
      .obtenerInicio()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
    // Proyectos y grupos con su avance (solo con la base real; con datos de ejemplo queda la tarjeta anterior).
    Promise.all([docenteService.listarProyectosGestion(), docenteService.listarGrupos()])
      .then(([proyectos, grupos]) => setPanel({ proyectos, grupos }))
      .catch(() => setPanel(null));
  }, []);

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-6 w-full max-w-full">
        <LoadingSkeleton type="card" count={1} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LoadingSkeleton type="card" count={3} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="card" count={2} />
        </div>
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return (
      <ErrorState
        title="Error al cargar el panel docente"
        message="No pudimos obtener la información del panel en este momento."
        onRetry={cargarDatos}
      />
    );
  }

  if (estadoEfectivo === 'sin_permiso') {
    return (
      <div className="p-8 bg-surface border-2 border-divider rounded-lg text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-accent-100 mx-auto flex items-center justify-center text-accent-strong">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-text">Acceso no autorizado</h2>
        <p className="text-sm text-text/70 max-w-md mx-auto">
          Esta sección es exclusiva para docentes titulares de la institución.
        </p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || !data) {
    return (
      <EmptyState
        title="No tenés proyectos ni cursos activos"
        description="Creá tu primer proyecto interdisciplinario o armá un grupo para comenzar el acompañamiento con Chasqui."
        actionText="Crear primer proyecto"
        onAction={() => navigate('/docente/proyectos/nuevo')}
      />
    );
  }

  const { metricas, proyectoEnFoco, misGrupos, fechaTexto, docenteNombre } = data;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 font-body">
      {/* 1. Cabecera con saludo y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider pb-4">
        <div>
          <div className="text-sm font-semibold text-text/70">{fechaTexto}</div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text tracking-tight mt-0.5">
            Hola, {docenteNombre}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/docente/grupos/nuevo')}
            className="font-bold"
          >
            Nuevo grupo
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/docente/proyectos/nuevo')}
            className="font-extrabold gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Crear proyecto</span>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de métricas (3 números coherentes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Métricas 1: Alumnos activos */}
        <div className="rounded-xl bg-accent-100 border border-accent-300 p-5 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-heading font-bold text-accent-strong uppercase tracking-wider">
            <span>Alumnos activos esta semana</span>
            <Users className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="font-heading font-extrabold text-3xl md:text-4xl text-text">
            {metricas.activosEstaSemana}
            <span className="text-lg md:text-xl font-bold text-text/60"> / {metricas.totalAlumnos}</span>
          </div>
        </div>

        {/* Métricas 2: Proyectos en curso */}
        <Link
          to="/docente/proyectos"
          className="rounded-xl bg-accent-2-100 border border-divider p-5 flex flex-col justify-between gap-2 hover:opacity-95 transition-opacity shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
        >
          <div className="flex items-center justify-between text-xs font-heading font-bold text-text/80 uppercase tracking-wider">
            <span>Proyectos en curso</span>
            <FolderKanban className="w-4 h-4 text-accent-strong group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
          <div className="font-heading font-extrabold text-3xl md:text-4xl text-text">
            {metricas.proyectosEnCurso}
          </div>
        </Link>

        {/* Métricas 3: Necesitan apoyo */}
        <Link
          to="/docente/apoyo"
          className="rounded-xl bg-accent-100 border border-divider p-5 flex flex-col justify-between gap-2 hover:opacity-95 transition-opacity shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
        >
          <div className="flex items-center justify-between text-xs font-heading font-bold text-text/80 uppercase tracking-wider">
            <span>
              Necesitan apoyo · <span className="text-accent-strong underline">ver lista →</span>
            </span>
            <AlertTriangle className="w-4 h-4 text-accent-strong group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
          <div className="font-heading font-extrabold text-3xl md:text-4xl text-text">
            {metricas.necesitanApoyo}
          </div>
        </Link>
      </div>

      {/* 3. Rejilla principal: Proyecto en foco + Mis grupos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0 items-start">
        {/* Columna Izquierda: Proyecto en foco (7 cols en lg) */}
        <div className="lg:col-span-7 bg-surface border-2 border-divider rounded-xl p-5 md:p-6 flex flex-col justify-between gap-5 min-w-0 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl md:text-2xl font-heading font-extrabold text-text">
                {proyectoEnFoco.titulo}
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent-2-100 text-text border border-divider">
                {proyectoEnFoco.materiasTexto}
              </span>
            </div>

            <p className="text-sm text-text/80 leading-relaxed">
              <strong className="text-text font-bold">Avance de misiones.</strong> Alineado a NAP: {proyectoEnFoco.alineacionNap}
            </p>

            {/* Barras de avance por materia */}
            <div className="space-y-3.5 pt-1">
              {proyectoEnFoco.avanceMisiones.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold text-text">
                    <span className="break-words pr-2">{item.materia}</span>
                    <span className="font-mono text-sm shrink-0">{item.porcentaje}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={item.porcentaje}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance de ${item.materia}: ${item.porcentaje}%`}
                    className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden p-0.5 border border-divider"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.colorClass}`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque: Lo que vio el tutor */}
          <div className="p-4 rounded-lg bg-neutral-100 border border-divider text-sm text-text/90 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-heading font-bold text-accent-strong">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Lo que vio el tutor:</span>
            </div>
            <p>{proyectoEnFoco.loQueVioElTutor}</p>
          </div>

          <div className="pt-2 border-t border-divider flex items-center justify-between flex-wrap gap-2">
            <Link
              to={`/docente/proyectos/${proyectoEnFoco.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-accent-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong rounded min-h-[44px] px-1"
            >
              <span>Abrir proyecto: misiones, grupos y cobertura curricular</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>

          </div>
        </div>

        {/* Columna derecha: proyectos y grupos con su avance */}
        {panel ? (
          <ResumenPanel proyectos={panel.proyectos} grupos={panel.grupos} />
        ) : (
        <div className="lg:col-span-5 bg-surface border-2 border-divider rounded-xl p-5 md:p-6 flex flex-col justify-between gap-4 min-w-0 shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xl font-heading font-extrabold text-text">
                Mis grupos · avance de misiones
              </h2>
            </div>

            <div className="divide-y-2 divide-divider">
              {misGrupos.map((grupo) => (
                <div key={grupo.id} className="py-3 flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm shrink-0 border border-divider shadow-xs ${grupo.colorBg} ${grupo.colorText}`}
                    >
                      {grupo.codigo}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-heading font-bold text-text break-words">
                        {grupo.nombre}
                      </h3>
                      <p className="text-xs text-text/70 break-words">{grupo.info}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-heading font-extrabold text-sm text-text font-mono">
                      {grupo.porcentaje}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-divider flex items-center justify-between text-sm">
            <span className="text-text/70 text-xs">Avance medido por misiones realizadas</span>
            <Link
              to="/docente/grupos"
              className="font-heading font-bold text-accent-strong hover:underline inline-flex items-center gap-1 min-h-[44px] px-1"
            >
              <span>Gestionar grupos</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
