import React from 'react';
import { PreguntaDiagnostico } from '@/services/diagnostico';
import { Check } from 'lucide-react';

export interface PreguntaProps {
  pregunta: PreguntaDiagnostico;
  opcionSeleccionada?: string;
  onSeleccionarOpcion: (opcionId: string) => void;
  onSiguiente: () => void;
  onAnterior?: () => void;
  isLoading?: boolean;
}

export const Pregunta: React.FC<PreguntaProps> = ({
  pregunta,
  opcionSeleccionada,
  onSeleccionarOpcion,
  onSiguiente,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full flex-1 justify-between min-w-0">
      <div className="space-y-4 min-w-0">
        <div className="text-sm text-[#4E4E4E] font-bold">
          {pregunta.subtitulo || 'Sin notas, es un juego para conocerte.'}
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-[#1B1C1C] break-words">
          {pregunta.enunciado}
        </h2>

        {pregunta.opciones && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
            role="radiogroup"
            aria-label="Opciones de respuesta"
          >
            {pregunta.opciones.map((op) => {
              const isSelected = opcionSeleccionada === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSeleccionarOpcion(op.id)}
                  className={`min-h-[56px] p-4 text-left font-extrabold text-base sm:text-lg rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#1CB0F6] bg-[#DDF4FF] text-[#004666] shadow-[0_4px_0_0_#1899D6]'
                      : 'border-[#E5E5E5] bg-white text-[#1B1C1C] hover:border-[#CCCCCC] shadow-[0_4px_0_0_#E5E5E5] active:translate-y-1 active:shadow-none'
                  }`}
                >
                  <span className="break-words">{op.texto}</span>
                  <span
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-[#1CB0F6] bg-[#1CB0F6] text-white'
                        : 'border-[#E5E5E5] bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto">
        <button
          type="button"
          disabled={!opcionSeleccionada || isLoading}
          onClick={onSiguiente}
          className="btn-3d btn-3d-primary w-full py-4 text-base sm:text-lg min-h-[52px] flex items-center justify-center font-black"
        >
          {isLoading ? 'Cargando...' : 'Seguir'}
        </button>
      </div>
    </div>
  );
};

