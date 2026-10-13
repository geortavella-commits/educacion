import { ValorarMision } from './ValorarMision';
import { HechaEnPapel } from './HechaEnPapel';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { docenteService } from '@/services/docente';
import {
  PerfilAlumnoDocente,
  HipotesisPerfil,
  SesionChasqui,
  EstadoHipotesis,
} from '@/mocks/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { ChatBubble } from '@/components/ChatBubble';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/States';
import { DialogoCorregirHipotesis } from './DialogoCorregirHipotesis';
import { Devoluciones } from './Devoluciones';
import { Migas } from './ui';
import {
  MessageSquare,
  Sparkles,
  Send,
  Lock,
  CheckCircle2,
  Edit2,
  XCircle,
  Clock,
  BookOpen,
} from 'lucide-react';

export interface PerfilAlumnoProps {
  forcedEstado?: 'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso';
}

export const PerfilAlumno: React.FC<PerfilAlumnoProps> = ({ forcedEstado }) => {
  const { id } = useParams<{ id: string }>();
  const alumnoId = id || 'valentina';

  const [perfil, setPerfil] = useState<PerfilAlumnoDocente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estados para diálogos interactivos
  const [hipotesisSeleccionada, setHipotesisSeleccionada] = useState<HipotesisPerfil | null>(null);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<SesionChasqui | null>(null);
  const [mostrarResumenIA, setMostrarResumenIA] = useState(false);

  const cargarDatos = () => {
    setLoading(true);
    setError(false);
    docenteService
      .obtenerPerfilAlumno(alumnoId)
      .then((res) => {
        setPerfil(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [alumnoId]);

  const handleActualizarHipotesis = (
    hipId: string,
    nuevoEstado: EstadoHipotesis,
    textoCorregido?: string
  ) => {
    docenteService.actualizarHipotesisPerfil(hipId, nuevoEstado, textoCorregido).then(() => {
      setPerfil((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hipotesis: prev.hipotesis.map((h) =>
            h.id === hipId
              ? { ...h, estado: nuevoEstado, textoCorregido: textoCorregido ?? h.textoCorregido }
              : h
          ),
        };
      });
    });
  };

  const estadoEfectivo = forcedEstado || (loading ? 'cargando' : error ? 'error' : 'feliz');

  if (estadoEfectivo === 'cargando') {
    return (
      <div className="space-y-6 w-full max-w-6xl">
        <LoadingSkeleton type="card" count={1} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LoadingSkeleton type="card" count={3} />
        </div>
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (estadoEfectivo === 'error') {
    return (
      <ErrorState
        title="Error al cargar el perfil del alumno"
        message="No se pudo obtener la información de este estudiante."
        onRetry={cargarDatos}
      />
    );
  }

  if (estadoEfectivo === 'sin_permiso') {
    return (
      <div className="p-8 bg-surface border-2 border-divider rounded-lg text-center space-y-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-accent-100 mx-auto flex items-center justify-center text-accent-strong">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-text">Acceso restringido</h2>
        <p className="text-sm text-text/70">
          Solo los docentes autorizados pueden visualizar el perfil pedagógico y las conversaciones.
        </p>
      </div>
    );
  }

  if (estadoEfectivo === 'vacio' || !perfil) {
    return (
      <EmptyState
        title="Alumno no encontrado"
        description="No se encontró registro para el identificador seleccionado."
      />
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl min-w-0 font-body">
      {/* 1. Dónde estás y cabecera del alumno */}
      <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Alumnos', to: '/docente/alumnos' }, { texto: perfil.nombre }]} />

      <div className="bg-surface border-2 border-divider rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-300 border-2 border-divider flex items-center justify-center font-heading font-extrabold text-2xl text-text shadow-xs shrink-0">
              {perfil.iniciales}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">
                {perfil.nombre}
              </h1>
              <p className="text-sm text-text/70 mt-0.5">
                {perfil.curso} · <span className="font-medium">Intereses: {perfil.intereses}</span>
              </p>
            </div>
          </div>

          <a
            href="#mensajes"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-xs font-heading font-bold border-2 border-divider bg-surface hover:border-accent-strong"
          >
            <Send className="w-3.5 h-3.5 text-accent-strong" aria-hidden="true" />
            <span>Dejar un mensaje</span>
          </a>
        </div>
      </div>

      {/* 2. Avance de misiones por materia */}
      <div className="space-y-2">
        <div className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
          Avance de misiones (no son notas)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {perfil.avanceMisiones.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border border-divider shadow-xs flex flex-col justify-between gap-2 ${item.bgClass}`}
            >
              <span className="text-xs font-heading font-bold text-text/80">{item.materia}</span>
              <div className="font-heading font-extrabold text-3xl text-text font-mono">
                {item.porcentaje}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bloque: Según su actividad reciente (Hipótesis con "Corregir") */}
      <div className="bg-surface border-2 border-divider rounded-xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-text">
            Según su actividad reciente
          </h2>
          <p className="text-sm text-text/70 mt-0.5">
            Hipótesis de la app. Corregilas si no coinciden con lo que ves en clase.
          </p>
        </div>

        <div className="divide-y-2 divide-divider">
          {perfil.hipotesis.map((hip) => {
            const textoAMostrar =
              hip.estado === 'corregida' && hip.textoCorregido
                ? hip.textoCorregido
                : hip.texto;

            return (
              <div
                key={hip.id}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  hip.estado === 'descartada' ? 'opacity-50' : ''
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm text-text leading-relaxed break-words">{textoAMostrar}</p>
                  {/* Badge de estado */}
                  <div>
                    {hip.estado === 'confirmada' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong bg-accent-100 px-2.5 py-0.5 rounded-full border border-accent-300">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Confirmada por vos</span>
                      </span>
                    )}
                    {hip.estado === 'corregida' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong bg-accent-100 px-2.5 py-0.5 rounded-full border border-accent-300">
                        <Edit2 className="w-3 h-3" aria-hidden="true" />
                        <span>Corregida por vos</span>
                      </span>
                    )}
                    {hip.estado === 'descartada' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-text/60 bg-neutral-200 px-2.5 py-0.5 rounded-full border border-divider">
                        <XCircle className="w-3 h-3" aria-hidden="true" />
                        <span>Descartada</span>
                      </span>
                    )}
                    {hip.estado === 'pendiente' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-text/60">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>Hipótesis de la app</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 sm:self-center">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setHipotesisSeleccionada(hip)}
                    className="font-bold text-xs min-h-[44px] px-3.5"
                  >
                    Corregir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner de aviso pedagógico */}
        <div className="p-3 bg-accent-100 rounded-lg text-sm text-text border border-divider">
          <strong>Son sugerencias de la app. La calificación la decidís vos.</strong>
        </div>
      </div>

      {/* 3b. Punto de partida: diagnóstico del año */}
      {perfil.diagnostico && perfil.diagnostico.length > 0 && (
        <div className="bg-surface border-2 border-divider rounded-xl p-5 space-y-3 shadow-sm">
          <h2 className="text-lg font-heading font-extrabold text-text">Punto de partida: diagnóstico del año</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {perfil.diagnostico.map((d) => (
              <li key={d.area} className="p-3 bg-neutral-100 border border-divider rounded-lg space-y-1">
                <p className="text-sm font-heading font-extrabold text-text">{d.area === 'matematica' ? 'Matemática' : 'Lengua'}</p>
                <p className="text-sm text-text">
                  {d.aciertos} de {d.total} respuestas acertadas
                </p>
                <p className="text-xs font-semibold text-text/80">
                  {d.aciertos === d.total ? 'Maneja lo que se preguntó.' : d.aciertos * 2 >= d.total ? 'Va en camino.' : 'Conviene reforzar antes de avanzar.'}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text/75">
            Son pocas preguntas por área, del año que cursa: una foto de dónde empezar, no una nota ni una comparación con otros chicos. Lo que ves en
            clase pesa más.
          </p>
        </div>
      )}

      {/* 4. Actividad reciente (Hechos observados) */}
      <div className="bg-surface border-2 border-divider rounded-xl p-5 space-y-3 shadow-sm">
        <h2 className="text-lg font-heading font-extrabold text-text">
          Actividad reciente en misiones
        </h2>

        <div className="divide-y-2 divide-divider">
          {perfil.actividadReciente.map((act) => (
            <div key={act.id} className="py-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text min-w-0 break-words">
                  <strong className="font-bold text-accent-strong mr-1">{act.periodo} ·</strong>
                  {act.actividad}
                </span>
                <span className="font-heading font-bold text-xs px-2.5 py-1 rounded-full bg-neutral-200 text-text shrink-0">
                  {act.hecho}
                </span>
              </div>
              {act.respuesta && (
                <blockquote className="border-l-4 border-accent-strong bg-neutral-100 px-3 py-2 text-text whitespace-pre-line break-words">
                  <span className="block text-xs font-heading font-bold text-text/75 mb-1">Lo que escribió {perfil.nombre}:</span>
                  {act.respuesta}
                </blockquote>
              )}
              {act.misionId && (act.estado !== 'completada' || act.enPapel) && <HechaEnPapel misionId={act.misionId} alumnoId={perfil.id} nombre={perfil.nombre} inicialEnPapel={!!act.enPapel} />}
              {act.misionId && <ValorarMision misionId={act.misionId} alumnoId={perfil.id} nombre={perfil.nombre} inicial={act.valoracion} />}
            </div>
          ))}
        </div>

        {perfil.misionesPendientes && perfil.misionesPendientes.length > 0 && (
          <details className="border-t-2 border-divider pt-3">
            <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-heading font-extrabold text-text">
              Misiones sin completar ({perfil.misionesPendientes.length}) · marcar las que hizo en papel
            </summary>
            <ul className="mt-2 space-y-3">
              {perfil.misionesPendientes.map((m) => (
                <li key={m.misionId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                  <span className="min-w-0 break-words text-text">
                    <strong className="font-bold">{m.titulo}</strong>
                    {m.proyecto && <span className="text-text/70"> · {m.proyecto}</span>}
                  </span>
                  <HechaEnPapel misionId={m.misionId} alumnoId={perfil.id} nombre={perfil.nombre} inicialEnPapel={false} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* 4b. Mensajes de la docente (devolución cualitativa) */}
      <Devoluciones alumnoId={perfil.id} nombre={perfil.nombre} />

      {/* 5. Bloque: Conversaciones con Chasqui */}
      <div className={`bg-surface border-2 border-divider rounded-xl p-5 space-y-4 shadow-sm ${perfil.conversaciones.length === 0 ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-strong" aria-hidden="true" />
              <span>Conversaciones con Chasqui</span>
            </h2>
            <p className="text-sm text-text/70 mt-0.5">
              Accedé a la conversación completa entre el alumno y Chasqui.
            </p>
          </div>
        </div>

        <div className="divide-y-2 divide-divider">
          {perfil.conversaciones.map((conv) => (
            <div
              key={conv.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-accent-strong">
                    {conv.fecha}
                  </span>
                  <span className="text-xs text-text/50">·</span>
                  <span className="text-sm font-bold text-text break-words">
                    Misión: {conv.mision}
                  </span>
                </div>
                <p className="text-xs text-text/70">
                  {conv.mensajes.length} intercambios registrados
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setSesionSeleccionada(conv);
                    setMostrarResumenIA(false);
                  }}
                  className="gap-1 text-xs font-bold min-h-[44px] px-3"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ver conversación completa</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSesionSeleccionada(conv);
                    setMostrarResumenIA(true);
                  }}
                  className="gap-1 text-xs font-bold min-h-[44px] px-3"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent-strong" aria-hidden="true" />
                  <span>Resumen IA</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diálogo de Conversación Completa con Chasqui */}
      {sesionSeleccionada && (
        <Dialog
          isOpen={Boolean(sesionSeleccionada)}
          onClose={() => setSesionSeleccionada(null)}
          title={`Interacción de ${perfil.nombre} con Chasqui`}
          description={`${sesionSeleccionada.fecha} · Misión: ${sesionSeleccionada.mision}`}
          className="max-w-2xl"
          actions={
            <div className="flex items-center justify-between w-full gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMostrarResumenIA(!mostrarResumenIA)}
                className="gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-strong" aria-hidden="true" />
                <span>{mostrarResumenIA ? 'Ver diálogo completo' : 'Ver resumen generado por IA'}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSesionSeleccionada(null)}>
                Cerrar
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Panel de Resumen IA si está activo */}
            {mostrarResumenIA ? (
              <div className="p-4 bg-accent-100/60 border-2 border-accent-300 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-extrabold text-accent-strong uppercase">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Resumen generado por IA · puede tener errores</span>
                </div>
                <p className="text-sm text-accent-900 leading-relaxed font-body">
                  {sesionSeleccionada.resumenIA}
                </p>
                <div className="text-xs text-accent-900/70 pt-1 border-t border-accent-200">
                  El docente tiene acceso permanente a los mensajes textuales originales.
                </div>
              </div>
            ) : (
              /* Diálogo completo con ChatBubble */
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <div className="text-xs text-text/60 text-center py-1">
                  Inicio de la sesión pedagógica
                </div>
                {sesionSeleccionada.mensajes.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    emisor={msg.emisor}
                    nombre={msg.emisor === 'alumno' ? perfil.nombre : 'Chasqui'}
                    contenido={msg.contenido}
                    hora={msg.hora}
                  />
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Diálogo Corregir Hipótesis */}
      {hipotesisSeleccionada && (
        <DialogoCorregirHipotesis
          isOpen={Boolean(hipotesisSeleccionada)}
          onClose={() => setHipotesisSeleccionada(null)}
          alumnoNombre={perfil.nombre}
          textoOriginal={hipotesisSeleccionada.texto}
          estadoActual={hipotesisSeleccionada.estado}
          textoCorregidoActual={hipotesisSeleccionada.textoCorregido}
          onConfirmar={() =>
            handleActualizarHipotesis(hipotesisSeleccionada.id, 'confirmada')
          }
          onGuardarCorreccion={(nuevoTexto) =>
            handleActualizarHipotesis(hipotesisSeleccionada.id, 'corregida', nuevoTexto)
          }
          onDescartar={() =>
            handleActualizarHipotesis(hipotesisSeleccionada.id, 'descartada')
          }
        />
      )}
    </div>
  );
};
