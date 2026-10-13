import React, { useState } from 'react';
import { docenteService } from '@/services/docente';
import { obtenerEtiquetaInteres } from '@/services/diagnostico';
import { mensajeErrorIA } from '@/lib/mensajesIA';
import { nombreClasifica } from '@/lib/nombreGrupo';
import { hayDiferenciasDeAvance, resumenParaNombrar, sugerirGrupos, type AlumnoParaGrupos, type CriterioGrupos, type GrupoSugerido } from '@/lib/sugerirGrupos';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Lightbulb, Sparkles } from 'lucide-react';

const CRITERIOS: { valor: CriterioGrupos; titulo: string; ayuda: string }[] = [
  { valor: 'intereses', titulo: 'Intereses en común', ayuda: 'Junta chicos con gustos parecidos (fútbol, dibujo, música…), según lo que cada uno cargó.' },
  { valor: 'mezcla', titulo: 'Grupos variados', ayuda: 'Cada grupo mezcla chicos que van a distinto ritmo en este proyecto, para que se acompañen entre sí.' },
  { valor: 'ritmo', titulo: 'Ritmo de avance parecido', ayuda: 'Junta chicos que completaron una cantidad parecida de misiones de este proyecto. Es una foto de hoy: no es una nota ni un nivel, y solo la ves vos.' },
];

/**
 * Sugerencias de grupos para "Nuevo grupo". Se calculan en el navegador de la docente con datos que ella ya puede ver
 * (sin IA y sin enviar nada afuera). Son sugerencias: ella las usa, las cambia o las ignora; nada se crea solo.
 * Lo que ven los alumnos (el nombre del grupo) es siempre neutro; el ritmo de avance solo aparece acá, para la docente.
 */
