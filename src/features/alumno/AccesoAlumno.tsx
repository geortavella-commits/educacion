import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ingresoService } from '@/services/ingreso';
import { ArrowLeft, KeyRound } from 'lucide-react';

const MENSAJES: Record<'invalido' | 'vencido' | 'bloqueado' | 'red', string> = {
  invalido: 'Ese código no es correcto. Revisalo con cuidado: son 8 letras o números.',
  vencido: 'Ese código ya se usó o venció. Pedile a tu seño o a tu familia uno nuevo.',
  bloqueado: 'Probaste muchas veces. Esperá un minuto y volvé a intentar.',
  red: 'No pudimos conectarnos. Revisá tu internet y probá de nuevo.',
};

/** Para un alumno que YA tiene cuenta y perdió su sesión (otro dispositivo, datos borrados): entra con el código que le dio su docente o su familia. */
export const AccesoAlumno: React.FC = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    document.title = 'Ya tengo cuenta · Chasqui';
  }, []);

  const limpio = codigo.replace(/[\s-]/g, '').toUpperCase();
  const completo = /^[A-Z0-9]{8}$/.test(limpio);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completo || enviando) return;
    setEnviando(true);
    setMensaje('');
    const r = await ingresoService.entrarConCodigoAcceso(limpio);
    setEnviando(false);
    if (r.exito) navigate('/alumno');
    else setMensaje(MENSAJES[r.motivo ?? 'invalido']);
  };

  return (
    <div className="w-full max-w-md mx-auto min-w-0 py-6">
      <div className="p-5 sm:p-7 md:p-8 bg-white border-2 border-[#E5E5E5] rounded-3xl shadow-[0_8px_0_0_#E5E5E5] space-y-5 text-[#1B1C1C]">
        <Link
          to="/alumno/ingreso"
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-black text-[#006590] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </Link>

        <div className="space-y-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E5F6FD] border-2 border-[#1CB0F6]/30 mx-auto flex items-center justify-center text-[#006590]">
            <KeyRound className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-[#1B1C1C]">
            Ya tengo cuenta
          </h1>
          <p className="text-sm text-[#4E4E4E] font-medium">
            Si cambiaste de dispositivo o se cerró tu sesión, pedile a tu seño o a tu familia un <strong>código de acceso</strong> y escribilo acá.
            Vas a volver a tu mismo perfil.
          </p>
        </div>

        <form onSubmit={entrar} noValidate className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="codigo-acceso" className="text-xs font-bold text-[#4E4E4E]">
              Tu código de acceso (8 letras o números)
            </label>
            <input
              id="codigo-acceso"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              maxLength={12}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              className="w-full min-h-[56px] px-4 text-center font-mono text-2xl tracking-[0.25em] uppercase bg-[#F7F7F7] text-[#004666] border-2 border-[#E5E5E5] rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {mensaje && (
            <p role="alert" className="p-3.5 bg-[#FFF8EB] border-2 border-[#F59E0B] text-[#78350F] text-xs sm:text-sm font-bold rounded-2xl">
              ⚠️ {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={!completo || enviando}
            className="btn-3d btn-3d-primary w-full py-4 text-base sm:text-lg min-h-[52px] flex items-center justify-center font-black"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-[#555555] text-center font-medium">
          ¿Es la primera vez que entrás? Usá{' '}
          <Link
            to="/alumno/ingreso"
            className="inline-flex items-center min-h-[44px] font-black text-[#006590] underline"
          >
            el código de tu clase
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
