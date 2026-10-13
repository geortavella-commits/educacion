import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;
    const labelString = typeof label === 'string' ? label : undefined;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'inline-flex items-start gap-3 cursor-pointer select-none group min-h-[var(--touch-target-min)]',
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            aria-label={labelString || props['aria-label']}
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 rounded-full border-2 border-divider bg-surface peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 transition-all flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-bg opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text group-hover:text-accent transition-colors">
            {label}
          </span>
          {description && (
            <span className="text-xs text-text/60">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export interface SegmentOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  name = 'segmented-control',
  className,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Opciones"
      className={cn(
        'inline-flex flex-wrap p-1 bg-surface border border-divider rounded-md gap-1 min-h-[var(--btn-min-height)] max-w-full',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const optId = `${name}-${option.value}`;
        const labelText = typeof option.label === 'string' ? option.label : option.value;
        return (
          <label
            key={option.value}
            htmlFor={optId}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-heading font-bold cursor-pointer rounded-sm select-none transition-all',
              isSelected
                ? 'bg-accent-strong text-on-accent shadow-sm'
                : 'text-text/70 hover:text-text hover:bg-neutral-200/50'
            )}
          >
            <input
              id={optId}
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              aria-label={labelText}
              className="sr-only"
            />
            {option.icon && <span className="text-sm" aria-hidden="true">{option.icon}</span>}
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};
