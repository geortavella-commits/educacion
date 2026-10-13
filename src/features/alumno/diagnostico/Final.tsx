import React from 'react';
import { formatearInteresesTexto } from '@/services/diagnostico';
import { Check } from 'lucide-react';

export interface FinalProps {
  interesesElegidos: string[];
  onFinalizar: () => void;
}

export const Final: React.FC<FinalProps> = ({
  interesesElegidos,
  onFinalizar,
}) => {
  const textoIntereses = formatearInteresesTexto(interesesElegidos);

  return (
    <div className="flex flex-col gap-6 w-full flex-1 justify-between py-6 min-w-0">
      <div className="space-y-6 text-left min-w-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-[#1E5000] shadow-md">
          <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3.5]" aria-hidden="true" />
        </div>

        <div className="space-y-3 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-[#1B1C1C] break-words">
            ¡Listo! Ya sé por dónde empezar con vos.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#4E4E4E] leading-relaxed break-words font-medium">
            Armé tus primeras misiones con <strong>{textoIntereses}</strong>. Podés cambiar tus pasiones cuando quieras desde el inicio.
          </p>
        </div>
      </div>

      <div className="pt-6 mt-auto">
        <button
          type="button"
          onClick={onFinalizar}
          className="btn-3d btn-3d-primary w-full py-4 text-base sm:text-lg min-h-[54px] flex items-center justify-center font-black"
        >
          Ver mis misiones
        </button>
      </div>
    </div>
  );
};

