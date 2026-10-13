import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService, RolUsuario, Sesion } from '@/services/auth';
import { LoadingSkeleton } from './States';

export interface RutaProtegidaProps {
  roles?: RolUsuario[];
  children?: React.ReactNode;
}

export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ roles, children }) => {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const cancelar = authService.suscribirseASesion((s) => {
      setSesion(s);
      setLoading(false);
    });
    return cancelar;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-6 flex flex-col justify-center max-w-lg mx-auto space-y-4">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="row" count={2} />
      </div>
    );
  }

  if (!sesion) {
    return <Navigate to="/ingresar?motivo=sinsesion" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(sesion.rol)) {
    return <Navigate to="/ingresar?motivo=sinpermiso" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const RutaDevOnly: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (!import.meta.env.DEV) {
    return <Navigate to="/ingresar" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};
