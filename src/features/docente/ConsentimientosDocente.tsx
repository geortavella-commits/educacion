import React, { useEffect, useMemo, useState } from 'react';
import { docenteService, type ConsentimientoAlumno } from '@/services/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Tag } from '@/components/Tag';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/States';
import { useSesion } from '@/lib/useSesion';
import { Copy, Check, UserPlus, Link2, MessageCircle } from 'lucide-react';

const ETIQUETA_ESTADO: Record<ConsentimientoAlumno['estado'], { texto: string; variante: 'accent' | 'neutral' | 'outline' }> = {
  otorgado: { texto: 'Autorizado', variante: 'neutral' },
  pendiente: { texto: 'Falta autorizar', variante: 'accent' },
  revocado: { texto: 'Retirado por la familia', variante: 'outline' },
  sin_registro: { texto: 'Sin familia vinculada', variante: 'accent' },
};

/** Enlace de registro que ya trae el código (la familia solo completa sus datos). */
const enlaceDeInvitacion = (codigo: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/familia/invitacion?codigo=${encodeURIComponent(codigo)}`;

export const ConsentimientosDocente: React.FC = () => {
  const sesion = useSesion();
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [lista, setLista] = useState<ConsentimientoAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [soloFaltan, setSoloFaltan] = useState(false);
  const [generando, setGenerando] = useState<string | null>(null);
  const [errorInvitacion, setErrorInvitacion] = useState('');
  const [invitacion, setInvitacion] = useState<{ alumno: string; codigo: string; venceEn: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = () => {
    setCargando(true);
    setError(false);
    docenteService
      .listarConsentimientos()
      .then(setLista)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const faltan = useMemo(() => lista.filter((a) => a.estado !== 'otorgado').length, [lista]);
  const visibles = soloFaltan ? lista.filter((a) => a.estado !== 'otorgado') : lista;

  const invitar = async (a: ConsentimientoAlumno) => {
    setGenerando(a.alumnoId);
    setErrorInvitacion('');
    try {
      const r = await docenteService.invitarFamilia(a.alumnoId);
      setInvitacion({ alumno: a.nombre, codigo: r.codigo, venceEn: r.venceEn });
      setCopiado(false);
      setEnlaceCopiado(false);
      cargar();
    } catch {
      setErrorInvitacion('No pudimos generar la invitación. Probá de nuevo.');
    } finally {
      setGenerando(null);
    }
  };

  // Mensaje para WhatsApp: corto, con el enlace (que ya trae el código) y el código por si el enlace no se abre.
  const mensajeWhatsApp = () => {
    if (!invitacion) return '';
    const firma = sesion?.nombreVisible ? `Soy ${sesion.nombreVisible}${sesion.escuelaNombre ? `, de ${sesion.escuelaNombre}` : ''}. ` : '';
    return `¡Hola! ${firma}Te invito a crear tu cuenta en Chasqui para acompañar a ${invitacion.alumno} y autorizar su uso. Entrá acá: ${enlaceDeInvitacion(invitacion.codigo)}\n\nSi no se abre, escribí este código en la página de invitación: ${invitacion.codigo} (sirve una sola vez y vence en 7 días).`;
  };

  const copiarEnlace = async () => {
    if (!invitacion) return;
    try {
      await navigator.clipboard.writeText(enlaceDeInvitacion(invitacion.codigo));
      setEnlaceCopiado(true);
    } catch {
      setEnlaceCopiado(false);
    }
  };

  const copiar = async () => {
    if (!invitacion) return;
    try {
      await navigator.clipboard.writeText(invitacion.codigo);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  if (cargando) return <LoadingSkeleton type="row" count={5} />;
  if (error) return <ErrorState title="No pudimos cargar las familias" message="Revisá tu conexión y reintentá." onRetry={cargar} />;
  if (lista.length === 0) {
    return <EmptyState title="Todavía no hay alumnos" description="Cuando tus alumnos entren a la clase, acá vas a ver el permiso de cada familia." />;
  }

  return (
    <div className="space-y-6 w-full max-w-6xl min-w-0 font-body">
      <div className="border-b border-divider pb-4">
        <span className="text-xs font-heading font-extrabold text-accent-strong uppercase tracking-wider">
          {faltan === 0 ? 'Todas las familias autorizaron' : `${faltan} ${faltan === 1 ? 'familia falta' : 'familias faltan'} autorizar`}
        </span>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight mt-1">Familias y consentimientos</h1>
        <p className="text-sm text-text/75 mt-1 max-w-2xl">
          Un chico solo puede usar Chasqui cuando su familia lo autoriza. Generá una invitación y entregásela a la familia: con ese código
          crea su cuenta y da el permiso.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={soloFaltan} onChange={(e) => setSoloFaltan(e.target.checked)} className="w-5 h-5 accent-[var(--color-accent-strong)]" />
          <span>Mostrar solo a quienes les falta el permiso</span>
        </label>
      </div>

      {errorInvitacion && (
        <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
          {errorInvitacion}
        </p>
      )}

      <ul className="space-y-2">
        {visibles.map((a) => {
          const e = ETIQUETA_ESTADO[a.estado];
          return (
            <li key={a.alumnoId} className="flex flex-col md:flex-row md:items-center gap-3 p-3 sm:p-4 bg-surface border border-divider rounded-lg min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-heading font-extrabold text-base text-text break-words">{a.nombre}</p>
                <p className="text-sm text-text/70">
                  {a.curso}
                  {a.familiaVinculada ? ' · Familia vinculada' : ' · Sin familia vinculada'}
                  {a.invitacionVigente ? ' · Invitación vigente' : ''}
                </p>
              </div>
              <Tag variant={e.variante} className="self-start md:self-center">
                {e.texto}
              </Tag>
              <Button
                variant="secondary"
                size="sm"
                disabled={generando === a.alumnoId}
                onClick={() => invitar(a)}
                aria-label={`Generar invitación para la familia de ${a.nombre}`}
                className="gap-1.5 self-start md:self-center"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>{generando === a.alumnoId ? 'Generando…' : a.invitacionVigente ? 'Nueva invitación' : 'Invitar a la familia'}</span>
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog
        isOpen={invitacion !== null}
        onClose={() => setInvitacion(null)}
        title={`Invitación para la familia de ${invitacion?.alumno ?? ''}`}
        description="Mandale el enlace por WhatsApp: ya trae el código y la familia solo completa sus datos. Sirve una sola vez y vence en 7 días."
        actions={
          <Button variant="primary" onClick={() => setInvitacion(null)}>
            Listo
          </Button>
        }
      >
        <div className="space-y-4">
          <p
            className="text-center font-mono font-extrabold text-3xl sm:text-4xl tracking-[0.3em] p-4 bg-neutral-100 border-2 border-dashed border-divider break-all"
            aria-label={`Código: ${invitacion?.codigo.split('').join(' ')}`}
          >
            {invitacion?.codigo}
          </p>
          {invitacion && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-3d btn-3d-primary w-full min-h-[48px] px-4 gap-2 text-base"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span>Enviar por WhatsApp</span>
            </a>
          )}
          <p className="text-xs text-text/70 text-center">Se abre WhatsApp con el mensaje armado: elegís el contacto de la familia y lo mandás.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={copiarEnlace} className="gap-1.5">
              {enlaceCopiado ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
              <span>{enlaceCopiado ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={copiar} className="gap-1.5">
              {copiado ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              <span>{copiado ? 'Copiado' : 'Copiar código'}</span>
            </Button>
          </div>
          <p className="text-sm text-text/80">
            Si la familia no usa WhatsApp, puede entrar a <strong>{typeof window !== 'undefined' ? `${window.location.origin}/familia/invitacion` : '/familia/invitacion'}</strong> y escribir el código.
          </p>
          <p className="text-xs text-text/60">Este código no se vuelve a mostrar: si lo perdés, generá uno nuevo y el anterior deja de servir.</p>
        </div>
      </Dialog>
    </div>
  );
};
