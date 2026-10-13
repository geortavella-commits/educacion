import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { docenteService, type ContenidoElegible, type CursoDocente, type PlanSugerido, type ProyectoSugerido } from '@/services/docente';
import { AyudaIAProyecto } from './AyudaIAProyecto';
import { PlanificadorIA } from './PlanificadorIA';
import { SelectorContenidos } from './SelectorContenidos';
import { CamposRespuesta } from './CamposRespuesta';
import { aDatosRespuesta, desdeSugerida, respuestaVacia, traePropuesta, validarBorrador, type BorradorRespuesta } from '@/lib/borradorRespuesta';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState, LoadingSkeleton, EmptyState } from '@/components/States';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Plus, Trash2 } from 'lucide-react';

interface MisionForm {
  clave: number;
  titulo: string;
  consigna: string;
  contenidoId: string;
  respuesta: BorradorRespuesta;
  /** La IA propuso la respuesta y las pistas: se le pide a la docente que las revise. */
  sugeridaIA?: boolean;
  /** Semana del plan (1..N) a la que pertenece. Sin planificación por semanas queda sin definir. */
  semana?: number;
}

interface EtapaForm {
  semana: number;
  titulo: string;
  objetivo: string;
  contenidoIds: string[];
}

/** Próximo lunes (desde mañana) como YYYY-MM-DD: el día natural para empezar una semana de clases. */
function proximoLunes(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "lunes 19 de octubre" para la semana N que arranca el día `inicio` (YYYY-MM-DD). */
function diaDeHabilitacion(inicio: string, semana: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return '';
  const d = new Date(`${inicio}T00:00:00`);
  d.setDate(d.getDate() + (semana - 1) * 7);
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const PASOS = ['La idea', 'Contenidos', 'Misiones', 'Revisar y guardar'];

export const NuevoProyecto: React.FC = () => {
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
  const [cursoId, setCursoId] = useState('');
  const [contenidos, setContenidos] = useState<ContenidoElegible[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contenidoIds, setContenidoIds] = useState<string[]>([]);
  const [misiones, setMisiones] = useState<MisionForm[]>([{ clave: 1, titulo: '', consigna: '', contenidoId: '', respuesta: respuestaVacia() }]);
  const [etapas, setEtapas] = useState<EtapaForm[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [publicar, setPublicar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [intento, setIntento] = useState(false);
  const [paso, setPaso] = useState(1);
  const [creado, setCreado] = useState<{ id: string } | null>(null);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    docenteService
      .listarCursos()
      .then((c) => {
        setCursos(c);
        if (c.length) setCursoId(c[0].id);
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!cursoId) return;
    setContenidoIds([]);
    docenteService.listarContenidosDelCurso(cursoId).then(setContenidos).catch(() => setError(true));
  }, [cursoId]);

  const cambiarMision = (clave: number, campo: Exclude<keyof MisionForm, 'clave' | 'respuesta'>, valor: string) =>
    setMisiones((l) => l.map((m) => (m.clave === clave ? { ...m, [campo]: valor } : m)));
  const agregarMision = () => setMisiones((l) => [...l, { clave: Math.max(0, ...l.map((m) => m.clave)) + 1, titulo: '', consigna: '', contenidoId: '', respuesta: respuestaVacia() }]);
  const agregarMisionEnSemana = (semana: number) =>
    setMisiones((l) => {
      const nueva = { clave: Math.max(0, ...l.map((m) => m.clave)) + 1, titulo: '', consigna: '', contenidoId: '', respuesta: respuestaVacia(), semana };
      // Las misiones quedan ordenadas por semana: la nueva va al final de su semana.
      const ultima = l.reduce((i, m, k) => (m.semana === semana ? k : i), -1);
      return ultima === -1 ? [...l, nueva] : [...l.slice(0, ultima + 1), nueva, ...l.slice(ultima + 1)];
    });
  const cambiarEtapa = (semana: number, campo: 'titulo' | 'objetivo', valor: string) => setEtapas((l) => l.map((e) => (e.semana === semana ? { ...e, [campo]: valor } : e)));
  const quitarPlanificacion = () => {
    setEtapas([]);
    setMisiones((l) => l.map((m) => ({ ...m, semana: undefined })));
  };
  const quitarMision = (clave: number) => setMisiones((l) => (l.length > 1 ? l.filter((m) => m.clave !== clave) : l));

  // La sugerencia de la IA solo llena el formulario: la docente la revisa y la guarda (o no).
  const aplicarSugerencia = (s: ProyectoSugerido) => {
    setTitulo(s.titulo);
    setDescripcion(s.descripcion);
    setMisiones(s.misiones.map((m, i) => ({ clave: i + 1, titulo: m.titulo, consigna: m.consigna, contenidoId: m.contenidoId ?? '', respuesta: desdeSugerida(m.respuesta), sugeridaIA: traePropuesta(m.respuesta) })));
    setContenidoIds([...new Set(s.misiones.map((m) => m.contenidoId).filter((x): x is string => !!x))]);
  };

  // El plan de la IA solo llena el formulario: semanas con su objetivo, aprendizajes y misiones. La docente lo revisa y lo guarda (o no).
  const aplicarPlan = (pl: PlanSugerido) => {
    setTitulo(pl.titulo);
    setDescripcion(pl.descripcion);
    setEtapas(pl.etapas.map((e) => ({ semana: e.semana, titulo: e.titulo, objetivo: e.objetivo, contenidoIds: e.contenidoIds })));
    let clave = 0;
    setMisiones(pl.etapas.flatMap((e) => e.misiones.map((m) => ({ clave: ++clave, titulo: m.titulo, consigna: m.consigna, contenidoId: m.contenidoId ?? '', respuesta: desdeSugerida(m.respuesta), sugeridaIA: traePropuesta(m.respuesta), semana: e.semana }))));
    setContenidoIds([...new Set(pl.etapas.flatMap((e) => [...e.contenidoIds, ...e.misiones.map((m) => m.contenidoId).filter((x): x is string => !!x)]))]);
    setFechaInicio((f) => f || proximoLunes());
  };

  const planificado = etapas.length > 0;
  const faltaFecha = planificado && !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio);
  const etapaSinTitulo = planificado && etapas.some((e) => misiones.some((m) => m.semana === e.semana && m.titulo.trim()) && e.titulo.trim().length < 3);
  const misionCargadaSinSemana = planificado && misiones.some((m) => m.titulo.trim() && !etapas.some((e) => e.semana === m.semana));
  const misionesCargadas = misiones.filter((m) => m.titulo.trim().length > 0);
  const faltaTitulo = titulo.trim().length < 3;
  const errorRespuesta = (m: MisionForm) => (m.titulo.trim() ? validarBorrador(m.respuesta) : null);
  const hayErrorEnRespuestas = misiones.some((m) => errorRespuesta(m) !== null);
  const faltanMisiones = publicar && misionesCargadas.length === 0;

  // Qué falta en cada paso (los errores se muestran recién cuando la docente intenta avanzar).
  const hayErrorEnPaso = (n: number) => (n === 1 ? faltaTitulo : n === 3 ? hayErrorEnRespuestas || faltaFecha || etapaSinTitulo || misionCargadaSinSemana : n === 4 ? faltanMisiones : false);
  const irAlPaso = (n: number) => {
    setPaso(n);
    window.scrollTo({ top: 0 });
    setTimeout(() => tituloPasoRef.current?.focus(), 0); // el lector de pantalla anuncia en qué paso está
  };
  const siguiente = () => {
    setIntento(true);
    if (hayErrorEnPaso(paso)) return;
    setIntento(false);
    irAlPaso(paso + 1);
  };

  const guardar = async () => {
    setIntento(true);
    setErrorGuardar('');
    const pasoConError = [1, 3, 4].find(hayErrorEnPaso);
    if (pasoConError) {
      if (pasoConError !== paso) irAlPaso(pasoConError);
      return;
    }
    setGuardando(true);
    try {
      const r = await docenteService.crearProyecto({
        cursoId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        contenidoIds,
        misiones: misionesCargadas.map((m) => ({ titulo: m.titulo, consigna: m.consigna || undefined, contenidoId: m.contenidoId || undefined, respuesta: aDatosRespuesta(m.respuesta), semana: planificado ? m.semana : undefined })),
        // Solo viajan las semanas que tienen alguna misión cargada.
        etapas: planificado ? etapas.filter((e) => misionesCargadas.some((m) => m.semana === e.semana)).map((e) => ({ semana: e.semana, titulo: e.titulo.trim(), objetivo: e.objetivo.trim() || undefined, contenidoIds: e.contenidoIds })) : undefined,
        fechaInicio: planificado ? fechaInicio : undefined,
        publicar,
      });
      setCreado({ id: r.id });
      setGuardando(false);
      window.scrollTo({ top: 0 });
    } catch {
      setErrorGuardar('No pudimos crear el proyecto. Revisá tu conexión y probá de nuevo.');
      setGuardando(false);
    }
  };

  const renderMision = (m: MisionForm) => {
    const i = misiones.indexOf(m);
    return (
      <li key={m.clave} className="p-3 sm:p-4 bg-surface border-2 border-divider rounded-lg space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-extrabold text-sm">Misión {i + 1}</span>
          {misiones.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => quitarMision(m.clave)} aria-label={`Quitar la misión ${i + 1}`} className="gap-1">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Quitar</span>
            </Button>
          )}
        </div>
        {m.sugeridaIA && (
          <p className="p-2.5 bg-accent-100 border border-divider rounded-lg text-xs font-semibold text-text">
            La IA sugirió la respuesta y las 3 pistas de esta misión. Revisalas y cambiá lo que haga falta: al crear el proyecto quedan aprobadas.
          </p>
        )}
        <Input label="Título" value={m.titulo} onChange={(e) => cambiarMision(m.clave, 'titulo', e.target.value)} maxLength={80} placeholder="Ej.: Medí el arco con pasos" />
        <Input label="Enunciado: el problema o la tarea (opcional)" value={m.consigna} onChange={(e) => cambiarMision(m.clave, 'consigna', e.target.value)} maxLength={400} placeholder="Ej.: Si el arco mide 7 pasos y lo repartís entre 2 chicos, ¿cuántos pasos le tocan a cada uno?" />
        <CamposRespuesta idBase={`resp-${m.clave}`} valor={m.respuesta} alCambiar={(r) => setMisiones((l) => l.map((x) => (x.clave === m.clave ? { ...x, respuesta: r } : x)))} error={intento ? errorRespuesta(m) : null} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`cont-${m.clave}`} className="text-xs font-heading font-semibold text-text/80">
            Contenido que trabaja (opcional)
          </label>
          <select id={`cont-${m.clave}`} value={m.contenidoId} onChange={(e) => cambiarMision(m.clave, 'contenidoId', e.target.value)} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
            <option value="">Ninguno en particular</option>
            {contenidos.filter((c) => contenidoIds.includes(c.id) || c.id === m.contenidoId).map((c) => (
              <option key={c.id} value={c.id}>
                {c.area} · {c.descripcion}
              </option>
            ))}
          </select>
        </div>
      </li>
    );
  };

  if (creado) {
    return (
      <div className="space-y-6 w-full max-w-3xl min-w-0 font-body">
        <div className="p-5 md:p-6 bg-surface border-2 border-accent-strong rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-accent-100 text-accent-strong flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 tabIndex={-1} ref={(el) => el?.focus()} className="text-2xl font-heading font-extrabold text-text">
              ¡Listo! Creamos “{titulo.trim()}”
            </h1>
          </div>
          <p className="text-sm text-text/80">{publicar ? 'Ya está en curso: tus alumnos lo van a ver (si su familia dio el permiso).' : 'Quedó como borrador: solo lo ves vos. Lo publicás cuando quieras.'}</p>
          <div className="space-y-2">
            <h2 className="font-heading font-extrabold text-text">¿Armamos los grupos ahora?</h2>
            <p className="text-sm text-text/80">Es opcional: el proyecto lo trabaja todo el curso junto. Si querés subgrupos, te sugerimos cómo armarlos según intereses.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/docente/grupos/nuevo?proyecto=${creado.id}`} className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-sm font-heading font-bold bg-accent-strong text-on-accent border-2 border-accent-strong hover:opacity-90">
              Armar grupos ahora
            </Link>
            <Link to={`/docente/proyectos/${creado.id}`} className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-sm font-heading font-bold border-2 border-divider bg-surface hover:border-text">
              Ir al proyecto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) return <LoadingSkeleton type="card" count={2} />;
  if (error) return <ErrorState title="No pudimos cargar el formulario" message="Revisá tu conexión y reintentá." onRetry={() => window.location.reload()} />;
  if (cursos.length === 0) return <EmptyState title="Todavía no tenés cursos asignados" description="Pedile a la dirección que te asigne un curso para crear proyectos." />;

  return (
    <div className="space-y-6 w-full max-w-3xl min-w-0 font-body">
      <div className="border-b border-divider pb-4">
        <Link to="/docente/proyectos" className="inline-flex items-center gap-1 text-sm font-bold text-accent-strong hover:underline min-h-[44px]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver a proyectos</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">Nuevo proyecto</h1>
        <p className="text-sm text-text/75 mt-1">
          Contanos la idea, elegí qué contenidos del año cubre y armá las misiones. Podés guardarlo como borrador y publicarlo después.
        </p>
      </div>

      <nav aria-label="Pasos para crear el proyecto">
        <ol className="flex flex-wrap gap-x-2 gap-y-2">
          {PASOS.map((nombre, i) => {
            const n = i + 1;
            const actual = paso === n;
            const hecho = n < paso;
            const contenido = (
              <>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-heading font-extrabold shrink-0 ${actual ? 'bg-text text-surface' : hecho ? 'bg-accent-strong text-on-accent' : 'bg-neutral-200 text-text'}`}>
                  {hecho ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : n}
                </span>
                <span className={`text-sm font-heading ${actual ? 'font-extrabold text-text' : 'font-bold text-text/75'}`}>{nombre}</span>
              </>
            );
            return (
              <li key={nombre} aria-current={actual ? 'step' : undefined} className="flex items-center gap-2">
                {hecho ? (
                  <button type="button" onClick={() => irAlPaso(n)} className="inline-flex items-center gap-2 min-h-[44px] px-2 cursor-pointer hover:underline">
                    {contenido}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 min-h-[44px] px-2">{contenido}</span>
                )}
                {n < PASOS.length && <span aria-hidden="true" className="text-text/40">›</span>}
              </li>
            );
          })}
        </ol>
      </nav>

      <h2 ref={tituloPasoRef} tabIndex={-1} className="sr-only">
        Paso {paso} de {PASOS.length}: {PASOS[paso - 1]}
      </h2>

      <div hidden={paso !== 1} className="space-y-6">
      <PlanificadorIA
        cursoId={cursoId}
        anio={cursos.find((c) => c.id === cursoId)?.nivel === 'primaria' ? cursos.find((c) => c.id === cursoId)?.anio : undefined}
        hayContenido={titulo.trim().length > 0 || misionesCargadas.length > 0}
        alPlanificar={aplicarPlan}
      />

      <AyudaIAProyecto
        cursoId={cursoId}
        hayContenido={titulo.trim().length > 0 || misionesCargadas.length > 0}
        alSugerir={aplicarSugerencia}
      />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (paso < PASOS.length) siguiente(); else guardar(); }} noValidate className="space-y-8">
        <section hidden={paso !== 1} className="space-y-4" aria-labelledby="t-idea">
          <h2 id="t-idea" className="font-heading font-extrabold text-lg">
            1. La idea
          </h2>
          {cursos.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="curso-proyecto" className="text-xs font-heading font-semibold text-text/80">
                Curso
              </label>
              <select id="curso-proyecto" value={cursoId} onChange={(e) => setCursoId(e.target.value)} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Título del proyecto"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={80}
            placeholder="Ej.: La cancha del barrio"
            error={intento && faltaTitulo ? 'Escribí un título de al menos 3 letras.' : undefined}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desc-proyecto" className="text-xs font-heading font-semibold text-text/80">
              ¿De qué se trata? (opcional)
            </label>
            <textarea
              id="desc-proyecto"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={400}
              rows={3}
              className="w-full px-3 py-2 bg-surface text-text border border-divider rounded-md text-sm"
            />
          </div>
        </section>

        <section hidden={paso !== 2} className="space-y-3" aria-labelledby="t-cont">
          <h2 id="t-cont" className="font-heading font-extrabold text-lg">
            2. Contenidos que cubre ({contenidoIds.length})
          </h2>
          <p className="text-xs text-text/70">Aprendizajes del diseño curricular de Córdoba (versión en consulta del Ministerio, todavía sin validar por la escuela).</p>
          <SelectorContenidos contenidos={contenidos} elegidos={contenidoIds} alCambiar={setContenidoIds} />
        </section>

        <section hidden={paso !== 3} className="space-y-3" aria-labelledby="t-mis">
          <h2 id="t-mis" className="font-heading font-extrabold text-lg">
            3. {planificado ? 'Plan por semanas' : 'Misiones'}
          </h2>

          {planificado ? (
            <>
              <div className="p-3 bg-surface border-2 border-divider rounded-lg space-y-2">
                <Input
                  label="¿Cuándo empieza la semana 1?"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  error={intento && faltaFecha ? 'Elegí la fecha de inicio.' : undefined}
                  hint="Cada semana se habilita para tus alumnos en su día de inicio. Hasta entonces no ven esas misiones."
                />
                <Button type="button" variant="ghost" size="sm" onClick={quitarPlanificacion}>
                  Prefiero que se vea todo desde el principio (sin semanas)
                </Button>
              </div>
              {etapas.map((e) => {
                const deLaSemana = misiones.filter((m) => m.semana === e.semana);
                return (
                  <div key={e.semana} className="space-y-3 min-w-0">
                    <div className="p-3 sm:p-4 bg-neutral-100 border-2 border-divider rounded-lg space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-heading font-extrabold text-base">Semana {e.semana}</h3>
                        {diaDeHabilitacion(fechaInicio, e.semana) && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-text/80">
                            <CalendarDays className="w-4 h-4" aria-hidden="true" />
                            Se habilita el {diaDeHabilitacion(fechaInicio, e.semana)}
                          </span>
                        )}
                      </div>
                      <Input label="Título de la semana" value={e.titulo} onChange={(ev) => cambiarEtapa(e.semana, 'titulo', ev.target.value)} maxLength={80} error={intento && etapaSinTitulo && e.titulo.trim().length < 3 ? 'Escribí un título de al menos 3 letras.' : undefined} />
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`obj-${e.semana}`} className="text-xs font-heading font-semibold text-text/80">
                          Objetivo de la semana (opcional)
                        </label>
                        <textarea id={`obj-${e.semana}`} value={e.objetivo} onChange={(ev) => cambiarEtapa(e.semana, 'objetivo', ev.target.value)} maxLength={400} rows={2} className="w-full px-3 py-2 bg-surface text-text border border-divider rounded-md text-sm" />
                      </div>
                    </div>
                    <ol className="space-y-4">{deLaSemana.map(renderMision)}</ol>
                    <Button type="button" variant="secondary" size="sm" onClick={() => agregarMisionEnSemana(e.semana)} className="gap-1.5">
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Agregar misión a la semana {e.semana}</span>
                    </Button>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <ol className="space-y-4">{misiones.map(renderMision)}</ol>
              <Button type="button" variant="secondary" size="sm" onClick={agregarMision} className="gap-1.5">
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Agregar otra misión</span>
              </Button>
            </>
          )}
        </section>

        <section hidden={paso !== 4} className="space-y-4" aria-labelledby="t-pub">
          <h2 id="t-pub" className="font-heading font-extrabold text-lg">
            4. Revisá y guardá
          </h2>
          <dl className="grid gap-x-6 gap-y-2 p-4 bg-neutral-100 border border-divider text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
            <dt className="font-heading font-bold text-text/75">Título</dt>
            <dd className="break-words">{titulo.trim() || '—'}</dd>
            <dt className="font-heading font-bold text-text/75">Curso</dt>
            <dd>{cursos.find((c) => c.id === cursoId)?.nombre}</dd>
            <dt className="font-heading font-bold text-text/75">Contenidos</dt>
            <dd>{contenidoIds.length === 0 ? 'Ninguno elegido' : `${contenidoIds.length} aprendizajes del grado`}</dd>
            <dt className="font-heading font-bold text-text/75">Misiones</dt>
            <dd>
              {misionesCargadas.length}
              {planificado ? ` en ${new Set(misionesCargadas.map((m) => m.semana)).size} semanas, desde el ${diaDeHabilitacion(fechaInicio, 1) || 'día que elijas'}` : ''}
            </dd>
          </dl>
          <label className="flex items-start gap-3 p-3 bg-surface border border-divider rounded-md cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[var(--color-accent-strong)] shrink-0" />
            <span className="text-sm">
              <strong>Publicar ahora a mis alumnos.</strong> Si no lo tildás, queda como borrador y solo lo ves vos.
            </span>
          </label>
          {intento && faltanMisiones && (
            <p role="alert" className="text-xs text-accent-strong font-semibold">
              Para publicar, cargá al menos una misión con título.
            </p>
          )}
          <p className="text-xs text-text/70">La evaluación oficial es tuya: la app no califica ni genera notas.</p>
        </section>

        {errorGuardar && (
          <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
            {errorGuardar}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {paso > 1 && (
            <Button type="button" variant="secondary" onClick={() => irAlPaso(paso - 1)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Atrás</span>
            </Button>
          )}
          {paso < PASOS.length ? (
            <Button type="button" variant="primary" onClick={siguiente} className="gap-1.5">
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? 'Guardando…' : publicar ? 'Crear y publicar' : 'Guardar borrador'}
            </Button>
          )}
          <Link to="/docente/proyectos" className="inline-flex items-center min-h-[44px] px-3 text-sm font-bold text-text/80 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
};
