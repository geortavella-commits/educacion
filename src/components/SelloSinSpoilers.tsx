import React from 'react';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

export interface SelloSinSpoilersProps {
  variant?: 'card' | 'badge' | 'banner';
  className?: string;
}

export const SelloSinSpoilers: React.FC<SelloSinSpoilersProps> = ({
  variant = 'card',
  className,
}) => {
  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 bg-accent-100 text-accent-strong border border-accent-300 rounded-full text-xs font-heading font-extrabold select-none',
          className
        )}
      >
        <Lightbulb className="w-3.5 h-3.5 text-accent-strong shrink-0" aria-hidden="true" />
        <span>Sin spoilers</span>
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'w-full p-3 bg-accent-strong text-on-accent rounded-md flex items-center justify-between gap-3 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Lightbulb className="w-5 h-5 text-on-accent shrink-0" aria-hidden="true" />
          <div className="text-xs font-medium min-w-0">
            <strong className="font-heading font-extrabold block text-sm">
              Sin spoilers pedagógico
            </strong>
            Chasqui guía con preguntas para que pienses el camino por vos mismo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 bg-accent-100/70 border-2 border-accent-300 rounded-lg flex items-start gap-3 shadow-sm text-accent-900',
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-accent-200 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 text-accent-strong" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-accent-strong">
          Compromiso pedagógico
        </span>
        <p className="text-sm font-medium leading-snug break-words">
          <strong>Sin spoilers:</strong> te ayuda a pensar sin darte la respuesta servida.
        </p>
      </div>
    </div>
  );
};
