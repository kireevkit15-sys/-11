'use client';

import { Megaphone, Star, Tag } from 'lucide-react';
import { PreviewProps, str, num, bool, list } from './types';

export function AnnouncementPreview({ values }: PreviewProps) {
  const title = str(values.title, 'Заголовок объявления');
  const content = str(values.content, 'Текст объявления появится здесь.');
  const key = str(values.key);
  const category = str(values.category);
  const badge = str(values.badge);
  const hue = num(values.hue, 24);
  const available = bool(values.available);
  const featured = bool(values.featured);
  const sortOrder = num(values.sortOrder, 0);

  const hsl = `hsl(${hue}, 70%, 58%)`;
  const hslDeep = `hsl(${hue}, 60%, 15%)`;

  return (
    <div className="mx-auto w-full max-w-[340px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="rounded-2xl p-[1.5px]"
        style={{
          background: `linear-gradient(135deg, ${hsl}, ${hslDeep})`,
          boxShadow: `0 0 22px ${hsl}30`,
          opacity: available ? 1 : 0.55,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden rounded-[13px]"
          style={{ background: 'rgba(10,6,20,0.99)' }}
        >
          {/* TOP ZONE — category + badges */}
          <div
            className="relative flex flex-col gap-3 px-5 pt-5 pb-4"
            style={{
              background: `linear-gradient(160deg, ${hslDeep} 0%, rgba(10,6,20,0.6) 100%)`,
              borderBottom: `1px solid ${hsl}20`,
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(ellipse 100% 80% at 50% 0%, ${hsl}1f 0%, transparent 65%)` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-8 right-8 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${hsl}90 50%, transparent)` }}
            />

            {/* Badge row */}
            <div className="relative z-10 flex flex-wrap items-center gap-1.5">
              {category && (
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: `${hsl}1f`, color: hsl, boxShadow: `0 0 0 1px ${hsl}40` }}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {category}
                </span>
              )}
              {badge && (
                <span
                  className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/45 ring-1 ring-white/[0.08]"
                >
                  {badge}
                </span>
              )}
              {featured && (
                <span
                  className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold"
                  style={{ background: 'rgba(251,146,60,0.14)', color: '#fb923c', boxShadow: '0 0 0 1px rgba(251,146,60,0.4)' }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  В топе
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="relative z-10 flex items-start gap-2 text-[16px] font-extrabold leading-tight tracking-tight text-white">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: hsl }} />
              <span>{title}</span>
            </h3>
          </div>

          {/* BOTTOM ZONE — content */}
          <div className="flex flex-col gap-3 p-5">
            <p
              className="text-[12px] leading-[1.7] text-white/55"
              style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {content}
            </p>

            {/* Footer — key + availability + sortOrder */}
            <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${hsl}15` }}>
              {available ? (
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Активно
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  Скрыто
                </span>
              )}
              {key && <span className="truncate font-mono text-[9px] text-white/25">{key}</span>}
              <span className="ml-auto font-mono text-[9px] text-white/20">#{sortOrder}</span>
            </div>
          </div>

          <div
            className="h-[2px] w-full"
            style={{ background: `linear-gradient(90deg, ${hsl}, #FB923C, ${hsl})` }}
          />
        </div>
      </div>
    </div>
  );
}
