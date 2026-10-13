import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { docenteService, type CoberturaProyecto, type ProyectoGestion } from '@/services/docente';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import { ProyectoPanel } from './ProyectoPanel';
import { CoberturaCurricular } from './CoberturaCurricular';
import { ETIQUETA_PROYECTO, Migas } from './ui';
import { ChevronDown, Lock } from 'lucide-react';

export interface ProyectoDocenteProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
}

/**
 * Pantalla de un proyecto. De arriba hacia abajo, lo que más se usa primero:
 * resumen y acciones → grupos y alumnos → misiones por semana → cobertura curricular (con buscador) → criterios de observación.
 */
const PILL_ESTADO: Record<string, string> = {
  borrador: 'bg-[#fff2d6] text-[#7a4200] border-[#ff9600]/40',
  activo: 'bg-[#e5f8cf] text-[#2b6c00] border-[#58cc02]/50',
};

export const Proyecto: React.FC<ProyectoDocenteProps> = ({ forcedEstado }) => {
  const { id } = useParams<{ id: string }>();
  const proyectoId = id || 'actual';

  const [proyecto, setProyecto] = useState<ProyectoGestion | null>(null);
  const [cobertura, setCobertura] = useState<CoberturaProyecto | null>(null);
  const [coberturaFalla, setCoberturaFalla] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cargarDatos = () => {
    setError(false);
    docenteService
      .obtenerProyectoGestion(proyectoId)
      .then((p) => {
        setProyecto(p);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
    // La cobertura carga aparte: si falla, el resto de la pantalla sigue sirviendo.
    docenteService
      .obtenerCoberturaProyecto(proyectoId)
      .then((c) => {
        setCobertura(c);
        setCoberturaFalla(false);
      })
      .catch(() => setCoberturaFalla(true));
  };

  useEffect(() => {
    setLoading(true);
    cargarDatos();
  }, [proyectoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-6 w-full max-w-full">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return <ErrorState title="Error al cargar el proyecto" message="No se pudo recuperar la planificación del proyecto." onRetry={() => { setLoading(true); cargarDatos(); }} />;
  }

  if (estadoEfectivo === 'sin_permiso') {
    return (
      <div className="p-8 bg-surface border-2 border-divider rounded-lg text-center space-y-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-accent-100 mx-auto flex items-center justify-center text-accent-strong">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-text">Acceso no autorizado</h2>
        <p className="text-sm text-text/70">Solo los docentes a cargo del curso pueden editar y publicar proyectos pedagógicos.</p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || !proyecto) {
    return <EmptyState title="Proyecto no encontrado" description="El proyecto seleccionado no existe o fue archivado." />;
  }

  return (
    <div className="space-y-8 w-full max-w-full min-w-0 font-nunito">
      <div className="pb-2 border-b-2 border-slate-200/70 space-y-4">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Proyectos', to: '/docente/proyectos' }, { texto: proyecto.titulo }]} />
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${PILL_ESTADO[proyecto.estado] ?? 'bg-slate-100 text-slate-700 border-slate-300'}`}>
          <span aria-hidden="true" className={`w-2 h-2 rounded-full ${proyecto.estado === 'borrador' ? 'bg-[#ff9600] animate-pulse' : proyecto.estado === 'activo' ? 'bg-[#58cc02]' : 'bg-slate-400'}`} />
          {ETIQUETA_PROYECTO[proyecto.estado] ?? proyecto.estado} • {proyecto.curso}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight break-words">{proyecto.titulo}</h1>
      </div>

      <ProyectoPanel p={proyecto} alCambiar={cargarDatos} />

      {cobertura ? (
        <CoberturaCurricular proyectoId={proyecto.id} cobertura={cobertura} semanas={proyecto.etapas.map((e) => ({ semana: e.semana, titulo: e.titulo }))} alCambiar={cargarDatos} />
      ) : coberturaFalla ? (
        <ErrorState title="No pudimos cargar la cobertura curricular" message="El resto del proyecto funciona igual. Reintentá en un momento." onRetry={cargarDatos} />
      ) : (
        <LoadingSkeleton type="card" count={1} />
      )}

      <details className="group bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
        <summary className="min-h-[56px] px-5 py-4 flex items-center justify-between gap-3 cursor-pointer list-none font-black text-slate-900 rounded-3xl">
          <span>Criterios para observar el trabajo</span>
          <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
        </summary>
        <div className="mx-5 pb-5 pt-4 space-y-3 border-t-2 border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            Una guía de ejemplo para mirar el trabajo de los chicos (todavía no se guarda ni se personaliza por proyecto). Son criterios de observación, no notas.
          </p>
          <ul className="space-y-1.5 text-sm font-semibold text-slate-800">
            <li><strong className="font-black">En inicio:</strong> necesita acompañamiento para empezar la tarea.</li>
            <li><strong className="font-black">En proceso:</strong> avanza con ayuda de las preguntas guía.</li>
            <li><strong className="font-black">Logrado:</strong> resuelve la tarea y puede explicar cómo lo hizo.</li>
          </ul>
          <p className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800">
            <strong className="font-black">La evaluación oficial es tuya.</strong> La app no califica ni genera notas.
          </p>
        </div>
      </details>
    </div>
  );
};
