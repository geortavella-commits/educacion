import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, TestTube, GraduationCap, Backpack, HeartHandshake, Building2, ArrowRight, Copy, Check, KeyRound } from 'lucide-react';

/**
 * Cuentas de prueba (datos ficticios del seed) para que otras personas puedan probar la plataforma.
 * SOLO se muestran en desarrollo o si el entorno lo pide a propósito (VITE_MOSTRAR_CUENTAS_DE_PRUEBA=true, p. ej. un entorno de testeo).
 * En producción el interruptor está apagado y este bloque se elimina del paquete.
 */
const MOSTRAR_CUENTAS = import.meta.env.DEV || import.meta.env.VITE_MOSTRAR_CUENTAS_DE_PRUEBA === 'true';
const CLAVE_DE_PRUEBA = MOSTRAR_CUENTAS ? 'educacion123' : '';
/** En producción devuelve vacío y el mail ficticio se elimina del paquete. */
const mail = (m: string) => (MOSTRAR_CUENTAS ? m : '');

interface Rol {
  to: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  icono: React.ReactNode;
  /** Colores del chip y del borde al pasar el mouse (texto oscuro sobre fondo claro: pasan contraste). */
  chip: string;
  borde: string;
  cuenta: string;
}

const ROLES: Rol[] = [
  {
    to: '/docente',
    etiqueta: 'Punto de entrada',
    titulo: 'Docente',
    texto: 'Proyectos por semanas, grupos, alumnos y lo que fueron respondiendo.',
    icono: <GraduationCap className="w-6 h-6" aria-hidden="true" />,
    chip: 'bg-[#e5f8cf] text-[#2b6c00]',
    borde: 'hover:border-[#58cc02]',
    cuenta: mail('docente.laura@ficticio.test'),
  },
  {
    to: '/alumno',
    etiqueta: 'Experiencia dual',
    titulo: 'Alumno',
    texto: 'Misiones con Chasqui, avance lúdico y cada tipo de respuesta con su estilo.',
    icono: <Backpack className="w-6 h-6" aria-hidden="true" />,
    chip: 'bg-[#ddf4ff] text-[#0b5e86]',
    borde: 'hover:border-[#1cb0f6]',
    cuenta: mail('alumno.mateo@ficticio.test'),
  },
  {
    to: '/familia',
    etiqueta: 'Acompañamiento',
    titulo: 'Familia',
    texto: 'Resumen del avance, consentimiento de uso de IA y acceso desde otro dispositivo.',
    icono: <HeartHandshake className="w-6 h-6" aria-hidden="true" />,
    chip: 'bg-[#fff2d6] text-[#7a4200]',
    borde: 'hover:border-[#ff9600]',
    cuenta: mail('familia.mateo@ficticio.test'),
  },
  {
    to: '/directivo',
    etiqueta: 'Fase 2',
    titulo: 'Directivo',
    texto: 'Supervisión general y métricas institucionales del piloto.',
    icono: <Building2 className="w-6 h-6" aria-hidden="true" />,
    chip: 'bg-slate-100 text-slate-800',
    borde: 'hover:border-slate-400',
    cuenta: mail('directivo@ficticio.test'),
  },
];

