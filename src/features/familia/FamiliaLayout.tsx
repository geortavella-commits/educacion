import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { ArrowLeft, Palette, LogOut } from 'lucide-react';
import { authService } from '@/services';

export const FamiliaLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const handleCerrarSesion = async () => {
    setCerrando(true);
    try {
      await authService.cerrarSesion();
      setMostrarConfirmacion(false);
      navigate('/ingresar');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <ModoProvider nivel="secundaria" className="tema-adultos">
      <div className="min-h-screen w-full max-w-full bg-bg text-text flex flex-col">
        <header className="border-b-2 border-divider px-4 md:px-6 py-3 bg-surface">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-heading font-extrabold text-lg text-accent-strong">
                Chasqui Familia
              </span>
              <span className="text-xs uppercase tracking-wider text-text/70 font-semibold px-2 py-0.5 bg-neutral-200">
                Acompañamiento
              </span>
            </div>
            <nav className="flex items-center gap-4 text-xs md:text-sm">
              <Link to="/" className="inline-flex items-center gap-1 text-accent-strong hover:underline font-bold min-h-[44px]">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Inicio</span>
              </Link>
              {import.meta.env.DEV && (
                <Link to="/sistema" className="inline-flex items-center gap-1 text-text/70 hover:text-accent-strong min-h-[44px]">
                  <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tokens</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(true)}
                className="inline-flex items-center gap-1 text-accent-strong hover:underline font-bold focus:outline-none min-h-[44px] px-2"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            </nav>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto min-w-0">
          <Outlet />
        </main>

        {mostrarConfirmacion && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cerrar-sesion-familia"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          >
            <div className="bg-surface rounded-2xl border-2 border-divider shadow-xl max-w-sm w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95">
              <h2 id="titulo-cerrar-sesion-familia" className="text-base font-bold text-text">
                ¿Cerrar sesión?
              </h2>
              <p className="text-sm text-text/80">
                ¿Seguro que querés salir de la cuenta de familia?
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(false)}
                  disabled={cerrando}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-divider hover:bg-neutral-100 text-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  disabled={cerrando}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-60"
                >
                  {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModoProvider>
  );
};

