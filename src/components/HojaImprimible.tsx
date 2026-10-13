import React from 'react';
import { LETRAS, rotuloDeHoja, type HojaSemana, type MisionDeHoja } from '@/lib/hojasImprimibles';

const Renglones: React.FC<{ n: number }> = ({ n }) => (
  <div aria-hidden="true" className="space-y-0">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="h-9 border-b border-slate-400" />
    ))}
  </div>
);

/** El espacio para responder cambia según el tipo, igual que en la pantalla del alumno. */
const Tablero: React.FC<{ m: MisionDeHoja }> = ({ m }) => {
  switch (m.tipo) {
    case 'numero':
      return (
        <div className="flex items-end gap-3">
          <span className="text-sm font-bold">Mi respuesta (un número):</span>
          <span className="inline-block w-40 h-11 border-2 border-slate-900 rounded-lg" aria-hidden="true" />
        </div>
      );
    case 'texto':
      return (
        <div className="flex items-end gap-3">
          <span className="text-sm font-bold">Mi respuesta corta:</span>
          <span className="flex-1 h-9 border-b-2 border-slate-900" aria-hidden="true" />
        </div>
      );
    case 'opcion':
      return (
        <div>
          <p className="text-sm font-bold mb-1.5">Marcá una opción:</p>
          <ul className="space-y-1.5">
            {m.opciones.map((o, i) => (
              <li key={o.id} className="flex items-start gap-2.5 text-base">
                <span className="inline-block w-5 h-5 mt-0.5 border-2 border-slate-900 rounded-full shrink-0" aria-hidden="true" />
                <span>
                  <strong>{LETRAS[i] ?? i + 1})</strong> {o.texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    default:
      return (
        <div>
          <p className="text-sm font-bold mb-1">Contá lo que pensaste:</p>
          <Renglones n={5} />
        </div>
      );
  }
};

/**
 * Una hoja A4 (o varias, si hay muchas misiones): una semana con todas sus misiones.
 * Sin respuestas correctas: `mostrarClaves` solo lo pide la vista de la docente.
 */
export const HojaImprimible: React.FC<{ hoja: HojaSemana; mostrarClaves?: boolean }> = ({ hoja, mostrarClaves = false }) => (
  <article className="hoja-a4 bg-white text-slate-900 font-nunito" aria-label={`Hoja: ${hoja.proyectoTitulo}, ${rotuloDeHoja(hoja)}`}>
    <header className="border-b-4 border-slate-900 pb-3 mb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-slate-700">
            Chasqui · {hoja.escuela}
            {hoja.curso ? ` · ${hoja.curso}` : ''}
          </p>
          <h1 className="text-2xl font-black leading-tight mt-1 break-words">{hoja.proyectoTitulo}</h1>
          <p className="text-lg font-extrabold text-slate-800 break-words">{rotuloDeHoja(hoja)}</p>
        </div>
        <div className="text-right text-sm font-bold shrink-0">
          {mostrarClaves ? (
            <span className="inline-block px-2 py-1 border-2 border-slate-900 rounded-lg font-black uppercase text-xs">Hoja de la docente</span>
          ) : (
            <>
              <p>
                Nombre: {hoja.alumno ? <span className="font-black">{hoja.alumno}</span> : <span className="inline-block w-44 border-b-2 border-slate-900 align-bottom">&nbsp;</span>}
              </p>
              <p className="mt-2">
                Fecha: <span className="inline-block w-28 border-b-2 border-slate-900 align-bottom">&nbsp;</span>
              </p>
            </>
          )}
        </div>
      </div>
      {hoja.objetivo && <p className="mt-2 text-sm font-semibold text-slate-800 break-words">{hoja.objetivo}</p>}
    </header>

    <ol className="space-y-6">
      {hoja.misiones.map((m, i) => (
        <li key={m.id} className="mision-hoja break-inside-avoid">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg border-2 border-slate-900 font-black flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <h2 className="text-lg font-black leading-snug break-words">{m.titulo}</h2>
              {m.enunciado && <p className="text-base font-semibold leading-relaxed whitespace-pre-line break-words">{m.enunciado}</p>}
              <Tablero m={m} />
              {mostrarClaves && m.respuestaEsperada && m.respuestaEsperada.length > 0 && (
                <p className="text-sm font-extrabold border-2 border-dashed border-slate-900 rounded-lg px-3 py-1.5 break-words">
                  Respuesta esperada: {m.respuestaEsperada.join('  ·  ')}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>

    <footer className="mt-8 pt-3 border-t-2 border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-between gap-3">
      <span>Chasqui · Tu seño o tu familia pueden ayudarte, pero pensá vos primero.</span>
      <span>No es una evaluación: es para pensar y practicar.</span>
    </footer>
  </article>
);