export const SugerenciasGrupo: React.FC<{
  cursoId: string;
  proyectoId: string;
  alUsar: (g: GrupoSugerido) => void;
  alCrearTodos: () => void;
}> = ({ cursoId, proyectoId, alUsar, alCrearTodos }) => {
  const [criterio, setCriterio] = useState<CriterioGrupos>('intereses');
  const [tamano, setTamano] = useState(4);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [alumnos, setAlumnos] = useState<AlumnoParaGrupos[]>([]);
  const [grupos, setGrupos] = useState<GrupoSugerido[] | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [usado, setUsado] = useState('');
  const [nombrando, setNombrando] = useState(false);
  const [avisoIA, setAvisoIA] = useState('');

  const nombreDe = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '—';

  const ver = async () => {
    setCargando(true);
    setError('');
    setAviso('');
    setUsado('');
    setAvisoIA('');
    setGrupos(null);
    try {
      const datos = await docenteService.datosParaSugerirGrupos(cursoId, proyectoId);
      setAlumnos(datos.alumnos);
      if (datos.alumnos.length === 0) {
        setAviso('Este curso todavía no tiene alumnos para agrupar.');
        return;
      }
      if (criterio === 'ritmo' && (datos.totalMisiones === 0 || !hayDiferenciasDeAvance(datos.alumnos))) {
        setAviso('Todavía no hay diferencias de avance en este proyecto (nadie empezó, o todos van igual), así que no puedo agrupar por ritmo. Probá con intereses o con grupos variados.');
        return;
      }
      if (criterio === 'mezcla' && (datos.totalMisiones === 0 || !hayDiferenciasDeAvance(datos.alumnos))) {
        setAviso('Todavía no hay diferencias de avance en este proyecto: armé los grupos por orden alfabético.');
      }
      setGrupos(sugerirGrupos(datos.alumnos, { criterio, tamano, totalMisiones: datos.totalMisiones, etiquetaInteres: (id) => obtenerEtiquetaInteres(id) ?? id }));
    } catch {
      setError('No pudimos armar las sugerencias. Revisá tu conexión y probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Opcional y barato: la IA solo propone NOMBRES. Se le cuentan los temas de cada grupo y cuántos chicos tiene; nunca nombres ni ids.
  const nombrarConIA = async () => {
    if (!grupos || nombrando) return;
    setNombrando(true);
    setError('');
    setAvisoIA('');
    try {
      const nombres = await docenteService.sugerirNombresGrupos({ cursoId, proyectoId, grupos: resumenParaNombrar(grupos, alumnos) });
      const validos = Object.fromEntries(Object.entries(nombres).filter(([, n]) => !nombreClasifica(n)));
      const cambiados = grupos.filter((g) => validos[g.clave]).length;
      setGrupos(grupos.map((g) => (validos[g.clave] ? { ...g, nombre: validos[g.clave] } : g)));
      setAvisoIA(
        cambiados > 0
          ? `Listo: les puse nombre a ${cambiados} ${cambiados === 1 ? 'grupo' : 'grupos'}. Son sugerencias de la IA: podés cambiarlos antes de crear los grupos.`
          : 'La IA no devolvió nombres que cumplan las reglas de la plataforma: dejé los nombres de siempre.',
      );
    } catch (e) {
      setError(mensajeErrorIA(e instanceof Error ? e.message : ''));
    } finally {
      setNombrando(false);
    }
  };

  const crearTodos = async () => {
    if (!grupos) return;
    setCreando(true);
    setError('');
    try {
      for (const g of grupos) {
        await docenteService.crearGrupo({ cursoId, proyectoId, nombreVisible: g.nombre, etiquetaDocente: g.etiquetaInterna, alumnoIds: g.alumnoIds, explicacion: g.explicacion });
      }
      window.dispatchEvent(new Event('datos-docente-actualizados'));
      setConfirmando(false);
      alCrearTodos();
    } catch {
      setConfirmando(false);
      setError('No pudimos crear todos los grupos. Revisá la lista de grupos: puede que algunos se hayan creado.');
      setCreando(false);
    }
  };

  return (
    <section aria-labelledby="t-sugerencias" className="p-4 bg-accent-100 border-2 border-accent-300 rounded-lg space-y-3">
      <h2 id="t-sugerencias" className="font-heading font-extrabold text-lg flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-accent-strong" aria-hidden="true" />
        <span>¿Querés una sugerencia para armar los grupos?</span>
      </h2>
      <p className="text-sm text-text/80">
        Te propongo cómo agrupar a los chicos. Son <strong>sugerencias</strong>: vos las revisás y decidís, y los nombres que ven los chicos son siempre neutros.
      </p>

      {!proyectoId ? (
        <p role="status" className="p-3 bg-surface border border-divider text-sm">Elegí primero el proyecto del grupo para ver sugerencias.</p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-xs font-heading font-semibold text-text/80">¿Con qué criterio?</legend>
            {CRITERIOS.map((c) => (
              <label key={c.valor} className={`flex items-start gap-3 p-3 border-2 cursor-pointer min-h-[44px] ${criterio === c.valor ? 'border-accent-strong bg-surface' : 'border-divider bg-surface/60'}`}>
                <input type="radio" name="criterio-grupos" value={c.valor} checked={criterio === c.valor} onChange={() => setCriterio(c.valor)} className="mt-1 w-5 h-5 accent-[var(--color-accent-strong)] shrink-0" />
                <span className="text-sm">
                  <strong>{c.titulo}</strong>
                  <span className="block text-text/75">{c.ayuda}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1.5 sm:w-48">
              <label htmlFor="tamano-grupos" className="text-xs font-heading font-semibold text-text/80">Chicos por grupo</label>
              <select id="tamano-grupos" value={tamano} onChange={(e) => setTamano(Number(e.target.value))} className="w-full min-h-[44px] px-3 bg-surface text-text border border-divider rounded-md text-sm">
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={ver} disabled={cargando} isLoading={cargando}>
              {cargando ? 'Armando…' : 'Ver sugerencias'}
            </Button>
          </div>
        </>
      )}

      {error && <p role="alert" className="p-3 bg-surface border border-accent-300 text-sm font-semibold">{error}</p>}
      {aviso && <p role="status" className="p-3 bg-surface border border-accent-300 text-sm">{aviso}</p>}
      {usado && <p role="status" className="p-3 bg-surface border border-accent-300 text-sm"><strong>Listo:</strong> completé el formulario de abajo con “{usado}”. Revisalo y cambialo si hace falta antes de crear el grupo.</p>}

      {grupos && grupos.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-heading font-bold">{grupos.length} {grupos.length === 1 ? 'grupo sugerido' : 'grupos sugeridos'}</p>
            <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={nombrarConIA} disabled={nombrando} isLoading={nombrando} className="gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-strong" aria-hidden="true" />
              <span>{nombrando ? 'Pensando…' : 'Ponerles nombres con IA'}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmando(true)}>
              {grupos.length === 1 ? 'Crear este grupo' : `Crear los ${grupos.length} grupos`}
            </Button>
            </div>
          </div>
          <p className="text-xs text-text/75">Los nombres con IA gastan muy poco: solo se le cuentan los temas de cada grupo y cuántos chicos tiene, <strong>nunca los nombres de los chicos</strong>.</p>
          {avisoIA && <p role="status" className="p-3 bg-surface border border-accent-300 text-sm">{avisoIA}</p>}
          <ul className="space-y-2">
            {grupos.map((g) => (
              <li key={g.clave} className="p-3 bg-surface border border-divider space-y-2 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-extrabold break-words">{g.nombre} <span className="font-body font-normal text-text/70">· {g.alumnoIds.length} {g.alumnoIds.length === 1 ? 'chico' : 'chicos'}</span></p>
                    <p className="text-sm text-text/80">{g.explicacion}</p>
                    <p className="text-xs text-text/70">Etiqueta interna (solo vos): {g.etiquetaInterna}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => { alUsar(g); setUsado(g.nombre); }}>
                    Usar este grupo
                  </Button>
                </div>
                <p className="text-sm break-words">{g.alumnoIds.map(nombreDe).join(', ')}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        isOpen={confirmando}
        onClose={() => setConfirmando(false)}
        title={(grupos?.length ?? 0) === 1 ? '¿Crear este grupo?' : `¿Crear los ${grupos?.length ?? 0} grupos?`}
        description="Después podés editarlos, cambiar chicos o eliminarlos."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmando(false)}>Cancelar</Button>
            <Button variant="primary" onClick={crearTodos} disabled={creando} isLoading={creando}>
              {(grupos?.length ?? 0) === 1 ? 'Sí, crear el grupo' : 'Sí, crear los grupos'}
            </Button>
          </>
        }
      >
        <ul className="text-sm space-y-1">
          {grupos?.map((g) => (
            <li key={g.clave}><strong>{g.nombre}</strong> · {g.alumnoIds.length} {g.alumnoIds.length === 1 ? 'chico' : 'chicos'}</li>
          ))}
        </ul>
      </Dialog>
    </section>
  );
};
