import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { Dialog } from '@/components/Dialog';
import { LoadingSkeleton, ErrorState } from '@/components/States';
import {
  diagnosticoService,
  PreguntaDiagnostico,
  InteresItem,
} from '@/services/diagnostico';
import { Pregunta } from './Pregunta';
import { Intereses } from './Intereses';
import { Final } from './Final';
import { X, ArrowLeft } from 'lucide-react';

export const DiagnosticoFlow: React.FC = () => {
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState<PreguntaDiagnostico[]>([]);
  const [interesesDisponibles, setInteresesDisponibles] = useState<InteresItem[]>([]);
  const [pasoIndex, setPasoIndex] = useState(0); // 0 to N-1
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [interesesSeleccionados, setInteresesSeleccionados] = useState<string[]>(['futbol', 'dibujo']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFinalizado, setIsFinalizado] = useState(false);
  const [isCerrarModalOpen, setIsCerrarModalOpen] = useState(false);

  // Ref para devolver el foco al cerrar el modal
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(false);
    try {
      const [preguntasData, interesesData] = await Promise.all([
        diagnosticoService.getPreguntas(),
        diagnosticoService.getInteresesDisponibles(),
      ]);
      setPreguntas(preguntasData);
      setInteresesDisponibles(interesesData);
      const guardados = await diagnosticoService.cargarInteresesGuardados();
      if (guardados && guardados.length > 0) {
        setInteresesSeleccionados(guardados);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const preguntaActual = preguntas[pasoIndex];
  const totalPasos = preguntas.length;
  const pasoNumero = pasoIndex + 1;
  const progresoPorcentaje = totalPasos > 0 ? Math.round((pasoNumero / totalPasos) * 100) : 0;

  const handleSeleccionarOpcion = (opcionId: string) => {
    if (!preguntaActual) return;
    setRespuestas({ ...respuestas, [preguntaActual.id]: opcionId });
  };

  const handleToggleInteres = (id: string) => {
    if (interesesSeleccionados.includes(id)) {
      setInteresesSeleccionados(interesesSeleccionados.filter((i) => i !== id));
    } else if (interesesSeleccionados.length < 3) {
      setInteresesSeleccionados([...interesesSeleccionados, id]);
    }
  };

  const handleSiguiente = async () => {
    if (pasoIndex < totalPasos - 1) {
      setPasoIndex(pasoIndex + 1);
    } else {
      // Guardar diagnóstico
      await diagnosticoService.guardarDiagnostico(respuestas, interesesSeleccionados);
      setIsFinalizado(true);
    }
  };

  const handleAnterior = () => {
    if (pasoIndex > 0) {
      setPasoIndex(pasoIndex - 1);
    }
  };

  const handleCerrarDiagnostico = () => {
    setIsCerrarModalOpen(false);
    navigate('/alumno');
  };

  return (
    <ModoProvider nivel="primaria">
      <div className="w-full max-w-2xl mx-auto min-h-[580px] bg-white text-slate-800 rounded-3xl border-2 border-[#e5e5e5] border-b-8 p-5 sm:p-7 md:p-9 flex flex-col justify-between shadow-sm transition-all min-w-0 my-2 md:my-6 font-nunito">
        {/* Cabecera con barra de progreso y botón de cerrar (solo cuando ya cargaron las preguntas) */}
        {!loading && !error && !isFinalizado && totalPasos > 0 && (
          <header className="flex items-center gap-3 pb-4 border-b-2 border-[#e5e5e5] min-w-0">
            {pasoIndex > 0 ? (
              <button
                type="button"
                onClick={handleAnterior}
                aria-label="Volver a la pregunta anterior"
                className="btn-3d-outline w-11 h-11 min-h-[44px] min-w-[44px] rounded-full p-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 stroke-[2.5]" aria-hidden="true" />
              </button>
            ) : (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsCerrarModalOpen(true)}
                aria-label="Cerrar diagnóstico"
                className="btn-3d-outline w-11 h-11 min-h-[44px] min-w-[44px] rounded-full p-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-700 stroke-[2.5]" aria-hidden="true" />
              </button>
            )}

            {/* Barra de progreso real estilo Duolingo */}
            <div
              role="progressbar"
              aria-valuenow={pasoNumero}
              aria-valuemin={1}
              aria-valuemax={totalPasos}
              aria-label={`Progreso del diagnóstico: paso ${pasoNumero} de ${totalPasos}`}
              className="flex-1 min-w-0"
            >
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border-2 border-[#e5e5e5]">
                <div
                  className="progress-duo-bar bg-[#58cc02] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progresoPorcentaje}%` }}
                />
              </div>
            </div>

            <span className="font-black text-sm sm:text-base text-slate-700 shrink-0">
              {pasoNumero} de {totalPasos}
            </span>

            {pasoIndex > 0 && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsCerrarModalOpen(true)}
                aria-label="Cerrar diagnóstico"
                className="btn-3d-outline w-11 h-11 min-h-[44px] min-w-[44px] rounded-full p-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-700 stroke-[2.5]" aria-hidden="true" />
              </button>
            )}
          </header>
        )}

        {/* Estados de Carga / Error */}
        {loading && (
          <div className="py-12 space-y-4 flex-1">
            <LoadingSkeleton type="text" count={2} />
            <LoadingSkeleton type="card" count={2} />
          </div>
        )}

        {!loading && error && (
          <div className="py-8 flex-1 flex flex-col justify-center">
            <ErrorState
              title="Error al cargar el juego"
              message="No pudimos cargar las preguntas de bienvenida. Por favor, reintentá."
              onRetry={cargarDatos}
            />
          </div>
        )}

        {/* Contenido según paso */}
        {!loading && !error && !isFinalizado && preguntaActual && (
          <section className="flex-1 flex flex-col py-3 min-w-0">
            {preguntaActual.tipo === 'opcion_multiple' ? (
              <Pregunta
                pregunta={preguntaActual}
                opcionSeleccionada={respuestas[preguntaActual.id]}
                onSeleccionarOpcion={handleSeleccionarOpcion}
                onSiguiente={handleSiguiente}
                onAnterior={handleAnterior}
              />
            ) : (
              <Intereses
                interesesDisponibles={interesesDisponibles}
                interesesSeleccionados={interesesSeleccionados}
                onToggleInteres={handleToggleInteres}
                onSiguiente={handleSiguiente}
              />
            )}
          </section>
        )}

        {/* Pantalla Final (6d) */}
        {!loading && !error && isFinalizado && (
          <Final
            interesesElegidos={interesesSeleccionados}
            onFinalizar={() => navigate('/alumno')}
          />
        )}

        {/* Modal de confirmación para salir */}
        <Dialog
          isOpen={isCerrarModalOpen}
          onClose={() => {
            setIsCerrarModalOpen(false);
            closeButtonRef.current?.focus();
          }}
          title="¿Querés salir del juego?"
          description="Podés volver a completarlo cuando quieras desde el portal de alumnos."
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setIsCerrarModalOpen(false);
                  closeButtonRef.current?.focus();
                }}
                className="btn-3d btn-3d-outline px-5 py-2.5 min-h-[44px] font-black text-sm"
              >
                Seguir jugando
              </button>
              <button
                type="button"
                onClick={handleCerrarDiagnostico}
                className="btn-3d btn-3d-primary px-5 py-2.5 min-h-[44px] font-black text-sm"
              >
                Salir
              </button>
            </>
          }
        >
          <p className="text-xs sm:text-sm text-text/80 leading-relaxed">
            Tus respuestas no se guardarán hasta que completes todas las preguntas. ¿Estás seguro de que querés volver al inicio?
          </p>
        </Dialog>
      </div>
    </ModoProvider>
  );
};
