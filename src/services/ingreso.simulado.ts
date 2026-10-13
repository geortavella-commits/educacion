import type { EstadoIngreso, IngresoService, EstadoSolicitud, ValidacionCodigoResult } from './ingreso.tipos';

export const ingresoService: IngresoService = {
  /**
   * Simula la validación de un código de clase de 6 caracteres.
   * Valores especiales para pruebas:
   * - 'VENCID': simula código expirado
   * - 'BLOQUE': simula bloqueo por demasiados intentos
   * - 'REDERR': simula error de red
   * - Cualquier otro que no termine en número o termine en 'ERR': código incorrecto
   * - Ej: 'FUT5K9', 'COR5B2', 'ABC123': código válido
   */
  async validarCodigo(codigo: string): Promise<ValidacionCodigoResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const limpio = codigo.trim().toUpperCase();

    if (limpio === 'REDERR') {
      return {
        estado: 'error_red',
        mensaje: 'Error de conexión con el servidor escolar. Revisá tu conexión a internet.',
      };
    }

    if (limpio === 'VENCID') {
      return {
        estado: 'vencido',
        mensaje: 'Este código ya venció hoy a las 18:00 hs. Pedile uno nuevo a tu seño.',
      };
    }

    if (limpio === 'BLOQUE') {
      return {
        estado: 'demasiados_intentos',
        mensaje: 'Probaste muchas veces. Esperá 1 minuto y volvé a intentar.',
        segundosBloqueo: 60,
      };
    }

    if (limpio.length !== 6 || limpio.includes('ERR')) {
      return {
        estado: 'incorrecto',
        mensaje: 'El código no coincide con ninguna clase activa. Revisá las 6 letras o números. Si tenés un código de acceso de 8 letras, usá “Entrá con tu código de acceso”, más abajo.',
      };
    }

    // Código válido
    return {
      estado: 'valido',
      cursoInfo: {
        id: 'cur-pri-5b',
        nombre: '5º Grado "B"',
        anio: '5º Grado Primaria',
        docente: 'Seño Mariana',
        vencimiento: 'Hoy a las 18:00 hs',
      },
    };
  },

  async solicitarIngresoAlumno(
    _codigo: string,
    _nombre: string,
    _avatarId: string
  ): Promise<{ exito: boolean; estado: EstadoIngreso }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { exito: true, estado: 'esperando_aprobacion' };
  },

  haySolicitudEnEspera(): boolean {
    return false;
  },

  async entrarConCodigoAcceso() {
    // Sin base real no hay cuentas a las que volver a entrar.
    return { exito: false, motivo: 'invalido' as const };
  },

  async consultarEstadoSolicitud(): Promise<EstadoSolicitud> {
    return 'sin_solicitud';
  },
};
