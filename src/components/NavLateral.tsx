import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Sparkles, LogOut } from 'lucide-react';
import { authService } from '@/services';
import { useSesion, ETIQUETA_ROL } from '@/lib/useSesion';

export interface NavItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface NavLateralProps {
  titulo?: string;
  subtitulo?: string;
  items: NavItem[];
  usuarioNombre?: string;
  usuarioRol?: string;
  escuela?: string;
  className?: string;
}

export const NavLateral: React.FC<NavLateralProps> = ({
  titulo = 'Chasqui',
  items,
  usuarioNombre: usuarioNombreProp,
  usuarioRol: usuarioRolProp,
  escuela: escuelaProp,
  className,
}) => {
  // Los datos de la persona salen de la sesión; las props solo sirven para forzarlos (por ejemplo en el laboratorio).
  const sesion = useSesion();
  const usuarioNombre = usuarioNombreProp ?? sesion?.nombreVisible ?? '';
  const usuarioRol = usuarioRolProp ?? (sesion ? ETIQUETA_ROL[sesion.rol] : '');
  const escuela = escuelaProp ?? sesion?.escuelaNombre ?? '';
  const location = useLocation();
  const navigate = useNavigate();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const currentPathWithHash = location.pathname + (location.hash || '');

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
    <aside
      className={cn(
        'w-64 bg-surface text-text border-r-2 border-divider p-5 flex flex-col justify-between h-full min-h-[500px]',
        className
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent-strong flex items-center justify-center text-on-accent font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-text">
            {titulo}
          </span>
        </div>

        <nav className="flex flex-col gap-1.5" aria-label="Navegación principal">
          {items.map((item) => {
            let isItemActive = false;
            if (item.to.includes('#')) {
              isItemActive = currentPathWithHash === item.to;
            } else if (item.to === '/docente' || item.to === '/alumno' || item.to === '/familia' || item.to === '/directivo' || item.to === '/') {
              isItemActive = location.pathname === item.to && (!location.hash || location.hash === '#');
            } else {
              isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/docente' || item.to === '/'}
                aria-current={isItemActive ? 'page' : undefined}
                className={cn(
                  'nav-item flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-md font-heading font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong',
                  isItemActive
                    ? 'nav-item-activo bg-text text-on-accent shadow-sm'
                    : 'text-text/80 hover:bg-neutral-200 hover:text-text'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-base flex items-center justify-center">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                      isItemActive
                        ? 'bg-accent-strong text-on-accent'
                        : 'bg-accent-strong text-on-accent'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t-2 border-divider flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              nombre={usuarioNombre}
              variant="accent-2"
              size="md"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-sm text-text truncate">
                {usuarioNombre}
              </span>
              <span className="text-xs text-text/60 truncate">{escuela}</span>
              <span className="text-xs uppercase tracking-wider text-accent-strong font-semibold">
                {usuarioRol}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostrarConfirmacion(true)}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 rounded-lg text-text/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {mostrarConfirmacion && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cerrar-sesion"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          >
            <div className="bg-surface rounded-2xl border-2 border-divider shadow-xl max-w-sm w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95">
              <h2 id="titulo-cerrar-sesion" className="text-base font-bold text-text">
                ¿Cerrar sesión?
              </h2>
              <p className="text-sm text-text/80">
                ¿Seguro que querés salir de tu cuenta? Tendrás que volver a ingresar para continuar.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(false)}
                  disabled={cerrando}
                  className="px-3.5 py-2 min-h-[44px] text-sm font-semibold rounded-xl border border-divider hover:bg-neutral-100 text-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  disabled={cerrando}
                  className="px-3.5 py-2 min-h-[44px] text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-60"
                >
                  {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

