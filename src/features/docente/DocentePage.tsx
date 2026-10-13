import React, { useEffect, useState } from 'react';
import { Curso } from '@/lib/types';
import { cursoService } from '@/services/cursoService';
import { Users, Calendar, Sparkles } from 'lucide-react';

export const DocentePage: React.FC = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cursoService.obtenerCursos().then((data) => {
      setCursos(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text break-words">
          Panel Docente
        </h1>
        <p className="text-text/70 text-sm md:text-base mt-1 break-words">
          Gestioná tus cursos y proyectos pedagógicos.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-text/60">Cargando cursos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          {cursos.map((curso) => (
            <div
              key={curso.id}
              className="bg-surface p-4 md:p-5 border-2 border-divider flex flex-col justify-between gap-4 min-w-0"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-strong bg-accent-100 px-2 py-0.5">
                    {curso.nivel}
                  </span>
                  <span className="text-xs text-text/70 font-mono">
                    Código: <strong>{curso.codigoClase}</strong>
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-heading font-bold text-text break-words">
                  {curso.nombre}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-text/70">
                  <Users className="w-3.5 h-3.5 text-accent-strong shrink-0" aria-hidden="true" />
                  <span>{curso.cantidadAlumnos} alumnos inscriptos</span>
                </div>
              </div>

              <div className="pt-3 border-t border-divider text-xs text-text/65 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text/50 shrink-0" aria-hidden="true" />
                <span className="truncate">Vencimiento: {curso.codigoVencimiento}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-accent-100/50 border border-accent-300 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-accent-strong shrink-0" aria-hidden="true" />
        <div className="text-xs text-accent-900 leading-snug">
          <strong>Aviso pedagógico:</strong> La calificación la decidís vos en el aula. Chasqui orienta con preguntas y propone hipótesis formativas.
        </div>
      </div>
    </div>
  );
};
