'use client';

import { ShieldCheck } from 'lucide-react';
import { PreviewProps, str, num } from './types';

export function TrustPillarPreview({ values }: PreviewProps) {
  const number = str(values.number, '01');
  const title = str(values.title, 'Заголовок столпа доверия');
  const content = str(
    values.content,
    'Краткое описание принципа работы появится здесь. Расскажите, чем вы отличаетесь от других.'
  );
  const quote = str(values.quote);
  const hue = num(values.hue, 250);

  const accent = `hsl(${hue}, 70%, 60%)`;
  const accentDim = `hsl(${hue}, 70%, 55%)`;

  return (
    <div className="mx-auto w-full max-w-[360px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="relative flex h-full flex-col overflow-hidden p-7"
        style={{
          borderRadius: 20,
          border: `1px solid ${accent}40`,
          background: `radial-gradient(ellipse 100% 80% at 30% 10%, ${accentDim}24, transparent 65%), radial-gradient(ellipse 80% 60% at 75% 90%, ${accent}14, transparent 65%), rgba(10,6,20,0.99)`,
          boxShadow: `0 0 0 1px ${accent}30, 0 8px 40px ${accent}25`,
        }}
      >
        {/* Контурная крупная цифра */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-4 select-none text-[160px] font-black leading-none tracking-[-0.06em] text-transparent"
          style={{ WebkitTextStroke: `1.5px ${accent}30` }}
        >
          {number}
        </span>

        <div className="relative z-10 flex h-full flex-col">
          {/* Иконка + номер */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                border: `1px solid ${accent}45`,
                background: `${accent}15`,
                color: accent,
                boxShadow: `0 0 20px ${accent}40`,
              }}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: '#fb923c' }}
            >
              {number}
            </span>
          </div>

          {/* Заголовок */}
          <h4
            className="text-[26px] font-extrabold leading-tight tracking-tight text-white"
            style={{ textShadow: `0 0 24px ${accent}35` }}
          >
            {title}
          </h4>

          {/* Текст */}
          <p
            className="mt-3 text-[14px] leading-relaxed text-white/80"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {content}
          </p>

          {/* Опциональная цитата */}
          {quote && (
            <blockquote
              className="mt-auto pl-3.5 pt-4"
              style={{ borderLeft: '2px solid #fb923c' }}
            >
              <p className="text-base italic leading-snug text-white/90">«{quote}»</p>
            </blockquote>
          )}
        </div>
      </div>
    </div>
  );
}
