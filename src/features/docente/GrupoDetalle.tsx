import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { docenteService, type GrupoDetalle as Detalle } from '@/services/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { ErrorState, LoadingSkeleton } from '@/components/States';
import { nombreClasifica } from '@/lib/nombreGrupo';
import { BarraAvance, Migas } from './ui';
import { AlertTriangle, ArrowRight, MessageSquareHeart, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react';

export const GrupoDetalle: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [eliminando, setEliminando] = useState(false);
  const [g, setG] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [etiqueta, setEtiqueta] = useState('');

  const cargar = () => {
    setError(false);
    docenteService
      .obtenerGrupo(id)
      .then(setG)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, [id]);

  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    setOcupado(true);
    setErrorAccion('');
    setAviso('');
    try {
      await accion();
      setAviso(mensaje);
      window.dispatchEvent(new Event('datos-docente-actualizados'));
      cargar();
      return true;
    } catch {
      setErrorAccion('No pudimos guardar el cambio. Probá de nuevo.');
      return false;
    } finally {
      setOcupado(false);
    }
  };

  if (cargando) return <LoadingSkeleton type="card" count={2} />;
  if (error || !g) return <ErrorState title="No pudimos abrir el grupo" message="Revisá tu conexión y reintentá." onRetry={() => { setCargando(true); cargar(); }} />;

  const abrirEdicion = () => {
    setNombre(g.nombreVisible);
    setEtiqueta(g.etiquetaDocente);
    setEditando(true);
  };

  return (
    <div className="space-y-6 w-full max-w-5xl min-w-0 font-body">
      <div className="border-b border-divider pb-4 space-y-2">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, ...(g.proyectoId ? [{ texto: g.proyectoTitulo ?? 'Proyecto', to: `/docente/proyectos/${g.proyectoId}` }] : [{ texto: 'Proyectos', to: '/docente/proyectos' }]), { texto: g.nombreVisible }]} />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight break-words">{g.nombreVisible}</h1>
            </div>
            <p className="text-sm text-text/75">{g.curso}{g.etiquetaDocente ? ` · Etiqueta interna: ${g.etiquetaDocente}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={abrirEdicion} className="gap-1.5">
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span>Editar</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEliminando(true)} className="gap-1.5">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Eliminar grupo</span>
            </Button>
          </div>
        </div>
      </div>

      {aviso && <p role="status" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">{aviso}</p>}
      {errorAccion && <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">{errorAccion}</p>}

      <section aria-labelledby="proy-grupo" className="p-4 bg-surface border-2 border-divider rounded-lg space-y-3">
        <h2 id="proy-grupo" className="text-lg font-heading font-extrabold text-text">Proyecto del grupo</h2>
        {g.proyectoId ? (
          <>
            <p className="text-sm text-text/85 break-words">{g.proyectoTitulo}</p>
            <BarraAvance valor={g.avance} etiqueta="Avance del grupo en el proyecto" />
            <Link to={`/docente/proyectos/${g.proyectoId}`} className="inline-flex items-center gap-1 min-h-[44px] text-sm font-heading font-bold text-accent-strong hover:underline">
              Ver y editar el proyecto <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="text-sm text-text/80">Este grupo es anterior a los proyectos y no tiene uno asignado.</p>
        )}
      </section>

      <section aria-labelledby="alumnos-grupo" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="alumnos-grupo" className="text-lg font-heading font-extrabold text-text">Alumnos del grupo ({g.miembros.length})</h2>
          <Button variant="primary" size="sm" disabled={g.candidatos.length === 0} onClick={() => { setElegidos([]); setAgregando(true); }} className="gap-1.5">
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Agregar alumnos</span>
          </Button>
        </div>
        {g.miembros.length === 0 ? (
          <p className="p-4 bg-neutral-100 border border-divider text-sm">Este grupo todavía no tiene alumnos. Usá “Agregar alumnos”.</p>
        ) : (
          <ul className="space-y-2">
            {g.miembros.map((m) => (
              <li key={m.id} className="p-3 bg-surface border border-divider rounded-md flex flex-col md:flex-row md:items-center gap-3 min-w-0">
                <Link to={`/docente/alumnos/${m.id}`} className="font-heading font-bold text-text hover:underline break-words md:w-48 min-h-[44px] inline-flex items-center">
                  {m.nombre}
                </Link>
                <div className="flex-1 min-w-0">
                  {g.proyectoId ? (
                    <BarraAvance valor={m.total ? Math.round((100 * m.completadas) / m.total) : 0} etiqueta={`Avance de ${m.nombre}`} />
                  ) : null}
                  {g.proyectoId && <p className="text-xs text-text/70 mt-0.5">{m.completadas} de {m.total} misiones</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/docente/alumnos/${m.id}#mensajes`} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-heading font-bold text-accent-strong border border-divider hover:border-accent-strong">
                    <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
                    <span>Dejar un mensaje</span>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={ocupado}
                    aria-label={`Quitar a ${m.nombre} del grupo`}
                    onClick={() => ejecutar(() => docenteService.quitarAlumnoDeGrupo(g.id, m.id), `${m.nombre} salió del grupo.`)}
                    className="gap-1.5"
                  >
                    <UserMinus className="w-4 h-4" aria-hidden="true" />
                    <span>Quitar</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        isOpen={agregando}
        onClose={() => setAgregando(false)}
        title="Agregar alumnos al grupo"
        description="Son alumnos de tu curso que todavía no están en este grupo."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAgregando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={elegidos.length === 0 || ocupado}
              onClick={async () => {
                if (await ejecutar(() => docenteService.agregarAlumnosAGrupo(g.id, elegidos), `Sumaste ${elegidos.length} ${elegidos.length === 1 ? 'alumno' : 'alumnos'} al grupo.`)) setAgregando(false);
              }}
            >
              Agregar ({elegidos.length})
            </Button>
          </>
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
          {g.candidatos.map((a) => (
            <li key={a.id}>
              <label className="flex items-center gap-3 p-2.5 bg-surface border border-divider rounded-md cursor-pointer min-h-[44px] hover:border-accent-strong">
                <input
                  type="checkbox"
                  checked={elegidos.includes(a.id)}
                  onChange={() => setElegidos((l) => (l.includes(a.id) ? l.filter((x) => x !== a.id) : [...l, a.id]))}
                  className="w-5 h-5 accent-[var(--color-accent-strong)] shrink-0"
                />
                <span className="text-sm font-semibold break-words">{a.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog
        isOpen={eliminando}
        onClose={() => setEliminando(false)}
        title={`¿Eliminar el grupo “${g.nombreVisible}”?`}
        description="Esta acción no se puede deshacer."
        actions={
          <>
            <Button variant="secondary" onClick={() => setEliminando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                setErrorAccion('');
                try {
                  await docenteService.eliminarGrupo(g.id);
                  window.dispatchEvent(new Event('datos-docente-actualizados'));
                  navigate(g.proyectoId ? `/docente/proyectos/${g.proyectoId}` : '/docente/proyectos');
                } catch {
                  setEliminando(false);
                  setErrorAccion('No pudimos eliminar el grupo. Probá de nuevo.');
                  setOcupado(false);
                }
              }}
            >
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-text/85">
          Se borra el grupo y su lista de alumnos. Los alumnos, el proyecto y su avance no se tocan.
        </p>
      </Dialog>

      <Dialog
        isOpen={editando}
        onClose={() => setEditando(false)}
        title="Editar grupo"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={nombre.trim().length < 3 || ocupado}
              onClick={async () => {
                if (await ejecutar(() => docenteService.editarGrupo(g.id, { nombreVisible: nombre, etiquetaDocente: etiqueta }), 'Guardamos los cambios del grupo.')) setEditando(false);
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre del grupo (lo ven los alumnos)" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} />
          {nombreClasifica(nombre) && (
            <p role="status" className="flex items-start gap-2 p-3 bg-accent-100 border border-accent-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
              <span><strong>Este nombre puede clasificar a los alumnos.</strong> Elegí uno motivador y neutro.</span>
            </p>
          )}
          <Input label="Etiqueta interna (solo la ves vos)" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} maxLength={60} hint="Nunca se muestra a alumnos ni familias." />
        </div>
      </Dialog>
    </div>
  );
};
