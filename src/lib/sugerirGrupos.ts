/**
 * Sugerencias de grupos para la docente, calculadas en su navegador con datos que ella ya puede ver (sin IA, sin enviar
 * nada a ningún servicio). Son SUGERENCIAS: la docente las revisa, las cambia y decide; nada se crea solo.
 *
 * Reglas del producto que esto respeta:
 *  - Nada clasifica a un chico: los nombres que ven los alumnos son NEUTROS ("Equipo A", "Equipo Fútbol"). Nunca "avanzados" ni
 *    "refuerzo". El ritmo de avance solo aparece en la etiqueta interna y en la explicación, que ve únicamente la docente.
 *  - "Ritmo de avance" es una foto de hoy: cuántas misiones de ESTE proyecto completó cada chico. No es una nota ni un nivel.
 */

export interface AlumnoParaGrupos {
  id: string;
  nombre: string;
  /** Ids de los intereses que el propio chico declaró. */
  intereses: string[];
  /** Misiones completadas del proyecto elegido. */
  completadas: number;
}

export type CriterioGrupos = 'intereses' | 'mezcla' | 'ritmo';

export interface GrupoSugerido {
  /** Identifica la sugerencia dentro de la lista (no es un id de la base). */
  clave: string;
  /** Lo que ven los alumnos: siempre neutro. */
  nombre: string;
  /** Solo la ve la docente. */
  etiquetaInterna: string;
  alumnoIds: string[];
  /** Por qué se armó así (solo la ve la docente). */
  explicacion: string;
}

export interface OpcionesSugerencia {
  criterio: CriterioGrupos;
  /** Chicos por grupo (se toma entre 2 y 8). */
  tamano: number;
  totalMisiones: number;
  etiquetaInteres: (id: string) => string;
}

const porNombre = (a: AlumnoParaGrupos, b: AlumnoParaGrupos) => a.nombre.localeCompare(b.nombre, 'es') || a.id.localeCompare(b.id);

/** Cuántos grupos hacen falta para que queden cerca del tamaño pedido. */
export function cantidadDeGrupos(alumnos: number, tamano: number): number {
  if (alumnos <= 0) return 0;
  return Math.max(1, Math.round(alumnos / tamano));
}

/** Parte una lista en `g` tramos consecutivos lo más parejos posible. */
function enTramos<T>(lista: T[], g: number): T[][] {
  const base = Math.floor(lista.length / g);
  const extra = lista.length % g;
  const tramos: T[][] = [];
  let desde = 0;
  for (let i = 0; i < g; i++) {
    const largo = base + (i < extra ? 1 : 0);
    tramos.push(lista.slice(desde, desde + largo));
    desde += largo;
  }
  return tramos.filter((t) => t.length > 0);
}

const hash = (texto: string) => {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = (h * 33 + texto.charCodeAt(i)) >>> 0;
  return h;
};

/**
 * Nombres neutros: letras asignadas en un orden que NO depende del ritmo de avance, para que "Equipo A" no parezca
 * "el mejor" ni "el que más ayuda necesita".
 */
function nombrarNeutros(grupos: Omit<GrupoSugerido, 'nombre' | 'clave'>[]): GrupoSugerido[] {
  const orden = grupos
    .map((g, i) => ({ g, i, h: hash([...g.alumnoIds].sort().join('|')) }))
    .sort((a, b) => a.h - b.h || a.i - b.i);
  const nombres = new Map<number, string>();
  orden.forEach((o, pos) => nombres.set(o.i, `Equipo ${pos < 26 ? String.fromCharCode(65 + pos) : pos + 1}`));
  return grupos.map((g, i) => ({ ...g, nombre: nombres.get(i)!, clave: `g${i + 1}` }));
}

function listarEtiquetas(ids: string[], etiqueta: (id: string) => string): string {
  const e = ids.map(etiqueta);
  return e.length <= 1 ? (e[0] ?? '') : `${e.slice(0, -1).join(', ')} y ${e[e.length - 1]}`;
}

function porRitmo(alumnos: AlumnoParaGrupos[], g: number, total: number): GrupoSugerido[] {
  const ordenados = [...alumnos].sort((a, b) => b.completadas - a.completadas || porNombre(a, b));
  const crudos = enTramos(ordenados, g).map((tramo) => {
    const min = Math.min(...tramo.map((a) => a.completadas));
    const max = Math.max(...tramo.map((a) => a.completadas));
    const rango = min === max ? `${min}` : `${min} y ${max}`;
    return {
      alumnoIds: tramo.map((a) => a.id),
      etiquetaInterna: `Ritmo parecido (${min === max ? min : `${min}–${max}`} de ${total})`,
      explicacion: `Completaron ${min === max ? '' : 'entre '}${rango} de ${total} misiones del proyecto (foto de hoy: no es una nota ni un nivel).`,
    };
  });
  return nombrarNeutros(crudos);
}

