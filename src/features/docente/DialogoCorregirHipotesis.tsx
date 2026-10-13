import React, { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { Check, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { EstadoHipotesis } from '@/mocks/docente';

export interface DialogoCorregirHipotesisProps {
  isOpen: boolean;
  onClose: () => void;
  alumnoNombre?: string;
  textoOriginal: string;
  estadoActual: EstadoHipotesis;
  textoCorregidoActual?: string;
  onConfirmar: () => void;
  onGuardarCorreccion: (nuevoTexto: string) => void;
  onDescartar: () => void;
}

export const DialogoCorregirHipotesis: React.FC<DialogoCorregirHipotesisProps> = ({
  isOpen,
  onClose,
  alumnoNombre,
  textoOriginal,
  textoCorregidoActual,
  onConfirmar,
  onGuardarCorreccion,
  onDescartar,
}) => {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [textoEditado, setTextoEditado] = useState(textoCorregidoActual || textoOriginal);

  const handleAbrirEdicion = () => {
    setTextoEditado(textoCorregidoActual || textoOriginal);
    setModoEdicion(true);
  };

  const handleGuardarTexto = () => {
    onGuardarCorreccion(textoEditado);
    setModoEdicion(false);
    onClose();
  };

  const handleConfirmar = () => {
    onConfirmar();
    onClose();
  };

  const handleDescartar = () => {
    onDescartar();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setModoEdicion(false);
        onClose();
      }}
      title={alumnoNombre ? `Revisar hipótesis de ${alumnoNombre}` : 'Revisar hipótesis de la app'}
      description="Las observaciones generadas por la app son hipótesis iniciales. Tu criterio docente define el seguimiento."
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-neutral-100 rounded-md border border-divider">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-strong mb-1">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hipótesis sugerida por la app:</span>
          </div>
          <p className="text-sm text-text leading-relaxed font-body">{textoOriginal}</p>
        </div>

        {modoEdicion ? (
          <div className="space-y-3 p-3 bg-surface border-2 border-accent-strong rounded-md">
            <Textarea
              label="Escribí tu observación docente"
              value={textoEditado}
              onChange={(e) => setTextoEditado(e.target.value)}
              rows={3}
              hint="Ajustá la frase para reflejar lo que observás en el aula."
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModoEdicion(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGuardarTexto}
              >
                Guardar texto corregido
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase text-text/70 block">
              Elegí una acción:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handleConfirmar}
                className="p-3 border-2 border-divider rounded-md hover:border-text hover:bg-neutral-100 text-left flex flex-col justify-between gap-1 transition-all focus-visible:ring-2 focus-visible:ring-accent-strong"
              >
                <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-text">
                  <Check className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                  <span>Es correcta</span>
                </div>
                <span className="text-xs text-text/70">Confirmar lo observado</span>
              </button>

              <button
                type="button"
                onClick={handleAbrirEdicion}
                className="p-3 border-2 border-divider rounded-md hover:border-text hover:bg-neutral-100 text-left flex flex-col justify-between gap-1 transition-all focus-visible:ring-2 focus-visible:ring-accent-strong"
              >
                <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-text">
                  <Edit3 className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                  <span>Corregir el texto</span>
                </div>
                <span className="text-xs text-text/70">Editar con tus palabras</span>
              </button>

              <button
                type="button"
                onClick={handleDescartar}
                className="p-3 border-2 border-divider rounded-md hover:border-text hover:bg-neutral-100 text-left flex flex-col justify-between gap-1 transition-all focus-visible:ring-2 focus-visible:ring-accent-strong"
              >
                <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-text">
                  <Trash2 className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                  <span>Descartar</span>
                </div>
                <span className="text-xs text-text/70">No aplica al alumno</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-text/70 border-t border-divider">
          La calificación la decidís vos. La app no califica ni genera notas.
        </div>
      </div>
    </Dialog>
  );
};
