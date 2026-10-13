import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { docenteService, type AlumnoCurso, type CursoDocente, type ProyectoGestionItem } from '@/services/docente';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState, LoadingSkeleton, EmptyState } from '@/components/States';
import { nombreClasifica } from '@/lib/nombreGrupo';
import { Migas } from './ui';
import { SugerenciasGrupo } from './SugerenciasGrupo';
import { ContextoCurricular } from './ContextoCurricular';
import type { GrupoSugerido } from '@/lib/sugerirGrupos';
import { AlertTriangle } from 'lucide-react';

export const NuevoGrupo: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [proyectos, setProyectos] = useState<ProyectoGestionItem[]>([]);
  const [proyectoId, setProyectoId] = useState('');
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
  const [cursoId, setCursoId] = useState('');
  const [alumnos, setAlumnos] = useState<AlumnoCurso[]>([]);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [nombre, setNombre] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    Promise.all([docenteService.listarCursos(), docenteService.listarProyectosGestion()])
      .then(([c, p]) => {
        setCursos(c);
        setProyectos(p);
        // Si llega ?proyecto=, el curso y el proyecto ya vienen elegidos.
        const pedido = p.find((x) => x.id === params.get('proyecto'));
        if (pedido) {
          setCursoId(pedido.cursoId);
          setProyectoId(pedido.id);
        } else if (c.length) {
          setCursoId(c[0].id);
        }
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!cursoId) return;
    setElegidos([]);
    setProyectoId((actual) => (proyectos.find((p) => p.id === actual)?.cursoId === cursoId ? actual : ''));
    docenteService.listarAlumnosDeCurso(cursoId).then(setAlumnos).catch(() => setError(true));
  }, [cursoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = (id: string) => setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const clasifica = nombreClasifica(nombre);
  const faltaNombre = nombre.trim().length < 3;
  // Solo proyectos que se están trabajando (en curso o borrador); un proyecto terminado o anulado ya no recibe grupos.
  const proyectosDelCurso = proyectos.filter((p) => p.cursoId === cursoId && (p.estado === 'activo' || p.estado === 'borrador' || p.id === proyectoId));

  // La sugerencia solo llena el formulario: la docente lo revisa y crea el grupo (o no).
  const usarSugerencia = (g: GrupoSugerido) => {
    setNombre(g.nombre);
    setEtiqueta(g.etiquetaInterna);
    setElegidos(g.alumnoIds);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntento(true);
    setErrorGuardar('');
    if (faltaNombre || elegidos.length === 0 || !proyectoId) return;
    setGuardando(true);
    try {
      await docenteService.crearGrupo({ cursoId, proyectoId, nombreVisible: nombre.trim(), etiquetaDocente: etiqueta.trim(), alumnoIds: elegidos });
      navigate(`/docente/proyectos/${proyectoId}`);
    } catch {
      setErrorGuardar('No pudimos crear el grupo. Revisá tu conexión y probá de nuevo.');
      setGuardando(false);
    }
  };

  if (cargando) return <LoadingSkeleton type="card" count={2} />;
  if (error) return <ErrorState title="No pudimos cargar el formulario" message="Revisá tu conexión y reintentá." onRetry={() => window.location.reload()} />;
  if (cursos.length === 0) return <EmptyState title="Todavía no tenés cursos asignados" description="Pedile a la dirección que te asigne un curso para armar grupos." />;

  return (
    <div className="space-y-6 w-full max-w-3xl min-w-0 font-body">
      <div className="border-b border-divider pb-4">
        <Migas pasos={[{ texto: 'Inicio', to: '/docente' }, { texto: 'Proyectos', to: '/docente/proyectos' }, { texto: 'Nuevo grupo' }]} />
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text tracking-tight">Nuevo grupo</h1>
        <p className="text-sm text-text/75 mt-1">Armá un subgrupo de alumnos para trabajar dentro de un proyecto. Podés cambiarlo cuando quieras.</p>
      </div>

      <form onSubmit={guardar} noValidate className="space-y-6">
        {cursos.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="curso-grupo" className="text-xs font-heading font-semibold text-text/80">
              Curso
            </label>
            <select
              id="curso-grupo"
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm"
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <ContextoCurricular gradoInicial={cursos.find((c) => c.id === cursoId)?.nivel === 'primaria' ? cursos.find((c) => c.id === cursoId)?.anio : undefined} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="proyecto-grupo" className="text-xs font-heading font-semibold text-text/80">
            Proyecto del grupo
          </label>
          <select
            id="proyecto-grupo"
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm"
          >
            <option value="">Elegí un proyecto…</option>
            {proyectosDelCurso.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
          {proyectosDelCurso.length === 0 && (
            <p className="text-xs text-text/75">
              Este curso todavía no tiene proyectos. <Link to="/docente/proyectos/nuevo" className="font-bold text-accent-strong underline">Creá uno primero</Link>.
            </p>
          )}
          {intento && !proyectoId && <p role="alert" className="text-xs text-accent-strong font-semibold">Elegí el proyecto del grupo.</p>}
          <p className="text-xs text-text/70">El proyecto abarca a todo el curso; el grupo organiza a una parte de los alumnos dentro de él.</p>
        </div>

        <SugerenciasGrupo cursoId={cursoId} proyectoId={proyectoId} alUsar={usarSugerencia} alCrearTodos={() => navigate(proyectoId ? `/docente/proyectos/${proyectoId}` : '/docente/proyectos')} />

        <div className="space-y-2">
          <Input
            label="Nombre del grupo (lo ven los alumnos)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={40}
            placeholder="Ej.: Los exploradores"
            error={intento && faltaNombre ? 'Escribí un nombre de al menos 3 letras.' : undefined}
          />
          {clasifica && (
            <p role="status" className="flex items-start gap-2 p-3 bg-accent-100 border border-accent-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Este nombre puede clasificar a los alumnos.</strong> Los alumnos lo van a ver. Elegí un nombre motivador y neutro.
              </span>
            </p>
          )}
        </div>

        <Input
          label="Etiqueta interna (solo la ves vos)"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          maxLength={60}
          placeholder="Ej.: Refuerzo · Fracciones"
          hint="Sirve para tu organización. Nunca se muestra a los alumnos ni a las familias."
        />

        <fieldset className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-xs font-heading font-semibold text-text/80">
              Alumnos del grupo ({elegidos.length} {elegidos.length === 1 ? 'elegido' : 'elegidos'})
            </legend>
            <button
              type="button"
              onClick={() => setElegidos(elegidos.length === alumnos.length ? [] : alumnos.map((a) => a.id))}
              className="min-h-[44px] px-2 text-sm font-heading font-bold text-accent-strong hover:underline"
            >
              {elegidos.length === alumnos.length && alumnos.length > 0 ? 'Quitar a todos' : 'Elegir a todo el curso'}
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
            {alumnos.map((a) => (
              <li key={a.id}>
                <label className="flex items-center gap-3 p-2.5 bg-surface border border-divider rounded-md cursor-pointer min-h-[44px] hover:border-accent-strong">
                  <input type="checkbox" checked={elegidos.includes(a.id)} onChange={() => alternar(a.id)} className="w-5 h-5 accent-[var(--color-accent-strong)] shrink-0" />
                  <span className="text-sm font-semibold break-words">{a.nombre}</span>
                </label>
              </li>
            ))}
          </ul>
          {intento && elegidos.length === 0 && (
            <p role="alert" className="text-xs text-accent-strong font-semibold">
              Elegí al menos un alumno.
            </p>
          )}
        </fieldset>

        {errorGuardar && (
          <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
            {errorGuardar}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear grupo'}
          </Button>
          <Link to="/docente/grupos" className="inline-flex items-center min-h-[44px] px-3 text-sm font-bold text-text/80 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
};
