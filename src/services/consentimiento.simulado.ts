import type { ConsentimientoData, ConsentimientoService } from './consentimiento.tipos';

export const mockConsentimientoData: ConsentimientoData = {
  id: 'cons-101',
  alumnoNombre: 'Mateo',
  escuela: 'Escuela Ficticia, Córdoba',
  tutorNombre: 'Carlos',
  estado: 'pendiente',
};

export const consentimientoService: ConsentimientoService = {
  async obtenerConsentimiento(id: string = 'cons-101'): Promise<ConsentimientoData> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...mockConsentimientoData, id };
  },

  async otorgarConsentimiento(id: string): Promise<ConsentimientoData> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    mockConsentimientoData.estado = 'otorgado';
    mockConsentimientoData.fechaOtorgado = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return { ...mockConsentimientoData, id };
  },

  async revocarConsentimiento(id: string): Promise<ConsentimientoData> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    mockConsentimientoData.estado = 'revocado';
    mockConsentimientoData.fechaRevocado = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return { ...mockConsentimientoData, id };
  },
};
