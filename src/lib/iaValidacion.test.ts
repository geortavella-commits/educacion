import { describe, it, expect } from 'vitest';
import {
  interesesAgregados,
  limpiarBorrador,
  limpiarNombresGrupos,
  limpiarPlan,
  limpiarProyecto,
  limpiarRespuesta,
  ocultarNombre,
  sanitizarEntrada,
  SalidaInvalida,
} from '../../supabase/functions/_shared/ia-validacion';

const ids = new Set(['k1', 'k2']);

describe('IA: validación de lo que devuelve el modelo (el modelo propone, esto filtra)', () => {
  describe('texto de la docente (es dato, nunca instrucción)', () => {
    it('saca caracteres de control, colapsa espacios y recorta el largo', () => {
      expect(sanitizarEntrada('  hola\u0000   mundo \n\n ', 50)).toBe('hola mundo');
      expect(sanitizarEntrada('x'.repeat(900), 500)).toHaveLength(500);
      expect(sanitizarEntrada(42 as unknown, 10)).toBe('');
    });
  });

  describe('proyecto sugerido', () => {
    const bueno = {
      titulo: 'La huerta de la escuela',
      descripcion: 'Armamos una huerta y medimos cómo crece.',
      misiones: [
        { titulo: 'Medir el terreno', consigna: '¿Cómo podés medir el patio sin regla?', contenido_id: 'k1' },
        { titulo: 'Qué necesitan las plantas', consigna: 'Investigá qué necesitan para crecer.', contenido_id: 'k2' },
      ],
    };

    it('acepta una propuesta correcta y conserva los ids que existen', () => {
      const r = limpiarProyecto(bueno, ids);
      expect(r.titulo).toBe('La huerta de la escuela');
      expect(r.misiones.map((m) => m.contenido_id)).toEqual(['k1', 'k2']);
    });

    it('descarta ids de currículo inventados (queda sin vincular, no se rompe)', () => {
      const r = limpiarProyecto({ ...bueno, misiones: [{ titulo: 'Una misión', consigna: 'Pensá algo', contenido_id: 'inventado' }] }, ids);
      expect(r.misiones[0].contenido_id).toBeNull();
    });

    it('descarta misiones que hablan de notas, comparan chicos o traen enlaces', () => {
      const r = limpiarProyecto(
        {
          ...bueno,
          misiones: [
            { titulo: 'Misión con calificación', consigna: 'Cada uno recibe una calificación del 1 al 10', contenido_id: null },
            { titulo: 'Competencia', consigna: 'Ganá siendo mejor que tus compañeros', contenido_id: null },
            { titulo: 'Con enlace', consigna: 'Mirá https://ejemplo.com', contenido_id: null },
            { titulo: 'Misión sana', consigna: 'Dibujá lo que observás.', contenido_id: null },
          ],
        },
        ids,
      );
      expect(r.misiones.map((m) => m.titulo)).toEqual(['Misión sana']);
      expect(r.descartadas).toBe(3);
    });

    it('descarta misiones que etiquetan a los chicos por nivel ("atrasados", "avanzados", "nivel bajo")', () => {
      const r = limpiarProyecto(
        {
          ...bueno,
          misiones: [
            { titulo: 'Para los atrasados', consigna: 'Esta misión es para los chicos atrasados del curso.', contenido_id: null },
            { titulo: 'Grupo avanzado', consigna: 'Solo para el grupo avanzado: calculá más rápido.', contenido_id: null },
            { titulo: 'Nivel bajo', consigna: 'Una actividad de nivel bajo para repasar.', contenido_id: null },
            { titulo: 'Con más pasos', consigna: 'Seguí estos pasos cortos: medí, anotá y compará.', contenido_id: null },
          ],
        },
        ids,
      );
      expect(r.misiones.map((m) => m.titulo)).toEqual(['Con más pasos']);
      expect(r.descartadas).toBe(3);
    });

    it('NO confunde "avanzar" ni "un proceso lento" con una etiqueta a personas', () => {
      const r = limpiarProyecto(
        {
          ...bueno,
          misiones: [
            { titulo: 'Avanzar paso a paso', consigna: 'Observá un proceso lento: cómo avanza el agua en la tierra.', contenido_id: null },
          ],
        },
        ids,
      );
      expect(r.misiones).toHaveLength(1);
    });

    it('un título o descripción que etiquetan por nivel rechaza el proyecto', () => {
      expect(() => limpiarProyecto({ ...bueno, descripcion: 'Proyecto pensado para los chicos atrasados del curso.' }, ids)).toThrow(SalidaInvalida);
    });

    it('NO descarta consignas normales que usan "nota" o "promedio" (tomar nota, calcular un promedio)', () => {
      const r = limpiarProyecto(
        {
          ...bueno,
          misiones: [
            { titulo: 'Medir y anotar', consigna: 'Tomá nota de cuánto crece cada planta durante una semana.', contenido_id: null },
            { titulo: 'Un promedio', consigna: 'Calculá el promedio de crecimiento de las plantas del grupo.', contenido_id: null },
            { titulo: 'Notas musicales', consigna: 'Escuchá una melodía y marcá cuántas notas distintas escuchás.', contenido_id: null },
          ],
        },
        ids,
      );
      expect(r.misiones).toHaveLength(3);
      expect(r.descartadas).toBe(0);
    });

    it('sin título o sin ninguna misión usable, se rechaza', () => {
      expect(() => limpiarProyecto({ titulo: '', misiones: bueno.misiones }, ids)).toThrow(SalidaInvalida);
      expect(() => limpiarProyecto({ titulo: 'Un proyecto', misiones: [] }, ids)).toThrow(SalidaInvalida);
      expect(() => limpiarProyecto(null, ids)).toThrow(SalidaInvalida);
    });

    it('limita a 6 misiones y recorta los textos largos', () => {
      const muchas = Array.from({ length: 10 }, (_, i) => ({ titulo: `Misión número ${i + 1}`, consigna: 'x'.repeat(900), contenido_id: null }));
      const r = limpiarProyecto({ ...bueno, misiones: muchas }, ids);
      expect(r.misiones).toHaveLength(6);
      expect(r.misiones[0].consigna.length).toBeLessThanOrEqual(400);
    });
  });

  describe('borrador de mensaje para un alumno', () => {
    it('acepta un mensaje cálido', () => {
      expect(limpiarBorrador({ texto: '[NOMBRE], me gustó cómo explicaste tu idea. ¡Seguí así!' })).toContain('Seguí así');
    });

    it.each([
      ['una etiqueta de nivel', 'Sé que sos de los chicos atrasados, pero podés mejorar.'],
      ['una nota', 'Sacaste un 9/10 en la misión, ¡felicitaciones!'],
      ['la palabra nota', 'Tu nota de esta semana fue muy buena.'],
      ['una comparación', 'Estás mejor que tus compañeros en esta tarea.'],
      ['un enlace', 'Mirá este video https://sitio.com/abc para practicar.'],
      ['un teléfono', 'Escribime al 3515551234 si tenés dudas.'],
      ['un mail', 'Mandame tu trabajo a seno@escuela.com cuando termines.'],
    ])('rechaza un mensaje con %s', (_que, texto) => {
      expect(() => limpiarBorrador({ texto })).toThrow(SalidaInvalida);
    });

    it('rechaza un mensaje vacío o demasiado corto', () => {
      expect(() => limpiarBorrador({ texto: 'ok' })).toThrow(SalidaInvalida);
      expect(() => limpiarBorrador(undefined)).toThrow(SalidaInvalida);
    });
  });

  describe('intereses del curso (agregados, sin identificar a nadie)', () => {
    const conteos = new Map([['futbol', 9], ['dibujo', 6], ['cocina', 5], ['robotica', 2], ['musica', 1]]);

    it('comparte solo los intereses de al menos 5 chicos, los 3 más comunes', () => {
      expect(interesesAgregados(conteos, 24)).toEqual(['futbol', 'dibujo', 'cocina']);
    });

    it('en un curso muy chico no comparte nada, ni siquiera el agregado', () => {
      expect(interesesAgregados(conteos, 8)).toEqual([]);
    });
  });

  describe('ocultar el nombre del alumno antes de enviarlo al modelo', () => {
    it('cambia el nombre por [NOMBRE] sin importar mayúsculas ni tildes', () => {
      expect(ocultarNombre('Dale ánimo a vico, que lo está haciendo bien. VICO es muy curioso.', 'Vico')).toBe(
        'Dale ánimo a [NOMBRE], que lo está haciendo bien. [NOMBRE] es muy curioso.',
      );
      expect(ocultarNombre('Sofia y SOFÍA', 'Sofía')).toBe('[NOMBRE] y [NOMBRE]');
    });

    it('no toca palabras que solo contienen el nombre', () => {
      expect(ocultarNombre('Vicente trajo a Vico', 'Vico')).toBe('Vicente trajo a [NOMBRE]');
      expect(ocultarNombre('Una marca importante', 'Ana')).toBe('Una marca importante');
    });

    it('con nombres compuestos oculta cada parte', () => {
      expect(ocultarNombre('María José y José María', 'María José')).toBe('[NOMBRE] [NOMBRE] y [NOMBRE] [NOMBRE]');
    });

    it('un texto sin el nombre queda igual', () => {
      expect(ocultarNombre('Muy buen trabajo esta semana', 'Mateo')).toBe('Muy buen trabajo esta semana');
    });
  });

  describe('nombres de grupo sugeridos por la IA', () => {
    const claves = new Set(['g1', 'g2', 'g3']);
    const n = (clave: string, nombre: string) => ({ clave, nombre });

    it('acepta nombres positivos y parejos', () => {
      const r = limpiarNombresGrupos({ nombres: [n('g1', 'Los goleadores'), n('g2', 'Exploradores del patio'), n('g3', 'Las curiosas')] }, claves);
      expect(r).toEqual({ g1: 'Los goleadores', g2: 'Exploradores del patio', g3: 'Las curiosas' });
    });

    it.each([
      ['ranking', 'Los campeones'],
      ['"los mejores"', 'Los mejores del curso'],
      ['orden', 'Primer equipo'],
      ['velocidad', 'Los rápidos'],
      ['nivel', 'Grupo avanzado'],
      ['números para ordenar', 'Equipo 1'],
      ['demasiado largo', 'Los exploradores intergalácticos del barrio'],
      ['un enlace', 'www.grupo.com'],
    ])('descarta un nombre con %s', (_que, nombre) => {
      expect(() => limpiarNombresGrupos({ nombres: [n('g1', nombre)] }, claves)).toThrow(SalidaInvalida);
    });

    it('ignora claves que no se pidieron y nombres repetidos, y conserva los válidos', () => {
      const r = limpiarNombresGrupos({ nombres: [n('g1', 'Los curiosos'), n('g2', 'LOS CURIOSOS'), n('g9', 'Intrusos'), n('g3', 'Las artistas')] }, claves);
      expect(r).toEqual({ g1: 'Los curiosos', g3: 'Las artistas' });
    });

    it('si ningún nombre sirve, falla (la pantalla conserva los nombres neutros)', () => {
      expect(() => limpiarNombresGrupos({ nombres: [] }, claves)).toThrow(SalidaInvalida);
      expect(() => limpiarNombresGrupos(null, claves)).toThrow(SalidaInvalida);
    });
  });
});


