'use client';

import { Fragment } from 'react';
import { PreviewProps, str, list } from './types';

function renderHeadline(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <Fragment key={li}>
        {parts.map((part, pi) =>
          part.startsWith('*') && part.endsWith('*') ? (
            <span key={pi} className="italic" style={{ color: '#a78bfa' }}>{part.slice(1, -1)}</span>
          ) : (
            <Fragment key={pi}>{part}</Fragment>
          ),
        )}
        {li < lines.length - 1 && <br />}
      </Fragment>
    );
  });
}

export function HeroPreview({ values }: PreviewProps) {
  const headline = str(values.headline, 'Заголовок hero');
  const subheadline = str(values.subheadline);
  const ctaText = str(values.ctaText, 'Кнопка');
  const badges = list(values.badges);
  const statNumber = str(values.statNumber);
  const statLabel = str(values.statLabel);

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-4 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Бухгалтерия · ФСИ</span>
      </span>

      <h1 className="text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl">
        {renderHeadline(headline)}
      </h1>

      {subheadline && (
        <p className="max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-white/85">
          {subheadline}
        </p>
      )}

      <span className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg" style={{ background: '#4F46E5', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>
        {ctaText}
      </span>

      {(badges.length > 0 || statNumber) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {badges.map((b) => (
            <span key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">{b}</span>
          ))}
          {statNumber && (
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <span className="font-mono font-semibold" style={{ color: '#a78bfa' }}>{statNumber}</span>
              {statLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
