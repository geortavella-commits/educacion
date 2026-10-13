import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Poner foco en el diálogo o su primer elemento focable
      setTimeout(() => {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          dialogRef.current?.focus();
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        // Focus trap
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'w-full max-w-lg bg-surface text-text border-2 border-divider rounded-lg shadow-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto focus:outline-none',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-divider pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="text-xl font-heading font-extrabold text-text break-words">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-text/70 mt-1 break-words">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text/70 hover:text-accent-strong p-1 rounded-md transition-colors min-w-touch min-h-touch flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
            aria-label="Cerrar ventana emergente"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="text-sm text-text/85 py-2 break-words">{children}</div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-divider mt-auto flex-wrap">
          {actions || (
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