function mezclados(alumnos: AlumnoParaGrupos[], g: number): GrupoSugerido[] {
  const ordenados = [...alumnos].sort((a, b) => b.completadas - a.completadas || porNombre(a, b));
  const cubetas: AlumnoParaGrupos[][] = Array.from({ length: g }, () => []);
  // Reparto "en serpentina": 0..g-1, g-1..0, 0..g-1… así cada grupo recibe chicos de todo el recorrido.
  ordenados.forEach((a, i) => {
    const vuelta = Math.floor(i / g);
    const pos = i % g;
    cubetas[vuelta % 2 === 0 ? pos : g - 1 - pos].push(a);
  });
  return nombrarNeutros(
    cubetas
      .filter((c) => c.length > 0)
      .map((c) => ({
        alumnoIds: c.map((a) => a.id),
        etiquetaInterna: 'Mixto',
        explicacion: 'Grupo variado: junta chicos que van a distinto ritmo en este proyecto, para que se acompañen entre sí.',
      })),
  );
}

function porIntereses(alumnos: AlumnoParaGrupos[], tamano: number, etiqueta: (id: string) => string): GrupoSugerido[] {
  const restantes = new Map(alumnos.map((a) => [a.id, a]));
  const grupos: GrupoSugerido[] = [];
  const usados = new Map<string, number>(); // cuántos grupos ya llevan el nombre de un interés

  // Mientras haya un interés que compartan al menos 2 chicos sin grupo, se arma un grupo con ese interés.
  for (;;) {
    const conteo = new Map<string, AlumnoParaGrupos[]>();
    for (const a of restantes.values()) for (const i of new Set(a.intereses)) conteo.set(i, [...(conteo.get(i) ?? []), a]);
    const mejor = [...conteo.entries()].filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];
    if (!mejor) break;
    // Primero los chicos con menos intereses cargados: son los más difíciles de ubicar.
    const elegidos = [...mejor[1]].sort((a, b) => a.intereses.length - b.intereses.length || porNombre(a, b)).slice(0, tamano);
    elegidos.forEach((a) => restantes.delete(a.id));
    const comunes = [...new Set(elegidos[0].intereses)].filter((i) => elegidos.every((a) => a.intereses.includes(i)));
    const veces = (usados.get(mejor[0]) ?? 0) + 1;
    usados.set(mejor[0], veces);
    grupos.push({
      clave: `g${grupos.length + 1}`,
      nombre: `Equipo ${etiqueta(mejor[0])}${veces > 1 ? ` ${veces}` : ''}`,
      etiquetaInterna: `Afinidad: ${listarEtiquetas(comunes, etiqueta)}`,
      alumnoIds: elegidos.map((a) => a.id),
      explicacion: `Comparten el interés por ${listarEtiquetas(comunes, etiqueta)}.`,
    });
  }

  // Los que no comparten ningún interés con nadie (o no cargaron ninguno) se agrupan aparte, sin inventar una afinidad.
  const resto = [...restantes.values()].sort(porNombre);
  if (resto.length > 0) {
    const sinDatos = alumnos.every((a) => a.intereses.length === 0);
    const tramos = enTramos(resto, Math.max(1, Math.round(resto.length / tamano)));
    tramos.forEach((t, i) => {
      grupos.push({
        clave: `g${grupos.length + 1}`,
        nombre: `Equipo mixto${tramos.length > 1 ? ` ${i + 1}` : ''}`,
        etiquetaInterna: 'Sin intereses en común',
        alumnoIds: t.map((a) => a.id),
        explicacion: sinDatos
          ? 'Todavía nadie cargó sus intereses: los armé por orden alfabético. Probá con otro criterio.'
          : 'Ninguno comparte intereses con otro chico que haya quedado sin grupo (o todavía no los cargaron): los junté para completar. Pueden tener gustos en común con chicos de otros grupos.',
      });
    });
  }
  return grupos;
}

/** Devuelve las sugerencias para el criterio elegido. Cada alumno aparece en exactamente un grupo. */
export function sugerirGrupos(alumnos: AlumnoParaGrupos[], opciones: OpcionesSugerencia): GrupoSugerido[] {
  if (alumnos.length === 0) return [];
  const tamano = Math.min(8, Math.max(2, Math.round(opciones.tamano) || 4));
  const g = cantidadDeGrupos(alumnos.length, tamano);
  if (opciones.criterio === 'ritmo') return porRitmo(alumnos, g, opciones.totalMisiones);
  if (opciones.criterio === 'mezcla') return mezclados(alumnos, g);
  return porIntereses(alumnos, tamano, opciones.etiquetaInteres);
}

/**
 * Lo único que se le cuenta a la IA para nombrar un grupo: los intereses que comparten TODOS sus integrantes (puede no haber)
 * y cuántos son. Nunca nombres ni ids de chicos.
 */
export function resumenParaNombrar(grupos: GrupoSugerido[], alumnos: AlumnoParaGrupos[]): { clave: string; temas: string[]; cantidad: number }[] {
  return grupos.map((g) => {
    const miembros = g.alumnoIds.map((id) => alumnos.find((a) => a.id === id)).filter((a): a is AlumnoParaGrupos => !!a);
    const comunes = miembros.length > 0 ? [...new Set(miembros[0].intereses)].filter((i) => miembros.every((m) => m.intereses.includes(i))) : [];
    return { clave: g.clave, temas: comunes.slice(0, 3), cantidad: g.alumnoIds.length };
  });
}

/** ¿Hay diferencias de avance como para que "ritmo" y "mezcla" digan algo? */
export function hayDiferenciasDeAvance(alumnos: AlumnoParaGrupos[]): boolean {
  return new Set(alumnos.map((a) => a.completadas)).size > 1;
}
