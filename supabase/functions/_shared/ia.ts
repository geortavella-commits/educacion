// Cliente de IA compartido por las Edge Functions (hoy: OpenAI). El navegador NUNCA habla con el modelo ni conoce la clave.
//
// Configuración (variables de entorno del servidor; ver docs/ia-configuracion.md). La clave vive fuera del proyecto:
//   OPENAI_API_KEY   obligatoria. Sin ella, las funciones de IA responden "ia_no_configurada" y el resto de la app sigue igual.
//   OPENAI_MODEL     modelo a usar (por defecto gpt-4o-mini; tiene que soportar salida estructurada).
//   OPENAI_BASE_URL  por defecto https://api.openai.com/v1 (se cambia solo para pruebas con un servidor falso).
//   IA_MAX_POR_DIA   tope de llamadas por docente en 24 h (por defecto 30).
//
// El proveedor es intercambiable: solo esta función conoce el formato de OpenAI. Lo que se registra de cada uso son
// tokens y función, NUNCA el texto enviado ni el recibido (podría tener datos de menores).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export class ErrorIA extends Error {
  /** `uso`: tokens que el proveedor ya cobró aunque la respuesta no sirvió (se registran igual: cuentan para el tope y el costo). */
  constructor(public codigo: string, public status: number, public uso?: { tokensEntrada: number; tokensSalida: number }) {
    super(codigo);
  }
}

const entorno = (nombre: string) => (Deno.env.get(nombre) ?? '').trim();

export function configuracionIA() {
  const maxPorDia = Number.parseInt(entorno('IA_MAX_POR_DIA'), 10);
  return {
    clave: entorno('OPENAI_API_KEY'),
    modelo: entorno('OPENAI_MODEL') || 'gpt-4o-mini',
    base: (entorno('OPENAI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    maxPorDia: Number.isFinite(maxPorDia) && maxPorDia > 0 ? maxPorDia : 30,
  };
}

/** Falla ANTES de gastar si no hay clave o si la docente ya usó su tope de las últimas 24 horas. */
export async function verificarCupo(admin: SupabaseClient, usuarioId: string): Promise<void> {
  const cfg = configuracionIA();
  if (!cfg.clave) throw new ErrorIA('ia_no_configurada', 503);
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from('ia_usos').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId).gte('created_at', desde);
  if ((count ?? 0) >= cfg.maxPorDia) throw new ErrorIA('cupo_diario', 429);
}

export async function registrarUso(admin: SupabaseClient, datos: { usuarioId: string; escuelaId: string | null; funcion: string; tokensEntrada: number; tokensSalida: number }) {
  await admin.from('ia_usos').insert({
    usuario_id: datos.usuarioId, escuela_id: datos.escuelaId, funcion: datos.funcion,
    tokens_entrada: datos.tokensEntrada, tokens_salida: datos.tokensSalida,
  });
}

export interface PedidoModelo {
  sistema: string;
  /** Datos de entrada (se envían como JSON: son DATOS, no instrucciones). */
  usuario: unknown;
  nombreEsquema: string;
  esquema: Record<string, unknown>;
  maxTokens?: number;
  /** Tiempo máximo de espera (ms). Por defecto 45 s; un plan de varias semanas pide más. */
  esperaMaxMs?: number;
}

/** Llama al modelo pidiendo una salida JSON que cumpla `esquema`. Devuelve el JSON ya parseado (sin validar: eso lo hace quien llama). */
export async function llamarModelo(pedido: PedidoModelo): Promise<{ datos: unknown; tokensEntrada: number; tokensSalida: number }> {
  const cfg = configuracionIA();
  if (!cfg.clave) throw new ErrorIA('ia_no_configurada', 503);

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), pedido.esperaMaxMs ?? 45_000);
  let respuesta: Response;
  try {
    respuesta = await fetch(`${cfg.base}/chat/completions`, {
      method: 'POST',
      signal: control.signal,
      headers: { Authorization: `Bearer ${cfg.clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.modelo,
        messages: [
          { role: 'system', content: pedido.sistema },
          { role: 'user', content: JSON.stringify(pedido.usuario) },
        ],
        response_format: { type: 'json_schema', json_schema: { name: pedido.nombreEsquema, strict: true, schema: pedido.esquema } },
        max_completion_tokens: pedido.maxTokens ?? 1200,
      }),
    });
  } catch (e) {
    console.error('ia: no se pudo llamar al proveedor', e instanceof Error ? e.name : 'error');
    throw new ErrorIA('ia_sin_conexion', 504);
  } finally {
    clearTimeout(corte);
  }

  if (!respuesta.ok) {
    // Se registra solo el estado (nunca el cuerpo: puede repetir lo enviado) y hacia afuera salen mensajes genéricos.
    console.error('ia: el proveedor respondió', respuesta.status);
    if (respuesta.status === 401 || respuesta.status === 403) throw new ErrorIA('ia_clave_invalida', 502);
    if (respuesta.status === 429) throw new ErrorIA('ia_saturada', 503);
    throw new ErrorIA('ia_error', 502);
  }

  const cuerpo = await respuesta.json().catch(() => null);
  const uso = { tokensEntrada: cuerpo?.usage?.prompt_tokens ?? 0, tokensSalida: cuerpo?.usage?.completion_tokens ?? 0 };
  const mensaje = cuerpo?.choices?.[0]?.message;
  if (!mensaje || mensaje.refusal) throw new ErrorIA('ia_rechazo', 502, uso);
  let datos: unknown;
  try {
    datos = JSON.parse(mensaje.content);
  } catch {
    throw new ErrorIA('ia_respuesta_invalida', 502, uso);
  }
  return { datos, ...uso };
}
