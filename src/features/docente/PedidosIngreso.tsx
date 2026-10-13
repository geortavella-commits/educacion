import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { docenteService, type SolicitudIngreso } from '@/services/docente';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/States';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Migas } from './ui';

// Los mismos avatares que elige el chico al pedir entrar.
const EMOJI_AVATAR: Record<string, string> = { 'av-1': '🦊', 'av-2': '🦉', 'av-3': '🚀', 'av-4': '🎨', 'av-5': '⭐', 'av-6': '⚽' };

const haceCuanto = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
};

export const PedidosIngreso: React.FC = () => {
  const [pedidos, setPedidos] = useState<SolicitudIngreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const cargar = () => {
    setCargando(true);
    setError(false);
    docenteService
      .listarSolicitudesIngreso()
      .then(setPedidos)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const resolver = async (p: SolicitudIngreso, accion: 'aprobar' | 'rechazar') => {
    setResolviendo(p.id);
    setErrorAccion('');
    setAviso('');
    try {
      await docenteService.resolverSolicitudIngreso(p.id, accion);
      setPedidos((lista) => lista.filter((x) => x.id !== p.id));
      window.dispatchEvent(new Event('datos-docente-actualizados'));
      setAviso(accion === 'aprobar' ? `${p.nombreVisible} ya puede entrar a ${p.curso}.` : `Rechazaste el pedido de ${p.nombreVisible}.`);
    } catch {
      setErrorAccion('No pudimos guardar tu decisión. Probá de nuevo.');
    } finally {
      setResolviendo(null);
    }
  };

  if (cargando) return <LoadingSkeleton type="row" count={4} />;
  if (error) return <ErrorState title="No pudimos cargar los pedidos" message="Revisá tu conexión y reintentá." onRetry={cargar} />;

  return (
    <div className="space-y-6 w-full max-w-6xl min-w-0 font-body">
      <div className="border-b border-divider pb-4">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Pedidos de ingreso' }]} />
        <span className="text-xs font-heading font-extrabold text-accent-strong uppercase tracking-wider">
          {pedidos.length} {pedidos.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
        </span>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight mt-1">Pedidos de ingreso</h1>
        <p className="text-sm text-text/75 mt-1 max-w-2xl">
          Estos chicos entraron con el código de tu clase. Aprobá solo a quienes conozcas: al aprobar se les crea su cuenta.
        </p>
      </div>

      {aviso && (
        <p role="status" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-accent-strong shrink-0" aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}
      {errorAccion && (
        <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
          {errorAccion}
        </p>
      )}

      {pedidos.length === 0 ? (
        <EmptyState
          title="No hay pedidos pendientes"
          description="Cuando un chico entre con el código de tu clase, lo vas a ver acá para aprobarlo."
        />
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 p-4 bg-surface border-2 border-divider rounded-lg min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                  {EMOJI_AVATAR[p.avatar ?? ''] ?? '🙂'}
                </span>
                <div className="min-w-0">
                  <p className="font-heading font-extrabold text-lg text-text break-words">{p.nombreVisible}</p>
                  <p className="text-sm text-text/70">
                    {p.curso} · {haceCuanto(p.creadaEn)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={resolviendo === p.id}
                  onClick={() => resolver(p, 'aprobar')}
                  aria-label={`Aprobar a ${p.nombreVisible}`}
                  className="gap-1.5"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{p.coincidencias.length > 0 ? 'Aprobar como alumno nuevo' : 'Aprobar'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={resolviendo === p.id}
                  onClick={() => resolver(p, 'rechazar')}
                  aria-label={`Rechazar a ${p.nombreVisible}`}
                  className="gap-1.5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Rechazar</span>
                </Button>
              </div>
              </div>

              {p.coincidencias.length > 0 && (
                <div role="note" className="flex items-start gap-2 p-3 bg-accent-100 border-2 border-accent-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p>
                      <strong>Ojo: ya hay {p.coincidencias.some((c) => c.tipo === 'alumno') ? 'un alumno' : 'otro pedido'} llamado “{p.nombreVisible}” en {p.curso}.</strong>{' '}
                      ¿Es la misma persona o un chico distinto con el mismo nombre?
                    </p>
                    <ul className="list-disc pl-5 text-text/85">
                      {p.coincidencias.map((c) => (
                        <li key={c.id}>
                          {c.tipo === 'alumno' ? (
                            <Link to={`/docente/alumnos/${c.id}`} className="font-bold text-accent-strong underline">
                              {c.nombre} (ya es alumno del curso)
                            </Link>
                          ) : (
                            <span>{c.nombre} (otro pedido sin resolver)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-text/85">
                      <strong>Si es la misma persona</strong> (perdió su sesión o cambió de dispositivo), no lo apruebes: rechazá este pedido y dale un
                      <strong> acceso nuevo</strong> desde <Link to="/docente/alumnos" className="font-bold text-accent-strong underline">Alumnos</Link>.{' '}
                      <strong>Si es otro chico</strong>, aprobalo como alumno nuevo.
                    </p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
