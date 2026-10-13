import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Consentimiento } from './Consentimiento';
import { ArrowLeft } from 'lucide-react';

/** Pantalla de la familia para autorizar (o retirar) el uso de Chasqui de un hijo/a. */
export const ConsentimientoPage: React.FC = () => {
  const [params] = useSearchParams();
  return (
    <div className="space-y-4 w-full max-w-3xl min-w-0">
      <Link to="/familia" className="inline-flex items-center gap-1 text-sm font-bold text-accent-strong hover:underline min-h-[44px]">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Volver al resumen</span>
      </Link>
      <Consentimiento alumnoId={params.get('hijo') ?? undefined} />
    </div>
  );
};