const Copiar: React.FC<{ texto: string; etiqueta: string }> = ({ texto, etiqueta }) => {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin portapapeles (p. ej. sin HTTPS): se puede seleccionar y copiar a mano */
    }
  };
  return (
    <button type="button" onClick={copiar} aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`} className="btn-3d-outline min-w-[44px] min-h-[44px] px-2.5 text-xs gap-1 cursor-pointer shrink-0">
      {copiado ? <Check className="w-4 h-4 text-[#2b6c00]" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      <span>{copiado ? 'Copiado' : 'Copiar'}</span>
    </button>
  );
};

export const HomePage: React.FC = () => {
  return (
    <div className="tema-adultos min-h-screen w-full max-w-full bg-bg text-text p-4 md:p-12 flex flex-col justify-between">
      <main className="max-w-5xl mx-auto w-full space-y-10 min-w-0">
        <header className="pb-6 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 min-w-0">
          <div className="min-w-0">
            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#e5f8cf] text-[#2b6c00] border border-[#58cc02]/50 text-xs font-black uppercase tracking-wider mb-3">
              Piloto Córdoba • Fase 1
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight break-words text-slate-900">Plataforma Educativa con IA</h1>
            <p className="text-slate-700 font-semibold text-sm md:text-base mt-2 break-words">Tutor pedagógico socrático “Chasqui” y proyectos interdisciplinarios para escuelas de Córdoba.</p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to="/ingresar" className="btn-3d btn-3d-primary min-h-[44px] px-5 gap-2 text-sm">
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to="/sistema" className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm">
              <Palette className="w-4 h-4" aria-hidden="true" />
              <span>Tokens</span>
            </Link>
            <Link to="/sistema/estados" className="btn-3d-outline min-h-[44px] px-4 gap-2 text-sm">
              <TestTube className="w-4 h-4" aria-hidden="true" />
              <span>Lab Estados</span>
            </Link>
          </div>
        </header>

        <section aria-labelledby="accesos" className="space-y-5 min-w-0">
          <div>
            <h2 id="accesos" className="text-xl md:text-2xl font-black text-slate-900">¿Quién va a probar?</h2>
            <p className="text-sm font-semibold text-slate-700">Elegí un rol para entrar{MOSTRAR_CUENTAS ? ' o usá su cuenta de prueba (son datos ficticios).' : '.'}</p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full min-w-0">
            {ROLES.map((r) => (
              <li key={r.to} className="min-w-0">
                <article className={`h-full bg-white border-2 border-slate-200 ${r.borde} rounded-3xl p-5 md:p-6 flex flex-col gap-4 shadow-sm transition-colors min-w-0`}>
                  <div className="flex items-start gap-4 min-w-0">
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.chip}`}>{r.icono}</span>
                    <div className="min-w-0">
                      <span className="text-xs uppercase font-black tracking-wider text-slate-600">{r.etiqueta}</span>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{r.titulo}</h3>
                      <p className="text-sm font-semibold text-slate-700 mt-1 break-words">{r.texto}</p>
                    </div>
                  </div>

                  {MOSTRAR_CUENTAS && (
                    <div role="group" aria-label={`Cuenta de prueba del rol ${r.titulo}`} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 space-y-2.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                        <KeyRound className="w-4 h-4" aria-hidden="true" />
                        Cuenta de prueba
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-600">Mail</span>
                          <span className="block text-sm font-black text-slate-900 break-all select-all">{r.cuenta}</span>
                        </div>
                        <Copiar texto={r.cuenta} etiqueta={`el mail del rol ${r.titulo}`} />
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-600">Contraseña</span>
                          <span className="block text-sm font-black text-slate-900 select-all">{CLAVE_DE_PRUEBA}</span>
                        </div>
                        <Copiar texto={CLAVE_DE_PRUEBA} etiqueta="la contraseña" />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link to="/ingresar" className="btn-3d btn-3d-primary min-h-[44px] px-4 gap-2 text-sm">
                      <span>Ingresar como {r.titulo.toLowerCase()}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pautas" className="p-5 bg-white border-2 border-slate-200 rounded-3xl text-sm font-semibold text-slate-700 space-y-2 min-w-0">
          <h2 id="pautas" className="font-black text-slate-900">Pautas éticas y técnicas del piloto</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>La IA nunca llega al navegador: los pedidos van a funciones del servidor, con límites y sin datos de los chicos.</li>
            <li>Nada califica ni clasifica a los alumnos: solo se muestra “avance de misiones”.</li>
            <li>La evaluación oficial es siempre de la docente; lo que propone la IA es un borrador que ella decide.</li>
          </ul>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs font-semibold text-slate-600 pt-8">Córdoba, Argentina — Plataforma Educativa con IA</footer>
    </div>
  );
};
