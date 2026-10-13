import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { misionService } from '@/services/mision';
import { ChatBubble } from '@/components/ChatBubble';
import { SelloSinSpoilers } from '@/components/SelloSinSpoilers';
import { LoadingSkeleton, ErrorState } from '@/components/States';
import {
  tutorService,
  MensajeChat,
  ConversacionGuion,
} from '@/services/tutor';
import {
  ArrowLeft,
  Mic,
  Volume2,
  Send,
  Sparkles,
  Loader2,
  Lock,
  AlertCircle,
} from 'lucide-react';

export interface TutorProps {
  forcedEstado?: 'feliz' | 'sin_consentimiento' | 'error_audio' | 'cargando' | 'error';
}

export const Tutor: React.FC<TutorProps> = ({ forcedEstado }) => {
  const [conversacion, setConversacion] = useState<ConversacionGuion | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sinConsentimiento, setSinConsentimiento] = useState(false);

  // Estados de interacción
  const [textoInput, setTextoInput] = useState('');
  const [isPensando, setIsPensando] = useState(false);
  const [estadoVoz, setEstadoVoz] = useState<'inactivo' | 'escuchando' | 'procesando' | 'error_audio'>('inactivo');
  const [audioReproduciendo, setAudioReproduciendo] = useState(false);
  const [mostrarTecladoNum, setMostrarTecladoNum] = useState(false);
  const [searchParams] = useSearchParams();
  const misionIdParam = searchParams.get('mision');
  const [misionTitulo, setMisionTitulo] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!misionIdParam) {
      setMisionTitulo(null);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        let m;
        try {
          m = await misionService.obtenerMision(misionIdParam);
        } catch {
          if (misionIdParam === 'mis-1') m = await misionService.obtenerMision('sim-4');
          else if (misionIdParam === 'mis-2') m = await misionService.obtenerMision('sim-1');
          else if (misionIdParam === 'mis-3') m = await misionService.obtenerMision('sim-2');
          else if (misionIdParam === 'mis-4') m = await misionService.obtenerMision('sim-1');
        }
        if (!cancelado && m) {
          setMisionTitulo(m.titulo);
        }
      } catch {
        // Ignorar si no existe
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [misionIdParam]);

  const cargarConversacion = async () => {
    setLoading(true);
    setError(false);
    setSinConsentimiento(false);

    if (forcedEstado === 'sin_consentimiento') {
      setSinConsentimiento(true);
      setLoading(false);
      return;
    }

    if (forcedEstado === 'error') {
      setError(true);
      setLoading(false);
      return;
    }

    if (forcedEstado === 'error_audio') {
      setEstadoVoz('error_audio');
    }

    try {
      const data = await tutorService.obtenerConversacion();
      setConversacion(data);
      setMensajes(data.mensajesIniciales);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConversacion();
  }, [forcedEstado]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isPensando]);

  const ultimoMensajeTutor = [...mensajes].reverse().find((m) => m.emisor === 'tutor');
  const ideasActuales = ultimoMensajeTutor?.ideasParaResponder || [];

  const handleEnviarMensaje = async (texto: string) => {
    if (!texto.trim() || isPensando) return;

    const nuevoMensajeAlumno: MensajeChat = {
      id: `msg-al-${Date.now()}`,
      emisor: 'alumno',
      contenido: texto.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoMensajeAlumno]);
    setTextoInput('');
    setIsPensando(true);
    setEstadoVoz('inactivo');

    try {
      const res = await tutorService.responderMensaje(texto);
      const nuevoMensajeTutor: MensajeChat = {
        id: `msg-tut-${Date.now()}`,
        emisor: 'tutor',
        contenido: res.respuestaTutor,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ideasParaResponder: res.ideasParaResponder,
      };
      setMensajes((prev) => [...prev, nuevoMensajeTutor]);
    } catch {
      // Fallback
    } finally {
      setIsPensando(false);
    }
  };

  // Simulación de interacción por voz
  const handleToggleVoz = () => {
    if (estadoVoz === 'inactivo' || estadoVoz === 'error_audio') {
      setEstadoVoz('escuchando');
      setTimeout(() => {
        setEstadoVoz('procesando');
        setTimeout(() => {
          setEstadoVoz('inactivo');
          // Enviar respuesta simulada según estrategia disponible
          const respuestaVoz = ideasActuales[0] || 'Dibujar los penales';
          handleEnviarMensaje(respuestaVoz);
        }, 1200);
      }, 1500);
    } else if (estadoVoz === 'escuchando') {
      setEstadoVoz('inactivo');
    }
  };

  const handleEscucharDeNuevo = () => {
    setAudioReproduciendo(true);
    setTimeout(() => {
      setAudioReproduciendo(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 w-full max-w-xl mx-auto min-w-0 p-4">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={3} />
      </div>
    );
  }

  if (sinConsentimiento) {
    return (
      <div className="p-6 sm:p-8 bg-surface border-2 border-divider rounded-3xl text-center space-y-4 max-w-lg mx-auto min-w-0 shadow-md">
        <div className="w-16 h-16 rounded-full bg-accent-100 border-2 border-accent-strong flex items-center justify-center text-accent-strong mx-auto">
          <Lock className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-text">
            Pedile a tu familia que autorice a Chasqui
          </h2>
          <p className="text-xs sm:text-sm text-text/75 leading-relaxed">
            Para poder charlar con Chasqui y que te guíe en tus misiones, un adulto de tu familia debe dar su consentimiento.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/familia">
            <Button variant="primary" size="lg" className="rounded-full w-full">
              Ir a autorización familiar
            </Button>
          </Link>
          <Link to="/alumno">
            <Button variant="secondary" size="lg" className="rounded-full w-full">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !conversacion) {
    return (
      <div className="py-8">
        <ErrorState
          title="No pudimos conectar con Chasqui"
          message="Ocurrió un error al cargar la conversación. Por favor, reintentá."
          onRetry={cargarConversacion}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] [@media(max-height:500px)]:grid-rows-[auto_minmax(0,1fr)] [@media(max-height:500px)]:gap-x-3 [@media(max-height:500px)]:h-[calc(100dvh-4rem)] [@media(max-height:500px)]:p-2 w-full max-w-4xl mx-auto h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-8.5rem)] min-h-0 bg-white border-2 border-[#e5e5e5] border-b-8 rounded-3xl p-3 sm:p-5 md:p-6 shadow-sm min-w-0 transition-all font-nunito">
      {/* 1. Cabecera con botón volver y Sello Sin Spoilers */}
      <header className="border-b-2 border-[#e5e5e5] pb-2 sm:pb-3 [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:col-span-2 flex flex-col gap-2 min-w-0 shrink-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to={misionIdParam ? `/alumno/mision/${misionIdParam}` : '/alumno'}
              aria-label={misionIdParam ? 'Volver a la misión' : 'Volver al inicio del alumno'}
              className="btn-3d-outline w-11 h-11 rounded-full p-0 flex items-center justify-center shrink-0 min-h-[44px] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 stroke-[2.5]" aria-hidden="true" />
            </Link>

            <div className="w-11 h-11 rounded-2xl bg-duo-green flex items-center justify-center text-white text-2xl shadow-sm border-b-4 border-duo-green-dark shrink-0">
              🦉
            </div>

            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-lg md:text-xl text-slate-800 break-words leading-tight">
                Chasqui · {conversacion.materia}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <SelloSinSpoilers variant="badge" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEscucharDeNuevo}
            disabled={audioReproduciendo}
            aria-label="Escuchar el último mensaje"
            className="btn-3d-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shrink-0 cursor-pointer min-h-[44px]"
          >
            <Volume2
              className={`w-4 h-4 text-[#006590] ${audioReproduciendo ? 'animate-pulse text-[#006590]' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {audioReproduciendo ? 'Escuchando...' : 'Escuchar de nuevo'}
            </span>
          </button>
        </div>

        {/* Si viene ?mision, mostramos arriba el título y botón Volver a la misión */}
        {misionIdParam && (
          <div className="flex items-center justify-between gap-2 bg-[#ddf4ff] border-2 border-[#1cb0f6] border-b-4 border-b-[#1899d6] text-[#004666] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black min-w-0 shadow-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-4 h-4 text-[#006590] shrink-0" aria-hidden="true" />
              <span className="truncate">Estás con: {misionTitulo || 'esta misión'}</span>
            </div>
            <Link
              to={`/alumno/mision/${misionIdParam}`}
              className="inline-flex items-center gap-1 font-black text-[#006590] underline hover:opacity-85 shrink-0 min-h-[44px] px-1"
            >
              <span>Volver a la misión</span>
            </Link>
          </div>
        )}
      </header>

      {/* 2. Área de Mensajes del Chat (Usa todo el alto flexible) */}
      <div
        className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 pr-1 py-1.5 sm:py-2 min-h-0 flex flex-col min-w-0"
        role="log"
        aria-label="Conversación con Chasqui"
      >
        {mensajes.map((m) => (
          <div key={m.id} className="min-w-0">
            <ChatBubble
              emisor={m.emisor}
              nombre={m.emisor === 'alumno' ? 'Mateo' : 'Chasqui'}
              contenido={m.contenido}
              hora={m.hora}
            />
          </div>
        ))}

        {isPensando && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-2xl w-fit text-xs font-black text-slate-700 animate-pulse border-2 border-[#e5e5e5]">
            <Loader2 className="w-4 h-4 animate-spin text-[#006590]" aria-hidden="true" />
            <span>Chasqui está pensando una buena pregunta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Panel de interacción inferior fijo y adaptativo */}
      <div className="pt-2 flex flex-col gap-2 min-w-0 shrink-0 border-t-2 border-[#e5e5e5] pb-[max(0.25rem,env(safe-area-inset-bottom))] [@media(max-height:500px)]:border-t-0 [@media(max-height:500px)]:border-l [@media(max-height:500px)]:pl-3 [@media(max-height:500px)]:pt-0 [@media(max-height:500px)]:min-h-0 [@media(max-height:500px)]:overflow-y-auto [@media(max-height:500px)]:justify-end">
        {/* Ideas para responder en UNA fila con scroll horizontal interno */}
        {!isPensando && ideasActuales.length > 0 && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#ffc800]" aria-hidden="true" />
              <span className="hidden sm:inline">Ideas:</span>
            </div>
            <div className="flex flex-nowrap overflow-x-auto gap-1.5 py-0.5 min-w-0 flex-1">
              {ideasActuales.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEnviarMensaje(idea)}
                  className="btn-3d-outline px-3.5 py-1.5 text-xs sm:text-sm font-black rounded-full min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teclado numérico plegable detrás de un botón */}
        {!isPensando && (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <button
                type="button"
                onClick={() => setMostrarTecladoNum(!mostrarTecladoNum)}
                aria-expanded={mostrarTecladoNum}
                className="text-xs font-black text-[#006590] hover:underline inline-flex items-center gap-1 px-2 min-h-[44px] rounded"
              >
                <span>{mostrarTecladoNum ? 'Ocultar números ▴' : 'Teclado numérico ▾'}</span>
              </button>

              {mostrarTecladoNum && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  {['1', '2', '3', '4', '5', '6'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleEnviarMensaje(num)}
                      aria-label={`Escribir número ${num}`}
                      className="btn-3d-outline w-11 h-11 rounded-xl text-center font-black text-sm cursor-pointer select-none"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {estadoVoz === 'error_audio' && (
              <div
                role="alert"
                className="p-1.5 px-2.5 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl text-xs font-black flex items-center gap-2 animate-fade-in shrink-0"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>No pude escuchar.</span>
                <button
                  type="button"
                  onClick={handleToggleVoz}
                  className="underline text-amber-800 font-black cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fila integrada de controles: Botón circular de voz + input + Botón circular de enviar */}
        <div className="flex flex-row items-center gap-2.5 min-w-0">
          {/* Botón circular 3D de Voz ("Tocá y hablá") */}
          <button
            type="button"
            onClick={handleToggleVoz}
            aria-pressed={estadoVoz === 'escuchando'}
            aria-label={estadoVoz === 'escuchando' ? 'Escuchando tu voz...' : 'Activar micrófono'}
            className={`btn-3d w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm cursor-pointer ${
              estadoVoz === 'escuchando'
                ? 'btn-3d-primary animate-pulse'
                : estadoVoz === 'procesando'
                ? 'bg-slate-700 text-white opacity-90'
                : 'btn-3d-secondary'
            }`}
          >
            {estadoVoz === 'escuchando' ? (
              <Mic className="w-5 h-5 text-[#1e5000] animate-bounce" aria-hidden="true" />
            ) : estadoVoz === 'procesando' ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <Mic className="w-5 h-5 text-[#00263a] stroke-[2.5]" aria-hidden="true" />
            )}
          </button>

          {/* Formulario de texto ocupando el resto de la fila */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviarMensaje(textoInput);
            }}
            className="flex-1 flex items-center gap-2 min-w-0"
          >
            <input
              type="text"
              id="input-mensaje-tutor"
              name="mensajeTutor"
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              placeholder="Escribí tu mensaje acá..."
              aria-label="Escribí tu mensaje para Chasqui"
              className="flex-1 px-4 py-2.5 bg-white text-slate-800 border-2 border-[#e5e5e5] rounded-2xl text-sm sm:text-base font-bold focus:border-[#1cb0f6] focus:outline-none min-h-[48px] min-w-0 shadow-xs"
            />
            {/* Botón circular 3D de Enviar */}
            <button
              type="submit"
              disabled={!textoInput.trim() || isPensando}
              className="btn-3d-primary w-12 h-12 rounded-full p-0 flex items-center justify-center shrink-0 min-h-[48px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Enviar respuesta escrita"
            >
              <Send className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
