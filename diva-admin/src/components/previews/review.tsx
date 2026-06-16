'use client';

import { Star, Quote } from 'lucide-react';
import { PreviewProps, str, num } from './types';

const SOURCE_LABEL: Record<string, string> = {
  email: 'Email',
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  whatsapp: 'WhatsApp',
  site: 'Сайт',
};

const BRAND = '#4F46E5';
const ACCENT = '#fb923c';

export function ReviewPreview({ values }: PreviewProps) {
  const authorName = str(values.authorName, 'Имя автора');
  const authorProject = str(values.authorProject, 'Проект · стартап');
  const text = str(values.text, 'Текст отзыва появится здесь. Расскажите, чем была полезна работа с командой ДИВА.');
  const sourceRaw = str(values.source, 'VK');
  const source = SOURCE_LABEL[sourceRaw.toLowerCase()] || sourceRaw;
  const rating = Math.max(0, Math.min(5, num(values.rating, 5)));

  const initials =
    authorName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('') || 'Д';

  // Уникальный оттенок аватара по имени (как на сайте)
  const hue = authorName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="mx-auto w-full max-w-[360px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="rounded-2xl p-[2px]"
        style={{
          background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
          boxShadow: `0 0 28px ${BRAND}33`,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden rounded-[14px] p-6"
          style={{ background: 'rgba(15,11,30,0.99)' }}
        >
          {/* glow wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${BRAND}26, transparent 45%)`,
            }}
          />

          {/* Quote icon */}
          <div className="relative z-10 mb-4">
            <Quote className="h-8 w-8" style={{ color: ACCENT }} fill="currentColor" />
          </div>

          {/* Review text — крупно, line-clamp ~4 */}
          <p
            className="relative z-10 text-[15px] leading-relaxed text-white/90"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {text}
          </p>

          {/* Divider */}
          <div
            className="relative z-10 my-5 h-px"
            style={{
              background: `linear-gradient(90deg, ${BRAND}99, ${ACCENT}66, transparent)`,
            }}
          />

          {/* Author row */}
          <div className="relative z-10 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${(hue + 40) % 360},70%,55%))`,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.12)',
              }}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white">{authorName}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/45">{authorProject}</p>
            </div>

            {/* Stars */}
            <div className="ml-auto flex shrink-0 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5"
                  style={{ color: i < rating ? ACCENT : 'rgba(255,255,255,0.18)' }}
                  fill={i < rating ? ACCENT : 'transparent'}
                />
              ))}
            </div>
          </div>

          {/* Source badge */}
          <div className="relative z-10 mt-4 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider"
              style={{
                background: `${BRAND}1f`,
                color: '#c7d2fe',
                boxShadow: `0 0 0 1px ${BRAND}40`,
              }}
            >
              {source}
            </span>
          </div>

          {/* bottom accent bar */}
          <div
            className="relative z-10 mt-5 h-[2px] w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${BRAND}, ${ACCENT}, ${BRAND})` }}
          />
        </div>
      </div>
    </div>
  );
}
