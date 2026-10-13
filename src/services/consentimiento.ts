// Fachada del consentimiento familiar (Supabase real en producción; simulado solo en desarrollo).
import { usarSupabase } from './modo';
import { consentimientoSupabase } from './consentimiento.supabase';
import type { ConsentimientoService } from './consentimiento.tipos';

export type { EstadoConsentimiento, ConsentimientoData, ConsentimientoService } from './consentimiento.tipos';

const simulado = !usarSupabase && import.meta.env.DEV ? import('./consentimiento.simulado') : null;

export const consentimientoService: ConsentimientoService = {
  obtenerConsentimiento: async (id) => (simulado ? (await simulado).consentimientoService : consentimientoSupabase).obtenerConsentimiento(id),
  otorgarConsentimiento: async (id) => (simulado ? (await simulado).consentimientoService : consentimientoSupabase).otorgarConsentimiento(id),
  revocarConsentimiento: async (id) => (simulado ? (await simulado).consentimientoService : consentimientoSupabase).revocarConsentimiento(id),
};
