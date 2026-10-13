import React, { useState } from 'react';
import { docenteService } from '@/services/docente';
import { Button } from '@/components/Button';
import { FileCheck2 } from 'lucide-react';

/**
 * Cierra una misión que el alumno resolvió en la hoja impresa: lo escrito en papel no vuelve al sistema, así que la docente lo marca.
 * No toca lo que el alumno ya hizo en pantalla.
 */
export const HechaEnPapel: React.FC<{ misionId: string; alumnoId: string; nombre: string; inicialEnPapel: boolean }> = ({ misionId, alumnoId, nombre, inicialEnPapel }) => {
  const [enPapel, setEnPapel] = useState(inicialEnPapel);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = async (marcar: boolean) => {
    setTrabajando(true);
    setError('');
    try {
      if (marcar) await docenteService.marcarMisionEnPapel(misionId, alumnoId);
      else await docenteService.desmarcarMisionEnPapel(misionId, alumnoId);
      setEnPapel(marcar);
    } catch {
      setError('No pudimos guardarlo. Probá de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {enPapel ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-text bg-accent-100 border border-divider rounded-lg px-3 py-2">
            <FileCheck2 className="w-4 h-4 text-accent-strong" aria-hidden="true" />
            Hecha en papel: {nombre} la resolvió en la hoja
          </span>
          <Button variant="secondary" size="md" isLoading={trabajando} onClick={() => void cambiar(false)} className="text-xs font-bold min-h-[44px] px-3.5">
            Deshacer
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="md" isLoading={trabajando} onClick={() => void cambiar(true)} className="text-xs font-bold min-h-[44px] px-3.5 gap-1.5">
          <FileCheck2 className="w-4 h-4" aria-hidden="true" />
          <span>Marcar como hecha en papel</span>
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-text">
          {error}
        </p>
      )}
    </div>
  );
};
