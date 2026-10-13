import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  className,
}: TableProps<T>) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('w-full max-w-full overflow-x-auto min-w-0 border border-divider rounded-md bg-surface', className)}>
      <table className="w-full text-sm text-text border-collapse">
        <thead className="border-b-2 border-divider bg-neutral-200/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-heading font-extrabold uppercase tracking-wider text-text/70',
                  alignClass[col.align || 'left'],
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text/60 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item, idx)}
                className="hover:bg-neutral-100/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      alignClass[col.align || 'left'],
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item, idx)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
