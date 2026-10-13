import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';

export interface ChatBubbleProps {
  emisor: 'alumno' | 'tutor';
  nombre?: string;
  contenido: React.ReactNode;
  hora?: string;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  emisor,
  nombre,
  contenido,
  hora,
  className,
}) => {
  const isTutor = emisor === 'tutor';

  return (
    <div
      className={cn(
        'flex gap-3 w-full my-2',
        isTutor ? 'justify-start' : 'justify-end',
        className
      )}
    >
      {isTutor && (
        <div className="shrink-0">
          <Avatar
            nombre="Chasqui"
            iniciales="CH"
            variant="accent"
            size="md"
          />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] md:max-w-[75%] p-4 rounded-2xl flex flex-col gap-1.5 shadow-xs text-left font-nunito',
          isTutor
            ? 'bg-white text-[#1b1c1c] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] rounded-tl-xs'
            : 'bg-[#ddf4ff] text-[#004666] border-2 border-[#88ceff] border-b-4 border-b-[#5eb8f5] rounded-tr-xs'
        )}
      >
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className={cn('font-black text-xs tracking-wide', isTutor ? 'text-[#006590]' : 'text-[#004666]')}>
            {isTutor ? 'Chasqui (Tutor)' : nombre || 'Alumno'}
          </span>
          {hora && <span className="text-xs text-slate-500 font-bold">{hora}</span>}
        </div>

        <div className="text-base font-bold leading-relaxed whitespace-pre-wrap">
          {contenido}
        </div>
      </div>

      {!isTutor && (
        <div className="shrink-0">
          <Avatar
            nombre={nombre || 'Alumno'}
            variant="neutral"
            size="md"
          />
        </div>
      )}
    </div>
  );
};
