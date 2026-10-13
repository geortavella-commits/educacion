import React, { useState, useEffect } from 'react';
import { ModoProvider } from '@/components/ModoProvider';
import { Button } from '@/components/Button';
import { ErrorState, LoadingSkeleton } from '@/components/States';
import { Dialog } from '@/components/Dialog';
import {
  consentimientoService,
  ConsentimientoData,
  EstadoConsentimiento,
} from '@/services/consentimiento';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';

export interface ConsentimientoProps {
  /** Alumno cuyo permiso se gestiona (si hay más de un hijo/a). */
  alumnoId?: string;
  forcedEstado?: EstadoConsentimiento;
  onConsentimientoChange?: (estado: EstadoConsentimiento) => void;
  className?: string;
}

export const Consentimiento: React.FC<ConsentimientoProps> = ({
  alumnoId,
  forcedEstado,
  onConsentimientoChange,
  className = '',
}) => {
  const [data, setData] = useState<ConsentimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorRed, setErrorRed] = useState(false);
  const [sinPermiso, setSinPermiso] = useState(false);

  // Checkbox SIN premarcar
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevocarModalOpen, setIsRevocarModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    setErrorRed(false);
    setSinPermiso(false);

    if (forcedEstado === 'sin_permiso') {
      setSinPermiso(true);
      setLoading(false);
      return;
    }
    if (forcedEstado === 'error_red') {
      setErrorRed(true);
      setLoading(false);
      return;
    }

    try {
      const res = await consentimientoService.obtenerConsentimiento(alumnoId);
      if (forcedEstado && forcedEstado !== 'cargando') {
        res.estado = forcedEstado;
      }
      setData(res);
    } catch {
      setErrorRed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [forcedEstado]);

  const handleAutorizar = async () => {
    if (!aceptoTerminos || !data) return;
    setIsSubmitting(true);
    try {
      const updated = await consentimientoService.otorgarConsentimiento(data.id);
      setData(updated);
      if (onConsentimientoChange) onConsentimientoChange('otorgado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevocar = async () => {
    if (!data) return;
    setIsSubmitting(true);
    try {
      const updated = await consentimientoService.revocarConsentimiento(data.id);
      setData(updated);
      setIsRevocarModalOpen(false);
      setAceptoTerminos(false);
      if (onConsentimientoChange) onConsentimientoChange('revocado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModoProvider nivel="secundaria" className="tema-adultos">
      <div
        className={`w-full max-w-lg mx-auto bg-white text-slate-800 border-2 border-slate-200 rounded-3xl p-5 sm:p-7 flex flex-col gap-5 shadow-sm transition-all min-w-0 overflow-hidden font-nunito ${className}`}
      >
        {/* Cabecera para familias */}
        <div className="pb-3 border-b-2 border-slate-100 flex items-center justify-between gap-3 min-w-0">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#e5f8cf] text-[#2b6c00] border border-[#58cc02]/40 text-xs font-black uppercase tracking-wider break-words">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Para madres, padres y tutores
          </span>
          <span className="text-xs font-bold text-slate-600 shrink-0">Fase 1</span>
        </div>

        {/* Estado CARGANDO */}
        {loading && (
          <div className="py-6 space-y-4">
            <LoadingSkeleton type="text" count={2} />
            <LoadingSkeleton type="card" count={1} />
          </div>
        )}

        {/* Estado ERROR DE RED */}
        {!loading && errorRed && (
          <ErrorState
            title="Error de conexión"
            message="No pudimos cargar el formulario de consentimiento familiar. Verificá tu red y reintentá."
            onRetry={cargarDatos}
          />
        )}

        {/* Estado SIN PERMISO */}
        {!loading && sinPermiso && (
          <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl text-center space-y-3 min-w-0">
            <Lock className="w-8 h-8 text-slate-600 mx-auto" aria-hidden="true" />
            <h2 className="text-lg font-black break-words">Acceso restringido</h2>
            <p className="text-sm font-semibold text-slate-700 break-words">
              No contás con permisos de tutor legal para gestionar el consentimiento de este alumno. Contactá a la dirección de la escuela.
            </p>
          </div>
        )}

        {/* Estado PENDIENTE: formulario */}
        {!loading && !errorRed && !sinPermiso && data?.estado === 'pendiente' && (
          <div className="flex flex-col gap-5 animate-fade-in min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight text-slate-900 break-words">
                Autorizá el uso de Chasqui para {data.alumnoNombre}
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-2 leading-relaxed break-words">
                <strong className="font-black">{data.alumnoNombre}</strong> va a usar a <strong className="font-black">Chasqui</strong>, un tutor pedagógico con{' '}
                <strong className="font-black">inteligencia artificial</strong> que puede equivocarse, en la <strong className="font-black">{data.escuela}</strong>.
              </p>
            </div>

            {/* Puntos de consentimiento */}
            <ul className="flex flex-col gap-2.5 min-w-0">
              {[
                ['Chasqui no da respuestas servidas.', 'Hace preguntas para que piense y aprenda a razonar por sí mismo.'],
                ['Qué pasa con la voz.', `Si ${data.alumnoNombre} habla, el audio se transcribe a texto con un servicio de voz de [proveedor a definir]. El audio original no se guarda. El texto queda en su historial pedagógico y lo ven su docente y vos.`],
                ['Datos mínimos y privacidad.', 'No guardamos fotos de personas, correos ni datos de ubicación geográfica.'],
                ['Podés revocar la autorización cuando quieras.', 'Podés dejar sin efecto este permiso en cualquier momento desde esta misma plataforma o notificando a la escuela.'],
                ['IA de terceros y precisión.', 'El tutor utiliza modelos de lenguaje que asisten el aprendizaje pero no reemplazan la enseñanza del docente.'],
              ].map(([titulo, texto]) => (
                <li key={titulo} className="flex items-start gap-3 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm leading-relaxed min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-[#2b6c00] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="break-words font-semibold text-slate-700">
                    <strong className="font-black text-slate-900">{titulo}</strong> {texto}
                  </span>
                </li>
              ))}
            </ul>

            {/* Casilla de aceptación SIN PREMARCAR */}
            <label
              htmlFor="checkbox-consentimiento-familiar"
              className={`flex items-start gap-3 cursor-pointer select-none p-4 border-2 rounded-2xl min-h-[56px] min-w-0 transition-colors ${aceptoTerminos ? 'border-[#58cc02] bg-[#e5f8cf]/50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
            >
              <input
                id="checkbox-consentimiento-familiar"
                type="checkbox"
                checked={aceptoTerminos}
                onChange={(e) => setAceptoTerminos(e.target.checked)}
                aria-label={`Leí y acepto el uso de la aplicación educativa y el tratamiento de datos para ${data.alumnoNombre}`}
                className="w-6 h-6 mt-0.5 accent-[#2b6c00] cursor-pointer shrink-0"
              />
              <span className="text-sm font-extrabold leading-snug text-slate-900 break-words">
                Leí y acepto el uso de la aplicación educativa y el tratamiento de datos para {data.alumnoNombre}.
              </span>
            </label>

            {/* Botones de acción */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                disabled={!aceptoTerminos || isSubmitting}
                onClick={handleAutorizar}
                className="btn-3d btn-3d-primary w-full min-h-[56px] px-5 gap-2 text-lg cursor-pointer disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <span>{isSubmitting ? 'Guardando…' : 'Autorizo'}</span>
              </button>
              {!aceptoTerminos && <p className="text-xs font-bold text-slate-600 text-center">Marcá la casilla de arriba para poder autorizar.</p>}

              <button type="button" onClick={() => setIsInfoModalOpen(true)} className="btn-3d-outline w-full min-h-[48px] px-4 gap-2 text-sm cursor-pointer">
                <Info className="w-4 h-4 text-[#158ecc]" aria-hidden="true" />
                <span>No autorizo / Quiero más información</span>
              </button>
            </div>
          </div>
        )}

        {/* Estado YA OTORGADO */}
        {!loading && !errorRed && !sinPermiso && data?.estado === 'otorgado' && (
          <div className="flex flex-col gap-5 animate-fade-in min-w-0">
            <div className="p-5 bg-[#e5f8cf] border-2 border-[#58cc02]/50 rounded-3xl space-y-2 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-white border-2 border-[#58cc02] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#2b6c00]" aria-hidden="true" />
                </span>
                <span className="font-black text-lg text-[#1e5000]">Consentimiento vigente</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-slate-800 break-words">
                Autorizaste a <strong className="font-black">{data.alumnoNombre}</strong> para participar en las actividades con Chasqui en la {data.escuela}.
              </p>
              {data.fechaOtorgado && <p className="text-xs font-extrabold text-[#2b6c00] pt-1">Otorgado el {data.fechaOtorgado}.</p>}
            </div>

            <p className="text-sm font-semibold text-slate-700 leading-relaxed break-words">
              <strong className="font-black text-slate-900">Tus derechos:</strong> podés revocar esta autorización en cualquier momento. Al hacerlo, el alumno no interactuará con el tutor IA y realizará actividades alternativas coordinadas por la seño.
            </p>

            <div className="pt-4 border-t-2 border-slate-100">
              <button type="button" onClick={() => setIsRevocarModalOpen(true)} className="btn-3d-outline w-full min-h-[48px] px-4 gap-2 text-sm cursor-pointer !text-red-700 !border-red-200 !border-b-red-300">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>Revocar autorización</span>
              </button>
            </div>
          </div>
        )}

        {/* Estado REVOCADO */}
        {!loading && !errorRed && !sinPermiso && data?.estado === 'revocado' && (
          <div className="flex flex-col gap-5 animate-fade-in min-w-0">
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-2 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#7a4200]" aria-hidden="true" />
                </span>
                <span className="font-black text-lg text-slate-900">Autorización revocada</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-slate-700 break-words">
                Retiraste el consentimiento para el uso del tutor de IA para {data.alumnoNombre}. La escuela fue notificada para coordinar el trabajo en formato tradicional.
              </p>
              {data.fechaRevocado && <p className="text-xs font-extrabold text-slate-600">Revocado el {data.fechaRevocado}.</p>}
            </div>

            <button
              type="button"
              className="btn-3d btn-3d-primary w-full min-h-[52px] px-5 gap-2 text-base cursor-pointer"
              onClick={() => {
                if (data) {
                  data.estado = 'pendiente';
                  setData({ ...data });
                }
              }}
            >
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              <span>Revisar y volver a autorizar</span>
            </button>
          </div>
        )}

        {/* Modal informativo */}
        <Dialog
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title="Información pedagógica para familias"
          description="Transparencia y derechos en el uso de IA escolar"
          actions={
            <Button variant="primary" onClick={() => setIsInfoModalOpen(false)}>
              Entendido
            </Button>
          }
        >
          <div className="space-y-3 text-sm font-semibold leading-relaxed text-slate-700">
            <p>
              <strong className="font-black text-slate-900">¿Es obligatorio usar Chasqui?</strong> No. Si decidís no autorizar, el alumno participará de los mismos proyectos en el aula con actividades guiadas en papel o cuaderno por la docente.
            </p>
            <p>
              <strong className="font-black text-slate-900">¿Qué datos se envían a la IA?</strong> Solo las consultas de texto sobre temas de la clase. Nunca datos identificatorios personales.
            </p>
            <p>
              <strong className="font-black text-slate-900">Contacto con la escuela:</strong> podés solicitar una reunión con la docente titular para evacuar dudas pedagógicas.
            </p>
          </div>
        </Dialog>

        {/* Modal de confirmación para Revocar */}
        <Dialog
          isOpen={isRevocarModalOpen}
          onClose={() => setIsRevocarModalOpen(false)}
          title="¿Querés revocar la autorización?"
          description="Esta acción deshabilitará el tutor Chasqui para el alumno."
          actions={
            <>
              <Button variant="secondary" onClick={() => setIsRevocarModalOpen(false)}>
                Cancelar
              </Button>
              <button type="button" onClick={handleRevocar} disabled={isSubmitting} className="btn-3d-outline min-h-[44px] px-4 text-sm cursor-pointer !text-red-700 !border-red-300 !border-b-red-400">
                {isSubmitting ? 'Guardando…' : 'Sí, revocar permiso'}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3 p-3.5 bg-[#fff2d6] border-2 border-[#ff9600]/40 rounded-2xl">
            <ShieldAlert className="w-5 h-5 text-[#7a4200] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm font-semibold leading-relaxed text-slate-800">
              Al revocar, el alumno no tendrá acceso a las conversaciones con Chasqui y el docente asignará actividades alternativas en el aula. Podés volver a autorizarlo cuando quieras.
            </p>
          </div>
        </Dialog>
      </div>
    </ModoProvider>
  );
};
