import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  sublabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label = 'Avance de misiones',
  showPercent = true,
  sublabel,
  className,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)} {...props}>
      <div className="flex items-center justify-between text-xs font-heading font-semibold text-text/80">
        <span>{label}</span>
        {showPercent && <span className="font-mono">{clampedValue}%</span>}
      </div>

      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border-2 border-slate-200 shadow-xs"
      >
        <div
          className="progress-duo-bar h-full bg-duo-green rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {sublabel && <span className="text-xs text-text/60">{sublabel}</span>}
    </div>
  );
};
