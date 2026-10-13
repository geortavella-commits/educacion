import React from 'react';
import { cn } from '@/lib/utils';

export type TagVariant = 'accent' | 'accent-2' | 'neutral' | 'outline';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  interactive?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  variant = 'neutral',
  interactive = false,
  className,
  children,
  ...props
}) => {
  const variants: Record<TagVariant, string> = {
    accent: 'bg-accent-100 text-accent-900 border border-accent-200',
    'accent-2': 'bg-accent-2-100 text-accent-2-900 border border-accent-2-200',
    neutral: 'bg-neutral-200 text-neutral-900 border border-divider',
    outline: 'bg-transparent border border-accent text-accent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading font-semibold rounded-full select-none transition-colors',
        variants[variant],
        interactive && 'cursor-pointer hover:opacity-80 active:scale-95',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
