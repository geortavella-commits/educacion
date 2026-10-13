import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docenteService, type EstadoProyectoDocente, type ProyectoGestion } from '@/services/docente';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Input, Textarea } from '@/components/Input';
import { ETIQUETA_PROYECTO } from './ui';
import { TarjetaGrupo } from './TarjetaGrupo';
import { TarjetaCurso } from './TarjetaCurso';
import { CamposRespuesta } from './CamposRespuesta';
import { aDatosRespuesta, ETIQUETAS_TIPO, respuestaVacia, validarBorrador } from '@/lib/borradorRespuesta';
import { Archive, CalendarDays, CheckCircle2, ChevronDown, Pencil, Plus, Printer, RotateCcw, Send, Target, Trash2, Users } from 'lucide-react';

/** Primer día de la semana N (YYYY-MM-DD), a partir del día de inicio del proyecto. */
function inicioDeSemana(fechaInicio: string | null, semana: number): Date | null {
  if (!fechaInicio || !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) return null;
  const d = new Date(`${fechaInicio}T00:00:00`);
  d.setDate(d.getDate() + (semana - 1) * 7);
  return d;
}
const diaDeSemana = (fechaInicio: string | null, semana: number) => inicioDeSemana(fechaInicio, semana)?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) ?? '';
/** ¿Ya empezó esa semana? (hoy, en la hora de la compu; la base y el servidor usan la hora de Córdoba). */
const estaHabilitadaHoy = (fechaInicio: string | null, semana: number) => {
  const d = inicioDeSemana(fechaInicio, semana);
  return !d || d.getTime() <= Date.now();
};

/**
 * Gestión real del proyecto: a quién abarca (todo el curso), estado, edición, misiones y grupos.
 * Con los datos de ejemplo (sin base) no se muestra.
 */
