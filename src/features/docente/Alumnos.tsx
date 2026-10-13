import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { docenteService, type AlumnoConAvance, type CursoDocente } from '@/services/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/States';
import { BarraAvance, Migas } from './ui';
import { KeyRound, MessageSquareHeart, Search, UserCheck } from 'lucide-react';

type CodigoVisible = { titulo: string; descripcion: string; codigo: string; venceEn: string };

const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

/** Todos los alumnos registrados en los cursos de la docente, con su avance en las misiones (no son notas). */
export const Alumnos: React.FC = () => {
  const [alumnos, setAlumnos] = useState<AlumnoConAvance[]>([]);
  const [cursosDocente, setCursosDocente] = useState<CursoDocente[]>([]);
  const [codigos, setCodigos] = useState<Record<string, { vigente: boolean; venceEn: string | null }>>({});
  const [pendientes, setPendientes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [curso, setCurso] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [visible, setVisible] = useState<CodigoVisible | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(false);
    Promise.all([
      docenteService.listarAlumnos(),
      docenteService.listarCursos().catch(() => [] as CursoDocente[]),
      docenteService.listarSolicitudesIngreso().catch(() => []),
    ])
      .then(async ([a, c, s]) => {
        setAlumnos(a);
        setCursosDocente(c);
        setPendientes(s.length);
        const estados = await Promise.all(c.map((x) => docenteService.estadoCodigoClase(x.id).catch(() => ({ vigente: false, venceEn: null }))));
        setCodigos(Object.fromEntries(c.map((x, i) => [x.id, estados[i]])));
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const cursos = useMemo(() => [...new Map(alumnos.map((a) => [a.cursoId, a.curso])).entries()], [alumnos]);
  const visibles = alumnos.filter(
    (a) => (curso === 'todos' || a.cursoId === curso) && a.nombre.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')),
  );

  const generarAcceso = async (a: AlumnoConAvance) => {
    setOcupado(a.id);
    setErrorAccion('');
    try {
      const r = await docenteService.generarAcceso(a.id);
      setVisible({
        titulo: `Acceso nuevo para ${a.nombre}`,
        descripcion: `Dictale este código a ${a.nombre}: lo escribe en “Ya tengo cuenta” (/alumno/acceso) del dispositivo donde quiere entrar. Sirve una sola vez (vence a las ${hora(r.venceEn)}).`,
        codigo: r.codigo,
        venceEn: r.venceEn,
      });
    } catch {
      setErrorAccion('No pudimos generar el acceso. Probá de nuevo en un rato.');
    } finally {
      setOcupado(null);
    }
  };

  const generarCodigoClase = async (c: CursoDocente) => {
    setOcupado(c.id);
    setErrorAccion('');
    try {
      const r = await docenteService.generarCodigoClase(c.id);
      setCodigos((prev) => ({ ...prev, [c.id]: { vigente: true, venceEn: r.venceEn } }));
      setVisible({
        titulo: `Código de clase de ${c.nombre}`,
        descripcion: `Los chicos lo escriben en /alumno/ingreso para pedir entrar; vos aprobás cada pedido. Vence el ${fechaLarga(r.venceEn)}. El código anterior ya no sirve. Anotalo ahora: no se vuelve a mostrar.`,
        codigo: r.codigo,
        venceEn: r.venceEn,
      });
    } catch {
      setErrorAccion('No pudimos generar el código. Probá de nuevo en un rato.');
    } finally {
      setOcupado(null);
    }
  };

  if (cargando) return <LoadingSkeleton type="row" count={6} />;
  if (error) return <ErrorState title="No pudimos cargar los alumnos" message="Revisá tu conexión y reintentá." onRetry={cargar} />;

  return (
    <div className="space-y-6 w-full max-w-5xl min-w-0 font-body">
      <div className="border-b border-divider pb-4 space-y-2">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Alumnos' }]} />
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">Alumnos</h1>
        <p className="text-sm text-text/75 max-w-xl">
          Todos los alumnos de tus cursos. El avance cuenta misiones realizadas: no son notas. Entrá a un alumno para ver su perfil y dejarle un mensaje.
        </p>
      </div>

      {pendientes > 0 && (
        <div role="status" className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-accent-100 border-2 border-accent-300">
          <UserCheck className="w-5 h-5 text-accent-strong shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm font-semibold">
            Hay {pendientes} {pendientes === 1 ? 'pedido de ingreso esperando' : 'pedidos de ingreso esperando'} tu aprobación. Hasta que lo apruebes, ese chico no aparece en esta lista.
          </p>
          <Link to="/docente/ingresos" className="inline-flex items-center justify-center min-h-[44px] px-4 bg-accent-strong text-on-accent font-heading font-bold text-sm">
            Ver pedidos
          </Link>
        </div>
      )}

      {errorAccion && <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">{errorAccion}</p>}

      {cursosDocente.length > 0 && (
        <section aria-labelledby="codigo-clase" className="p-4 bg-surface border-2 border-divider rounded-lg space-y-3">
          <div>
            <h2 id="codigo-clase" className="text-lg font-heading font-extrabold text-text">Sumar alumnos nuevos</h2>
            <p className="text-sm text-text/75">
              Generá el código de clase y dáselo a los chicos: lo escriben en <strong>/alumno/ingreso</strong> y te llega un pedido para aprobar.
              Por seguridad el código se muestra una sola vez; si se perdió, generá uno nuevo (el anterior deja de servir).
            </p>
          </div>
          <ul className="space-y-2">
            {cursosDocente.map((c) => {
              const estado = codigos[c.id];
              return (
                <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between p-3 border border-divider min-w-0">
                  <p className="text-sm min-w-0">
                    <span className="font-heading font-bold">{c.nombre}</span>
                    {' · '}
                    {estado?.vigente && estado.venceEn ? `código vigente hasta el ${fechaLarga(estado.venceEn)}` : 'no hay un código vigente'}
                  </p>
                  <Button variant="secondary" size="sm" disabled={ocupado === c.id} onClick={() => generarCodigoClase(c)} className="gap-1.5">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                    <span>{ocupado === c.id ? 'Generando…' : estado?.vigente ? 'Generar código nuevo' : 'Generar código de clase'}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {alumnos.length === 0 ? (
        <EmptyState title="Todavía no hay alumnos" description="Cuando aprobes pedidos de ingreso, los vas a ver acá." />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1.5 sm:w-56">
              <label htmlFor="filtro-curso" className="text-xs font-heading font-semibold text-text/80">Curso</label>
              <select
                id="filtro-curso"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm"
              >
                <option value="todos">Todos ({alumnos.length})</option>
                {cursos.map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre} ({alumnos.filter((a) => a.cursoId === id).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="buscar-alumno" className="text-xs font-heading font-semibold text-text/80">Buscar por nombre</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text/60" aria-hidden="true" />
                <input
                  id="buscar-alumno"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 bg-surface text-text border border-divider rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {visibles.length === 0 ? (
            <p role="status" className="p-4 bg-neutral-100 border border-divider text-sm">No hay alumnos que coincidan con la búsqueda.</p>
          ) : (
            <ul className="space-y-2">
              {visibles.map((a) => (
                <li key={a.id} className="p-3 bg-surface border border-divider rounded-md flex flex-col lg:flex-row lg:items-center gap-3 min-w-0">
                  <Link to={`/docente/alumnos/${a.id}`} className="inline-flex flex-col min-h-[44px] justify-center lg:w-48 hover:underline">
                    <span className="font-heading font-bold text-text break-words">{a.nombre}</span>
                    <span className="text-xs text-text/70">{a.curso}</span>
                  </Link>
                  <div className="flex-1 min-w-0">
                    {a.total > 0 ? (
                      <>
                        <BarraAvance valor={Math.round((100 * a.completadas) / a.total)} etiqueta={`Avance de ${a.nombre}`} />
                        <p className="text-xs text-text/70 mt-0.5">{a.completadas} de {a.total} misiones</p>
                      </>
                    ) : (
                      <p className="text-sm text-text/70">Todavía no hay misiones en su curso.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/docente/alumnos/${a.id}#mensajes`}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-heading font-bold text-accent-strong border border-divider hover:border-accent-strong"
                    >
                      <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
                      <span>Dejar un mensaje</span>
                    </Link>
                    <Button variant="secondary" size="sm" disabled={ocupado === a.id} onClick={() => generarAcceso(a)} aria-label={`Dar acceso nuevo a ${a.nombre}`} className="gap-1.5">
                      <KeyRound className="w-4 h-4" aria-hidden="true" />
                      <span>{ocupado === a.id ? 'Generando…' : 'Dar nuevo acceso'}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog
        isOpen={visible !== null}
        onClose={() => setVisible(null)}
        title={visible?.titulo ?? ''}
        description={visible?.descripcion}
        actions={<Button variant="primary" onClick={() => setVisible(null)}>Listo</Button>}
      >
        <p
          className="text-center font-mono text-3xl md:text-4xl font-extrabold tracking-[0.3em] break-all select-all p-4 bg-neutral-100 border border-divider"
          aria-label={`Código ${visible?.codigo.split('').join(' ')}`}
        >
          {visible?.codigo}
        </p>
      </Dialog>
    </div>
  );
};
