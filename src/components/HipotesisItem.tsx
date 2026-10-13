import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Textarea } from './Input';
import { Pencil } from 'lucide-react';

export interface HipotesisItemProps {
  alumnoNombre: string;
  observacionHipotesis: string;
  sugerencia?: string;
  onCorregir?: (nuevaObservacion: string) => void;
  className?: string;
}

export const HipotesisItem: React.FC<HipotesisItemProps> = ({
  alumnoNombre,
  observacionHipotesis,
  sugerencia,
  onCorregir,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correccion, setCorreccion] = useState(observacionHipotesis);

  const handleGuardar = () => {
    if (onCorregir) {
      onCorregir(correccion);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'p-4 bg-surface border-2 border-divider rounded-lg flex flex-col gap-3 transition-all',
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-accent-strong">
            Hipótesis pedagógica · {alumnoNombre}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Corregir</span>
          </Button>
        </div>

        <div className="text-sm text-text/90 leading-relaxed font-body break-words">
          <p>
            <strong>Según su actividad reciente:</strong> {observacionHipotesis}
          </p>
          {sugerencia && (
            <p className="text-xs text-text/70 mt-1 italic break-words">
              <strong>Sugerencia de abordaje:</strong> {sugerencia}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-divider flex items-center justify-between text-xs text-text/70 flex-wrap gap-1">
          <span>La calificación la decidís vos (el docente).</span>
          <span className="font-semibold text-accent-strong">Hipótesis de la app</span>
        </div>
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Ajustar observación de ${alumnoNombre}`}
        description="Tu criterio profesional como docente siempre prevalece sobre las hipótesis automáticas."
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuardar}>
              Guardar ajuste
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Tu corrección u observación docente"
            value={correccion}
            onChange={(e) => setCorreccion(e.target.value)}
            rows={4}
            hint="Escribí lo que observás en el aula para calibrar el acompañamiento."
          />
        </div>
      </Dialog>
    </>
  );
};