export const ProyectoPanel: React.FC<{ p: ProyectoGestion; alCambiar: () => void }> = ({ p, alCambiar }) => {
  const navigate = useNavigate();
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState<'finalizado' | 'archivado'>('finalizado');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<EstadoProyectoDocente>('borrador');
  const [fechaInicio, setFechaInicio] = useState('');
  const [nuevaMision, setNuevaMision] = useState(false);
  const [tituloMision, setTituloMision] = useState('');
  const [consignaMision, setConsignaMision] = useState('');
  const [respuestaMision, setRespuestaMision] = useState(respuestaVacia());
  const [errorMision, setErrorMision] = useState<string | null>(null);

  const [semanaMision, setSemanaMision] = useState<number | ''>('');
  const semanaActual = () => {
    // La última semana ya habilitada es la "de hoy": la que se abre sola y la que se propone al agregar una misión.
    const habilitadas = p.etapas.filter((e) => estaHabilitadaHoy(p.fechaInicio, e.semana));
    return habilitadas.length > 0 ? habilitadas[habilitadas.length - 1].semana : (p.etapas[0]?.semana ?? 0);
  };
  const [abiertas, setAbiertas] = useState<Set<number>>(() => new Set([semanaActual()]));
  const alternarSemana = (n: number) =>
    setAbiertas((a) => {
      const nuevo = new Set(a);
      if (nuevo.has(n)) nuevo.delete(n);
      else nuevo.add(n);
      return nuevo;
    });

  const renderMision = (m: ProyectoGestion['misionesDetalle'][number]) => (
    <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-[#e5f8cf]/40 border-2 border-slate-200 hover:border-[#58cc02] rounded-2xl transition min-w-0">
      <span className="flex items-center gap-3.5 min-w-0">
        <span className="w-7 h-7 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">{m.orden}</span>
        <span className="font-extrabold text-sm text-slate-800 break-words min-w-0">
          {m.titulo}
          {m.tipoRespuesta !== 'abierta' && <span className="ml-2 text-xs font-bold text-slate-600">· {ETIQUETAS_TIPO[m.tipoRespuesta]}</span>}
        </span>
      </span>
      <span className="flex items-center gap-2.5 text-xs font-bold text-slate-600 shrink-0">
        {m.alumnosQueCompletaron} de {p.alumnos} la completaron
        <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${m.alumnosQueCompletaron > 0 ? 'bg-[#58cc02]' : 'bg-slate-300'}`} />
      </span>
    </li>
  );

  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    setOcupado(true);
    setErrorAccion('');
    setAviso('');
    try {
      await accion();
      setAviso(mensaje);
      window.dispatchEvent(new Event('datos-docente-actualizados'));
      alCambiar();
      return true;
    } catch {
      setErrorAccion('No pudimos guardar el cambio. Probá de nuevo.');
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const abrirEdicion = () => {
    setTitulo(p.titulo);
    setDescripcion(p.descripcion);
    setEstado(p.estado);
    setFechaInicio(p.fechaInicio ?? '');
    setEditando(true);
  };

  const abrirNuevaMision = () => {
    setTituloMision('');
    setConsignaMision('');
    setRespuestaMision(respuestaVacia());
    setErrorMision(null);
    setSemanaMision(p.etapas.length > 0 ? semanaActual() : '');
    setNuevaMision(true);
  };

  const completadasDeSemana = (n: number | null) => {
    const ms = p.misionesDetalle.filter((m) => m.semana === n);
    const posibles = ms.length * p.alumnos;
    return { cantidad: ms.length, pct: posibles ? Math.round((100 * ms.reduce((t, m) => t + m.alumnosQueCompletaron, 0)) / posibles) : 0 };
  };

  // Un acordeón por semana (o uno solo si el proyecto no está planificado por semanas).
  // (Función de render y no componente: así el botón no se vuelve a crear al desplegar y conserva el foco.)
  const renderSemana = ({ id, titulo, objetivo, cuando, misiones }: { id: number; titulo: string; objetivo?: string; cuando?: { habilitada: boolean; texto: string }; misiones: ProyectoGestion['misionesDetalle'] }) => {
    const abierta = abiertas.has(id);
    const { cantidad, pct } = completadasDeSemana(id === 0 ? null : id);
    const esActual = id !== 0 && id === semanaActual();
    return (
      <li key={id} className={`bg-white border-2 rounded-3xl shadow-sm transition-all min-w-0 ${abierta ? 'border-[#58cc02]/60 shadow-md' : 'border-slate-200'}`}>
        <h4 className="m-0">
          <button
            type="button"
            onClick={() => alternarSemana(id)}
            aria-expanded={abierta}
            aria-controls={`semana-${id}`}
            className="w-full min-h-[64px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left cursor-pointer rounded-3xl"
          >
            <span className="flex items-center gap-3 min-w-0">
              {id !== 0 && (
                <span className={`w-9 h-9 rounded-2xl border-2 flex items-center justify-center font-black text-sm shrink-0 ${esActual ? 'bg-[#e5f8cf] border-[#58cc02] text-[#2b6c00]' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{id}</span>
              )}
              <span className="min-w-0">
                <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight break-words">{titulo}</span>
                <span className="text-xs font-bold text-slate-600">
                  {cantidad} {cantidad === 1 ? 'misión' : 'misiones'}
                  {p.alumnos > 0 && cantidad > 0 ? ` • ${pct}% completado` : ''}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-3 self-end md:self-auto">
              {cuando && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs border ${cuando.habilitada ? 'bg-[#e5f8cf] border-[#58cc02]/40 text-[#2b6c00]' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                  {cuando.texto}
                </span>
              )}
              <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <ChevronDown className={`w-4 h-4 transition-transform ${abierta ? 'rotate-180' : ''}`} aria-hidden="true" />
              </span>
            </span>
          </button>
        </h4>
        {abierta && (
          <div id={`semana-${id}`} className="mx-4 sm:mx-5 pb-5 pt-4 space-y-4 border-t-2 border-slate-100">
            {objetivo && <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 break-words">{objetivo}</p>}
            {misiones.length > 0 && (
              <Link to={`/docente/proyectos/${p.id}/imprimir?semana=${p.id}:${id === 0 ? 'sin' : id}`} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm">
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>Imprimir esta {id === 0 ? 'lista' : 'semana'}</span>
              </Link>
            )}
            {misiones.length === 0 ? <p className="text-sm text-slate-600">Todavía no hay misiones en esta semana.</p> : <ol className="space-y-2">{misiones.map(renderMision)}</ol>}
          </div>
        )}
      </li>
    );
  };

  const puntoEstado: Record<string, string> = { borrador: 'bg-[#ff9600]', activo: 'bg-[#58cc02]' };

  return (
    <section aria-labelledby="gestion-proyecto" className="space-y-8">
      <h2 id="gestion-proyecto" className="sr-only">
        Gestión del proyecto
      </h2>

      {/* Resumen y acciones */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-5 border-b-2 border-slate-100">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <span className="text-xs font-black uppercase text-slate-600 tracking-wider block mb-1">Estado</span>
              <span className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${puntoEstado[p.estado] ?? 'bg-slate-400'}`} />
                {ETIQUETA_PROYECTO[p.estado] ?? p.estado}
              </span>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-slate-600 tracking-wider block mb-1">Participan</span>
              <span className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#158ecc]" aria-hidden="true" />
                Todo el curso • {p.alumnos} alumnos
              </span>
            </div>
            <div className="min-w-[160px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Avance</span>
                <span className="text-xs font-black text-slate-700">{p.avance}%</span>
              </div>
              <div role="progressbar" aria-label="Avance del curso en el proyecto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.avance} className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div className="bg-[#58cc02] h-full rounded-full transition-all duration-500" style={{ width: `${p.avance}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <button type="button" onClick={abrirEdicion} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm cursor-pointer">
              <Pencil className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>Editar</span>
            </button>
            <button type="button" onClick={() => { setErrorEliminar(''); setEliminando(true); }} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm cursor-pointer !text-red-700 !border-red-200 !border-b-red-300">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Eliminar</span>
            </button>
            {p.estado === 'activo' && (
              <button type="button" onClick={() => { setMotivoCierre('finalizado'); setCerrando(true); }} className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm cursor-pointer">
                <CheckCircle2 className="w-4 h-4 text-[#2b6c00]" aria-hidden="true" />
                <span>Cerrar proyecto</span>
              </button>
            )}
            {(p.estado === 'finalizado' || p.estado === 'archivado') && (
              <button type="button" disabled={ocupado} onClick={() => ejecutar(() => docenteService.actualizarProyecto(p.id, { titulo: p.titulo, descripcion: p.descripcion, estado: 'activo' }), 'Volvió a estar en curso: tus alumnos lo ven de nuevo.')} className="btn-3d btn-3d-primary min-h-[44px] px-5 gap-2 text-sm cursor-pointer">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Volver a ponerlo en curso</span>
              </button>
            )}
            {p.estado === 'borrador' && (
              <button type="button" onClick={() => setPublicando(true)} className="btn-3d btn-3d-primary min-h-[44px] px-5 gap-2 text-sm cursor-pointer">
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Publicar a {p.curso}</span>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1.5 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {p.estado === 'borrador' && <p className="font-extrabold text-[#7a4200]">Es un borrador: los alumnos todavía no lo ven.</p>}
          {(p.estado === 'finalizado' || p.estado === 'archivado') && <p className="font-extrabold text-slate-800">{p.estado === 'finalizado' ? 'Proyecto terminado' : 'Proyecto anulado'}: los alumnos ya no lo ven. Todo su avance y sus respuestas quedan guardados.</p>}
          {p.descripcion ? <p className="leading-relaxed font-semibold text-slate-700 break-words">{p.descripcion}</p> : p.estado !== 'borrador' && <p className="font-semibold text-slate-600">Este proyecto no tiene descripción.</p>}
        </div>
        {aviso && <p role="status" className="p-3 bg-[#e5f8cf] border-2 border-[#58cc02]/50 rounded-2xl text-sm font-extrabold text-[#2b6c00]">{aviso}</p>}
        {errorAccion && <p role="alert" className="p-3 bg-[#fff2d6] border-2 border-[#ff9600]/40 rounded-2xl text-sm font-extrabold text-[#7a4200]">{errorAccion}</p>}
      </div>

      {/* Grupos: lo más importante del proyecto, el acceso a los alumnos y a lo que fueron respondiendo */}
      <section aria-labelledby="grupos-proyecto" className="p-5 sm:p-6 bg-[#ddf4ff]/50 border-2 border-[#1cb0f6]/40 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id="grupos-proyecto" className="m-0 text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#158ecc]" aria-hidden="true" />
              Alumnos y grupos
            </h3>
            <p className="text-sm font-semibold text-slate-700">Todo el curso trabaja el proyecto; los grupos son una forma de organizarlo. Entrá a cualquiera para ver cómo avanzan y lo que respondieron.</p>
          </div>
          <Link to={`/docente/grupos/nuevo?proyecto=${p.id}`} className="btn-3d btn-3d-secondary min-h-[44px] px-4 gap-1.5 text-sm self-start sm:self-auto">
            <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>Nuevo grupo</span>
          </Link>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          <li className="min-w-0">
            <TarjetaCurso curso={p.curso} participantes={p.participantes} avance={p.avance} />
          </li>
          {p.gruposLista.map((g) => (
            <li key={g.id} className="min-w-0">
              <TarjetaGrupo g={g} />
            </li>
          ))}
        </ul>
        {p.gruposLista.length === 0 && <p className="text-sm font-semibold text-slate-700">Si querés organizar subgrupos dentro del curso, creá un grupo nuevo.</p>}
      </section>

      {/* Misiones: una semana por acordeón */}
      <section aria-labelledby="misiones-proyecto" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 id="misiones-proyecto" className="m-0 text-xl font-black text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#d67c00]" aria-hidden="true" />
            {p.etapas.length > 0 ? 'Misiones por semana' : 'Misiones'} ({p.misionesDetalle.length})
          </h3>
          <button type="button" onClick={abrirNuevaMision} className="btn-3d-outline min-h-[44px] px-4 gap-1.5 text-sm cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4 stroke-[3] text-[#2b6c00]" aria-hidden="true" />
            <span>Agregar misión</span>
          </button>
        </div>
        {p.misionesDetalle.length === 0 && p.etapas.length === 0 ? (
          <p className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-700">Todavía no hay misiones. Agregá la primera.</p>
        ) : p.etapas.length > 0 ? (
          <ul className="space-y-3">
            {p.etapas.map((e) => {
              const habilitada = estaHabilitadaHoy(p.fechaInicio, e.semana);
              const cuando = diaDeSemana(p.fechaInicio, e.semana);
              return renderSemana({
                id: e.semana,
                titulo: `Semana ${e.semana} • ${e.titulo}`,
                objetivo: e.objetivo,
                cuando: cuando ? { habilitada, texto: habilitada ? `Habilitada desde el ${cuando}` : `Se habilita el ${cuando}` } : undefined,
                misiones: p.misionesDetalle.filter((m) => m.semana === e.semana),
              });
            })}
            {p.misionesDetalle.some((m) => m.semana === null) && renderSemana({ id: 0, titulo: 'Sin semana (se ven desde el principio)', misiones: p.misionesDetalle.filter((m) => m.semana === null) })}
          </ul>
        ) : (
          <ul>{renderSemana({ id: 0, titulo: 'Todas las misiones', misiones: p.misionesDetalle })}</ul>
        )}
      </section>

      <p className="text-sm font-semibold text-slate-600">La evaluación oficial es tuya. Para acompañar a cada alumno, dejale un mensaje desde su perfil.</p>

      <Dialog
        isOpen={eliminando}
        onClose={() => setEliminando(false)}
        title={`¿Eliminar el proyecto “${p.titulo}”?`}
        description="Esta acción no se puede deshacer."
        actions={
          <>
            <Button variant="secondary" onClick={() => setEliminando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                setErrorEliminar('');
                try {
                  await docenteService.eliminarProyecto(p.id);
                  window.dispatchEvent(new Event('datos-docente-actualizados'));
                  navigate('/docente/proyectos');
                } catch (e) {
                  setErrorEliminar(
                    e instanceof Error && e.message === 'con_actividad'
                      ? 'Este proyecto ya tiene conversaciones de los alumnos con el tutor, por eso no se puede borrar. Archivalo desde “Editar”: deja de verse pero no se pierde nada.'
                      : e instanceof Error && e.message === 'sin_permiso'
                        ? 'Solo quien creó el proyecto puede eliminarlo.'
                        : 'No pudimos eliminar el proyecto. Probá de nuevo.',
                  );
                  setOcupado(false);
                }
              }}
            >
              Sí, eliminar
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-text/85">
          <p>
            Se {p.misionesDetalle.length === 1 ? 'borra 1 misión' : `borran ${p.misionesDetalle.length} misiones`}
            {p.gruposLista.length > 0 ? ` y ${p.gruposLista.length === 1 ? '1 grupo' : `${p.gruposLista.length} grupos`}` : ''}.
            {p.misionesDetalle.some((m) => m.alumnosQueCompletaron > 0) ? ' Hay alumnos que ya completaron misiones: ese avance se pierde.' : ''}
          </p>
          <p>Los alumnos, sus cuentas y los mensajes que les dejaste no se borran. Si solo querés que deje de verse, es mejor archivarlo desde “Editar”.</p>
          {errorEliminar && <p role="alert" className="p-3 bg-accent-100 border border-accent-300 font-semibold">{errorEliminar}</p>}
        </div>
      </Dialog>

      <Dialog
        isOpen={editando}
        onClose={() => setEditando(false)}
        title="Editar proyecto"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={titulo.trim().length < 3 || ocupado || (p.etapas.length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio))}
              onClick={async () => {
                if (await ejecutar(() => docenteService.actualizarProyecto(p.id, { titulo, descripcion, estado, fechaInicio: p.etapas.length > 0 ? fechaInicio : undefined }), 'Guardamos los cambios del proyecto.')) setEditando(false);
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Título del proyecto" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
          <Textarea label="¿De qué se trata?" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
          {p.etapas.length > 0 && (
            <Input
              label="¿Cuándo empieza la semana 1?"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              hint="Cada semana se habilita para tus alumnos en su día de inicio. Si lo movés, las demás semanas se corren con él."
            />
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estado-proyecto" className="text-xs font-heading font-semibold text-text/80">Estado</label>
            <select
              id="estado-proyecto"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoProyectoDocente)}
              className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm"
            >
              {(Object.keys(ETIQUETA_PROYECTO) as EstadoProyectoDocente[]).map((k) => (
                <option key={k} value={k}>{ETIQUETA_PROYECTO[k]}</option>
              ))}
            </select>
            <p className="text-xs text-text/70">“Borrador” lo deja solo para vos. Los alumnos ven los proyectos en curso.</p>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={cerrando}
        onClose={() => setCerrando(false)}
        title="¿Cerrar el proyecto?"
        description="Los alumnos dejan de verlo. No se borra nada: el avance, los grupos y las respuestas quedan guardados, y lo podés volver a poner en curso."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCerrando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={ocupado}
              onClick={async () => {
                if (await ejecutar(() => docenteService.actualizarProyecto(p.id, { titulo: p.titulo, descripcion: p.descripcion, estado: motivoCierre }), motivoCierre === 'finalizado' ? 'Cerraste el proyecto: pasó a Terminados.' : 'Anulaste el proyecto: quedó archivado en Terminados.')) setCerrando(false);
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="sr-only">Cómo se cierra</legend>
          {([
            ['finalizado', 'Terminó', 'Lo trabajamos completo. Queda guardado en “Terminados” con todo su avance.', CheckCircle2],
            ['archivado', 'Anularlo', 'No lo vamos a usar (por ejemplo, lo armé por error o se canceló). Queda archivado en “Terminados”.', Archive],
          ] as const).map(([valor, titulo, ayuda, Icono]) => (
            <label key={valor} className={`flex items-start gap-3 p-3.5 border-2 rounded-2xl cursor-pointer min-h-[44px] ${motivoCierre === valor ? 'border-[#58cc02] bg-[#e5f8cf]/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="motivo-cierre" checked={motivoCierre === valor} onChange={() => setMotivoCierre(valor)} className="w-5 h-5 mt-0.5 accent-[#2b6c00] shrink-0" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-extrabold text-slate-900"><Icono className="w-4 h-4 text-[#2b6c00]" aria-hidden="true" />{titulo}</span>
                <span className="block text-sm font-semibold text-slate-700">{ayuda}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Dialog>

      <Dialog
        isOpen={publicando}
        onClose={() => setPublicando(false)}
        title={`Publicar proyecto a ${p.curso}`}
        description={`Los ${p.alumnos} alumnos del curso van a ver sus misiones en Chasqui (si su familia ya dio el permiso).`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPublicando(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={ocupado}
              onClick={async () => {
                if (await ejecutar(() => docenteService.actualizarProyecto(p.id, { titulo: p.titulo, descripcion: p.descripcion, estado: 'activo' }), 'Publicaste el proyecto: ya está en curso.')) setPublicando(false);
              }}
            >
              Confirmar publicación
            </Button>
          </>
        }
      >
        <p className="text-sm text-text/85">Podés volver a ponerlo en borrador cuando quieras desde “Editar”.</p>
      </Dialog>

      <Dialog
        isOpen={nuevaMision}
        onClose={() => setNuevaMision(false)}
        title="Agregar misión"
        actions={
          <>
            <Button variant="secondary" onClick={() => setNuevaMision(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={tituloMision.trim().length < 3 || ocupado}
              onClick={async () => {
                const problema = validarBorrador(respuestaMision);
                if (problema) {
                  setErrorMision(problema);
                  return;
                }
                if (await ejecutar(() => docenteService.agregarMision(p.id, { titulo: tituloMision, consigna: consignaMision, respuesta: aDatosRespuesta(respuestaMision), semana: semanaMision === '' ? undefined : semanaMision }), 'Agregamos la misión.')) setNuevaMision(false);
              }}
            >
              Guardar misión
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Título de la misión" value={tituloMision} onChange={(e) => setTituloMision(e.target.value)} maxLength={80} />
          {p.etapas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="semana-mision" className="text-xs font-heading font-semibold text-text/80">¿En qué semana?</label>
              <select id="semana-mision" value={semanaMision} onChange={(e) => setSemanaMision(Number(e.target.value))} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                {p.etapas.map((e) => (
                  <option key={e.semana} value={e.semana}>Semana {e.semana} · {e.titulo}</option>
                ))}
              </select>
            </div>
          )}
          <Textarea label="Enunciado: el problema o la tarea (opcional)" value={consignaMision} onChange={(e) => setConsignaMision(e.target.value)} rows={3} maxLength={400} />
          <CamposRespuesta idBase="panel-mision" valor={respuestaMision} alCambiar={(r) => { setRespuestaMision(r); setErrorMision(null); }} error={errorMision} />
        </div>
      </Dialog>
    </section>
  );
};
