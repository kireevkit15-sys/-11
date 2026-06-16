'use client';

import { ChevronDown } from 'lucide-react';
import { PreviewProps, str } from './types';

const BRAND = '#4F46E5';

export function FaqPreview({ values }: PreviewProps) {
  const question = str(values.question, 'Сколько стоит обслуживание?');
  const answer = str(
    values.answer,
    'Зависит от системы налогообложения: АУСН — 5 900 ₽/мес, УСН — 7 900 ₽/мес, ОСН — 8 900 ₽/мес. Скрытых надбавок нет, состав работ открыт и фиксируется в договоре.',
  );
  const category = str(values.category, 'Цены и оплата');
  const sortOrder = str(values.sortOrder, '01');
  const num = sortOrder.padStart(2, '0');

  return (
    <div className="mx-auto w-full max-w-[480px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(10,6,20,0.99)',
          boxShadow: `0 0 0 1px ${BRAND}40, 0 0 28px ${BRAND}20`,
          borderBottom: `1px solid ${BRAND}73`,
        }}
      >
        {/* Q-row */}
        <div className="flex flex-col gap-3 px-5 pt-5">
          {/* category badge + order */}
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
              style={{ background: `${BRAND}26`, color: '#A5B4FC', boxShadow: `0 0 0 1px ${BRAND}59` }}
            >
              {category}
            </span>
            <span className="ml-auto font-mono text-[10px] font-bold tracking-[0.22em] text-white/35">{num}</span>
          </div>

          {/* question + chevron */}
          <div className="flex items-start gap-3 pb-5">
            <span
              className="flex-1 text-[18px] font-extrabold leading-tight tracking-tight text-white"
              style={{ textShadow: `0 0 18px ${BRAND}4d` }}
            >
              {question}
            </span>
            <span className="shrink-0 pt-1" style={{ color: '#A5B4FC' }}>
              <ChevronDown className="h-5 w-5" style={{ transform: 'rotate(180deg)' }} />
            </span>
          </div>
        </div>

        {/* answer (expanded) */}
        <div className="px-5 pb-6" style={{ borderTop: `1px solid ${BRAND}26` }}>
          <p className="pt-4 text-[14px] leading-[1.65] text-white/70">{answer}</p>
        </div>

        {/* accent bar */}
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${BRAND}, #FB923C, ${BRAND})` }} />
      </div>
    </div>
  );
}
