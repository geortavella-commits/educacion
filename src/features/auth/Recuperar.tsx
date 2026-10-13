import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';
import { Mail, ArrowLeft, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const Recuperar: React.FC = () => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorRed, setErrorRed] = useState(false);
  const [errorFormato, setErrorFormato] = useState('');

  const validarEmail = (valor: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRed(false);
    setErrorFormato('');

    const emailLimpio = email.trim();
    if (!emailLimpio) {
      setErrorFormato('Ingresá tu correo electrónico.');
      return;
    }

    if (!validarEmail(emailLimpio)) {
      setErrorFormato('Ingresá un correo electrónico válido.');
      return;
    }

    setCargando(true);
    try {
      const res = await authService.solicitarRecuperacion(emailLimpio);
      if (!res.ok && res.motivo === 'red') {
        setErrorRed(true);
      } else {
        setEnviado(true);
      }
    } catch {
      setErrorRed(true);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="tema-adultos min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans antialiased text-[var(--color-text)]">
      <main className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <Link
            to="/ingresar"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-accent-strong)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-strong)] focus:ring-offset-2 rounded px-2.5 py-2 min-h-[44px] mb-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Volver a ingresar</span>
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] font-black text-2xl mb-3 shadow-sm border border-[var(--color-border)]">
            Ch
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
            Ingresá tu mail y te enviamos las instrucciones para restablecerla.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] py-8 px-5 sm:px-8 shadow-sm rounded-2xl border border-[var(--color-border)]">
          {errorRed && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-sm"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium">Sin conexión con el servidor.</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Comprobá tu conexión a internet e intentalo de nuevo.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-100 underline hover:no-underline focus:outline-none"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {enviado ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div role="status" className="space-y-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  Revisá tu casilla de correo
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Si el mail está registrado, te enviamos un enlace para crear una contraseña nueva. Revisá también la carpeta de spam.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--color-border)]">
                <Link
                  to="/ingresar"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 text-sm font-semibold rounded-xl text-white bg-[var(--color-accent-strong)] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-strong)] transition-all"
                >
                  Volver a ingresar
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email-recuperar" className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                  Mail
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <input
                    id="email-recuperar"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorFormato) setErrorFormato('');
                    }}
                    placeholder="nombre@escuela.edu.ar"
                    aria-invalid={!!errorFormato}
                    aria-describedby={errorFormato ? 'error-formato-recuperar' : undefined}
                    className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-colors ${
                      errorFormato
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-950'
                        : 'border-[var(--color-border)] focus:border-[var(--color-accent-strong)] focus:ring-[var(--color-accent-soft)]'
                    }`}
                  />
                </div>
                {errorFormato && (
                  <p id="error-formato-recuperar" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorFormato}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[var(--color-accent-strong)] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-strong)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {cargando ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Enviando…
                    </span>
                  ) : (
                    'Enviarme el enlace'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
