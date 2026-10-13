import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authService } from '@/services/auth';
import { Sparkles, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

type Fase = 'verificando' | 'listo' | 'enlace_invalido' | 'hecho';

export const Restablecer: React.FC = () => {
  const navigate = useNavigate();
  const [fase, setFase] = useState<Fase>('verificando');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    document.title = 'Nueva contraseña · Chasqui';
    let activo = true;
    authService.esperarRecuperacion().then((valido) => {
      if (activo) setFase(valido ? 'listo' : 'enlace_invalido');
    });
    return () => {
      activo = false;
    };
  }, []);

  const corta = nueva.length < 8 || !/\p{L}/u.test(nueva) || !/\d/.test(nueva);
  const distintas = nueva !== repetida;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntento(true);
    setMensaje('');
    if (corta || distintas) return;
    setEnviando(true);
    const r = await authService.cambiarContrasena(nueva);
    setEnviando(false);
    if (r.ok) {
      setFase('hecho');
    } else if (r.motivo === 'sin_sesion') {
      setFase('enlace_invalido');
    } else if (r.motivo === 'red') {
      setMensaje('No pudimos conectarnos. Revisá tu internet y probá de nuevo.');
    } else {
      setMensaje('Esa contraseña no se pudo usar. Probá con una más larga (al menos 8 caracteres).');
    }
  };

  return (
    <ModoProvider nivel="secundaria">
      <div className="tema-adultos min-h-screen w-full bg-bg text-text flex flex-col">
        <header className="px-4 sm:px-6 py-4 max-w-md w-full mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 min-h-[44px] font-heading font-extrabold text-xl">
            <span className="w-9 h-9 bg-accent-strong text-on-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>Chasqui</span>
          </Link>
        </header>

        <main className="flex-1 px-4 sm:px-6 pb-10 w-full max-w-md mx-auto min-w-0">
          <div className="p-5 sm:p-6 bg-surface border-2 border-divider rounded-xl space-y-5">
            {fase === 'verificando' && (
              <p role="status" className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Verificando tu enlace…</span>
              </p>
            )}

            {fase === 'enlace_invalido' && (
              <div className="space-y-3">
                <h1 className="text-2xl font-heading font-extrabold">Este enlace ya no sirve</h1>
                <p className="text-sm text-text/80">El enlace venció o ya se usó. Pedí uno nuevo y revisá también la carpeta de spam.</p>
                <Link to="/recuperar" className="inline-flex items-center min-h-[44px] px-4 bg-accent-strong text-on-accent font-heading font-bold text-sm">
                  Pedir un enlace nuevo
                </Link>
              </div>
            )}

            {fase === 'listo' && (
              <>
                <div className="space-y-1">
                  <h1 className="text-2xl font-heading font-extrabold">Creá tu contraseña nueva</h1>
                  <p className="text-sm text-text/75">Elegí una que no uses en otros lugares. Al terminar, vas a ingresar con ella.</p>
                </div>
                <form onSubmit={guardar} noValidate className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Contraseña nueva"
                      type={verClave ? 'text' : 'password'}
                      value={nueva}
                      onChange={(e) => setNueva(e.target.value)}
                      autoComplete="new-password"
                      hint="Al menos 8 caracteres, con letras y números."
                      error={intento && corta ? 'Al menos 8 caracteres, con letras y números.' : undefined}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setVerClave((v) => !v)}
                      aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={verClave}
                      className="absolute right-1 top-[1.65rem] w-11 h-11 flex items-center justify-center text-text/70 hover:text-text"
                    >
                      {verClave ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  <Input
                    label="Repetí la contraseña"
                    type={verClave ? 'text' : 'password'}
                    value={repetida}
                    onChange={(e) => setRepetida(e.target.value)}
                    autoComplete="new-password"
                    error={intento && !corta && distintas ? 'Las dos contraseñas tienen que ser iguales.' : undefined}
                  />
                  {mensaje && (
                    <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
                      {mensaje}
                    </p>
                  )}
                  <Button type="submit" variant="primary" fullWidth disabled={enviando}>
                    {enviando ? 'Guardando…' : 'Guardar contraseña'}
                  </Button>
                </form>
              </>
            )}

            {fase === 'hecho' && (
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-accent-strong font-heading font-extrabold text-lg">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  <span>¡Listo! Cambiaste tu contraseña.</span>
                </p>
                <Button variant="primary" fullWidth onClick={() => navigate('/ingresar')}>
                  Ir a ingresar
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ModoProvider>
  );
};