describe('IA: plan de varias semanas', () => {
  const ok = (semana: number, extra: Record<string, unknown> = {}) => ({
    semana, titulo: `Etapa ${semana}`, objetivo: 'Explorar y registrar lo observado.', contenido_ids: ['k1'],
    misiones: [{ titulo: 'Observá y anotá', consigna: 'Mirá tu entorno y contá qué ves.', contenido_id: 'k1' }], ...extra,
  });
  const plan = (etapas: unknown[]) => ({ titulo: 'La huerta', descripcion: 'Un plan de cuatro semanas.', etapas });

  it('ordena por semana y conserva solo ids del currículo', () => {
    const r = limpiarPlan(plan([ok(2, { contenido_ids: ['k1', 'inventado'] }), ok(1)]), ids, 4);
    expect(r.etapas.map((e) => e.semana)).toEqual([1, 2]);
    expect(r.etapas[1].contenido_ids).toEqual(['k1']);
  });
  it('descarta semanas fuera de rango o repetidas', () => {
    const r = limpiarPlan(plan([ok(1), ok(1), ok(5), ok(0), ok(3)]), ids, 4);
    expect(r.etapas.map((e) => e.semana)).toEqual([1, 3]);
    expect(r.descartadas).toBe(3);
  });
  it('un id de misión inexistente queda en null', () => {
    const r = limpiarPlan(plan([ok(1, { misiones: [{ titulo: 'Contá lo que ves', consigna: 'Dibujá una idea.', contenido_id: 'no-existe' }] })]), ids, 3);
    expect(r.etapas[0].misiones[0].contenido_id).toBeNull();
  });
  it('descarta misiones con notas, comparaciones, etiquetas de nivel o contactos', () => {
    const malas = [
      { titulo: 'Misión con puntaje', consigna: 'Ganás 10 puntos si terminás.', contenido_id: null },
      { titulo: 'Sé mejor que todos', consigna: 'Hacelo mejor que tus compañeros.', contenido_id: null },
      { titulo: 'Para los atrasados', consigna: 'Una ayuda para alumnos atrasados.', contenido_id: null },
      { titulo: 'Escribinos', consigna: 'Mandá un mail a docente@escuela.com.ar', contenido_id: null },
      { titulo: 'Una buena misión', consigna: 'Observá las plantas del patio.', contenido_id: null },
    ];
    const r = limpiarPlan(plan([ok(1, { misiones: malas })]), ids, 4);
    expect(r.etapas[0].misiones.map((m) => m.titulo)).toEqual(['Una buena misión']);
    expect(r.descartadas).toBe(4);
  });
  it('una etapa sin misiones válidas se descarta, y sin etapas se rechaza todo', () => {
    expect(() => limpiarPlan(plan([ok(1, { misiones: [] })]), ids, 4)).toThrow(SalidaInvalida);
    expect(() => limpiarPlan({ titulo: 'x', etapas: [] }, ids, 4)).toThrow(SalidaInvalida);
  });
  it('topea las misiones por semana', () => {
    const muchas = Array.from({ length: 9 }, (_, i) => ({ titulo: `Misión número ${i + 1}`, consigna: 'Explorá y contá.', contenido_id: null }));
    expect(limpiarPlan(plan([ok(1, { misiones: muchas })]), ids, 4, 4).etapas[0].misiones).toHaveLength(4);
  });
  it('rechaza un plan cuyo título o descripción trae una calificación', () => {
    expect(() => limpiarPlan({ titulo: 'Proyecto con ranking', descripcion: 'x', etapas: [ok(1)] }, ids, 4)).toThrow(SalidaInvalida);
  });
});

