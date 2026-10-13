import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChasquiMascota } from './ChasquiMascota';
import { ArrowRight, Home, Sparkles, CheckCircle2 } from 'lucide-react';

export interface ModalExitoMisionProps {
  isOpen: boolean;
  onClose: () => void;
  tipoResultado: 'correcta' | 'entregada';
  explicacion?: string;
  siguiente?: { id: string; titulo: string } | null;
  onSiguiente?: () => void;
}

export const ModalExitoMision: React.FC<ModalExitoMisionProps> = ({
  isOpen,
  onClose,
  tipoResultado,
  explicacion,
  siguiente,
  onSiguiente,
}) => {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const isEntregada = tipoResultado === 'entregada';

  // Manejo de foco y accesibilidad dialog
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Enfoque inicial al botón principal
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 60);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Trampa de foco y tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleIrASiguiente = () => {
    if (onSiguiente) {
      onSiguiente();
    } else if (siguiente) {
      navigate(`/alumno/mision/${siguiente.id}`);
    }
  };

  const handleVolverInicio = () => {
    onClose();
    navigate('/alumno');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-fade-in"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Diálogo */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-exito-titulo"
        aria-describedby={explicacion ? 'modal-exito-explicacion' : undefined}
        className="relative w-full max-w-lg bg-white border-2 border-slate-200 border-b-8 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 min-w-0 animate-scale-up font-nunito"
      >
        {/* Confeti CSS festivo y liviano */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" aria-hidden="true">
          <div className="absolute top-2 left-6 w-3 h-3 bg-duo-green rounded-full animate-confeti [animation-delay:100ms]" />
          <div className="absolute top-4 left-1/4 w-2.5 h-2.5 bg-duo-orange rounded-sm animate-confeti [animation-delay:250ms]" />
          <div className="absolute top-1 left-1/2 w-3 h-3 bg-[#ffaa00] rounded-full animate-confeti [animation-delay:180ms]" />
          <div className="absolute top-3 right-1/4 w-2.5 h-2.5 bg-duo-blue rounded-sm animate-confeti [animation-delay:350ms]" />
          <div className="absolute top-2 right-8 w-3 h-3 bg-duo-green rounded-full animate-confeti [animation-delay:120ms]" />
        </div>

        {/* Mascota Chasqui festejando */}
        <div className="relative pt-2">
          <ChasquiMascota estado="festejo" size="lg" />
          <div className="absolute -top-1 -right-2 bg-amber-100 border-2 border-amber-300 text-amber-700 p-1.5 rounded-full shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </div>
        </div>

        {/* Título de logro */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border-2 border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" aria-hidden="true" />
            <span>{isEntregada ? 'Misión entregada' : '¡Excelente pensamiento!'}</span>
          </div>

          <h2
            id="modal-exito-titulo"
            className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight break-words"
          >
            {isEntregada
              ? '¡Entregaste tu misión! Tu docente la va a leer.'
              : '¡Muy bien!'}
          </h2>
        </div>

        {/* Explicación pedagógica de la docente si vino */}
        {explicacion && (
          <div
            id="modal-exito-explicacion"
            className="w-full text-left p-4 bg-amber-50 border-2 border-amber-200 border-b-4 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed break-words"
          >
            <span className="font-black text-amber-900 block mb-1">
              Para recordar:
            </span>
            <p className="whitespace-pre-line font-bold">{explicacion}</p>
          </div>
        )}

        {/* Finalización del proyecto si ya no quedan más misiones */}
        {!siguiente && (
          <div className="p-3.5 bg-slate-100 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-slate-700">
            🎉 ¡Terminaste las misiones de este proyecto!
          </div>
        )}

        {/* Botones de acción accesibles y estilo Duolingo / Stitch */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          {siguiente ? (
            <>
              <button
                ref={primaryButtonRef}
                type="button"
                onClick={handleIrASiguiente}
                className="btn-3d-primary px-6 py-3.5 text-base sm:text-lg flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Siguiente misión</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleVolverInicio}
                className="btn-3d-outline px-5 py-3 text-sm sm:text-base min-h-[48px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Volver al inicio</span>
              </button>
            </>
          ) : (
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleVolverInicio}
              className="btn-3d-primary px-8 py-3.5 text-base sm:text-lg w-full min-h-[48px] inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Home className="w-5 h-5" aria-hidden="true" />
              <span>Volver al inicio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
