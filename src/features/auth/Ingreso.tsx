import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService, RolUsuario } from '@/services/auth';
import { Button } from '@/components/Button';
import { ModoProvider } from '@/components/ModoProvider';
import {
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  WifiOff,
  ArrowRight,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Ingreso: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const motivoParam = searchParams.get('motivo');
  const [mostrarMotivo, setMostrarMotivo] = useState(Boolean(motivoParam));

  // Form states
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Error & status states
  const [errorCredenciales, setErrorCredenciales] = useState(false);
  const [errorEmailInvalido, setErrorEmailInvalido] = useState(false);
  const [errorRed, setErrorRed] = useState(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState<number | null>(null);

  // Refs for accessible focus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Timer para bloqueo
  useEffect(() => {
    if (segundosBloqueo === null || segundosBloqueo <= 0) return;

    const interval = setInterval(() => {
      setSegundosBloqueo((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [segundosBloqueo]);

  const formatearTiempo = (seg: number): string => {
    const mins = Math.floor(seg / 60);
    const secs = seg % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const redirigirPorRol = (rol: RolUsuario) => {
    switch (rol) {
      case 'docente':
        navigate('/docente', { replace: true });
        break;
      case 'directivo':
        navigate('/directivo', { replace: true });
        break;
      case 'familia':
        navigate('/familia', { replace: true });
        break;
      case 'alumno':
        navigate('/alumno', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (segundosBloqueo && segundosBloqueo > 0) return;

    // Reset errors & dismiss old motivo banner
    setMostrarMotivo(false);
    setErrorCredenciales(false);
    setErrorEmailInvalido(false);
    setErrorRed(false);

    // Validación cliente
    const cleanEmail = email.trim();
    if (!cleanEmail || !regexEmail.test(cleanEmail)) {
      setErrorEmailInvalido(true);
      emailInputRef.current?.focus();
      return;
    }

    if (!password) {
      setErrorCredenciales(true);
      passwordInputRef.current?.focus();
      return;
    }

    setCargando(true);

    try {
      const res = await authService.iniciarSesion(cleanEmail, password);

      if (res.ok) {
        redirigirPorRol(res.sesion.rol);
      } else {
        setCargando(false);
        if (res.motivo === 'bloqueado') {
          setSegundosBloqueo(res.segundosEspera || 60);
        } else if (res.motivo === 'red') {
          setErrorRed(true);
        } else {
          setErrorCredenciales(true);
          emailInputRef.current?.focus();
        }
      }
    } catch {
      setCargando(false);
      setErrorRed(true);
    }
  };

  return (
    <ModoProvider nivel="secundaria">
      <div className="tema-adultos min-h-screen w-full bg-bg text-text flex flex-col justify-between py-6 px-4 sm:px-6">
        <header className="max-w-md w-full mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-text hover:text-accent-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong rounded-md p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-strong flex items-center justify-center text-on-accent font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-text">
              Chasqui
            </span>
          </Link>

          {import.meta.env.DEV && (
            <Link
              to="/sistema/estados"
              className="text-xs font-semibold text-accent-strong hover:underline"
            >
              Cuentas de prueba →
            </Link>
          )}
        </header>

        <main className="w-full max-w-md mx-auto my-auto py-6">
          <div className="bg-surface border-2 border-divider rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text tracking-tight">
                Ingresá a tu cuenta
              </h1>
              <p className="text-sm text-text/70">
                Acceso para docentes, directivos, familias y estudiantes.
              </p>
            </div>

            {/* Banners por motivo de redirección (solo visibles antes de interactuar con el formulario) */}
            {mostrarMotivo && motivoParam === 'vencida' && (
              <div
                role="alert"
                className="p-3.5 bg-accent-100 border-2 border-accent-300 rounded-lg text-sm text-accent-900 flex items-start gap-2.5"
              >
                <Clock className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <span>Tu sesión expiró por inactividad. Ingresá nuevamente para continuar.</span>
              </div>
            )}

            {mostrarMotivo && motivoParam === 'sinpermiso' && (
              <div
                role="alert"
                className="p-3.5 bg-accent-100 border-2 border-accent-300 rounded-lg text-sm text-accent-900 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <span>No tenés permiso para ingresar a esa sección con esta cuenta.</span>
              </div>
            )}

            {mostrarMotivo && motivoParam === 'sinsesion' && !motivoParam.includes('sinpermiso') && (
              <div
                role="alert"
                className="p-3.5 bg-accent-100 border-2 border-divider rounded-lg text-sm text-text flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <span>Iniciá sesión para acceder a la plataforma.</span>
              </div>
            )}

            {/* Error de credenciales */}
            {errorCredenciales && (
              <div
                role="alert"
                className="p-3.5 bg-accent-100 border-2 border-accent-300 rounded-lg text-sm text-accent-900 flex items-start gap-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-bold">Error de ingreso:</strong> El mail o la contraseña no coinciden.
                </div>
              </div>
            )}

            {/* Error de formato de mail */}
            {errorEmailInvalido && (
              <div
                role="alert"
                className="p-3.5 bg-accent-100 border-2 border-accent-300 rounded-lg text-sm text-accent-900 flex items-start gap-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <span>Por favor, ingresá una dirección de correo electrónico válida.</span>
              </div>
            )}

            {/* Error de conexión / sin red */}
            {errorRed && (
              <div
                role="alert"
                className="p-3.5 bg-neutral-100 border-2 border-divider rounded-lg text-sm text-text flex flex-col gap-2.5 animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                  <span>No se pudo conectar con el servidor. Revisá tu conexión a internet.</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSubmit}
                  className="gap-1.5 self-start font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reintentar</span>
                </Button>
              </div>
            )}

            {/* Aviso de cuenta bloqueada con cuenta regresiva */}
            {segundosBloqueo !== null && segundosBloqueo > 0 && (
              <div
                role="alert"
                className="p-4 bg-accent-100 border-2 border-accent-strong rounded-lg text-sm text-accent-900 flex items-start gap-3 animate-fade-in"
              >
                <Clock className="w-5 h-5 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Demasiados intentos fallidos.</p>
                  <p className="mt-0.5">
                    Cuenta bloqueada temporalmente por seguridad. Podés reintentar en{' '}
                    <span className="font-mono font-extrabold text-accent-strong">
                      {formatearTiempo(segundosBloqueo)}
                    </span>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* Formulario de Login */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="input-email"
                  className="block text-sm font-heading font-bold text-text"
                >
                  Mail
                </label>
                <input
                  id="input-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (mostrarMotivo) setMostrarMotivo(false);
                  }}
                  disabled={cargando || Boolean(segundosBloqueo && segundosBloqueo > 0)}
                  placeholder="nombre@ejemplo.com"
                  className="w-full px-3.5 py-2.5 bg-surface text-text border-2 border-divider rounded-lg font-body text-sm transition-colors hover:border-text/60 focus:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:opacity-50 disabled:bg-neutral-100"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-password"
                    className="block text-sm font-heading font-bold text-text"
                  >
                    Contraseña
                  </label>
                  <Link
                    to="/recuperar"
                    className="text-xs font-semibold text-accent-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong rounded min-h-[44px] inline-flex items-center px-1"
                  >
                    Olvidé mi contraseña
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="input-password"
                    ref={passwordInputRef}
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (mostrarMotivo) setMostrarMotivo(false);
                    }}
                    disabled={cargando || Boolean(segundosBloqueo && segundosBloqueo > 0)}
                    placeholder="Tu contraseña"
                    className="w-full pl-3.5 pr-11 py-2.5 bg-surface text-text border-2 border-divider rounded-lg font-body text-sm transition-colors hover:border-text/60 focus:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:opacity-50 disabled:bg-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-text/60 hover:text-text rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong cursor-pointer"
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={cargando || Boolean(segundosBloqueo && segundosBloqueo > 0)}
                className="w-full font-extrabold text-sm gap-2"
              >
                <span>{cargando ? 'Ingresando…' : 'Ingresar'}</span>
                {!cargando && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </Button>
            </form>

            {/* Separador y bloque para alumnos de primaria */}
            <div className="pt-4 border-t-2 border-divider space-y-3">
              <div className="text-center">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-text/70">
                  ¿Sos alumno de primaria?
                </span>
              </div>

              <Link
                to="/alumno/ingreso"
                className="w-full p-3.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-divider rounded-xl flex items-center justify-between gap-3 text-text transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-accent-100 border border-divider flex items-center justify-center text-text shrink-0">
                    <GraduationCap className="w-5 h-5 text-accent-strong" aria-hidden="true" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-heading font-bold text-sm block leading-snug">
                      Entrar con el código de mi clase
                    </span>
                    <span className="text-xs text-text/60 block leading-snug mt-0.5">
                      Sin contraseña · Ingreso fácil con 6 letras
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-accent-strong group-hover:translate-x-1 transition-transform shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </main>

        <footer className="max-w-md w-full mx-auto text-center">
          <p className="text-xs text-text/70 leading-relaxed">
            Esta plataforma usa inteligencia artificial como apoyo. La calificación la decide siempre tu docente.
          </p>
        </footer>
      </div>
    </ModoProvider>
  );
};
