import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { docenteService } from '@/services/docente';
import { AlumnoApoyo, EstadoHipotesis } from '@/mocks/docente';
import { Button } from '@/components/Button';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import { DialogoCorregirHipotesis } from './DialogoCorregirHipotesis';
import {
  ArrowLeft,
  CheckCircle2,
  Edit2,
  XCircle,
  Clock,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface ApoyoDocenteProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const Apoyo: React.FC<ApoyoDocenteProps> = ({
  forcedEstado,
  isDrawer = false,
  onCloseDrawer,
}) => {
  const [alumnos, setAlumnos] = useState<AlumnoApoyo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estado para el modal de corregir hipótesis
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoApoyo | null>(null);

  const cargarDatos = () => {
    setLoading(true);
    setError(false);
    docenteService
      .obtenerAlumnosApoyo()
      .then((res) => {
        setAlumnos(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleActualizarEstado = (
    alumnoId: string,
    nuevoEstado: EstadoHipotesis,
    textoCorregido?: string
  ) => {
    docenteService
      .actualizarHipotesisApoyo(alumnoId, nuevoEstado, textoCorregido)
      .then((alumnoActualizado) => {
        setAlumnos((prev) =>
          prev.map((a) => (a.id === alumnoActualizado.id ? alumnoActualizado : a))
        );
      });
  };

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-4 w-full max-w-full">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={5} />
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return (
      <ErrorState
        title="Error al cargar la lista de apoyo"
        message="No pudimos recuperar la lista de alumnos en este momento."
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
        <h2 className="font-heading font-extrabold text-xl text-text">Vista exclusiva para docentes</h2>
        <p className="text-sm text-text/70 max-w-md mx-auto">
          Esta información pedagógica solo está disponible para el equipo docente del aula.
        </p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || alumnos.length === 0) {
    return (
      <EmptyState
        title="Ningún alumno requiere apoyo en este momento"
        description="Todos los estudiantes vienen avanzando con buen ritmo en sus misiones."
        icon={<CheckCircle2 className="w-6 h-6 text-accent-strong" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl min-w-0 font-body">
      {/* 1. Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-4">
        <div>
          <div className="flex items-center gap-2">
            {!isDrawer && (
              <Link
                to="/docente"
                className="text-xs font-bold text-accent-strong hover:underline inline-flex items-center gap-1 mr-2 min-h-[44px] px-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Panel</span>
              </Link>
            )}
            <span className="text-xs font-heading font-extrabold text-accent-strong uppercase tracking-wider">
              {alumnos.length} ALUMNOS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight mt-1">
            Necesitan apoyo
          </h1>
        </div>

        {isDrawer && onCloseDrawer && (
          <Button
            variant="secondary"
            size="md"
            onClick={onCloseDrawer}
            aria-label="Cerrar panel de apoyo"
            className="min-h-[44px]"
          >
            Cerrar
          </Button>
        )}
      </div>

      {/* 2. Banner de aclaración pedagógica fija */}
      <div className="p-4 rounded-xl bg-accent-100 border border-divider flex items-start gap-3 text-sm text-text leading-relaxed shadow-xs">
        <Info className="w-5 h-5 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <strong>Son hipótesis de la app.</strong> Corregilas si no coinciden con lo que ves. Vos decidís qué hacer hoy.
        </div>
      </div>

      {/* 3. Lista de alumnos */}
      <div className="bg-surface border-2 border-divider rounded-xl divide-y-2 divide-divider shadow-sm overflow-hidden">
        {alumnos.map((alumno) => {
          const textoAMostrar =
            alumno.estadoHipotesis === 'corregida' && alumno.textoCorregido
              ? alumno.textoCorregido
              : alumno.motivoObservacion;

          return (
            <div
              key={alumno.id}
              className={`p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                alumno.estadoHipotesis === 'descartada' ? 'opacity-60 bg-neutral-100/50' : ''
              }`}
            >
              {/* Alumno + Curso */}
              <div className="sm:w-1/4 shrink-0 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-accent-100 border border-divider flex items-center justify-center font-heading font-bold text-xs text-text shrink-0">
                    {alumno.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-base text-text break-words">
                      {alumno.nombre}
                    </h2>
                    <span className="text-xs text-text/70 font-medium">{alumno.curso}</span>
                  </div>
                </div>
              </div>

              {/* Observación / Hipótesis con Badge de Estado */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-text leading-relaxed break-words">
                  {textoAMostrar}
                </p>

                {/* Badge visible del estado de la hipótesis */}
                <div className="flex items-center gap-2 pt-0.5">
                  {alumno.estadoHipotesis === 'confirmada' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong bg-accent-100 px-2.5 py-0.5 rounded-full border border-accent-300">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      <span>Observación confirmada por vos</span>
                    </span>
                  )}
                  {alumno.estadoHipotesis === 'corregida' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong bg-accent-100 px-2.5 py-0.5 rounded-full border border-accent-300">
                      <Edit2 className="w-3 h-3" aria-hidden="true" />
                      <span>Corregida por vos</span>
                    </span>
                  )}
                  {alumno.estadoHipotesis === 'descartada' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-text/60 bg-neutral-200 px-2.5 py-0.5 rounded-full border border-divider">
                      <XCircle className="w-3 h-3" aria-hidden="true" />
                      <span>Descartada</span>
                    </span>
                  )}
                  {alumno.estadoHipotesis === 'pendiente' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text/60">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>Sin revisar por vos</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción: Corregir y Ver perfil con touch target >= 44px */}
              <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setAlumnoSeleccionado(alumno)}
                  className="font-bold text-xs min-h-[44px] px-3.5"
                >
                  Corregir
                </Button>

                <Link
                  to={`/docente/alumnos/${alumno.id}`}
                  className="inline-flex items-center gap-1 text-sm font-heading font-extrabold text-accent-strong px-3 py-2 min-h-[44px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong rounded"
                >
                  <span>Ver perfil</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie aclaratorio */}
      <div className="p-3.5 bg-neutral-100 rounded-lg text-sm text-text/75 text-center">
        La calificación oficial es tuya. Esta lista no genera notas ni sanciones.
      </div>

      {/* Diálogo de 3 acciones para Corregir Hipótesis */}
      {alumnoSeleccionado && (
        <DialogoCorregirHipotesis
          isOpen={Boolean(alumnoSeleccionado)}
          onClose={() => setAlumnoSeleccionado(null)}
          alumnoNombre={alumnoSeleccionado.nombre}
          textoOriginal={alumnoSeleccionado.motivoObservacion}
          estadoActual={alumnoSeleccionado.estadoHipotesis}
          textoCorregidoActual={alumnoSeleccionado.textoCorregido}
          onConfirmar={() =>
            handleActualizarEstado(alumnoSeleccionado.id, 'confirmada')
          }
          onGuardarCorreccion={(nuevoTexto) =>
            handleActualizarEstado(alumnoSeleccionado.id, 'corregida', nuevoTexto)
          }
          onDescartar={() =>
            handleActualizarEstado(alumnoSeleccionado.id, 'descartada')
          }
        />
      )}
    </div>
  );
};
