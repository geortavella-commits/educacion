// Misiones con DATOS DE EJEMPLO, solo para desarrollo (no viaja en producción: se carga con import dinámico dentro de import.meta.env.DEV).
// Sirve para construir y probar la pantalla del alumno sin base. Las respuestas correctas viven acá porque es un simulador.
import { esRespuestaCorrecta, respuestaConFormatoValido } from '../../supabase/functions/_shared/respuestas';
import type { MisionParaResolver, MisionService, ResultadoRespuesta, TipoRespuesta } from './mision.tipos';

interface MisionDeEjemplo {
  id: string;
  titulo: string;
  enunciado: string;
  tipo: TipoRespuesta;
  opciones?: { id: string; texto: string }[];
  correctas: string[];
  pista?: string;
  explicacion?: string;
}

const PROYECTO = 'La cancha del barrio';

const MISIONES: MisionDeEjemplo[] = [
  {
    id: 'sim-1',
    titulo: 'Repartir los pasos',
    enunciado: 'Medís el arco de la cancha con pasos y te da 7 pasos de ancho. Si lo repartís en partes iguales entre 2 chicos, ¿cuántos pasos le tocan a cada uno?',
    tipo: 'numero',
    correctas: ['3,5'],
    pista: 'Pensá en cuántas veces entra el 2 en el 7. Si te sobra, ¿podés partir ese paso?',
    explicacion: '7 pasos entre 2 chicos son 3 pasos y medio para cada uno: 3,5.',
  },
  {
    id: 'sim-2',
    titulo: 'El suelo y el agua',
    enunciado: 'Después de una lluvia, ¿en cuál de estos suelos se acumula menos agua en la superficie?',
    tipo: 'opcion',
    opciones: [
      { id: 'a', texto: 'Suelo de arcilla' },
      { id: 'b', texto: 'Suelo de arena' },
      { id: 'c', texto: 'Suelo de piedra compacta' },
    ],
    correctas: ['b'],
    explicacion: 'La arena deja pasar el agua entre sus granos, por eso casi no se acumula.',
  },
  {
    id: 'sim-3',
    titulo: 'Nuestra provincia',
    enunciado: '¿En qué provincia argentina está la ciudad de Córdoba?',
    tipo: 'texto',
    correctas: ['Córdoba'],
    pista: 'Fijate cómo se llama la ciudad. A veces la provincia y la capital comparten el nombre.',
  },
  {
    id: 'sim-4',
    titulo: 'Cuidemos la cancha',
    enunciado: 'Escribí tres ideas para cuidar el césped de la cancha del barrio. Podés usar lo que descubriste en las misiones anteriores.',
    tipo: 'abierta',
    correctas: [],
  },
];

const completadas = new Set<string>();
const entregas = new Map<string, string>();
let intentosSeguidos = 0;
const demora = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const siguienteDe = (actual: MisionDeEjemplo): { id: string; titulo: string } | null => {
  const i = MISIONES.findIndex((m) => m.id === actual.id);
  const pendientes = MISIONES.filter((m) => !completadas.has(m.id));
  const sig = pendientes.find((m) => MISIONES.indexOf(m) > i) ?? pendientes[0] ?? null;
  return sig ? { id: sig.id, titulo: sig.titulo } : null;
};

const pistasPedidas = new Map<string, number>();

export const misionService: MisionService & { reiniciar(): void } = {
  async obtenerMision(misionId): Promise<MisionParaResolver> {
    await demora();
    const m = MISIONES.find((x) => x.id === misionId);
    if (!m) throw new Error('no_encontrada');
    return {
      id: m.id,
      titulo: m.titulo,
      enunciado: m.enunciado,
      tipo: m.tipo,
      opciones: m.opciones ?? [],
      orden: MISIONES.indexOf(m) + 1,
      total: MISIONES.length,
      proyectoNombre: PROYECTO,
      completada: completadas.has(m.id),
      respuestaPrevia: entregas.get(m.id),
      hayPista: !!m.pista,
    };
  },

  async enviarRespuesta(misionId, respuesta): Promise<ResultadoRespuesta> {
    await demora();
    const m = MISIONES.find((x) => x.id === misionId);
    if (!m) return { estado: 'error' };
    if (!respuestaConFormatoValido(m.tipo, respuesta, m.opciones ?? null)) return { estado: 'formato_invalido' };
    if (m.tipo === 'abierta') {
      entregas.set(m.id, respuesta.trim());
      completadas.add(m.id);
      return { estado: 'entregada', siguiente: siguienteDe(m) };
    }
    if (completadas.has(m.id)) return { estado: 'correcta', explicacion: m.explicacion, siguiente: siguienteDe(m) };
    if (intentosSeguidos >= 20) return { estado: 'demasiados_intentos', segundosEspera: 60 };
    if (!esRespuestaCorrecta(m.tipo, respuesta, m.correctas)) {
      intentosSeguidos += 1;
      return { estado: 'incorrecta' };
    }
    intentosSeguidos = 0;
    completadas.add(m.id);
    return { estado: 'correcta', explicacion: m.explicacion, siguiente: siguienteDe(m) };
  },

  async pedirPista(misionId, otra = false): Promise<{ pistas: string[]; total: number }> {
    await demora();
    const m = MISIONES.find((x) => x.id === misionId);
    if (!m?.pista) throw new Error('sin_pista');
    const todas = [m.pista, 'Probá con un ejemplo más chico y fijate qué pasa.', 'Armá un dibujo o una tabla con los datos y buscá el patrón.'];
    pistasPedidas.set(misionId, Math.min(todas.length, Math.max(1, (pistasPedidas.get(misionId) ?? 0) + (otra ? 1 : 0))));
    return { pistas: todas.slice(0, pistasPedidas.get(misionId)), total: todas.length };
  },

  reiniciar() {
    completadas.clear();
    entregas.clear();
    intentosSeguidos = 0;
  },
};

/** Ids de las misiones de ejemplo (para armar enlaces de prueba: /alumno/mision/sim-1). */
export const IDS_MISIONES_DE_EJEMPLO = MISIONES.map((m) => m.id);
