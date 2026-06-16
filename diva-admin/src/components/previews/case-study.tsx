'use client';

import { Quote, TrendingUp, CalendarRange } from 'lucide-react';
import { PreviewProps, str, num, bool, list } from './types';

const BRAND = '#fb923c';

export function CaseStudyPreview({ values }: PreviewProps) {
  const title = str(values.title);
  const clientName = str(values.clientName);
  const heading = title || clientName || 'Название кейса';
  const clientLogoUrl = str(values.clientLogoUrl);
  const tags = list(values.tags);
  const task = str(values.task, 'Задача клиента появится здесь.');
  const solution = str(values.solution);
  const result = str(values.result, 'Результат');
  const quote = str(values.quote);
  const quoteAuthor = str(values.quoteAuthor);
  const period = str(values.period);
  const sortOrder = num(values.sortOrder, 0);

  const initials =
    clientName.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'Д';

  return (
    <div className="mx-auto w-full max-w-[340px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="rounded-2xl p-[1.5px]"
        style={{
          background: `linear-gradient(135deg, ${BRAND}, rgba(124,58,237,0.6), rgba(10,6,20,0.9))`,
          boxShadow: `0 0 24px ${BRAND}26`,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden rounded-[13px]"
          style={{ background: 'rgba(10,6,20,0.99)' }}
        >
          {/* TOP ZONE — tags + client + title */}
          <div
            className="relative flex flex-col gap-3 px-5 pt-5 pb-4"
            style={{
              background: 'linear-gradient(160deg, rgba(124,58,237,0.16) 0%, rgba(10,6,20,0.6) 100%)',
              borderBottom: '1px solid rgba(251,146,60,0.16)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-8 right-8 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${BRAND}90 50%, transparent)` }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="relative z-10 flex flex-wrap gap-1.5">
                {tags.slice(0, 4).map((tag, i) => (
                  <span
                    key={tag + i}
                    className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(124,58,237,0.2)',
                      color: 'rgb(196,181,253)',
                      boxShadow: '0 0 0 1px rgba(167,139,250,0.35)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Client row */}
            <div className="relative z-10 flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-extrabold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.45), rgba(124,58,237,0.85))',
                  boxShadow: '0 0 0 1px rgba(167,139,250,0.35)',
                }}
              >
                {clientLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clientLogoUrl} alt={clientName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-extrabold leading-tight tracking-tight text-white">
                  {heading}
                </h3>
                {clientName && title && (
                  <p className="mt-0.5 truncate font-mono text-[10px] tracking-wide text-white/40">
                    {clientName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ZONE — task + result + quote */}
          <div className="flex flex-col gap-3 p-5">
            {/* Task */}
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-white/35">Задача</p>
              <p
                className="text-[12px] leading-[1.6] text-white/55"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {task}
              </p>
            </div>

            {/* Result — крупно, бренд-цвет */}
            <div
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: `${BRAND}12`, boxShadow: `0 0 0 1px ${BRAND}30` }}
            >
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
              <div className="min-w-0">
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest" style={{ color: `${BRAND}aa` }}>
                  Результат
                </p>
                <p
                  className="text-[17px] font-extrabold leading-tight tracking-tight"
                  style={{ color: BRAND, textShadow: `0 0 18px ${BRAND}40` }}
                >
                  {result}
                </p>
              </div>
            </div>

            {/* Quote */}
            {quote && (
              <div className="flex gap-2 pt-1">
                <Quote className="h-3.5 w-3.5 shrink-0 text-white/25" />
                <div className="min-w-0">
                  <p
                    className="text-[11px] italic leading-[1.6] text-white/60"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {quote}
                  </p>
                  {quoteAuthor && (
                    <p className="mt-1 font-mono text-[9px] tracking-wide text-white/35">— {quoteAuthor}</p>
                  )}
                </div>
              </div>
            )}

            {/* Footer — период + sortOrder */}
            {(period || solution) && (
              <div
                className="flex items-center gap-2 pt-3"
                style={{ borderTop: `1px solid ${BRAND}15` }}
              >
                {period && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/40">
                    <CalendarRange className="h-3 w-3" style={{ color: `${BRAND}aa` }} />
                    {period}
                  </span>
                )}
                <span className="ml-auto font-mono text-[9px] text-white/20">#{sortOrder}</span>
              </div>
            )}
          </div>

          <div
            className="h-[2px] w-full"
            style={{ background: `linear-gradient(90deg, ${BRAND}, rgba(124,58,237,0.9), ${BRAND})` }}
          />
        </div>
      </div>
    </div>
  );
}
