import React, { useState } from 'react';
import { docenteService } from '@/services/docente';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { MARCAS_VALORACION, marcaDe, type MarcaValoracion, type ValoracionMision } from '@/lib/valoracionMision';
import { MessageSquareHeart } from 'lucide-react';

/**
 * La docente deja, sobre UN ejercicio de un alumno, una marca suave y un mensaje corto. No es una nota: el alumno la lee en esa misión.
 */
export const ValorarMision: React.FC<{ misionId: string; alumnoId: string; nombre: string; inicial?: ValoracionMision }> = ({ misionId, alumnoId, nombre, inicial }) => {
  const [actual, setActual] = useState<ValoracionMision | undefined>(inicial);
  const [editando, setEditando] = useState(false);
  const [marca, setMarca] = useState<MarcaValoracion>(inicial?.marca ?? 'encaminado');
  const [mensaje, setMensaje] = useState(inicial?.mensaje ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      await docenteService.valorarMision(misionId, alumnoId, marca, mensaje);
      setActual({ marca, mensaje: mensaje.trim() });
      setEditando(false);
    } catch {
      setError('No pudimos guardar el mensaje. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async () => {
    setGuardando(true);
    setError('');
    try {
      await docenteService.quitarValoracionMision(misionId, alumnoId);
      setActual(undefined);
      setMensaje('');
      setMarca('encaminado');
      setEditando(false);
    } catch {
      setError('No pudimos quitar el mensaje. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <div className="space-y-2">
        {actual && (
          <p className="text-sm text-text bg-accent-100 border border-divider rounded-lg px-3 py-2 break-words whitespace-pre-line">
            <strong className="font-heading font-bold">{marcaDe(actual.marca).docente}</strong>
            {actual.mensaje ? ` — ${actual.mensaje}` : ''}
          </p>
        )}
        <Button variant="secondary" size="md" onClick={() => setEditando(true)} className="text-xs font-bold min-h-[44px] px-3.5 gap-1.5">
          <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
          <span>{actual ? 'Cambiar mi mensaje' : `Valorar y escribirle a ${nombre}`}</span>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="space-y-3 p-3 border-2 border-divider rounded-lg bg-surface"
    >
      <fieldset className="space-y-2">
        <legend className="text-xs font-heading font-bold text-text/75">Cómo va en esta misión</legend>
        <div className="flex flex-wrap gap-2">
          {MARCAS_VALORACION.map((m) => (
            <label
              key={m.valor}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl border-2 text-sm font-bold cursor-pointer ${marca === m.valor ? 'border-accent-strong bg-accent-100' : 'border-divider bg-white'}`}
            >
              <input type="radio" name={`marca-${misionId}`} value={m.valor} checked={marca === m.valor} onChange={() => setMarca(m.valor)} className="w-4 h-4 accent-[#2b6c00]" />
              <span>{m.docente}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Textarea
        label="Mensaje para el alumno (opcional)"
        value={mensaje}
        maxLength={600}
        rows={3}
        onChange={(e) => setMensaje(e.target.value)}
        hint="Lo lee en esa misión. Sin notas ni puntajes: una idea concreta y amable."
      />
      {error && (
        <p role="alert" className="text-sm font-bold text-text">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="md" isLoading={guardando} className="min-h-[44px] px-4 text-sm font-bold">
          Guardar
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={() => setEditando(false)} disabled={guardando} className="min-h-[44px] px-4 text-sm font-bold">
          Cancelar
        </Button>
        {actual && (
          <Button type="button" variant="secondary" size="md" onClick={() => void quitar()} disabled={guardando} className="min-h-[44px] px-4 text-sm font-bold">
            Quitar mi mensaje
          </Button>
        )}
      </div>
    </form>
  );
};
