import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ModoProvider } from '@/components/ModoProvider';
import { NavLateral, NavItem } from '@/components/NavLateral';
import { docenteService } from '@/services/docente';
import {
  Home,
  Users,
  FolderKanban,
  FileCheck,
  Palette,
  ArrowLeft,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

const traerConteos = () => docenteService.listarSolicitudesIngreso().catch(() => []).then((s) => ({ solicitudes: s.length }));

export const DocenteLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Aviso que pide una acción: pedidos de ingreso sin resolver.
  const [conteos, setConteos] = useState<{ solicitudes: number }>({ solicitudes: 0 });
  const location = useLocation();

  // Los números de la barra salen de los datos reales (se refrescan al cambiar de pantalla).
  useEffect(() => {
    let activo = true;
    traerConteos().then((c) => {
      if (activo) setConteos(c);
    });
    return () => {
      activo = false;
    };
  }, [location.pathname]);

  // Las pantallas avisan cuando cambian datos que se cuentan en la barra (por ejemplo, al resolver un pedido).
  useEffect(() => {
    const refrescar = () => traerConteos().then(setConteos);
    window.addEventListener('datos-docente-actualizados', refrescar);
    return () => window.removeEventListener('datos-docente-actualizados', refrescar);
  }, []);

  // Cerrar menú al navegar o al presionar Escape
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navItems: NavItem[] = [
    {
      to: '/docente',
      label: 'Inicio',
      icon: <Home className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/docente/alumnos',
      label: 'Alumnos',
      icon: <Users className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/docente/proyectos',
      label: 'Proyectos',
      icon: <FolderKanban className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/docente/ingresos',
      label: 'Pedidos de ingreso',
      icon: <GraduationCap className="w-4 h-4" aria-hidden="true" />,
      badge: conteos.solicitudes > 0 ? String(conteos.solicitudes) : undefined,
    },
    {
      to: '/docente/consentimientos',
      label: 'Familias y consentimientos',
      icon: <FileCheck className="w-4 h-4" aria-hidden="true" />,
    },
    // Herramienta de diseño: solo existe en desarrollo.
    ...(import.meta.env.DEV
      ? [{ to: '/sistema', label: 'Tokens / Diseño', icon: <Palette className="w-4 h-4" aria-hidden="true" /> }]
      : []),
  ];

  return (
    <ModoProvider nivel="secundaria" className="tema-adultos">
      <div className="min-h-screen w-full max-w-full bg-bg text-text flex flex-col lg:flex-row">
        {/* Barra Lateral fija en Desktop y Notebook (desde lg ≥ 1024px) */}
        <div className="hidden lg:block w-[240px] shrink-0 border-r-2 border-divider min-h-screen bg-surface sticky top-0 h-screen">
          <NavLateral
            titulo="Chasqui Docente"
            items={navItems}
            className="w-full h-full border-r-0"
          />
        </div>

        {/* Cabecera Móvil y Tablet (< lg) */}
        <header className="lg:hidden border-b-2 border-divider px-4 py-3 bg-surface flex items-center justify-between gap-2 min-w-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              aria-expanded={isMobileMenuOpen}
              className="p-2 border-2 border-divider rounded-md hover:bg-neutral-200 text-text cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <GraduationCap className="w-5 h-5 text-accent-strong shrink-0" aria-hidden="true" />
              <span className="font-heading font-extrabold text-base text-text truncate">
                Chasqui Docente
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong hover:underline min-h-[44px] px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Portal</span>
          </Link>
        </header>

        {/* Menú Desplegable Móvil / Tablet (< lg) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-start">
            <div className="bg-surface border-b-2 border-divider p-4 animate-fade-in space-y-3 max-h-[85vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-divider">
                <span className="font-heading font-bold text-sm text-text">Menú Docente</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-2 text-text/70 hover:text-text rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <NavLateral
                titulo="Chasqui Docente"
                items={navItems}
                className="w-full border-0 p-0 min-h-0"
              />
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Contenido Principal ocupando todo el ancho restante sin marco */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="hidden lg:flex items-center justify-end px-6 py-3.5 border-b-2 border-divider bg-surface">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-accent-strong hover:underline min-h-[44px] px-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Volver al Portal</span>
            </Link>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 w-full min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </ModoProvider>
  );
};

