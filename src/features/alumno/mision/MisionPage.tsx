import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  misionService,
  MisionParaResolver,
  ResultadoRespuesta,
} from '@/services';
import { LoadingSkeleton, ErrorState } from '@/components/States';
import { marcaDe } from '@/lib/valoracionMision';
import { ChasquiMascota } from './ChasquiMascota';
import { ModalExitoMision } from './ModalExitoMision';
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react';

export const MisionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados de datos y carga
  const [mision, setMision] = useState<MisionParaResolver | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [sinPermiso, setSinPermiso] = useState(false);

  // Estados de interacción
  const [respuesta, setRespuesta] = useState('');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRespuesta | null>(null);
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);
  const [tipoFeedback, setTipoFeedback] = useState<'info' | 'advertencia' | 'espera' | null>(null);

  // Pista
  const [pistas, setPistas] = useState<string[]>([]);
  const [totalPistas, setTotalPistas] = useState(0);
  const [pidiendoPista, setPidiendoPista] = useState(false);
  const [hayPistaDisponible, setHayPistaDisponible] = useState(true);

  // Demasiados intentos (cuenta regresiva)
  const [segundosEspera, setSegundosEspera] = useState(0);

  // Modal de éxito
  const [modalExitoOpen, setModalExitoOpen] = useState(false);

  // Referencias para foco
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const misionIdRealRef = useRef<string>(id || 'sim-1');

  // Mapeo seguro de alias en desarrollo si se ingresa con ids iniciales mis-1..mis-4
  const resolverMisionConFallback = async (misionId: string): Promise<MisionParaResolver> => {
    try {
      misionIdRealRef.current = misionId;
      return await misionService.obtenerMision(misionId);
    } catch (err: unknown) {
      // Si la misión no se encuentra por ser un id de ejemplo antiguo, resolvemos a una de las simuladas equivalentes
      let fallbackId = '';
      if (misionId === 'mis-1') fallbackId = 'sim-4'; // abierta
      else if (misionId === 'mis-2') fallbackId = 'sim-1'; // numero
      else if (misionId === 'mis-3') fallbackId = 'sim-2'; // opcion
      else if (misionId === 'mis-4') fallbackId = 'sim-1'; // numero

      if (fallbackId) {
        misionIdRealRef.current = fallbackId;
        return await misionService.obtenerMision(fallbackId);
      }
      throw err;
    }
  };

  const cargarMision = async () => {
    if (!id) {
      setNoEncontrada(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorCarga(false);
    setNoEncontrada(false);
    setSinPermiso(false);
    setResultado(null);
    setMensajeFeedback(null);
    setTipoFeedback(null);
    setPistas([]);
    setTotalPistas(0);
    setModalExitoOpen(false);

    try {
      const data = await resolverMisionConFallback(id);
      setMision(data);
      setHayPistaDisponible(data.hayPista);

      if (data.sinConsentimiento) {
        setSinPermiso(true);
        setLoading(false);
        return;
      }

      // Precarga si hay respuesta previa (misiones abiertas)
      if (data.tipo === 'abierta' && data.respuestaPrevia) {
        setRespuesta(data.respuestaPrevia);
      } else {
        setRespuesta('');
      }
      setOpcionSeleccionada('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'no_encontrada') {
        setNoEncontrada(true);
      } else {
        setErrorCarga(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMision();
  }, [id]);

  // Manejo de la cuenta regresiva para demasiados intentos
  useEffect(() => {
    if (segundosEspera <= 0) return;

    const timer = setInterval(() => {
      setSegundosEspera((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMensajeFeedback(null);
          setTipoFeedback(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosEspera]);

  // Si ya había pedido pistas en esta misión, vuelven a aparecer (y se sabe cuántas hay en total).
  useEffect(() => {
    if (!mision) return;
    setTotalPistas(mision.cantidadPistas ?? 0);
    if ((mision.pistasUsadas ?? 0) > 0) {
      misionService
        .pedirPista(misionIdRealRef.current)
        .then((r) => {
          setPistas(r.pistas);
          setTotalPistas(r.total);
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mision?.id]);

  // Manejador para pedir pista
  const handlePedirPista = async (otra = false) => {
    if (!mision) return;
    setPidiendoPista(true);
    try {
      const r = await misionService.pedirPista(misionIdRealRef.current, otra);
      setPistas(r.pistas);
      setTotalPistas(r.total);
    } catch {
      setHayPistaDisponible(false);
    } finally {
      setPidiendoPista(false);
    }
  };

  // Manejador para enviar respuesta
  const handleEnviarRespuesta = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mision || enviando || segundosEspera > 0) return;

    const valorAEnviar = mision.tipo === 'opcion' ? opcionSeleccionada : respuesta.trim();
    if (!valorAEnviar) return;

    setEnviando(true);
    setMensajeFeedback(null);
    setTipoFeedback(null);

    try {
      const res = await misionService.enviarRespuesta(misionIdRealRef.current, valorAEnviar);
      setResultado(res);

      if (res.estado === 'correcta' || res.estado === 'entregada') {
        setModalExitoOpen(true);
      } else if (res.estado === 'incorrecta') {
        setTipoFeedback('advertencia');
        setMensajeFeedback(
          'Todavía no, ¡probá de nuevo! Podés revisar tu idea o pedir una pista.'
        );
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else if (res.estado === 'formato_invalido') {
        setTipoFeedback('info');
        if (mision.tipo === 'numero') {
          setMensajeFeedback('Escribí un número, por ejemplo 3,5 o 7/2.');
        } else if (mision.tipo === 'opcion') {
          setMensajeFeedback('Elegí una de las opciones para continuar.');
        } else {
          setMensajeFeedback('Por favor, escribí una respuesta válida.');
        }
        inputRef.current?.focus();
      } else if (res.estado === 'demasiados_intentos') {
        const segs = res.segundosEspera || 60;
        setSegundosEspera(segs);
        setTipoFeedback('espera');
        setMensajeFeedback(
          `Probaste muchas veces seguidas. Descansá un ratito y volvé en ${segs} segundos.`
        );
      } else if (res.estado === 'sin_permiso') {
        setSinPermiso(true);
      } else if (res.estado === 'error') {
        setTipoFeedback('advertencia');
        setMensajeFeedback(
          'No pudimos comprobar tu respuesta. Revisá tu conexión y probá de nuevo.'
        );
      }
    } catch {
      setTipoFeedback('advertencia');
      setMensajeFeedback(
        'Ocurrió un problema de red al enviar tu respuesta. Por favor, reintentá.'
      );
    } finally {
      setEnviando(false);
    }
  };

  // Pasar a la siguiente misión desde el modal
  const handleAvanzarSiguiente = () => {
    setModalExitoOpen(false);
    if (resultado?.siguiente) {
      navigate(`/alumno/mision/${resultado.siguiente.id}`);
    } else {
      navigate('/alumno');
    }
  };

  // ESTADO: Cargando
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto py-6 sm:py-8 space-y-6 min-w-0 animate-fade-in">
        <LoadingSkeleton type="row" count={1} />
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={2} />
      </div>
    );
  }

  // ESTADO: Sin consentimiento familiar
  if (sinPermiso) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-12 min-w-0 font-nunito">
        <div className="p-6 sm:p-8 bg-white border-2 border-slate-200 border-b-6 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mx-auto border-2 border-amber-300">
            <KeyRound className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            Sin autorización familiar
          </h1>
          <p className="text-sm font-bold text-slate-600 leading-relaxed">
            Para interactuar con Chasqui y tus misiones, un adulto responsable de tu familia debe otorgar el consentimiento en el portal familiar.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/familia"
              className="btn-3d-primary text-sm px-6 py-3 w-full sm:w-auto text-center cursor-pointer min-h-[44px]"
            >
              Ir a pantalla familiar
            </Link>
            <Link
              to="/alumno"
              className="btn-3d-outline text-sm px-6 py-3 w-full sm:w-auto text-center cursor-pointer min-h-[44px]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO: Misión no encontrada
  if (noEncontrada) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-12 min-w-0 font-nunito">
        <div className="p-6 sm:p-8 bg-white border-2 border-slate-200 border-b-6 rounded-3xl text-center space-y-4 shadow-sm">
          <ChasquiMascota estado="pensando" size="md" className="mx-auto" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            Esta misión no está disponible
          </h1>
          <p className="text-sm font-bold text-slate-600 leading-relaxed">
            Es posible que ya haya finalizado o que el enlace sea diferente. Podés regresar a tus proyectos activos.
          </p>
          <div className="pt-2">
            <Link
              to="/alumno"
              className="btn-3d-primary text-sm px-6 py-3 inline-block cursor-pointer min-h-[44px]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO: Error de red o carga
  if (errorCarga || !mision) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-12 min-w-0 font-nunito">
        <ErrorState
          title="No pudimos cargar la misión"
          message="Ocurrió un error al consultar tu actividad. Por favor, comprobá tu conexión y reintentá."
          onRetry={cargarMision}
        />
      </div>
    );
  }

  // Cálculo de progreso para barra gruesa estilo Duolingo
  const porcentaje = Math.round((mision.orden / mision.total) * 100);
  const esAbierta = mision.tipo === 'abierta';
  const textoBoton = enviando
    ? esAbierta
      ? 'Entregando…'
      : 'Comprobando…'
    : esAbierta
    ? 'Entregar'
    : 'Comprobar';

  const valorActual = mision.tipo === 'opcion' ? opcionSeleccionada : respuesta.trim();
  const botonDeshabilitado = !valorActual || enviando || segundosEspera > 0;

  return (
    <div className="w-full max-w-3xl mx-auto py-2 sm:py-4 px-1 flex flex-col gap-6 min-w-0 font-nunito">
      {/* 1. Barra de cabecera con navegación y progreso grueso del proyecto */}
      <header className="space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <Link
            to="/alumno"
            aria-label="Inicio, volver a la lista de misiones"
            className="btn-3d inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-200 border-b-4 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 stroke-[3]" aria-hidden="true" />
            <span>Inicio</span>
          </Link>

          <div className="text-right min-w-0">
            <span className="text-xs sm:text-sm font-extrabold text-slate-500 block break-words">
              Proyecto: {mision.proyectoNombre}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#006590]">
              Misión {mision.orden} de {mision.total}
            </span>
          </div>
        </div>

        {/* Barra de progreso gruesa estilo Duolingo con brillo */}
        <div
          role="progressbar"
          aria-valuenow={mision.orden}
          aria-valuemin={1}
          aria-valuemax={mision.total}
          aria-label={`Progreso del proyecto: Misión ${mision.orden} de ${mision.total}`}
          className="w-full bg-slate-100 h-5 rounded-full p-1 border-2 border-slate-200 shadow-xs"
        >
          <div
            className="progress-duo-bar bg-duo-green h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </header>

      {/* Banner si la misión ya fue completada antes */}
      {mision.completada && (
        <aside
          role="status"
          className="p-4 bg-emerald-50 border-2 border-emerald-300 border-b-4 rounded-3xl flex items-center justify-between gap-3 min-w-0 shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[3] shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-black text-emerald-800 break-words">
              ¡Ya resolviste esta misión! Podés practicarla de nuevo cuantas veces quieras.
            </span>
          </div>
        </aside>
      )}

      {/* Lo que la docente le dejó en esta misión: aliento, nunca una nota */}
      {mision.valoracionDocente && (
        <aside aria-label="Mensaje de tu docente" className="p-4 bg-sky-50 border-2 border-sky-300 border-b-4 rounded-3xl space-y-1.5 min-w-0 shadow-xs">
          <p className="text-sm font-black text-sky-900 break-words">{marcaDe(mision.valoracionDocente.marca).alumno}</p>
          {mision.valoracionDocente.mensaje && <p className="text-sm font-semibold text-slate-800 whitespace-pre-line break-words">{mision.valoracionDocente.mensaje}</p>}
        </aside>
      )}

      {/* 2. Cuerpo del problema: Enunciado protagonista y Mascota */}
      <section className="bg-white border-2 border-slate-200 border-b-6 rounded-3xl p-6 sm:p-7 md:p-8 space-y-6 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4 min-w-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="bg-slate-100 text-slate-700 text-xs font-black px-3 py-1 rounded-xl border border-slate-200 inline-block">
              Misión {mision.orden}
            </span>
            <h1
              id="titulo-mision"
              className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-snug break-words"
            >
              {mision.titulo}
            </h1>
          </div>

          <ChasquiMascota
            estado={resultado?.estado === 'incorrecta' ? 'pensando' : mision.completada ? 'tranquilo' : 'normal'}
            size="md"
            className="shrink-0 self-center sm:self-auto"
          />
        </div>

        {/* Enunciado protagonista con tipografía grande y saltos de línea */}
        <div
          id="enunciado-mision"
          className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 leading-relaxed whitespace-pre-line break-words p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl"
        >
          {mision.enunciado}
        </div>

        {/* 3. Zona de respuesta según el tipo */}
        <form onSubmit={handleEnviarRespuesta} className="space-y-5 pt-2 min-w-0">
          {/* Tipo: Número */}
          {mision.tipo === 'numero' && (
            <div className="space-y-2 min-w-0">
              <label
                htmlFor="campo-numero"
                className="block text-sm sm:text-base font-black text-slate-800"
              >
                Tu respuesta
              </label>
              <p id="ayuda-numero" className="text-xs sm:text-sm font-bold text-slate-500">
                Podés escribir 3,5 o 7/2
              </p>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                id="campo-numero"
                type="text"
                inputMode="decimal"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                disabled={enviando || segundosEspera > 0}
                aria-describedby="ayuda-numero"
                placeholder="Ej: 3,5"
                className="w-full text-xl sm:text-2xl font-black p-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-[#1cb0f6] focus:outline-none focus:ring-0 transition-all shadow-xs"
              />
            </div>
          )}

          {/* Tipo: Texto corto */}
          {mision.tipo === 'texto' && (
            <div className="space-y-2 min-w-0">
              <label
                htmlFor="campo-texto"
                className="block text-sm sm:text-base font-black text-slate-800"
              >
                Tu respuesta
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                id="campo-texto"
                type="text"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                disabled={enviando || segundosEspera > 0}
                placeholder="Escribí acá tu respuesta..."
                className="w-full text-lg sm:text-xl font-black p-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-[#1cb0f6] focus:outline-none focus:ring-0 transition-all shadow-xs"
              />
            </div>
          )}

          {/* Tipo: Opción múltiple */}
          {mision.tipo === 'opcion' && (
            <div
              role="radiogroup"
              aria-labelledby="enunciado-mision"
              className="space-y-3 min-w-0"
            >
              <span className="block text-xs sm:text-sm font-black text-slate-700">
                Elegí una opción:
              </span>
              {mision.opciones.map((opc) => {
                const isSelected = opcionSeleccionada === opc.id;
                return (
                  <button
                    key={opc.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setOpcionSeleccionada(opc.id)}
                    className={`btn-3d w-full min-h-[52px] p-4 rounded-2xl border-2 border-b-4 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ddf4ff] border-[#1cb0f6] border-b-[#1899d6] text-[#00263a] shadow-sm'
                        : 'bg-white border-[#e5e5e5] border-b-[#d4d4d4] hover:bg-slate-50 text-[#1b1c1c]'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black break-words flex-1">
                      {opc.texto}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#1cb0f6] bg-[#1cb0f6] text-white'
                          : 'border-slate-300 bg-slate-100 text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tipo: Abierta / Reflexión */}
          {mision.tipo === 'abierta' && (
            <div className="space-y-2 min-w-0">
              <label
                htmlFor="campo-abierta"
                className="block text-sm sm:text-base font-black text-slate-800"
              >
                Contá lo que pensaste
              </label>
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                id="campo-abierta"
                rows={4}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                disabled={enviando || segundosEspera > 0}
                placeholder="Escribí acá tu explicación o tus ideas..."
                className="w-full text-base font-bold p-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-[#1cb0f6] focus:outline-none transition-all shadow-xs leading-relaxed"
              />
            </div>
          )}

          {/* Feedback inline / franja de "Todavía no" en Ámbar suave (sin rojo) */}
          {mensajeFeedback && (
            <div
              role={tipoFeedback === 'advertencia' || tipoFeedback === 'espera' ? 'alert' : 'status'}
              className={`p-4 rounded-2xl border-2 border-b-4 flex items-start gap-3 animate-slide-up text-xs sm:text-sm font-black leading-relaxed ${
                tipoFeedback === 'espera'
                  ? 'bg-slate-100 border-slate-300 border-b-slate-400 text-slate-700'
                  : tipoFeedback === 'advertencia'
                  ? 'bg-[#fff8eb] border-[#f59e0b] border-b-[#d97706] text-[#78350f]'
                  : 'bg-sky-50 border-sky-300 border-b-sky-400 text-sky-900'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-inherit" aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <p className="break-words">{mensajeFeedback}</p>
                {segundosEspera > 0 && (
                  <p className="font-mono text-xs opacity-90">
                    Tiempo restante: {segundosEspera}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recuadro de pista solicitada */}
          {pistas.length > 0 && (
            <aside
              role="status"
              aria-live="polite"
              className="p-5 bg-sky-50 border-2 border-sky-300 border-b-4 rounded-2xl text-sky-900 space-y-3 animate-slide-up"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase text-sky-700">
                <Lightbulb className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span>
                  {pistas.length === 1 ? 'Pista de la seño' : 'Pistas de la seño'} · {pistas.length} de {totalPistas}
                </span>
              </div>
              <ol className="space-y-2">
                {pistas.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-line text-sky-950">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-sky-200 text-sky-900 text-xs font-black flex items-center justify-center" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="min-w-0 break-words">{p}</span>
                  </li>
                ))}
              </ol>
            </aside>
          )}

          {/* Botones de apoyo (Pista y Chasqui) en el flujo normal, fuera de la barra pegajosa */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {hayPistaDisponible && (pistas.length === 0 || pistas.length < totalPistas) && (
              <button
                type="button"
                onClick={() => void handlePedirPista(pistas.length > 0)}
                disabled={pidiendoPista || enviando}
                className="btn-3d-outline px-4 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] cursor-pointer w-full shadow-xs"
              >
                <Lightbulb className="w-4 h-4 text-[#006590] shrink-0" aria-hidden="true" />
                <span>{pidiendoPista ? 'Buscando pista…' : pistas.length > 0 ? 'Necesito otra pista' : 'Necesito una pista'}</span>
              </button>
            )}

          </div>

          {/* 4. Barra de acciones pegajosa abajo en celular: SOLO botón principal (altura total ≤ 75 px) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 md:-mx-8 md:-mb-8 p-3 sm:p-4 border-t-2 border-[#e5e5e5] z-10 flex items-center justify-end">
            <button
              type="submit"
              disabled={botonDeshabilitado}
              className="btn-3d-primary w-full sm:w-auto sm:min-w-[220px] px-8 py-3 text-base sm:text-lg min-h-[48px] cursor-pointer shadow-md flex items-center justify-center"
            >
              <span>{textoBoton}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 5. Modal de éxito animado accesible */}
      <ModalExitoMision
        isOpen={modalExitoOpen}
        onClose={() => setModalExitoOpen(false)}
        tipoResultado={resultado?.estado === 'entregada' ? 'entregada' : 'correcta'}
        explicacion={resultado?.explicacion}
        siguiente={resultado?.siguiente}
        onSiguiente={handleAvanzarSiguiente}
      />
    </div>
  );
};
