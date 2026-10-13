import React, { useMemo, useState } from 'react';
import { docenteService, type CoberturaProyecto } from '@/services/docente';
import { buscarAprendizajes } from '@/lib/buscarAprendizajes';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Input, Textarea } from '@/components/Input';
import { CamposRespuesta } from './CamposRespuesta';
import { aDatosRespuesta, respuestaVacia, validarBorrador } from '@/lib/borradorRespuesta';
import { ChevronDown, Info, Plus, Search } from 'lucide-react';

type Aprendizaje = CoberturaProyecto['aprendizajes'][number];
const PAGINA = 15;

const Barra: React.FC<{ valor: number; total: number; etiqueta: string }> = ({ valor, total, etiqueta }) => (
  <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={total} aria-valuenow={valor} className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5 border border-slate-300 min-w-0">
    <div className="bg-[#1cb0f6] h-full rounded-full transition-all duration-700" style={{ width: `${total ? Math.round((100 * valor) / total) : 0}%` }} />
  </div>
);

const CAMPO = 'w-full min-h-[44px] px-3.5 bg-white border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1cb0f6]/40 rounded-2xl font-bold text-sm text-slate-800 shadow-sm';
const ETIQUETA = 'block text-xs font-extrabold uppercase tracking-wide text-slate-600';

/**
 * Cobertura curricular del curso para un proyecto: un resumen corto y un buscador para llegar a cualquiera de los aprendizajes del grado.
 * No muestra todo junto: hay cientos. Se ven las materias que ya se trabajan; el resto se busca por palabra, materia o estado.
 */
