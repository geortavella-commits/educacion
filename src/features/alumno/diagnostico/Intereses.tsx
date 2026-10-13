import React, { useState } from 'react';
import { InteresItem } from '@/services/diagnostico';
import { Check, AlertCircle } from 'lucide-react';

export interface InteresesProps {
  interesesDisponibles: InteresItem[];
  interesesSeleccionados: string[];
  onToggleInteres: (id: string) => void;
  onSiguiente: () => void;
  isLoading?: boolean;
}

export const Intereses: React.FC<InteresesProps> = ({
  interesesDisponibles,
  interesesSeleccionados,
  onToggleInteres,
  onSiguiente,
  isLoading = false,
}) => {
  const [avisoMaximo, setAvisoMaximo] = useState(false);

  const handleSelect = (id: string) => {
    if (!interesesSeleccionados.includes(id) && interesesSeleccionados.length >= 3) {
      setAvisoMaximo(true);
      setTimeout(() => setAvisoMaximo(false), 3000);
      return;
    }
    setAvisoMaximo(false);
    onToggleInteres(id);
  };

  return (
    <div className="flex flex-col gap-4 w-full flex-1 justify-between min-w-0">
      <div className="space-y-3 min-w-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-[#1B1C1C] break-words">
          ¿Qué te gusta hacer en tu tiempo libre?
        </h2>
        <p className="text-sm text-[#4E4E4E] font-bold">
          Elegí hasta 3. Chasqui las usa para explicar.
        </p>

        {avisoMaximo && (
          <div
            role="alert"
            className="p-3 bg-[#FFF8EB] border-2 border-[#F59E0B] text-[#78350F] rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" aria-hidden="true" />
            <span>¡Ya elegiste 3 pasiones! Desmarcá una si querés cambiarla.</span>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2"
          role="group"
          aria-label="Selección de pasiones e intereses"
        >
          {interesesDisponibles.map((item) => {
            const isSelected = interesesSeleccionados.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelect(item.id)}
                className={`min-h-[52px] p-3 sm:p-4 rounded-2xl border-2 text-left font-extrabold text-sm sm:text-base flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#1CB0F6] bg-[#DDF4FF] text-[#004666] shadow-[0_4px_0_0_#1899D6]'
                    : 'border-[#E5E5E5] bg-white text-[#1B1C1C] hover:border-[#CCCCCC] shadow-[0_4px_0_0_#E5E5E5] active:translate-y-1 active:shadow-none'
                }`}
              >
                <span className="break-words">{item.etiqueta}</span>
                {isSelected ? (
                  <span className="w-6 h-6 rounded-full bg-[#1CB0F6] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-[#E5E5E5] bg-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs sm:text-sm text-[#4E4E4E] text-right pt-1 font-bold">
          {interesesSeleccionados.length} de 3 elegidos
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button
          type="button"
          disabled={interesesSeleccionados.length === 0 || isLoading}
          onClick={onSiguiente}
          className="btn-3d btn-3d-primary w-full py-4 text-base sm:text-lg min-h-[52px] flex items-center justify-center font-black"
        >
          {isLoading ? 'Cargando...' : 'Seguir'}
        </button>
      </div>
    </div>
  );
};

