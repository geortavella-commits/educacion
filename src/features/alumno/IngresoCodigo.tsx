import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { Dialog } from '@/components/Dialog';
import { ErrorState } from '@/components/States';
import { ingresoService, EstadoIngreso, ValidacionCodigoResult } from '@/services/ingreso';
import { usarSupabase } from '@/services/modo';
import {
  Sparkles,
  Camera,
  QrCode,
  Hourglass,
  Check,
  ArrowLeft,
  Loader2,
  ScanLine,
  KeyRound,
} from 'lucide-react';

export interface IngresoCodigoProps {
  forcedEstado?: EstadoIngreso;
  onSuccess?: () => void;
  className?: string;
}

const AVATARES_DISPONIBLES = [
  { id: 'av-1', emoji: '🦊', nombre: 'Zorro' },
  { id: 'av-2', emoji: '🦉', nombre: 'Lechuza' },
  { id: 'av-3', emoji: '🚀', nombre: 'Cohete' },
  { id: 'av-4', emoji: '🎨', nombre: 'Pintura' },
  { id: 'av-5', emoji: '⭐', nombre: 'Estrella' },
  { id: 'av-6', emoji: '⚽', nombre: 'Pelota' },
];

export const IngresoCodigo: React.FC<IngresoCodigoProps> = ({
  forcedEstado,
  onSuccess,
  className = '',
}) => {
  const navigate = useNavigate();
  // Pasos: 1 = codigo, 2 = avatar_nombre, 3 = espera_aprobacion, 4 = listo
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);

  // Inputs de código (6 caracteres)
  const [digitos, setDigitos] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Datos del alumno
  const [nombreVisible, setNombreVisible] = useState('');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(AVATARES_DISPONIBLES[0].id);

  // Estados de validación
  const [estado, setEstado] = useState<EstadoIngreso>(forcedEstado || 'idle');
  const [mensajeError, setMensajeError] = useState<string>('');
  const [segundosBloqueo, setSegundosBloqueo] = useState<number>(
    forcedEstado === 'demasiados_intentos' ? 60 : 0
  );
  const [infoCurso, setInfoCurso] = useState<ValidacionCodigoResult['cursoInfo']>();

  // Helper para formato mm:ss
  const formatTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Modal QR / Cámara
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [permisoCamara, setPermisoCamara] = useState<'inicial' | 'solicitando' | 'concedido' | 'denegado'>('inicial');

  useEffect(() => {
    if (forcedEstado) {
      setEstado(forcedEstado);
      if (forcedEstado === 'esperando_aprobacion') setPaso(3);
      if (forcedEstado === 'demasiados_intentos') {
        setSegundosBloqueo(60);
        setMensajeError('Probaste muchas veces. Esperá 1 minuto y volvé a intentar.');
      }
    }
  }, [forcedEstado]);

  // Cuenta regresiva para bloqueo por intentos
  useEffect(() => {
    if (segundosBloqueo > 0) {
      const timer = setInterval(() => {
        setSegundosBloqueo((prev) => {
          if (prev <= 1) {
            setEstado('idle');
            setMensajeError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [segundosBloqueo]);

  const handleDigitoChange = (index: number, valor: string) => {
    const char = valor.slice(-1).toUpperCase();
    const nuevosDigitos = [...digitos];
    nuevosDigitos[index] = char;
    setDigitos(nuevosDigitos);
    setEstado('idle');
    setMensajeError('');

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim().toUpperCase().slice(0, 6);
    const chars = text.split('');
    const nuevos = ['', '', '', '', '', ''];
    chars.forEach((c, i) => {
      nuevos[i] = c;
    });
    setDigitos(nuevos);
    const nextIndex = Math.min(chars.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const codigoCompleto = digitos.join('');

  const handleValidarCodigo = async () => {
    if (codigoCompleto.length < 6) {
      setEstado('incorrecto');
      setMensajeError('Por favor completá las 6 casillas con letras o números.');
      return;
    }

    setEstado('cargando');
    const res = await ingresoService.validarCodigo(codigoCompleto);
    setEstado(res.estado);

    if (res.estado === 'valido') {
      setInfoCurso(res.cursoInfo);
      setPaso(2);
    } else if (res.estado === 'demasiados_intentos') {
      setMensajeError(res.mensaje || 'Probaste muchas veces. Esperá 1 minuto y volvé a intentar.');
      setSegundosBloqueo(res.segundosBloqueo || 60);
    } else {
      setMensajeError(res.mensaje || 'Ocurrió un error.');
    }
  };

  const handleConfirmarPerfil = async () => {
    if (!nombreVisible.trim()) return;

    setEstado('cargando');
    const res = await ingresoService.solicitarIngresoAlumno(codigoCompleto, nombreVisible, avatarSeleccionado);
    if (res.exito === false) {
      // El nombre no sirvió, el código venció, se cortó internet...: se queda en este paso con el motivo.
      setEstado(res.estado);
      setMensajeError(res.mensaje || 'No pudimos enviar tu pedido. Probá de nuevo.');
      if (res.segundosBloqueo) setSegundosBloqueo(res.segundosBloqueo);
      return;
    }
    setEstado('esperando_aprobacion');
    setPaso(3);
  };

  // Modo real: mientras se espera, se pregunta cada 4 segundos si la seño ya aprobó.
  // También retoma la espera si el chico recarga la página con un pedido pendiente.
  useEffect(() => {
    if (!usarSupabase || forcedEstado) return;
    if (paso === 1 && ingresoService.haySolicitudEnEspera()) {
      setEstado('esperando_aprobacion');
      setPaso(3);
      return;
    }
    if (paso !== 3) return;
    let cancelado = false;
    const consultar = async () => {
      const r = await ingresoService.consultarEstadoSolicitud();
      if (cancelado) return;
      if (r === 'aprobada') {
        setEstado('aprobado');
        setPaso(4);
      } else if (r === 'rechazada') {
        setEstado('incorrecto');
        setMensajeError('Tu seño no aprobó este ingreso. Hablá con ella o con él para volver a probar.');
        setPaso(1);
      } else if (r === 'sin_solicitud') {
        setEstado('idle');
        setPaso(1);
      }
    };
    consultar();
    const id = setInterval(consultar, 4000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [paso, forcedEstado]);

  const handleSimularAprobacionDocente = () => {
    setEstado('aprobado');
    setPaso(4);
    if (onSuccess) onSuccess();
  };

  const handleSolicitarCamara = () => {
    setPermisoCamara('solicitando');
    setTimeout(() => {
      setPermisoCamara('concedido');
    }, 800);
  };

  const isBloqueado = estado === 'demasiados_intentos' || segundosBloqueo > 0;

  return (
    <ModoProvider nivel="primaria">
      <div
        className={`w-full max-w-md mx-auto bg-white text-[#1B1C1C] rounded-3xl border-2 border-[#E5E5E5] shadow-[0_8px_0_0_#E5E5E5] p-5 sm:p-7 md:p-8 flex flex-col gap-5 transition-all min-w-0 my-2 md:my-6 ${className}`}
      >
        {/* Cabecera / Marca */}
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-[#1E5000] flex items-center justify-center font-black shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="font-extrabold text-2xl text-[#1B1C1C] tracking-tight truncate">
              Chasqui
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-[#004666] bg-[#DDF4FF] border border-[#1CB0F6]/30 px-3 py-1 rounded-full shrink-0">
            Primaria
          </span>
        </div>

        {/* PASO 1: Ingreso de Código */}
        {paso === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-[#1B1C1C] break-words">
                ¡Entrá a tu clase!
              </h1>
              <p className="text-sm md:text-base text-[#4E4E4E] mt-1 font-medium break-words">
                Pedile el código a tu seño.
              </p>
            </div>

            {/* Grilla de 6 casillas (min-w 44px garantizado) */}
            <div
              className="grid grid-cols-6 gap-1.5 sm:gap-2 my-1 min-w-0"
              onPaste={handlePaste}
              role="group"
              aria-label="Código de 6 letras o números"
            >
              {digitos.map((d, i) => (
                <input
                  key={i}
                  id={`codigo-digito-${i + 1}`}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={d}
                  disabled={estado === 'cargando' || isBloqueado}
                  onChange={(e) => handleDigitoChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Carácter ${i + 1} del código`}
                  className={`min-w-[44px] min-h-[48px] h-12 sm:h-14 w-full text-center font-extrabold text-xl sm:text-2xl uppercase rounded-2xl border-2 transition-all select-none
                    ${
                      d
                        ? 'border-[#1CB0F6] bg-[#DDF4FF] text-[#004666] shadow-[0_3px_0_0_#1899D6]'
                        : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#1B1C1C]'
                    }
                    focus:border-[#1CB0F6] focus:bg-white focus:outline-none focus:ring-0
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              ))}
            </div>

            {/* Ayuda de las casillas */}
            <div className="text-xs text-[#555555] font-semibold">
              <span>6 letras o números.</span>
            </div>

            {/* Mensajes de error / bloqueo */}
            {isBloqueado && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-[#FFF8EB] border-2 border-[#F59E0B] text-[#78350F] rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-2.5"
              >
                <Hourglass className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-bold text-[#78350F]">
                    Probaste muchas veces. Esperá 1 minuto y volvé a intentar.
                  </span>
                  <div className="text-xs text-[#78350F]/80 flex items-center gap-1.5 font-medium">
                    <span>Podés volver a intentar en:</span>
                    <span className="font-mono font-bold text-[#004666] bg-white px-2 py-0.5 rounded border border-[#1CB0F6]/40 text-xs sm:text-sm">
                      {formatTiempo(segundosBloqueo)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {estado === 'vencido' && (
              <ErrorState
                title="Código vencido"
                message={mensajeError || 'El código ya caducó. Pedile uno nuevo a tu seño.'}
              />
            )}

            {estado === 'incorrecto' && (
              <div className="p-3.5 bg-[#FFF8EB] border-2 border-[#F59E0B] text-[#78350F] rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>⚠️ {mensajeError || 'Código incorrecto. Revisá las 6 letras.'}</span>
              </div>
            )}

            {estado === 'error_red' && (
              <ErrorState
                title="Sin conexión"
                message="Error de red. Verificá tu internet y reintentá."
                onRetry={handleValidarCodigo}
              />
            )}

            {/* Botón Entrar */}
            <button
              type="button"
              disabled={codigoCompleto.length !== 6 || isBloqueado || estado === 'cargando'}
              onClick={handleValidarCodigo}
              className="btn-3d btn-3d-primary w-full py-4 text-base md:text-lg min-h-[52px] flex items-center justify-center font-black"
            >
              {estado === 'cargando' ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                'Entrar'
              )}
            </button>

            {/* Separador */}
            <div className="flex items-center gap-3 my-0.5">
              <span className="flex-1 h-0.5 bg-[#E5E5E5]" />
              <span className="text-xs font-black uppercase text-[#999999]">o</span>
              <span className="flex-1 h-0.5 bg-[#E5E5E5]" />
            </div>

            {/* Botón Escanear QR */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="p-3.5 bg-white border-2 border-[#E5E5E5] rounded-2xl flex items-center gap-3.5 shadow-[0_4px_0_0_#E5E5E5] active:translate-y-1 active:shadow-none hover:border-[#CCCCCC] transition-all cursor-pointer text-left group min-w-0"
            >
              <div className="w-12 h-12 rounded-xl bg-[#E5F6FD] border border-[#1CB0F6]/20 flex items-center justify-center text-[#006590] group-hover:scale-105 transition-transform shrink-0">
                <QrCode className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm md:text-base text-[#1B1C1C] group-hover:text-[#006590]">
                  Escanear QR
                </span>
                <span className="text-xs text-[#666666] leading-snug">
                  Apuntá la cámara al cartel del aula
                </span>
              </div>
            </button>

            {/* ¿Ya entró antes? Tarjeta destacada */}
            <Link
              to="/alumno/acceso"
              className="p-3.5 bg-[#DDF4FF] border-2 border-[#1CB0F6] rounded-2xl flex items-center gap-3.5 shadow-[0_4px_0_0_#1899D6] active:translate-y-1 active:shadow-none hover:border-[#1899D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] transition-all text-left group min-w-0"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1CB0F6] flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
                <KeyRound className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm md:text-base text-[#004666] group-hover:underline">
                  Ya entré antes
                </span>
                <span className="text-xs text-[#004666]/80 leading-snug font-medium">
                  Entrá con el código de acceso que te dio tu seño o tu familia
                </span>
              </div>
            </Link>

            {/* Pasos explicativos */}
            <div className="p-4 bg-[#F7F7F7] rounded-2xl flex flex-col gap-2.5 border-2 border-[#E5E5E5] min-w-0">
              <span className="font-bold text-xs uppercase tracking-wider text-[#666666]">
                Pasos para entrar
              </span>
              <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-[#1B1C1C]">
                <span className="w-6 h-6 rounded-full bg-[#58CC02] text-[#1E5000] flex items-center justify-center text-xs shrink-0 font-black">
                  1
                </span>
                <span>Ponés el código</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-[#555555]">
                <span className="w-6 h-6 rounded-full border-2 border-[#E5E5E5] bg-white flex items-center justify-center text-xs shrink-0 font-bold">
                  2
                </span>
                <span>Tu seño aprueba el ingreso</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-[#555555]">
                <span className="w-6 h-6 rounded-full border-2 border-[#E5E5E5] bg-white flex items-center justify-center text-xs shrink-0 font-bold">
                  3
                </span>
                <span>¡A explorar con Chasqui!</span>
              </div>
            </div>

            <p className="text-xs text-center text-[#555555] italic font-medium">
              No usás tu apellido ni tu mail. Elegís un avatar.
            </p>
          </div>
        )}

        {/* PASO 2: Elegir Nombre y Avatar */}
        {paso === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in min-w-0">
            <div className="min-w-0">
              <span className="text-xs uppercase font-black tracking-wider text-[#004666] bg-[#DDF4FF] px-2.5 py-1 rounded-full inline-block">
                {infoCurso?.nombre || '5º Grado'} · {infoCurso?.docente || 'Seño'}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight mt-1 text-[#1B1C1C] break-words">
                ¿Cómo te llamás?
              </h2>
              <p className="text-xs md:text-sm text-[#4E4E4E] break-words font-medium">
                Escribí solo tu nombre de pila (sin apellido).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre-visible" className="text-xs font-bold text-[#4E4E4E]">
                Tu nombre visible
              </label>
              <input
                id="nombre-visible"
                type="text"
                placeholder="Ej: Mateo, Sofi, Benja..."
                value={nombreVisible}
                onChange={(e) => setNombreVisible(e.target.value)}
                className="w-full text-base md:text-lg py-3 px-4 rounded-2xl border-2 border-[#E5E5E5] bg-white text-[#1B1C1C] focus:border-[#1CB0F6] focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[#4E4E4E] mb-2">
                Elegí tu avatar para el aula
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AVATARES_DISPONIBLES.map((av) => {
                  const isSelected = avatarSeleccionado === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarSeleccionado(av.id)}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1CB0F6] bg-[#DDF4FF] shadow-[0_4px_0_0_#1899D6] scale-105 text-[#004666]'
                          : 'border-[#E5E5E5] bg-white shadow-[0_3px_0_0_#E5E5E5] text-[#1B1C1C] hover:border-[#CCCCCC] active:translate-y-0.5 active:shadow-none'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{av.emoji}</span>
                      <span className="text-xs font-extrabold truncate w-full text-center">
                        {av.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="btn-3d btn-3d-outline px-4 py-3 min-h-[48px] flex items-center justify-center font-black shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                Volver
              </button>
              <button
                type="button"
                disabled={!nombreVisible.trim()}
                onClick={handleConfirmarPerfil}
                className="btn-3d btn-3d-primary flex-1 py-3 min-h-[48px] flex items-center justify-center font-black text-sm md:text-base"
              >
                Pedir acceso a la seño
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Espera de Aprobación */}
        {paso === 3 && (
          <div className="flex flex-col items-center text-center gap-4 py-3 animate-fade-in min-w-0">
            <div className="w-20 h-20 rounded-full bg-[#E5F6FD] border-4 border-[#1CB0F6] shadow-md flex items-center justify-center text-4xl animate-bounce">
              {AVATARES_DISPONIBLES.find((a) => a.id === avatarSeleccionado)?.emoji || '🚀'}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-[#004666] bg-[#DDF4FF] px-3 py-1 rounded-full">
                Paso 2 de 3
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold mt-3 text-[#1B1C1C] break-words">
                ¡Casi listo, {nombreVisible || 'Mateo'}!
              </h2>
              <p className="text-xs md:text-sm text-[#4E4E4E] mt-1 max-w-xs mx-auto break-words font-medium">
                Esperá que tu seño confirme tu ingreso desde su pantalla del aula.
              </p>
            </div>

            <div className="w-full p-4 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl text-xs sm:text-sm text-[#1B1C1C] space-y-2 text-left min-w-0">
              <div className="flex justify-between">
                <span className="text-[#666666]">Clase:</span>
                <strong className="text-[#1B1C1C]">{infoCurso?.nombre || '5º Grado B'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Docente:</span>
                <strong className="text-[#1B1C1C]">{infoCurso?.docente || 'Seño Mariana'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Tu avatar:</span>
                <strong className="text-[#1B1C1C]">
                  {AVATARES_DISPONIBLES.find((a) => a.id === avatarSeleccionado)?.nombre || 'Zorro'}
                </strong>
              </div>
            </div>

            <div className="pt-2 w-full space-y-3">
              {usarSupabase ? (
                <p role="status" className="text-sm text-[#004666] font-bold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1CB0F6]" aria-hidden="true" />
                  <span>Esperando que tu seño lo apruebe…</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSimularAprobacionDocente}
                  className="btn-3d btn-3d-primary w-full py-3.5 min-h-[48px] flex items-center justify-center gap-2 font-black text-sm sm:text-base"
                >
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>Simular aprobación de la seño</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="btn-3d btn-3d-outline w-full py-2.5 min-h-[44px] flex items-center justify-center font-black text-sm"
              >
                Cambiar código
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Ingreso Aprobado */}
        {paso === 4 && (
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in min-w-0">
            <div className="w-20 h-20 rounded-full bg-[#58CC02] border-b-4 border-[#46A302] text-[#1E5000] flex items-center justify-center shadow-md">
              <Check className="w-10 h-10 stroke-[3.5]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B1C1C] break-words">
                ¡Bienvenido/a al aula!
              </h2>
              <p className="text-sm md:text-base text-[#4E4E4E] mt-1 break-words font-medium">
                La seño te aprobó. Chasqui ya tiene listas tus misiones de hoy.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess();
                else navigate('/alumno');
              }}
              className="btn-3d btn-3d-primary w-full py-4 text-base sm:text-lg min-h-[52px] flex items-center justify-center font-black mt-2"
            >
              🚀 Comenzar misiones
            </button>
          </div>
        )}

        {/* Dialog / Modal de QR y permiso de cámara */}
        <Dialog
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Escanear código QR del aula"
          description="Apuntá tu teléfono o tablet al código que proyecta la seño en el pizarrón."
          actions={
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="btn-3d btn-3d-outline px-4 py-2 min-h-[44px] font-black text-sm"
            >
              Cerrar
            </button>
          }
        >
          <div className="flex flex-col items-center text-center gap-4 py-2 min-w-0">
            {permisoCamara === 'inicial' && (
              <div className="space-y-4 w-full">
                <div className="w-20 h-20 rounded-2xl bg-[#F7F7F7] border-2 border-dashed border-[#CCCCCC] mx-auto flex items-center justify-center text-[#006590]">
                  <Camera className="w-8 h-8" aria-hidden="true" />
                </div>
                <p className="text-xs md:text-sm text-[#4E4E4E] break-words font-medium">
                  Para escanear el QR necesitamos acceso a la cámara de tu dispositivo.
                </p>
                <button
                  type="button"
                  onClick={handleSolicitarCamara}
                  className="btn-3d btn-3d-primary w-full py-3.5 min-h-[48px] flex items-center justify-center gap-2 font-black text-sm"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Permitir uso de cámara</span>
                </button>
              </div>
            )}

            {permisoCamara === 'solicitando' && (
              <div className="py-6 space-y-2">
                <Loader2 className="animate-spin w-8 h-8 text-[#1CB0F6] mx-auto" aria-hidden="true" />
                <p className="text-xs md:text-sm font-bold text-[#1B1C1C]">Solicitando permiso al navegador...</p>
              </div>
            )}

            {permisoCamara === 'concedido' && (
              <div className="space-y-3 w-full">
                <div className="w-full h-40 bg-[#1B1C1C] rounded-2xl flex flex-col items-center justify-center text-white p-4 relative overflow-hidden border-2 border-[#1CB0F6]">
                  <div className="w-28 h-28 border-2 border-[#1CB0F6] rounded-xl border-dashed animate-pulse flex flex-col items-center justify-center gap-1">
                    <ScanLine className="w-6 h-6 text-[#1CB0F6]" aria-hidden="true" />
                    <span className="text-xs text-center opacity-80">
                      Encuadrá el QR
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsQrModalOpen(false);
                    setDigitos(['F', 'U', 'T', '5', 'K', '9']);
                    handleValidarCodigo();
                  }}
                  className="btn-3d btn-3d-secondary w-full py-3 min-h-[44px] flex items-center justify-center font-black text-xs sm:text-sm"
                >
                  ⚡ Simular lectura de QR (FUT5K9)
                </button>
              </div>
            )}
          </div>
        </Dialog>
      </div>
    </ModoProvider>
  );
};
