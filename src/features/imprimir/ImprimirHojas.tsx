import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { docenteService } from '@/services/docente';
import { familiaService } from '@/services/familia';
import { HojaImprimible } from '@/components/HojaImprimible';
import { rotuloDeHoja, type HojaSemana } from '@/lib/hojasImprimibles';
import { ErrorState, LoadingSkeleton } from '@/components/States';
import { ArrowLeft, Printer } from 'lucide-react';

const TODAS = 'todas';

/**
 * Hojas imprimibles: UNA POR SEMANA con todas las misiones de esa semana.
 * Se imprime (o se guarda como PDF) con el diálogo del navegador. La barra de arriba no sale en el papel.
 *  - Docente: /docente/proyectos/:id/imprimir  (puede incluir una hoja con las respuestas esperadas, solo para ella)
 *  - Familia: /familia/imprimir?hijo=…        (solo semanas ya habilitadas y sin respuestas correctas)
 */
export const ImprimirHojas: React.FC<{ origen: 'docente' | 'familia' }> = ({ origen }) => {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const alumnoId = params.get('hijo') ?? '';
  const [hojas, setHojas] = useState<HojaSemana[] | null>(null);
  const [error, setError] = useState(false);
  const [claves, setClaves] = useState(false);

  useEffect(() => {
    document.title = 'Hojas para imprimir · Chasqui';
  }, []);

  useEffect(() => {
    setHojas(null);
    setError(false);
    const carga = origen === 'docente' ? docenteService.obtenerHojasProyecto(id ?? '', claves) : familiaService.obtenerHojasHijo(alumnoId);
    carga.then(setHojas).catch(() => setError(true));
  }, [origen, id, alumnoId, claves]);

  const volver = origen === 'docente' ? `/docente/proyectos/${id ?? ''}` : '/familia';

  const clave = (h: HojaSemana) => `${h.proyectoId}:${h.semana ?? 'sin'}`;
  const elegida = params.get('semana') ?? '';
  const visibles = useMemo(() => {
    if (!hojas) return [];
    if (elegida === TODAS) return hojas;
    return [hojas.find((h) => clave(h) === elegida) ?? hojas[0]].filter(Boolean) as HojaSemana[];
  }, [hojas, elegida]);

  return (
    <div className="min-h-screen bg-slate-100 font-nunito text-slate-900 tema-adultos">
      <div className="no-imprimir bg-white border-b-2 border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-end gap-x-5 gap-y-3">
          <Link to={volver} className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-extrabold text-[#2b6c00] hover:underline">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Volver</span>
          </Link>

          {hojas && hojas.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="hoja-elegida" className="text-xs font-black uppercase tracking-wide text-slate-600">
                Qué imprimir
              </label>
              <select
                id="hoja-elegida"
                value={elegida === TODAS ? TODAS : clave(visibles[0] ?? hojas[0])}
                onChange={(e) => {
                  const p = new URLSearchParams(params);
                  p.set('semana', e.target.value);
                  setParams(p, { replace: true });
                }}
                className="min-h-[44px] px-3 bg-white border-2 border-slate-300 rounded-2xl text-sm font-bold max-w-xs"
              >
                {hojas.map((h) => (
                  <option key={clave(h)} value={clave(h)}>
                    {hojas.some((x) => x.proyectoId !== hojas[0].proyectoId) ? `${h.proyectoTitulo} — ` : ''}
                    {rotuloDeHoja(h)}
                  </option>
                ))}
                {hojas.length > 1 && <option value={TODAS}>Todas las semanas (una hoja por semana)</option>}
              </select>
            </div>
          )}

          {origen === 'docente' && (
            <label className="inline-flex items-center gap-2 min-h-[44px] text-sm font-bold cursor-pointer">
              <input type="checkbox" checked={claves} onChange={(e) => setClaves(e.target.checked)} className="w-5 h-5 accent-[#2b6c00]" />
              <span>Incluir respuestas esperadas (hoja de la docente)</span>
            </label>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!hojas || hojas.length === 0}
            className="btn-3d btn-3d-primary min-h-[48px] px-5 gap-2 text-sm cursor-pointer ml-auto"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Imprimir o guardar como PDF</span>
          </button>
        </div>
        <p className="max-w-4xl mx-auto px-4 pb-3 text-xs font-semibold text-slate-700">
          Se abre el diálogo de impresión del navegador: elegí tu impresora, o “Guardar como PDF” para llevarla en el celular.
          {origen === 'docente' && claves ? ' Esta hoja tiene las respuestas: no se la des a los chicos.' : ''}
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-2 sm:px-4 py-6 space-y-6">
        {!hojas && !error && <LoadingSkeleton type="card" count={2} />}
        {error && <ErrorState title="No pudimos preparar la hoja" message="Revisá tu conexión y volvé a intentar." onRetry={() => setClaves((c) => c)} />}
        {hojas && hojas.length === 0 && (
          <div className="no-imprimir bg-white border-2 border-slate-200 rounded-3xl p-6 text-center space-y-2">
            <h2 className="text-lg font-black">Todavía no hay misiones para imprimir</h2>
            <p className="text-sm font-semibold text-slate-700">
              {origen === 'familia' ? 'Cuando empiece la semana de un proyecto en curso, la hoja aparece acá.' : 'Cuando el proyecto tenga misiones, vas a poder imprimirlas por semana.'}
            </p>
          </div>
        )}
        {visibles.map((h) => (
          <HojaImprimible key={clave(h)} hoja={h} mostrarClaves={origen === 'docente' && claves} />
        ))}
      </main>
    </div>
  );
};
