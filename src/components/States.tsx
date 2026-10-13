import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Inbox, AlertTriangle } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 md:p-8 text-center bg-surface border border-divider rounded-lg flex flex-col items-center justify-center gap-3 my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-200 border border-divider flex items-center justify-center text-accent-strong mb-1">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h2 className="font-heading font-extrabold text-base md:text-lg text-text break-words">
        {title}
      </h2>
      <p className="text-xs md:text-sm text-text/70 max-w-md break-words">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocurrió un problema',
  message = 'No pudimos cargar la información en este momento. Por favor, probá de nuevo.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 md:p-6 text-center bg-accent-100/60 border-2 border-accent-300 rounded-lg flex flex-col items-center justify-center gap-3 my-4 text-accent-900',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-accent-200 flex items-center justify-center text-accent-strong font-bold">
        <AlertTriangle className="w-5 h-5 text-accent-strong" aria-hidden="true" />
      </div>
      <h2 className="font-heading font-extrabold text-base md:text-lg text-accent-strong break-words">
        {title}
      </h2>
      <p className="text-xs md:text-sm text-accent-900 max-w-md break-words">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="mt-2">
          Reintentar
        </Button>
      )}
    </div>
  );
};

export interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'avatar' | 'row';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count });

  const renderSkeleton = () => {
    switch (type) {
      case 'avatar':
        return <div className="w-10 h-10 rounded-full bg-neutral-300 animate-pulse shrink-0" />;
      case 'text':
        return (
          <div className="space-y-2 w-full animate-pulse">
            <div className="h-4 bg-neutral-300 rounded w-3/4" />
            <div className="h-3 bg-neutral-200 rounded w-1/2" />
          </div>
        );
      case 'row':
        return (
          <div className="flex items-center gap-4 p-3 bg-surface border border-divider rounded-md animate-pulse">
            <div className="w-8 h-8 rounded-full bg-neutral-300 shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 bg-neutral-300 rounded w-1/3" />
              <div className="h-2.5 bg-neutral-200 rounded w-1/4" />
            </div>
            <div className="w-12 h-4 bg-neutral-200 rounded shrink-0" />
          </div>
        );
      case 'card':
      default:
        return (
          <div className="p-5 bg-surface border border-divider rounded-md animate-pulse space-y-3">
            <div className="h-3 bg-accent-200 rounded w-1/4" />
            <div className="h-5 bg-neutral-300 rounded w-2/3" />
            <div className="h-3 bg-neutral-200 rounded w-full" />
            <div className="h-3 bg-neutral-200 rounded w-4/5" />
            <div className="h-8 bg-neutral-300 rounded w-1/3 mt-2" />
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {items.map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};
