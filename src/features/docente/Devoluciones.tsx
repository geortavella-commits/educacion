import React, { useEffect, useState } from 'react';
import { docenteService, type Devolucion, type TipoDevolucion } from '@/services/docente';
import { mensajeErrorIA } from '@/lib/mensajesIA';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { MessageSquareHeart, Sparkles, Trash2 } from 'lucide-react';

export const TIPOS_DEVOLUCION: { valor: TipoDevolucion; etiqueta: string; ayuda: string }[] = [
  { valor: 'logro', etiqueta: 'Reconocer un logro', ayuda: 'Qué hizo bien y cómo se nota su esfuerzo.' },
  { valor: 'motivacion', etiqueta: 'Motivar', ayuda: 'Un mensaje para darle ánimo y ganas de seguir.' },
  { valor: 'sugerencia', etiqueta: 'Sugerir cómo seguir', ayuda: 'Una idea concreta y amable para avanzar.' },
];

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');

/**
 * Devolución cualitativa de la docente para un alumno: texto para motivar o sugerir.
 * Sin notas, puntajes ni escalas. El alumno la lee en su pantalla de inicio.
 */
export const Devoluciones: React.FC<{ alumnoId: string; nombre: string }> = ({ alumnoId, nombre }) => {
  const [lista, setLista] = useState<Devolucion[] | null>(null);
  const [noDisponible, setNoDisponible] = useState(false);
  const [tipo, setTipo] = useState<TipoDevolucion>('logro');
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pensando, setPensando] = useState(false);
  const [esBorradorIA, setEsBorradorIA] = useState(false);

  const cargar = () => {
    docenteService
      .listarDevoluciones(alumnoId)
      .then(setLista)
      .catch(() => setNoDisponible(true));
  };
  useEffect(cargar, [alumnoId]);

  // Con los datos de ejemplo (sin base) no hay dónde guardar: no se muestra.
  if (noDisponible) return null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMensaje('');
    if (texto.trim().length < 3) {
      setErrorMsg('Escribí al menos unas palabras.');
      return;
    }
    setGuardando(true);
    try {
      await docenteService.crearDevolucion({ alumnoId, tipo, texto });
      setTexto('');
      setMensaje(`Listo: ${nombre} va a ver tu mensaje cuando entre a Chasqui.`);
      cargar();
    } catch {
      setErrorMsg('No pudimos guardar el mensaje. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // La IA solo propone un borrador en el cuadro de texto: la docente lo edita y decide si lo envía.
  // Si ya escribió algo, eso se usa como idea de base. Al modelo no le llega el nombre del chico.
  const sugerirBorrador = async () => {
    if (pensando) return;
    setPensando(true);
    setErrorMsg('');
    setMensaje('');
    try {
      const propuesta = await docenteService.sugerirBorradorMensaje({ alumnoId, tipo, pista: texto.trim() || undefined });
      setTexto(propuesta.replace(/\[NOMBRE\]/g, nombre));
      setEsBorradorIA(true);
    } catch (e) {
      setErrorMsg(mensajeErrorIA(e instanceof Error ? e.message : ''));
    } finally {
      setPensando(false);
    }
  };

  const borrar = async (id: string) => {
    setErrorMsg('');
    try {
      await docenteService.eliminarDevolucion(id);
      cargar();
    } catch {
      setErrorMsg('No pudimos borrar el mensaje. Probá de nuevo.');
    }
  };

  return (
    <section id="mensajes" aria-labelledby="titulo-mensajes" className="bg-surface border-2 border-divider rounded-xl p-5 space-y-4 shadow-sm scroll-mt-4">
      <div>
        <h2 id="titulo-mensajes" className="text-lg font-heading font-extrabold text-text flex items-center gap-2">
          <MessageSquareHeart className="w-5 h-5 text-accent-strong" aria-hidden="true" />
          <span>Mensajes para {nombre}</span>
        </h2>
        <p className="text-sm text-text/75 mt-0.5">
          Una devolución cualitativa para motivar y ayudar. No lleva nota ni puntaje: contale qué viste, qué reconocés y qué le sugerís para seguir.
        </p>
      </div>

      <form onSubmit={guardar} noValidate className="space-y-3">
        <fieldset>
          <legend className="text-xs font-heading font-semibold text-text/80 mb-1.5">Tipo de mensaje</legend>
          <div className="flex flex-wrap gap-2">
            {TIPOS_DEVOLUCION.map((t) => (
              <label
                key={t.valor}
                className={`inline-flex items-center gap-2 min-h-[44px] px-3 border-2 cursor-pointer text-sm font-heading font-bold ${
                  tipo === t.valor ? 'border-accent-strong bg-accent-100' : 'border-divider bg-surface'
                }`}
              >
                <input type="radio" name="tipo-devolucion" value={t.valor} checked={tipo === t.valor} onChange={() => setTipo(t.valor)} className="accent-[var(--color-accent-strong)]" />
                {t.etiqueta}
              </label>
            ))}
          </div>
          <p className="text-xs text-text/70 mt-1">{TIPOS_DEVOLUCION.find((t) => t.valor === tipo)?.ayuda}</p>
        </fieldset>
        <Textarea
          label="Tu mensaje"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setEsBorradorIA(false);
          }}
          maxLength={600}
          rows={3}
          placeholder={`Ej.: ${nombre}, me gustó cómo explicaste tu razonamiento. Probá contarlo con un dibujo.`}
          hint={`${texto.length}/600 · Lo lee ${nombre} en su pantalla. Usá un tono cálido y no lo compares con otros chicos.`}
        />
        {errorMsg && <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">{errorMsg}</p>}
        {mensaje && <p role="status" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">{mensaje}</p>}
        {esBorradorIA && (
          <p role="status" className="p-3 bg-accent-100 border border-accent-300 text-sm">
            <strong>Borrador sugerido por la IA.</strong> Puede tener errores: leelo, cambialo si hace falta y recién ahí enviáselo.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={guardando || pensando}>
            {guardando ? 'Guardando…' : 'Dejar mensaje'}
          </Button>
          <Button type="button" variant="secondary" onClick={sugerirBorrador} disabled={pensando || guardando} className="gap-1.5">
            <Sparkles className="w-4 h-4 text-accent-strong" aria-hidden="true" />
            <span>{pensando ? 'Pensando…' : 'Sugerir un borrador con IA'}</span>
          </Button>
        </div>
        <p className="text-xs text-text/70">Si escribís una idea en el cuadro, la IA la usa de base. A la IA no le llega el nombre del chico.</p>
      </form>

      {lista && lista.length > 0 && (
        <ul className="divide-y-2 divide-divider border-t border-divider">
          {lista.map((d) => (
            <li key={d.id} className="py-3 flex items-start justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-xs font-heading font-bold text-accent-strong">
                  {TIPOS_DEVOLUCION.find((t) => t.valor === d.tipo)?.etiqueta} · {fecha(d.creadaEn)}
                  {d.proyectoTitulo ? ` · ${d.proyectoTitulo}` : ''}
                </p>
                <p className="text-sm text-text break-words whitespace-pre-line">{d.texto}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => borrar(d.id)} aria-label="Borrar este mensaje" className="shrink-0 gap-1.5">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Borrar</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
