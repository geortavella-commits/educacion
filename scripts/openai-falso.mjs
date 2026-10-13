// Servidor FALSO con la forma de la API de OpenAI (/v1/chat/completions) para probar las funciones de IA sin clave ni gasto.
// Solo para desarrollo local. Uso:   node scripts/openai-falso.mjs   (escucha en el puerto 4010)
// Las funciones lo usan si OPENAI_BASE_URL=http://host.docker.internal:4010/v1 (ver docs/ia-configuracion.md).
//
// Para probar las barandas, la pista de la docente puede pedir una respuesta mala a propósito:
//   FORZAR_NOTA → el borrador trae una nota;  FORZAR_ERROR → responde 500;  FORZAR_BASURA → no es JSON;  FORZAR_ID → inventa un id de currículo.
// Lo último que recibió el "modelo" se guarda en la carpeta indicada por FALSO_REGISTRO (para comprobar qué datos le llegan).
import http from 'node:http';
import { writeFileSync } from 'node:fs';

const PUERTO = Number(process.env.FALSO_PUERTO ?? 4010);
const REGISTRO = process.env.FALSO_REGISTRO ?? '';

function responder(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(cuerpo));
}

function completado(contenido, extra = {}) {
  return { id: 'falso', choices: [{ index: 0, message: { role: 'assistant', content: contenido, ...extra } }], usage: { prompt_tokens: 321, completion_tokens: 123 } };
}

http
  .createServer((req, res) => {
    if (req.method !== 'POST' || !req.url?.endsWith('/chat/completions')) return responder(res, 404, { error: 'no existe' });
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      let pedido;
      try {
        pedido = JSON.parse(cuerpo);
      } catch {
        return responder(res, 400, { error: 'json' });
      }
      if (!req.headers.authorization?.startsWith('Bearer ')) return responder(res, 401, { error: 'sin clave' });

      const esquema = pedido?.response_format?.json_schema?.name;
      const usuario = JSON.parse(pedido.messages.find((m) => m.role === 'user').content);
      if (REGISTRO) writeFileSync(`${REGISTRO}/ultimo-pedido.json`, JSON.stringify({ modelo: pedido.model, esquema, sistema: pedido.messages[0].content, usuario }, null, 2));
      const texto = JSON.stringify(usuario);

      if (texto.includes('FORZAR_ERROR')) return responder(res, 500, { error: 'error forzado' });
      if (texto.includes('FORZAR_BASURA')) return responder(res, 200, completado('esto no es json {'));

      if (esquema === 'proyecto_sugerido') {
        const ids = (usuario.contenidos ?? []).map((c) => c.id);
        const n = usuario.cantidad_de_misiones ?? 4;
        const misiones = Array.from({ length: n }, (_, i) => ({
          titulo: `Misión ${i + 1}: explorar la idea`,
          consigna: `¿Qué descubrís si observás con atención el paso ${i + 1}? Contalo con tus palabras.`,
          contenido_id: texto.includes('FORZAR_ID') ? 'id-inventado' : ids[i % Math.max(ids.length, 1)] ?? null,
        }));
        return responder(res, 200, completado(JSON.stringify({
          titulo: `Proyecto: ${String(usuario.idea_de_la_docente).slice(0, 40)}`,
          descripcion: `Proyecto de ejemplo. Intereses del curso considerados: ${(usuario.intereses_del_curso ?? []).join(', ') || 'ninguno'}.`,
          misiones,
        })));
      }

      if (esquema === 'borrador_mensaje') {
        const malo = texto.includes('FORZAR_NOTA');
        return responder(res, 200, completado(JSON.stringify({
          texto: malo
            ? '[NOMBRE], sacaste un 9/10 en la misión: ¡sos mejor que tus compañeros!'
            : '[NOMBRE], me gustó mucho cómo pensaste cada paso. ¡Seguí explicando con tus palabras!',
        })));
      }

      return responder(res, 400, { error: 'esquema desconocido' });
    });
  })
  .listen(PUERTO, '0.0.0.0', () => console.log(`OpenAI falso escuchando en el puerto ${PUERTO}`));
