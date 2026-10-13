import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/Dialog';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/States';
import {
  inicioService,
  DatosInicioAlumno,
  MensajeDocente,
} from '@/services/inicio';
import {
  diagnosticoService,
  InteresItem,
  obtenerEtiquetaInteres,
} from '@/services/diagnostico';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  KeyRound,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface InicioProps {
  forcedEstado?: 'feliz' | 'vacio' | 'error' | 'sin_permiso';
}

const tipoEnPalabras = (tipo?: string) => {
  switch (tipo) {
    case 'numero':
      return 'Número';
    case 'texto':
      return 'Texto corto';
    case 'opcion':
      return 'Elegí una opción';
    case 'abierta':
      return 'Contá lo que pensaste';
    default:
      return 'Actividad';
  }
};

export const Inicio: React.FC<InicioProps> = ({ forcedEstado }) => {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<DatosInicioAlumno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sinPermiso, setSinPermiso] = useState(false);

  // Modal para cambiar pasiones
  const [isModalPasionesOpen, setIsModalPasionesOpen] = useState(false);
  const [interesesDisponibles, setInteresesDisponibles] = useState<InteresItem[]>([]);
  const [tempPasiones, setTempPasiones] = useState<string[]>([]);
  const [avisoMaximo, setAvisoMaximo] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeDocente[]>([]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(false);
    setSinPermiso(false);
    try {
      if (forcedEstado === 'sin_permiso') {
        setSinPermiso(true);
        setLoading(false);
        return;
      }
      const data = await inicioService.getDatosInicio(forcedEstado);
      if (data.sinConsentimiento) {
        setSinPermiso(true); // la familia todavía no autorizó a Chasqui
        setLoading(false);
        return;
      }
      setDatos(data);
      setTempPasiones(data.pasiones);
      inicioService.listarMensajesDocente().then(setMensajes).catch(() => setMensajes([]));
      const listaIntereses = await diagnosticoService.getInteresesDisponibles();
      setInteresesDisponibles(listaIntereses);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [forcedEstado]);

  const handleTogglePasion = (id: string) => {
    if (tempPasiones.includes(id)) {
      setTempPasiones(tempPasiones.filter((p) => p !== id));
      setAvisoMaximo(false);
    } else {
      if (tempPasiones.length >= 3) {
        setAvisoMaximo(true);
        setTimeout(() => setAvisoMaximo(false), 3000);
        return;
      }
      setTempPasiones([...tempPasiones, id]);
      setAvisoMaximo(false);
    }
  };

  const handleGuardarPasiones = async () => {
    if (tempPasiones.length === 0) return;
    await inicioService.actualizarPasiones(tempPasiones);
    if (datos) {
      setDatos({ ...datos, pasiones: tempPasiones });
    }
    setIsModalPasionesOpen(false);
  };

  // Los hooks van SIEMPRE antes de cualquier return temprano (reglas de hooks de React).
  const proyectosConMisiones = React.useMemo(() => {
    if (!datos) return [];
    const lista = datos.proyectos && datos.proyectos.length > 0
      ? datos.proyectos
      : datos.proyecto
      ? [datos.proyecto]
      : [];

    return lista.map((proy) => {
      const misionesDelProyecto = datos.misiones
        .filter((m) => m.proyectoId === proy.id)
        .sort((a, b) => a.orden - b.orden);

      const misionesFinales = misionesDelProyecto.length > 0
        ? misionesDelProyecto
        : datos.misiones.filter((m) => m.proyectoNombre === proy.nombre).sort((a, b) => a.orden - b.orden);

      return {
        ...proy,
        misiones: misionesFinales,
      };
    });
  }, [datos]);

  const proximaMisionPendienteId = React.useMemo(() => {
    if (!proyectosConMisiones.length) return null;
    const primer = proyectosConMisiones[0];
    const pend = primer.misiones.find((m) => m.estado === 'Pendiente');
    return pend ? pend.id : null;
  }, [proyectosConMisiones]);

  if (loading) {
    return (
      <div className="space-y-6 w-full max-w-full min-w-0 animate-fade-in">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={3} />
      </div>
    );
  }

  if (sinPermiso) {
    return (
      <div className="p-6 bg-surface border-2 border-divider rounded-3xl text-center space-y-4 max-w-lg mx-auto min-w-0">
        <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center text-accent-strong mx-auto">
          <KeyRound className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-heading font-extrabold text-text">
          Todavía falta el permiso de tu familia
        </h2>
        <p className="text-sm text-text/80">
          Para usar Chasqui y tus misiones, un adulto de tu familia tiene que dar su permiso.
        </p>
        <p className="text-sm text-text/80">
          Avisale a tu docente: te va a dar una invitación para que se la lleves a tu casa.
        </p>
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="py-8">
        <ErrorState
          title="No pudimos cargar tus misiones"
          message="Ocurrió un error al consultar tus datos escolares. Por favor, reintentá."
          onRetry={cargarDatos}
        />
      </div>
    );
  }

  if (datos.misiones.length === 0 && !datos.proyectos?.some((p) => p.empiezaEl)) {
    return (
      <div className="space-y-6 w-full max-w-full min-w-0">
        <EmptyState
          title="Sin misiones por hoy"
          description="Completaste todas tus actividades o tu seño todavía no asignó nuevas misiones para hoy. ¡Buen descanso!"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 font-nunito">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================== */}
        {/* COLUMNA IZQUIERDA (Perfil, IA Tutor, Pasiones) */}
        {/* ============================================== */}
        <section aria-label="Sección del Estudiante" className="lg:col-span-5 flex flex-col gap-6 min-w-0">
          {/* Card de Bienvenida & Avatar del Alumno */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-4 shadow-sm" data-purpose="user-greeting-card">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase tracking-wider mb-2">
                  ¡Hola, {datos.alumnoNombre}! 👋
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                  ¿Qué hacemos<br />hoy?
                </h1>
              </div>

              {/* Avatar circular con letra inicial */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-400 border-4 border-amber-500 text-white flex items-center justify-center font-black text-3xl shadow-inner">
                  {datos.alumnoNombre.charAt(0)}
                </div>
              </div>
            </div>

            {/* Badges de gamificación interactivos (sin vidas, sin gemas, solo estrellas y racha simple) */}
            <div className="flex flex-wrap gap-2.5 mt-6">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-full text-sm font-black shadow-xs">
                <span className="text-base text-amber-500">★</span> <span>{datos.estrellas} estrellas</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 border-2 border-orange-300 text-orange-900 rounded-full text-sm font-black shadow-xs">
                <span className="text-base">🔥</span> <span>3 días en racha</span>
              </div>
              <Link
                to="/alumno/diagnostico"
                className="btn-3d-outline inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black rounded-full shadow-xs min-h-[44px]"
              >
                <span className="text-base">🎮</span> <span>Juego de bienvenida</span>
              </Link>
            </div>
          </div>

          {/* Mensajes de la seño (si existen) */}
          {mensajes.length > 0 && (
            <div aria-labelledby="mensajes-seno" className="bg-white rounded-3xl p-6 border-2 border-rose-200 border-b-4 shadow-sm space-y-3">
              <h2 id="mensajes-seno" className="flex items-center gap-2 text-lg font-black text-slate-800">
                <MessageSquare className="w-5 h-5 text-sky-700" aria-hidden="true" />
                <span>Un mensaje de tu seño</span>
              </h2>
              <ul className="space-y-2.5">
                {mensajes.map((m) => (
                  <li key={m.id} className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-sm font-bold text-slate-700 leading-relaxed break-words whitespace-pre-line">
                    {m.texto}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Card: Tus Pasiones / Intereses (Chips) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#e5e5e5] border-b-4 shadow-sm" data-purpose="passions-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                <h3 className="text-lg font-black text-slate-800">Tus pasiones</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempPasiones(datos.pasiones);
                  setIsModalPasionesOpen(true);
                }}
                className="btn-3d-outline text-xs font-black uppercase px-3.5 py-1.5 rounded-xl min-h-[44px] cursor-pointer"
              >
                Cambiar
              </button>
            </div>
            {/* Tags de pasiones como chips en cápsula */}
            <div className="flex flex-wrap gap-2.5">
              {datos.pasiones.map((p, idx) => {
                const etiqueta = obtenerEtiquetaInteres(p);
                if (!etiqueta) return null;
                const colorStyles = [
                  'bg-violet-50 text-violet-800 border-violet-200',
                  'bg-emerald-50 text-emerald-800 border-emerald-200',
                  'bg-amber-50 text-amber-900 border-amber-200',
                  'bg-sky-50 text-sky-800 border-sky-200',
                ];
                const colorCls = colorStyles[idx % colorStyles.length];
                return (
                  <span
                    key={p}
                    className={`inline-flex items-center gap-1.5 ${colorCls} text-xs font-black px-3.5 py-1.5 rounded-full border-2`}
                  >
                    {etiqueta}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================== */}
        {/* COLUMNA DERECHA (Simulaciones y Misiones)       */}
        {/* ============================================== */}
        <section aria-label="Misiones y Desafíos" className="lg:col-span-7 flex flex-col gap-6 min-w-0">
          {/* Barrita de Misiones de Ejemplo / Enlaces Rápidos (Dev) */}
          {import.meta.env.DEV && (
            <div className="bg-white/90 rounded-2xl p-4 border-2 border-[#e5e5e5] border-dashed text-xs sm:text-sm font-bold text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-extrabold text-slate-700">Misiones de ejemplo:</span>
              <Link to="/alumno/mision/sim-1" className="text-[#006590] hover:underline font-black">
                sim-1 (Número)
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/alumno/mision/sim-2" className="text-[#006590] hover:underline font-black">
                sim-2 (Opción)
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/alumno/mision/sim-3" className="text-[#006590] hover:underline font-black">
                sim-3 (Texto)
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/alumno/mision/sim-4" className="text-[#006590] hover:underline font-black">
                sim-4 (Abierta)
              </Link>
            </div>
          )}

          {/* Contenedores de Proyectos */}
          {proyectosConMisiones.map((proy) => {
            const pct = proy.misionesTotales > 0
              ? Math.round((proy.misionesCompletadas / proy.misionesTotales) * 100)
              : 0;

            return (
              <div
                key={proy.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#e5e5e5] border-b-6 shadow-sm"
                data-purpose="project-container"
              >
                {/* Encabezado del Proyecto & Progreso (SIN rojo para el alumno) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {proy.nombre}
                  </h2>
                  {!proy.empiezaEl && <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#1e5000] border-2 border-[#a6e77c] text-xs font-black rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#58cc02] animate-pulse" />
                      {proy.misionesCompletadas} de {proy.misionesTotales} misiones completadas
                    </span>
                  </div>}
                </div>

                {proy.empiezaEl && (
                  <p role="status" className="flex items-center gap-3 p-4 mb-2 bg-[#ddf4ff] border-2 border-[#1cb0f6]/50 rounded-2xl text-[#00263a] font-extrabold text-sm sm:text-base">
                    <span aria-hidden="true" className="text-xl">🗓️</span>
                    <span>
                      Este proyecto empieza el {new Date(`${proy.empiezaEl}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}. ¡Ya falta poco!
                    </span>
                  </p>
                )}

                {/* Barra de Progreso Lúdica Duolingo */}
                {!proy.empiezaEl && <div
                  role="progressbar"
                  aria-valuenow={proy.misionesCompletadas}
                  aria-valuemin={0}
                  aria-valuemax={proy.misionesTotales}
                  aria-label={`Avance de ${proy.nombre}: ${proy.misionesCompletadas} de ${proy.misionesTotales} misiones`}
                  className="w-full bg-slate-100 h-5 rounded-full p-1 border-2 border-[#e5e5e5] mb-8"
                  data-purpose="project-progress-bar"
                >
                  <div
                    className="progress-duo-bar bg-[#58cc02] h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>}

                {/* Lista de Tarjetas de Misiones */}
                <div className="flex flex-col gap-6">
                  {proy.misiones.map((m) => {
                    const isCompletada = m.estado === 'Completada';
                    const esProxima = m.id === proximaMisionPendienteId;

                    return (
                      <article
                        key={m.id}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('a')) return;
                          navigate(`/alumno/mision/${m.id}`);
                        }}
                        className={`bg-white rounded-3xl p-6 border-2 border-[#e5e5e5] border-b-4 hover:border-slate-300 transition cursor-pointer ${
                          esProxima ? 'ring-2 ring-[#ffc800] border-amber-300' : ''
                        }`}
                        data-purpose={`mission-card-${m.id}`}
                      >
                        {/* Tags superiores y Estado de Completado */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-800 text-xs font-black px-3 py-1 rounded-xl border border-slate-200">
                              Misión {m.orden}
                            </span>
                            <span className="bg-amber-50 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-xl border border-amber-200">
                              {tipoEnPalabras(m.tipo)}
                            </span>
                            {m.materias.map((mat) => (
                              <span
                                key={mat}
                                className="bg-sky-50 text-sky-900 text-xs font-extrabold px-3 py-1 rounded-xl border border-sky-200"
                              >
                                {mat}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {esProxima && (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full animate-pulse">
                                ★ Seguí por acá
                              </span>
                            )}
                            {isCompletada ? (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-[#1e5000] bg-[#eefae6] border border-[#a6e77c] px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[#1e5000] stroke-3" />
                                Completada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Aviso: la seño le dejó un mensaje en esta misión */}
                        {m.mensajeDocente && (
                          <p className="mb-3 inline-flex items-center gap-2 text-sm font-black text-sky-900 bg-sky-50 border-2 border-sky-300 px-3 py-2 rounded-2xl">
                            <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Tu seño te dejó un mensaje</span>
                          </p>
                        )}

                        {/* Título de la tarea */}
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug mb-1">
                          {m.titulo}
                        </h3>
                        <p className="text-sm font-extrabold text-slate-500 mb-6 flex items-center gap-1.5">
                          <span>{m.materias.join(' + ') || 'Proyecto'}</span>
                          <span>•</span>
                          <span>⏱ {m.duracionMinutos} min</span>
                        </p>

                        {/* Botón de acción táctil Duolingo / Stitch */}
                        <div className="flex items-center">
                          {isCompletada ? (
                            <Link
                              to={`/alumno/mision/${m.id}`}
                              className="btn-3d-outline px-6 py-3 text-sm min-h-[48px] inline-flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                              <span>Ver de nuevo</span>
                              <span className="text-base font-bold">→</span>
                            </Link>
                          ) : (
                            <Link
                              to={`/alumno/mision/${m.id}`}
                              className="btn-3d-primary px-6 py-3 text-sm min-h-[48px] inline-flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <span>Resolver</span>
                              <span className="text-base font-bold">→</span>
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Modal para editar pasiones */}
      <Dialog
        isOpen={isModalPasionesOpen}
        onClose={() => setIsModalPasionesOpen(false)}
        title="Elegí tus pasiones"
        description="Elegí hasta 3 temas para que Chasqui arme ejemplos a tu medida."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsModalPasionesOpen(false)}
              className="btn-3d px-5 py-2.5 rounded-2xl border-2 border-slate-200 border-b-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={tempPasiones.length === 0}
              onClick={handleGuardarPasiones}
              className="btn-3d px-5 py-2.5 rounded-2xl border-b-4 border-duo-green-dark bg-duo-green hover:bg-duo-green-dark text-white font-black text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Guardar pasiones
            </button>
          </>
        }
      >
        <div className="space-y-3 font-nunito">
          {avisoMaximo && (
            <div
              role="alert"
              className="p-3 bg-amber-50 border-2 border-amber-300 border-b-4 text-amber-900 rounded-2xl text-xs font-black flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>Máximo 3 pasiones. Desmarcá una primero.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {interesesDisponibles.map((item) => {
              const isSelected = tempPasiones.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTogglePasion(item.id)}
                  className={`btn-3d p-3 rounded-2xl border-2 border-b-4 text-left font-black text-xs sm:text-sm flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 border-b-amber-500 bg-amber-50 text-amber-900'
                      : 'border-slate-200 border-b-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="break-words">{item.etiqueta}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[3] text-amber-700" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500 text-right font-extrabold">
            {tempPasiones.length} de 3 elegidos
          </div>
        </div>
      </Dialog>
    </div>
  );
};
