'use client';

import { Zap, ArrowRight } from 'lucide-react';
import { PreviewProps, str, bool } from './types';

export function AnnouncementMessagePreview({ values }: PreviewProps) {
  const message = str(values.message, 'Текст сообщения в полоске объявлений');
  const cta = str(values.ctaText);
  const available = bool(values.available);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-2.5" style={{ background: '#1a1340' }}>
        <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: '#fb923c' }} />
        <span className="truncate font-mono text-xs font-semibold tracking-wide text-white/90">{message}</span>
        {cta && (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#fb923c' }}>
            {cta}
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
      {!available && (
        <p className="mt-2 text-center text-xs text-amber-300/80">Сейчас скрыто (available = выкл) — на сайте не показывается</p>
      )}
    </div>
  );
}