describe('respuesta correcta y pistas que sugiere la IA', () => {
  const pistas = ['Pensá en lo que queda después de pinchar.', 'Restá los globos pinchados de los que había.', 'Si hubiera 10 y se pinchan 3, quedan 7.'];

  it('una misión numérica conserva la respuesta y las 3 pistas', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['8'], opciones: [], correcta: null, pistas, explicacion: 'Quedan 8.' });
    expect(r).toMatchObject({ tipo_respuesta: 'numero', respuestas: ['8'], explicacion: 'Quedan 8.' });
    expect(r?.pistas).toHaveLength(3);
  });

  it('descarta la pista que delata la respuesta correcta', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['8'], opciones: [], correcta: null, pistas: [...pistas.slice(0, 2), 'La respuesta es 8, contá de nuevo.'], explicacion: null });
    expect(r?.pistas).toEqual(pistas.slice(0, 2));
  });

  it('también detecta la respuesta escrita como fracción o con coma', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['7/2'], opciones: [], correcta: null, pistas: ['Da 3,5 si dividís', 'Pensá en repartir en partes iguales'], explicacion: null });
    expect(r?.pistas).toEqual(['Pensá en repartir en partes iguales']);
  });

  it('en opción múltiple arma los ids y marca la correcta; una pista con el texto correcto se descarta', () => {
    const r = limpiarRespuesta({
      tipo_respuesta: 'opcion', respuestas: [], opciones: ['Rosario', 'Córdoba', 'Salta'], correcta: 1,
      pistas: ['Fijate en el nombre de la provincia', 'La respuesta es Córdoba'], explicacion: null,
    });
    expect(r?.respuestas).toEqual(['b']);
    expect(r?.opciones?.map((o) => o.id)).toEqual(['a', 'b', 'c']);
    expect(r?.pistas).toEqual(['Fijate en el nombre de la provincia']);
  });

  it('si la respuesta no es coherente con el tipo, queda como entrega libre y conserva las pistas', () => {
    const numeroMalo = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['muchos'], opciones: [], correcta: null, pistas: [pistas[0]], explicacion: null });
    expect(numeroMalo).toMatchObject({ tipo_respuesta: 'abierta', respuestas: [] });
    expect(numeroMalo?.pistas).toEqual([pistas[0]]);
    const correctaFuera = limpiarRespuesta({ tipo_respuesta: 'opcion', respuestas: [], opciones: ['a', 'b'], correcta: 5, pistas: [], explicacion: null });
    expect(correctaFuera).toBeNull();
  });

  it('si lista valores numéricos distintos no hay respuesta verificable: queda abierta', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['3', '5', '7', '10'], opciones: [], correcta: null, pistas: [pistas[0]], explicacion: null });
    expect(r).toMatchObject({ tipo_respuesta: 'abierta', respuestas: [] });
  });

  it('formas equivalentes del mismo número sí se conservan', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'numero', respuestas: ['3,5', '7/2', '3.5'], opciones: [], correcta: null, pistas: [], explicacion: null });
    expect(r).toMatchObject({ tipo_respuesta: 'numero', respuestas: ['3,5', '7/2', '3.5'] });
  });

  it('un texto con muchas respuestas distintas queda abierto', () => {
    const r = limpiarRespuesta({ tipo_respuesta: 'texto', respuestas: ['8 peras', '5 manzanas', 'más peras', 'más manzanas'], opciones: [], correcta: null, pistas: [pistas[0]], explicacion: null });
    expect(r).toMatchObject({ tipo_respuesta: 'abierta', respuestas: [] });
  });

  it('descarta pistas con notas, enlaces o etiquetas de nivel, y limita a 3', () => {
    const r = limpiarRespuesta({
      tipo_respuesta: 'abierta', respuestas: [], opciones: [], correcta: null, explicacion: null,
      pistas: ['Mirá con atención', 'Tu puntaje depende de esto', 'Entrá a https://ejemplo.com', 'Probá con un dibujo', 'Contale a un compañero', 'Otra más'],
    });
    expect(r?.pistas).toEqual(['Mirá con atención', 'Probá con un dibujo', 'Contale a un compañero']);
  });

  it('las misiones del plan y del proyecto traen su respuesta limpia', () => {
    const idsOk = new Set(['k1']);
    const m = { titulo: 'Globos', consigna: 'Hay 15 globos y se pinchan 7. ¿Cuántos quedan?', contenido_id: 'k1', tipo_respuesta: 'numero', respuestas: ['8'], opciones: [], correcta: null, pistas: [pistas[0]], explicacion: null };
    const proyecto = limpiarProyecto({ titulo: 'Un proyecto', descripcion: 'x', misiones: [m] }, idsOk);
    expect(proyecto.misiones[0].respuesta).toMatchObject({ tipo_respuesta: 'numero', respuestas: ['8'] });
    const plan = limpiarPlan({ titulo: 'Plan', descripcion: 'x', etapas: [{ semana: 1, titulo: 'Explorar', objetivo: 'o', contenido_ids: [], misiones: [m] }] }, idsOk, 3);
    expect(plan.etapas[0].misiones[0].respuesta?.pistas).toEqual([pistas[0]]);
  });
});
