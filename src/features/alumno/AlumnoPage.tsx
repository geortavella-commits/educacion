import React, { useEffect, useState } from 'react';
import { Usuario } from '@/lib/types';
import { usuarioService } from '@/services/usuarioService';
import { useModo } from '@/components/ModoProvider';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { IngresoCodigo } from './IngresoCodigo';
import { KeyRound, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

export const AlumnoPage: React.FC = () => {
  const { nivel } = useModo();
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarIngreso, setMostrarIngreso] = useState(false);

  useEffect(() => {
    usuarioService.obtenerUsuariosPorRol('alumno').then((data) => {
      setAlumnos(data);
      setLoading(false);
    });
  }, []);

  if (mostrarIngreso) {
    return (
      <div className="py-4 w-full max-w-full min-w-0">
        <div className="mb-4 text-center">
          <button
            onClick={() => setMostrarIngreso(false)}
            className="text-xs text-accent-strong font-bold hover:underline cursor-pointer"
          >
            ← Volver al aula de Mateo
          </button>
        </div>
        <IngresoCodigo onSuccess={() => setMostrarIngreso(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text break-words">
          ¡Hola, Mateo!
        </h1>
        <p className="text-text/75 text-base md:text-lg mt-1 break-words">
          {nivel === 'primaria'
            ? '¿Listo para explorar las misiones de hoy con Chasqui?'
            : 'Tus misiones activas.'}
        </p>
      </div>

      <div className="p-4 md:p-6 bg-surface border border-divider rounded-lg shadow-sm w-full max-w-full min-w-0">
        <ProgressBar
          value={65}
          label="Avance de misiones"
          sublabel="Fase 1: Ciencias Naturales y Geometría"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setMostrarIngreso(true)}
          className="w-full gap-2 text-sm md:text-base py-3"
        >
          <KeyRound className="w-5 h-5" aria-hidden="true" />
          <span>Ingresar con nuevo código / QR</span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full gap-2 text-sm md:text-base py-3"
        >
          <BookOpen className="w-5 h-5" aria-hidden="true" />
          <span>Ver cuaderno de notas</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs text-text/60">Cargando compañeros...</div>
      ) : (
        <div className="p-4 bg-surface border border-divider rounded-md w-full min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-strong" aria-hidden="true" />
            <h3 className="text-xs font-heading font-bold text-text/70 uppercase tracking-wider">
              Compañeros de grupo
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alumnos.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-divider text-text text-xs md:text-sm rounded-full font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-strong" aria-hidden="true" />
                {a.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