export const CoberturaCurricular: React.FC<{
  proyectoId: string;
  cobertura: CoberturaProyecto;
  /** Semanas del plan del proyecto (vacío si no está planificado por semanas). */
  semanas: { semana: number; titulo: string }[];
  alCambiar: () => void;
}> = ({ proyectoId, cobertura, semanas, alCambiar }) => {
  const [consulta, setConsulta] = useState('');
  const [materia, setMateria] = useState('');
  const [estado, setEstado] = useState<'todos' | 'faltan' | 'trabajados'>('todos');
  const [limite, setLimite] = useState(PAGINA);
  const [verTodoElProyecto, setVerTodoElProyecto] = useState(false);

  const [destino, setDestino] = useState<Aprendizaje | null>(null);
  const [nombre, setNombre] = useState('');
  const [consigna, setConsigna] = useState('');
  const [semana, setSemana] = useState<number | ''>('');
  const [respuesta, setRespuesta] = useState(respuestaVacia());
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const { aprendizajes, materias } = cobertura;
  const cubiertos = aprendizajes.filter((a) => a.cubierto).length;
  const visibles = materias.filter((m) => m.enEsteProyecto > 0 || m.cubiertos > 0);
  const principales = visibles.length > 0 ? visibles : materias.slice(0, 3);
  const otras = materias.filter((m) => !principales.includes(m));

  const buscando = consulta.trim().length > 0 || materia !== '' || estado !== 'todos';
  const resultados = useMemo(() => {
    let lista = aprendizajes;
    if (materia) lista = lista.filter((a) => a.materiaId === materia);
    if (estado === 'faltan') lista = lista.filter((a) => !a.cubierto);
    if (estado === 'trabajados') lista = lista.filter((a) => a.cubierto);
    return buscarAprendizajes(lista, consulta);
  }, [aprendizajes, consulta, materia, estado]);
  // Sin buscar: solo lo que ya se trabaja en ESTE proyecto, para que la pantalla no sea una lista interminable.
  const deEsteProyecto = useMemo(() => aprendizajes.filter((a) => a.cubierto && a.detalle !== 'En otro proyecto del curso'), [aprendizajes]);
  const lista = buscando ? resultados : deEsteProyecto;
  // Sin buscar, solo unos pocos para no armar una lista interminable; con búsqueda, de a 15.
  const tope = buscando ? limite : verTodoElProyecto ? deEsteProyecto.length : 5;

  const abrir = (a: Aprendizaje) => {
    setDestino(a);
    setNombre('');
    setConsigna('');
    setRespuesta(respuestaVacia());
    setErrorRespuesta(null);
    setError('');
    setSemana(semanas.length > 0 ? semanas[0].semana : '');
  };

  const guardar = async () => {
    if (!destino) return;
    const problema = validarBorrador(respuesta);
    if (problema) {
      setErrorRespuesta(problema);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await docenteService.agregarMision(proyectoId, { titulo: nombre, consigna, contenidoId: destino.id, respuesta: aDatosRespuesta(respuesta), semana: semana === '' ? undefined : semana });
      setDestino(null);
      alCambiar();
    } catch {
      setError('No pudimos guardar la actividad. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const FilaMateria = ({ m }: { m: CoberturaProyecto['materias'][number] }) => (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[10rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <span className="text-sm font-extrabold text-slate-800 break-words">{m.nombre}</span>
      <span className="text-sm font-black text-slate-600 sm:order-3">
        {m.cubiertos} / {m.total}
      </span>
      <div className="col-span-2 sm:col-span-1 sm:order-2">
        <Barra valor={m.cubiertos} total={m.total} etiqueta={`${m.nombre}: ${m.cubiertos} de ${m.total} aprendizajes trabajados`} />
      </div>
    </li>
  );

  return (
    <section aria-labelledby="cobertura-titulo" className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-100">
        <h2 id="cobertura-titulo" className="text-2xl font-black text-slate-900">
          Cobertura curricular • {cobertura.etiquetaGrado}
        </h2>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#ddf4ff] border-2 border-[#1cb0f6]/40 text-[#004666] font-black text-sm self-start sm:self-auto">
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-[#1cb0f6]" />
          {cubiertos} de {aprendizajes.length} aprendizajes trabajados
        </span>
      </div>
      <p className="flex items-start gap-3 bg-[#ddf4ff]/40 border border-[#1cb0f6]/30 p-4 rounded-2xl text-sm font-semibold text-slate-700">
        <Info className="w-5 h-5 text-[#158ecc] shrink-0 mt-0.5" aria-hidden="true" />
        <span>Aprendizajes del Ministerio de Córdoba (versión en consulta), todavía sin validar por la escuela. Cuenta lo que se trabaja en cualquier proyecto del curso.</span>
      </p>

      {aprendizajes.length === 0 ? (
        <p className="text-sm text-text/75">Todavía no hay contenidos cargados para este año.</p>
      ) : (
        <>
          <ul className="space-y-4" aria-label="Avance por materia">
            {principales.map((m) => (
              <FilaMateria key={m.id} m={m} />
            ))}
          </ul>
          {otras.length > 0 && (
            <details className="group">
              <summary className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-black text-[#0b5e86] cursor-pointer list-none">
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                Ver las otras {otras.length} materias
              </summary>
              <ul className="space-y-3 pt-2" aria-label="Avance en las otras materias">
                {otras.map((m) => (
                  <FilaMateria key={m.id} m={m} />
                ))}
              </ul>
            </details>
          )}

          <div className="border-t-2 border-slate-100 pt-6 space-y-4">
            <h3 className="text-xl font-black text-slate-900">Buscá un aprendizaje del grado</h3>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_11rem]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="buscar-aprendizaje" className={ETIQUETA}>
                  Palabras (de cualquier parte del aprendizaje o sus indicadores)
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    id="buscar-aprendizaje"
                    type="search"
                    value={consulta}
                    onChange={(e) => { setConsulta(e.target.value); setLimite(PAGINA); }}
                    placeholder="Ej.: fracciones, medición, textos de opinión…"
                    className={`${CAMPO} pl-11 pr-4`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filtro-materia" className={ETIQUETA}>
                  Materia
                </label>
                <select id="filtro-materia" value={materia} onChange={(e) => { setMateria(e.target.value); setLimite(PAGINA); }} className={CAMPO}>
                  <option value="">Todas</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filtro-estado" className={ETIQUETA}>
                  Estado
                </label>
                <select id="filtro-estado" value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); setLimite(PAGINA); }} className={CAMPO}>
                  <option value="todos">Todos</option>
                  <option value="faltan">Los que faltan</option>
                  <option value="trabajados">Ya trabajados</option>
                </select>
              </div>
            </div>

            <p role="status" className="text-sm font-bold text-slate-700">
              {buscando
                ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`
                : deEsteProyecto.length > 0
                  ? `Lo que ya se trabaja en este proyecto (${deEsteProyecto.length}). Buscá arriba para ver los ${aprendizajes.length} aprendizajes del grado.`
                  : `Este proyecto todavía no tiene aprendizajes asociados. Buscá arriba entre los ${aprendizajes.length} del grado.`}
            </p>

            {lista.length > 0 && (
              <ul className="space-y-3.5">
                {lista.slice(0, tope).map((a) => (
                  <li key={a.id} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-3xl p-5 sm:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 min-w-0">
                    <div className="space-y-2.5 min-w-0 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 font-black text-xs text-slate-700">{a.materia}</span>
                        <span className={`px-3 py-1 rounded-xl border font-black text-xs ${a.cubierto ? 'bg-[#fff2d6] border-[#ff9600]/40 text-[#7a4200]' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {a.cubierto ? `✓ ${a.detalle ?? 'Trabajado'}` : 'Falta'}
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug break-words">{a.descripcion}</p>
                      {a.indicadores.length > 0 && (
                        <details className="group min-w-0">
                          <summary className="min-h-[44px] inline-flex items-center gap-1 text-xs font-extrabold text-slate-600 hover:text-slate-900 cursor-pointer list-none">
                            Ver indicadores de logro ({a.indicadores.length})
                            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
                          </summary>
                          <ul className="list-disc pl-5 space-y-1 text-sm font-semibold text-slate-700 pb-2">
                            {a.indicadores.map((t, i) => (
                              <li key={i} className="break-words">
                                {t}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                    <button type="button" onClick={() => abrir(a)} className="btn-3d-outline shrink-0 min-h-[44px] px-4 gap-1.5 text-xs sm:text-sm cursor-pointer self-start md:self-auto">
                      <Plus className="w-4 h-4 stroke-[3] text-[#2b6c00]" aria-hidden="true" />
                      <span>Agregar actividad</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {lista.length > tope && (
              <button type="button" onClick={() => (buscando ? setLimite((l) => l + PAGINA) : setVerTodoElProyecto(true))} className="btn-3d-outline min-h-[44px] px-4 text-sm cursor-pointer">
                Mostrar más ({lista.length - tope} restantes)
              </button>
            )}
          </div>
        </>
      )}

      {destino && (
        <Dialog
          isOpen
          onClose={() => setDestino(null)}
          title="Agregar actividad"
          description={destino.descripcion}
          actions={
            <>
              <Button variant="secondary" onClick={() => setDestino(null)}>
                Cancelar
              </Button>
              <Button variant="primary" disabled={nombre.trim().length < 3 || guardando} onClick={guardar}>
                {guardando ? 'Guardando…' : 'Guardar actividad'}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-text/75">Se crea una misión nueva en este proyecto, vinculada a este aprendizaje.</p>
            <Input label="Nombre de la actividad / misión" placeholder="Ej: Calcular la escala en el plano" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
            <Textarea label="Consigna (opcional)" placeholder="¿Cómo representarías 10 metros en tu hoja de dibujo?" rows={3} value={consigna} onChange={(e) => setConsigna(e.target.value)} maxLength={400} />
            <CamposRespuesta idBase="cobertura-actividad" valor={respuesta} alCambiar={(r) => { setRespuesta(r); setErrorRespuesta(null); }} error={errorRespuesta} />
            {semanas.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="semana-actividad" className="text-xs font-heading font-semibold text-text/80">
                  ¿En qué semana?
                </label>
                <select id="semana-actividad" value={semana} onChange={(e) => setSemana(Number(e.target.value))} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                  {semanas.map((s) => (
                    <option key={s.semana} value={s.semana}>
                      Semana {s.semana} · {s.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
                {error}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
};
