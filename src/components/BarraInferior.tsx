import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface BarraInferiorItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export interface BarraInferiorProps {
  items: BarraInferiorItem[];
  className?: string;
}

export const BarraInferior: React.FC<BarraInferiorProps> = ({
  items,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-surface border-t-2 border-divider px-3 py-2 flex items-center justify-around md:hidden shadow-lg',
        className
      )}
      aria-label="Navegación móvil del alumno"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-3 min-h-touch min-w-touch rounded-md font-heading transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong',
              isActive
                ? 'text-accent-strong font-extrabold scale-105'
                : 'text-text/70 hover:text-text'
            )
          }
        >
          <span className="text-xl leading-none flex items-center justify-center">{item.icon}</span>
          <span className="text-xs leading-tight font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
