import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  kicker?: string;
  title?: React.ReactNode;
  meta?: React.ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  kicker,
  title,
  meta,
  elevation = 'none',
  interactive = false,
  children,
  className,
  ...props
}) => {
  const elevationStyles = {
    none: 'border border-divider',
    sm: 'border border-divider shadow-sm',
    md: 'border border-divider shadow-md',
    lg: 'border border-divider shadow-lg',
  };

  return (
    <div
      className={cn(
        'bg-surface text-text p-4 md:p-6 rounded-md flex flex-col gap-3 transition-all',
        elevationStyles[elevation],
        interactive && 'cursor-pointer hover:border-accent hover:shadow-md',
        className
      )}
      {...props}
    >
      {(kicker || meta) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {kicker && (
            <span className="font-heading font-extrabold uppercase tracking-wider text-accent-strong text-xs">
              {kicker}
            </span>
          )}
          {meta && <div className="text-text/60 ml-auto">{meta}</div>}
        </div>
      )}

      {title && (
        <h3 className="font-heading font-bold text-lg leading-tight text-text">
          {title}
        </h3>
      )}

      {children && <div className="text-sm text-text/80 flex-1">{children}</div>}
    </div>
  );
};
