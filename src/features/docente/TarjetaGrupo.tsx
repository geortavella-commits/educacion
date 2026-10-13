import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { docenteService, type GrupoDetalle, type GrupoLista } from '@/services/docente';
import { ArrowRight, ChevronDown, FileText, Users } from 'lucide-react';

/**
 * Un grupo del proyecto, pensado como puerta de entrada a los alumnos: se ve el avance del grupo, y con un toque se despliegan sus
 * alumnos con su avance y el acceso a su perfil, donde está lo que fueron respondiendo.
 */
export const TarjetaGrupo: React.FC<{ g: GrupoLista }> = ({ g }) => {
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState<GrupoDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const alternar = () => {
    const proximo = !abierto;
    setAbierto(proximo);
    if (proximo && !detalle && !cargando) {
      setCargando(true);
      setError(false);
      docenteService
        .obtenerGrupo(g.id)
        .then(setDetalle)
        .catch(() => setError(true))
        .finally(() => setCargando(false));
    }
  };

  const idPanel = `alumnos-grupo-${g.id}`;

  return (
    <article className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-3xl p-5 space-y-4 min-w-0 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-black text-slate-800 break-words">
            <Link to={`/docente/grupos/${g.id}`} className="inline-flex items-center min-h-[44px] hover:underline">
              {g.nombreVisible}
            </Link>
          </h3>
          <p className="text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 mt-0.5">
            <Users className="w-4 h-4 text-[#158ecc]" aria-hidden="true" />
            {g.alumnos} {g.alumnos === 1 ? 'alumno' : 'alumnos'}
          </p>
        </div>
        <span className="text-xs font-black text-slate-600 shrink-0">{g.avance}%</span>
      </div>

      <div role="progressbar" aria-label={`Avance del grupo ${g.nombreVisible}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.avance} className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
        <div className="bg-[#58cc02] h-full rounded-full" style={{ width: `${g.avance}%` }} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/docente/grupos/${g.id}`}
          className="btn-3d inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-sm font-extrabold bg-slate-800 text-white border-2 border-slate-800 border-b-4 border-b-slate-950 rounded-xl hover:bg-slate-700"
        >
          <span>Ver el grupo</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <button type="button" onClick={alternar} aria-expanded={abierto} aria-controls={idPanel} className="btn-3d-outline min-h-[44px] px-4 gap-1.5 text-sm cursor-pointer">
          <span>{abierto ? 'Ocultar alumnos' : 'Ver alumnos y respuestas'}</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {abierto && (
        <div id={idPanel} className="border-t-2 border-slate-100 pt-3">
          {cargando && <p className="text-sm text-slate-600">Cargando alumnos…</p>}
          {error && (
            <p role="alert" className="text-sm font-semibold text-slate-800">
              No pudimos cargar los alumnos. Probá de nuevo.
            </p>
          )}
          {detalle && detalle.miembros.length === 0 && <p className="text-sm text-slate-600">Este grupo todavía no tiene alumnos.</p>}
          {detalle && detalle.miembros.length > 0 && (
            <ul className="space-y-2">
              {detalle.miembros.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                  <span className="font-extrabold text-sm text-slate-800 break-words min-w-0 flex-1 basis-40">{m.nombre}</span>
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    {m.completadas} de {m.total} misiones
                  </span>
                  <Link
                    to={`/docente/alumnos/${m.id}`}
                    className="btn-3d-outline min-h-[44px] px-3 gap-1.5 text-xs"
                    aria-label={`Ver lo que respondió ${m.nombre}`}
                  >
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
