import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { NivelEducativo } from '@/lib/types';
import { ArrowLeft, Palette, LogOut } from 'lucide-react';
import { authService } from '@/services';

export const AlumnoLayout: React.FC = () => {
  const navigate = useNavigate();
  const [nivel, setNivel] = useState<NivelEducativo>('primaria');
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
    <ModoProvider nivel={nivel}>
      <div className="tema-alumno min-h-screen w-full max-w-full bg-[#fbf9f8] text-[#1b1c1c] font-nunito flex flex-col justify-between transition-colors duration-200">
        {/* Cabecera estilo Duolingo / Stitch */}
        <header className="bg-white border-b-2 border-[#e5e5e5] sticky top-0 z-30 shadow-xs" data-purpose="site-navigation">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo y selector de nivel */}
            <div className="flex items-center gap-6 min-w-0">
              <Link to="/alumno" className="flex items-center gap-2.5 group shrink-0" aria-label="Chasqui Alumno, ir al inicio">
                <div className="w-11 h-11 rounded-2xl bg-duo-green flex items-center justify-center text-white text-2xl shadow-sm border-b-4 border-duo-green-dark">
                  🦉
                </div>
                <div className="leading-none">
                  <span className="block text-2xl font-black tracking-tight text-[#2b6c00] group-hover:opacity-90">
                    Chasqui
                  </span>
                  <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                    ALUMNO
                  </span>
                </div>
              </Link>

              {/* Selector de nivel escolar (Primaria / Secundaria) */}
              {import.meta.env.DEV && (
                <div className="hidden sm:flex items-center bg-slate-100 p-1.5 rounded-2xl border-2 border-[#e5e5e5] shrink-0">
                  <button
                    type="button"
                    onClick={() => setNivel('primaria')}
                    className={`btn-3d font-extrabold px-4 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                      nivel === 'primaria'
                        ? 'btn-3d-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span>🎒</span> Primaria (Suave)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNivel('secundaria')}
                    className={`btn-3d font-extrabold px-4 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                      nivel === 'secundaria'
                        ? 'btn-3d-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Secundaria
                  </button>
                </div>
              )}
            </div>

            {/* Accesos rápidos y Salida */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <Link
                to="/"
                className="hidden md:inline-flex items-center gap-1 text-sm font-extrabold text-slate-600 hover:text-slate-900 transition min-h-[48px] px-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Portal</span>
              </Link>

              {import.meta.env.DEV && (
                <Link
                  to="/sistema"
                  className="hidden md:inline-flex items-center gap-1 text-sm font-extrabold text-slate-600 hover:text-slate-900 transition min-h-[48px] px-2"
                >
                  <Palette className="w-4 h-4" aria-hidden="true" />
                  <span>Tokens</span>
                </Link>
              )}

              <div className="h-6 w-0.5 bg-[#e5e5e5] hidden md:block" />

              <button
                type="button"
                onClick={() => setMostrarConfirmacion(true)}
                className="inline-flex items-center gap-1.5 text-sm font-black text-slate-600 hover:text-slate-900 transition cursor-pointer min-h-[48px] px-2"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido principal delimitado a máx 1080px en compu */}
        <main className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
          <Outlet />
        </main>

        {/* Footer amigable */}
        <footer className="border-t-2 border-[#e5e5e5] bg-white py-5 px-4 text-xs font-extrabold text-slate-500 mt-10" data-purpose="page-footer">
          <div className="max-w-[1080px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-lg">💡</span>
              <span>¡Cada misión completada ayuda a pensar y aprender con tu grupo en Chasqui!</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-slate-500">Escuela Ficticia · Córdoba</span>
            </div>
          </div>
        </footer>

        {/* Modal de confirmación al salir */}
        {mostrarConfirmacion && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cerrar-sesion-alumno"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in"
          >
            <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] border-b-8 shadow-2xl max-w-sm w-full p-6 space-y-4 text-left animate-scale-up">
              <h2 id="titulo-cerrar-sesion-alumno" className="text-xl font-black text-slate-800">
                ¿Cerrar sesión?
              </h2>
              <p className="text-sm font-bold text-slate-600">
                ¿Seguro que querés salir de tu cuenta de alumno?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(false)}
                  disabled={cerrando}
                  className="btn-3d-outline px-5 py-2.5 text-sm font-black min-h-[44px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  disabled={cerrando}
                  className="btn-3d px-5 py-2.5 text-sm font-black rounded-2xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white shadow-sm transition disabled:opacity-60 min-h-[44px] cursor-pointer"
                >
                  {cerrando ? 'Saliendo…' : 'Salir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModoProvider>
  );
};

