import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { familiaService, type ResultadoCanje } from '@/services/familia';
import { useSesion } from '@/lib/useSesion';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

const MENSAJES: Record<Exclude<ResultadoCanje, { ok: true }>['motivo'], string> = {
  codigo_invalido: 'Ese código no corresponde a ninguna invitación. Revisalo con cuidado (son 8 letras o números).',
  codigo_vencido: 'Este código ya se usó o venció. Pedile una invitación nueva a la docente.',
  ya_vinculada: 'Tu cuenta ya está vinculada a este alumno.',
  cuenta_existente: 'Ya hay una cuenta con ese mail. Ingresá con tu cuenta y usá el código desde ahí.',
  bloqueado: 'Probaste muchas veces. Esperá un minuto y volvé a intentar.',
  datos: 'Revisá los datos: el mail tiene que ser válido y la contraseña de al menos 8 caracteres, con letras y números.',
  red: 'No pudimos conectarnos. Revisá tu internet y probá de nuevo.',
};

export const InvitacionFamilia: React.FC = () => {
  const navigate = useNavigate();
  const sesion = useSesion(); // undefined = cargando, null = sin cuenta abierta
  const [params] = useSearchParams();
  // Si llegó por el enlace que le mandó la docente (por ejemplo, por WhatsApp), el código ya viene cargado.
  const [codigoDelEnlace] = useState(() => (params.get('codigo') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8));
  const [codigo, setCodigo] = useState(codigoDelEnlace);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    document.title = 'Invitación de la escuela · Chasqui';
  }, []);

  // El código se usa una sola vez y no tiene por qué quedar en la barra de direcciones ni en el historial.
  useEffect(() => {
    if (codigoDelEnlace) navigate('/familia/invitacion', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const conCuenta = !!sesion;
  const codigoLimpio = codigo.replace(/[\s-]/g, '').toUpperCase();
  const faltaCodigo = !/^[A-Z0-9]{8}$/.test(codigoLimpio);
  const faltaNombre = !conCuenta && nombre.trim().length < 2;
  const faltaMail = !conCuenta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const faltaClave = !conCuenta && (password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntento(true);
    setMensaje('');
    if (faltaCodigo || faltaNombre || faltaMail || faltaClave) return;
    setEnviando(true);
    const r = await familiaService.canjearInvitacion({ codigo: codigoLimpio, nombre: nombre.trim(), email: email.trim(), password });
    setEnviando(false);
    if (r.ok) {
      navigate('/familia');
    } else {
      setMensaje(MENSAJES[r.motivo]);
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
            <div className="space-y-1">
              <h1 className="text-2xl font-heading font-extrabold">Invitación de la escuela</h1>
              <p className="text-sm text-text/75">
                {conCuenta
                  ? 'Escribí el código que te dio la docente para vincular a otro hijo, hija o alumno a tu cuenta.'
                  : 'Con el código que te dio la docente creás tu cuenta y quedás vinculado/a a tu hijo o hija. Después vas a poder autorizar el uso de Chasqui.'}
              </p>
            </div>

            {codigoDelEnlace.length === 8 && (
              <p role="status" className="p-3 bg-[#e5f8cf] border-2 border-[#58cc02]/50 rounded-2xl text-sm font-extrabold text-[#2b6c00]">
                ¡Listo! Ya cargamos tu código de invitación. Solo te falta completar tus datos.
              </p>
            )}

            <form onSubmit={enviar} noValidate className="space-y-4">
              <Input
                label="Código de invitación"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={12}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono tracking-[0.25em] uppercase"
                error={intento && faltaCodigo ? 'El código tiene 8 letras o números.' : undefined}
              />

              {!conCuenta && sesion !== undefined && (
                <>
                  <Input
                    label="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={30}
                    autoComplete="given-name"
                    hint="Con este nombre te va a ver la escuela."
                    error={intento && faltaNombre ? 'Escribí tu nombre.' : undefined}
                  />
                  <Input
                    label="Tu mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    error={intento && faltaMail ? 'Escribí un mail válido.' : undefined}
                  />
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        label="Elegí una contraseña"
                        type={verClave ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        hint="Al menos 8 caracteres, con letras y números."
                        error={intento && faltaClave ? 'Al menos 8 caracteres, con letras y números.' : undefined}
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
                  </div>
                </>
              )}

              {mensaje && (
                <p role="alert" className="p-3 bg-accent-100 border border-accent-300 text-sm font-semibold">
                  {mensaje}
                </p>
              )}

              <Button type="submit" variant="primary" fullWidth disabled={enviando || sesion === undefined}>
                {enviando ? 'Verificando…' : conCuenta ? 'Vincular' : 'Crear mi cuenta'}
              </Button>
            </form>

            {!conCuenta && sesion !== undefined && (
              <p className="text-sm text-text/75">
                ¿Ya tenés cuenta?{' '}
                <Link to="/ingresar" className="font-bold text-accent-strong hover:underline inline-flex items-center min-h-[44px]">
                  Ingresá primero
                </Link>{' '}
                y volvé a esta pantalla para vincular a otro hijo o hija.
              </p>
            )}
          </div>
        </main>
      </div>
    </ModoProvider>
  );
};
