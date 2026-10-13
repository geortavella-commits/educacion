import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  nombre?: string;
  iniciales?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'accent' | 'accent-2' | 'neutral';
}

export const Avatar: React.FC<AvatarProps> = ({
  nombre,
  iniciales,
  size = 'md',
  variant = 'neutral',
  className,
  ...props
}) => {
  const getInitials = () => {
    if (iniciales) return iniciales.toUpperCase();
    if (!nombre) return '?';
    const parts = nombre.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const variantStyles = {
    accent: 'bg-accent-strong text-on-accent border-transparent',
    'accent-2': 'bg-accent-2-600 text-on-accent border-transparent',
    neutral: 'bg-neutral-300 text-neutral-900 border-divider',
  };

  return (
    <div
      className={cn(
        'inline-grid place-items-center rounded-full font-heading font-extrabold select-none border shrink-0',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      aria-label={nombre || 'Avatar de usuario'}
      title={nombre}
      {...props}
    >
      <span>{getInitials()}</span>
    </div>
  );
};
