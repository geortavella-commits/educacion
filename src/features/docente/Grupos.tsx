import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { docenteService } from '@/services/docente';
import { GrupoSugerido } from '@/mocks/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Info,
  Check,
  Edit2,
  AlertTriangle,
} from 'lucide-react';

export interface GruposDocenteProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
}

const PALABRAS_SENSIBLES = ['refuerzo', 'nivel', 'bajo', 'avanzado', 'apoyo', 'fácil', 'facil', 'difícil', 'dificil'];

export const Grupos: React.FC<GruposDocenteProps> = ({ forcedEstado }) => {
  const { id } = useParams<{ id: string }>();
  const proyectoId = id || 'actual';

  const [grupos, setGrupos] = useState<GrupoSugerido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal para editar grupo
  const [grupoEnEdicion, setGrupoEnEdicion] = useState<GrupoSugerido | null>(null);
  const [nombreVisibleTemp, setNombreVisibleTemp] = useState('');
  const [etiquetaDocenteTemp, setEtiquetaDocenteTemp] = useState('');

  const cargarDatos = () => {
    setLoading(true);
    setError(false);
    docenteService
      .obtenerGruposSugeridos(proyectoId)
      .then((res) => {
        setGrupos(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [proyectoId]);

  const handleToggleAprobacion = (grupoId: string, estadoActual: 'borrador' | 'aprobado') => {
    const nuevoEstado = estadoActual === 'borrador' ? 'aprobado' : 'borrador';
    docenteService.cambiarEstadoGrupo(grupoId, nuevoEstado).then((grupoActualizado) => {
      setGrupos((prev) =>
        prev.map((g) => (g.id === grupoActualizado.id ? grupoActualizado : g))
      );
    });
  };

  const handleAbrirEdicion = (grupo: GrupoSugerido) => {
    setGrupoEnEdicion(grupo);
    setNombreVisibleTemp(grupo.nombreVisible);
    setEtiquetaDocenteTemp(grupo.etiquetaDocente);
  };

  const handleGuardarEdicion = () => {
    if (!grupoEnEdicion) return;
    docenteService
      .editarGrupo(grupoEnEdicion.id, {
        nombreVisible: nombreVisibleTemp,
        etiquetaDocente: etiquetaDocenteTemp,
      })
      .then((grupoActualizado) => {
        setGrupos((prev) =>
          prev.map((g) => (g.id === grupoActualizado.id ? grupoActualizado : g))
        );
        setGrupoEnEdicion(null);
      });
  };

  // Validación en vivo de palabras clasificatorias
  const contienePalabraClasificatoria = PALABRAS_SENSIBLES.some((p) =>
    nombreVisibleTemp.toLowerCase().includes(p)
  );

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-4 w-full max-w-6xl">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return (
      <ErrorState
        title="Error al cargar las sugerencias de grupos"
        message="No se pudieron obtener los agrupamientos propuestos por el tutor."
        onRetry={cargarDatos}
      />
    );
  }

  if (estadoEfectivo === 'sin_permiso') {
    return (
      <div className="p-8 bg-surface border-2 border-divider rounded-lg text-center space-y-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-accent-100 mx-auto flex items-center justify-center text-accent-strong">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-text">Acceso no autorizado</h2>
        <p className="text-sm text-text/70">
          Solo los docentes pueden revisar y aprobar la conformación de grupos para los proyectos.
        </p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || grupos.length === 0) {
    return (
      <EmptyState
        title="No hay grupos sugeridos pendientes"
        description="El tutor aún no identificó patrones de agrupamiento para este proyecto o todos los grupos ya fueron gestionados."
      />
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl min-w-0 font-body">
      {/* 1. Cabecera */}
      <div className="border-b border-divider pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to={`/docente/proyectos/${proyectoId}`}
            className="text-xs font-bold text-accent-strong hover:underline inline-flex items-center gap-1 mr-2 min-h-[44px] px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver al proyecto</span>
          </Link>
          <span className="text-xs text-text/50">·</span>
          <span className="text-xs font-heading font-bold text-text/70">
            Sugeridos por el tutor según el progreso
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">
          Grupos para el proyecto
        </h1>
      </div>

      {/* 2. Tarjetas de grupos sugeridos */}
      <div className="space-y-4">
        {grupos.map((grupo) => {
          const estaAprobado = grupo.estado === 'aprobado';

          return (
            <div
              key={grupo.id}
              className={`bg-surface border-2 rounded-xl p-5 md:p-6 flex flex-col gap-4 shadow-sm transition-all ${
                estaAprobado
                  ? 'border-accent-strong bg-accent-100/20 ring-1 ring-accent-strong'
                  : 'border-divider'
              }`}
            >
              {/* Título y badge de alumnos + estado */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-heading font-extrabold text-text">
                    {grupo.nombreVisible}
                  </h2>
                  {estaAprobado ? (
                    <span className="inline-flex items-center gap-1 text-xs font-heading font-extrabold px-2.5 py-0.5 rounded-full bg-accent-strong text-on-accent">
                      <Check className="w-3 h-3" aria-hidden="true" />
                      <span>APROBADO</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-heading font-extrabold px-2.5 py-0.5 rounded-full bg-neutral-200 text-text/70 border border-divider">
                      BORRADOR
                    </span>
                  )}
                </div>

                <span className="text-xs font-heading font-bold px-3 py-1 rounded-full bg-accent-100 text-text border border-divider">
                  {grupo.alumnosCount} alumnos
                </span>
              </div>

              {/* Explicación del tutor */}
              <p className="text-sm text-text/90 leading-relaxed break-words font-body">
                {grupo.explicacionTutor}
              </p>

              {/* Etiquetas visibles: Alumnos ven vs Solo docente */}
              <div className="flex flex-wrap gap-2 text-xs font-heading font-bold">
                <span className="px-3 py-1 rounded-full bg-accent-2-100 text-text border border-divider">
                  Alumnos ven: {grupo.nombreVisible}
                </span>
                <span className="px-3 py-1 rounded-full bg-accent-100 text-accent-strong border border-divider">
                  Solo docente: {grupo.etiquetaDocente}
                </span>
              </div>

              {/* Avatares de los alumnos (iniciales) */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {grupo.alumnosIniciales.map((ini, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-accent-100 border-2 border-surface flex items-center justify-center font-heading font-extrabold text-xs text-text shadow-xs"
                      title={grupo.alumnosNombres?.[i] || ini}
                    >
                      {ini}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-text/60 pl-2">
                  {grupo.alumnosNombres?.join(', ')}
                </span>
              </div>

              {/* Botones de acción con touch target >= 44px */}
              <div className="pt-3 border-t border-divider flex items-center gap-3">
                <Button
                  variant={estaAprobado ? 'secondary' : 'primary'}
                  size="md"
                  onClick={() => handleToggleAprobacion(grupo.id, grupo.estado)}
                  className="font-extrabold text-xs gap-1.5 min-h-[44px] px-3.5"
                >
                  {estaAprobado ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                      <span>Deshacer aprobación</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Aprobar grupo</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleAbrirEdicion(grupo)}
                  className="font-bold text-xs gap-1.5 min-h-[44px] px-3.5"
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Editar</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Pie fijo aclaratorio obligatorio */}
      <div className="p-4 rounded-xl bg-neutral-100 border border-divider text-sm text-text/75 leading-relaxed flex items-center gap-2.5">
        <Info className="w-4 h-4 text-accent-strong shrink-0" aria-hidden="true" />
        <span>
          <strong>Nada se arma solo:</strong> los grupos quedan en borrador hasta que los aprobes.
        </span>
      </div>

      {/* Diálogo para Editar Grupo */}
      {grupoEnEdicion && (
        <Dialog
          isOpen={Boolean(grupoEnEdicion)}
          onClose={() => setGrupoEnEdicion(null)}
          title={`Editar grupo (${grupoEnEdicion.nombreVisible})`}
          description="Podés modificar el nombre que verán los chicos y tu etiqueta pedagógica interna."
          actions={
            <>
              <Button variant="secondary" onClick={() => setGrupoEnEdicion(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleGuardarEdicion}>
                Guardar cambios
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <Input
                label="Nombre visible para los alumnos (nombre neutro)"
                value={nombreVisibleTemp}
                onChange={(e) => setNombreVisibleTemp(e.target.value)}
                placeholder="Ej: Los goleadores del área"
              />
              {contienePalabraClasificatoria && (
                <div className="p-2.5 bg-accent-100 border-2 border-accent-300 rounded-md text-xs text-accent-900 flex items-start gap-2 mt-1 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong>Aviso de cuidado:</strong> Este nombre puede clasificar a los alumnos. Los alumnos lo van a ver. Elegí una denominación motivadora y neutra.
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Etiqueta interna (SOLO docente)"
              value={etiquetaDocenteTemp}
              onChange={(e) => setEtiquetaDocenteTemp(e.target.value)}
              placeholder="Ej: Refuerzo · Área y perímetro"
              hint="Esta etiqueta nunca será visible para los alumnos ni en sus informes."
            />
          </div>
        </Dialog>
      )}
    </div>
  );
};
