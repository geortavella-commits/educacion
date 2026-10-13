import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'btn-ui btn-ui-' + variant + ' inline-flex items-center justify-center font-heading font-bold text-center select-none transition-colors border cursor-pointer min-h-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 ' +
      'disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-700 disabled:border-divider disabled:shadow-none';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-accent-strong text-on-accent border-transparent hover:bg-accent-700 active:bg-accent-800 shadow-sm',
      secondary:
        'bg-surface text-text border-divider hover:bg-neutral-200 active:bg-neutral-300 shadow-sm',
      ghost:
        'bg-transparent text-accent-strong border-transparent hover:bg-accent-100 active:bg-accent-200',
      icon:
        'bg-transparent text-text border-divider hover:bg-surface active:bg-neutral-200 p-2 min-w-touch min-h-touch',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3.5 py-2 text-xs rounded-sm min-h-btn',
      md: 'px-4 py-2.5 text-sm rounded-md min-h-btn',
      lg: 'px-6 py-3.5 text-base rounded-lg min-h-btn',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          variant !== 'icon' && sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-current" aria-hidden="true" />
            <span>Cargando...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
