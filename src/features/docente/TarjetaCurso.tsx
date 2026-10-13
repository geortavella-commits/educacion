import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MiembroGrupo } from '@/services/docente';
import { ChevronDown, FileText, Users } from 'lucide-react';

/**
 * "Todo el curso": el proyecto abarca a todos los alumnos, estén o no en un grupo. Misma idea que la tarjeta de un grupo:
 * avance de conjunto y, con un toque, cada alumno con acceso a lo que fue respondiendo.
 */
export const TarjetaCurso: React.FC<{ curso: string; participantes: MiembroGrupo[]; avance: number }> = ({ curso, participantes, avance }) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <article className="bg-white border-2 border-[#1cb0f6]/50 rounded-3xl p-5 space-y-4 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-black text-slate-800 break-words">Todo el curso{curso ? ` · ${curso}` : ''}</h3>
          <p className="text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 mt-0.5">
            <Users className="w-4 h-4 text-[#158ecc]" aria-hidden="true" />
            {participantes.length} {participantes.length === 1 ? 'alumno' : 'alumnos'}
          </p>
        </div>
        <span className="text-xs font-black text-slate-600 shrink-0">{avance}%</span>
      </div>

      <div role="progressbar" aria-label="Avance de todo el curso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avance} className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
        <div className="bg-[#58cc02] h-full rounded-full" style={{ width: `${avance}%` }} />
      </div>

      <button type="button" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto} aria-controls="alumnos-todo-el-curso" className="btn-3d-outline min-h-[44px] px-4 gap-1.5 text-sm cursor-pointer">
        <span>{abierto ? 'Ocultar alumnos' : 'Ver alumnos y respuestas'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {abierto && (
        <div id="alumnos-todo-el-curso" className="border-t-2 border-slate-100 pt-3">
          {participantes.length === 0 ? (
            <p className="text-sm text-slate-600">Este curso todavía no tiene alumnos inscriptos.</p>
          ) : (
            <ul className="space-y-2">
              {participantes.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                  <span className="font-extrabold text-sm text-slate-800 break-words min-w-0 flex-1 basis-40">{m.nombre}</span>
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    {m.completadas} de {m.total} misiones
                  </span>
                  <Link to={`/docente/alumnos/${m.id}`} className="btn-3d-outline min-h-[44px] px-3 gap-1.5 text-xs" aria-label={`Ver lo que respondió ${m.nombre}`}>
                    <FileText className="w-4 h-4 text-[#158ecc]" aria-hidden="true" />
                    <span>Ver respuestas</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
};
