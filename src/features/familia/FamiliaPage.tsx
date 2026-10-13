import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { familiaService, type HijoResumen, type ResumenFamilia } from '@/services/familia';
import { Tag } from '@/components/Tag';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/States';
import { ShieldCheck, UserPlus, MessageCircle, KeyRound, Printer } from 'lucide-react';

const ESTADO_CONSENTIMIENTO: Record<HijoResumen['consentimiento'], { texto: string; variante: 'accent' | 'neutral' | 'outline'; accion: string }> = {
  otorgado: { texto: 'Autorizaste a Chasqui', variante: 'neutral', accion: 'Ver o retirar la autorización' },
  pendiente: { texto: 'Falta tu autorización', variante: 'accent', accion: 'Revisar y autorizar' },
  revocado: { texto: 'Retiraste la autorización', variante: 'outline', accion: 'Ver autorización' },
};

export const FamiliaPage: React.FC = () => {
  const [datos, setDatos] = useState<ResumenFamilia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [generando, setGenerando] = useState<string | null>(null);
  const [errorAcceso, setErrorAcceso] = useState('');
  const [acceso, setAcceso] = useState<{ nombre: string; codigo: string; venceEn: string } | null>(null);

  const darAcceso = async (alumnoId: string, nombre: string) => {
    setGenerando(alumnoId);
    setErrorAcceso('');
    try {
      const r = await familiaService.generarAccesoHijo(alumnoId);
      setAcceso({ nombre, codigo: r.codigo, venceEn: r.venceEn });
    } catch {
      setErrorAcceso('No pudimos generar el código. Probá de nuevo en un rato.');
    } finally {
      setGenerando(null);
    }
  };

  const cargar = () => {
    setCargando(true);
    setError(false);
    familiaService
      .obtenerResumen()
      .then(setDatos)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  if (cargando) return <LoadingSkeleton type="card" count={2} />;
  if (error || !datos) return <ErrorState title="No pudimos cargar el resumen" message="Revisá tu conexión y reintentá." onRetry={cargar} />;

  return (
    <div className="space-y-6 w-full max-w-4xl min-w-0 font-body">
      <div className="border-b border-divider pb-4">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">Hola, {datos.tutorNombre}</h1>
        <p className="text-sm text-text/75 mt-1">Acá ves cómo viene tu hijo o hija con las misiones. Es un resumen: la calificación la decide siempre su docente.</p>
      </div>

      {datos.hijos.length === 0 ? (
        <EmptyState
          title="Todavía no hay ningún chico vinculado a tu cuenta"
          description="Si la escuela te dio un código de invitación, usalo para vincular a tu hijo o hija."
          actionText="Usar un código de invitación"
          onAction={() => (window.location.href = '/familia/invitacion')}
        />
      ) : (
        datos.hijos.map((h) => {
          const e = ESTADO_CONSENTIMIENTO[h.consentimiento];
          return (
            <section key={h.alumnoId} className="p-4 sm:p-6 bg-surface border-2 border-divider rounded-lg space-y-5 min-w-0" aria-labelledby={`hijo-${h.alumnoId}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 id={`hijo-${h.alumnoId}`} className="font-heading font-extrabold text-xl text-text break-words">
                    {h.nombre}
                  </h2>
                  <p className="text-sm text-text/70">{h.curso}</p>
                </div>
                <Tag variant={e.variante} className="self-start sm:self-center">
                  {e.texto}
                </Tag>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-100 border border-divider">
                  <p className="text-xs uppercase tracking-wider font-heading font-extrabold text-text/70">Esta semana</p>
                  <p className="text-2xl font-heading font-extrabold">{h.semana.misionesCompletadas}</p>
                  <p className="text-sm text-text/75">{h.semana.misionesCompletadas === 1 ? 'misión completada' : 'misiones completadas'}</p>
                </div>
                <div className="p-3 bg-neutral-100 border border-divider">
                  <p className="text-xs uppercase tracking-wider font-heading font-extrabold text-text/70">Días con actividad</p>
                  <p className="text-2xl font-heading font-extrabold">{h.semana.diasActivos}</p>
                  <p className="text-sm text-text/75">de los últimos 7</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-heading font-extrabold text-text/70">Avance de misiones (no son notas)</h3>
                {h.avance.length === 0 ? (
                  <p className="text-sm text-text/70">Todavía no hay misiones activas en su curso.</p>
                ) : (
                  h.avance.map((a) => (
                    <div key={a.materia} className="space-y-1">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{a.materia}</span>
                        <span>
                          {a.completadas} de {a.total}
                        </span>
                      </div>
                      <div
                        className="h-3 bg-neutral-200 border border-divider"
                        role="progressbar"
                        aria-valuenow={a.porcentaje}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Avance de ${a.materia}: ${a.completadas} de ${a.total} misiones`}
                      >
                        <div className="h-full bg-accent-strong" style={{ width: `${a.porcentaje}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-accent-100 border border-accent-300 text-sm">
                <MessageCircle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Para charlar en casa:</strong> preguntale qué misión le gustó más esta semana y cómo la resolvió.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {h.consentimiento === 'pendiente' ? (
                  <Link
                    to={`/familia/consentimiento?hijo=${h.alumnoId}`}
                    aria-label={`Revisar y autorizar el uso de Chasqui para ${h.nombre}`}
                    className="btn-3d btn-3d-primary pulso-llamado min-h-[52px] px-6 gap-2.5 text-base"
                  >
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                    <span>{e.accion}</span>
                  </Link>
                ) : (
                  <Link to={`/familia/consentimiento?hijo=${h.alumnoId}`} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                    <span>{e.accion}</span>
                  </Link>
                )}
                <Link to={`/familia/imprimir?hijo=${h.alumnoId}`} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm" aria-label={`Imprimir las misiones de ${h.nombre}`}>
                  <Printer className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                  <span>Imprimir misiones</span>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => darAcceso(h.alumnoId, h.nombre)}
                  disabled={generando === h.alumnoId}
                  aria-label={`Dar acceso a ${h.nombre} en otro dispositivo`}
                  className="gap-2"
                >
                  <KeyRound className="w-4 h-4 text-accent-strong" aria-hidden="true" />
                  <span>{generando === h.alumnoId ? 'Generando…' : 'Acceso en otro dispositivo'}</span>
                </Button>
              </div>
            </section>
          );
        })
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-divider bg-surface">
        <p className="text-sm text-text/80 flex-1">
          Solo ves un resumen. La conversación completa con Chasqui la ve su docente; vos podés pedirle que te cuente cómo va.
        </p>
        <Link to="/familia/invitacion" className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm font-bold text-accent-strong hover:underline">
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>Vincular otro hijo o hija</span>
        </Link>
      </div>

      {errorAcceso && (
        <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
          {errorAcceso}
        </p>
      )}

      <Dialog
        isOpen={acceso !== null}
        onClose={() => setAcceso(null)}
        title={`Acceso de ${acceso?.nombre ?? ''} en otro dispositivo`}
        description="Escribí este código en la pantalla “Ya tengo cuenta” del otro dispositivo. Sirve una sola vez."
        actions={<Button variant="primary" onClick={() => setAcceso(null)}>Listo</Button>}
      >
        <div className="space-y-3 text-center">
          <p className="font-mono text-3xl md:text-4xl font-extrabold tracking-[0.3em] break-all select-all" aria-label={`Código ${acceso?.codigo.split('').join(' ')}`}>
            {acceso?.codigo}
          </p>
          <p className="text-sm text-text/80">
            Vence en 15 minutos (a las {acceso ? new Date(acceso.venceEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}). Solo se muestra ahora:
            si se pierde, generá otro. En el otro dispositivo, el chico entra en <strong>/alumno/acceso</strong>.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
