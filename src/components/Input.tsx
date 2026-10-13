import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-heading font-semibold text-text/80 select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full min-h-[var(--btn-min-height)] px-3 py-2 bg-surface text-text border border-divider rounded-md font-body text-sm placeholder:text-text/40 transition-colors',
            'hover:border-text/60 focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-accent-strong text-text focus:ring-accent',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-accent-strong font-medium">{error}</span>}
        {hint && !error && <span className="text-xs text-text/60">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-heading font-semibold text-text/80 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 bg-surface text-text border border-divider rounded-md font-body text-sm placeholder:text-text/40 transition-colors resize-y min-h-[80px]',
            'hover:border-text/60 focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-accent-strong text-text focus:ring-accent',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-accent-strong font-medium">{error}</span>}
        {hint && !error && <span className="text-xs text-text/60">{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
