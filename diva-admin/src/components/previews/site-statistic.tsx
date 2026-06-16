'use client';

import { PreviewProps, str, num } from './types';

export function SiteStatisticPreview({ values }: PreviewProps) {
  const value = num(values.value, 0);
  const suffix = str(values.suffix);
  const label = str(values.label, 'Подпись метрики');
  const caption = str(values.caption);

  // Бренд-акцент: «%» подсвечиваем коралловым, остальное — индиго.
  const accent = suffix === '%' ? '#fb923c' : '#4F46E5';

  return (
    <div className="mx-auto w-full max-w-[360px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="relative flex flex-col items-center overflow-hidden px-7 py-10 text-center"
        style={{
          borderRadius: 20,
          border: `1px solid ${accent}33`,
          background: `radial-gradient(ellipse 100% 90% at 50% 0%, ${accent}22, transparent 70%), rgba(10,6,20,0.99)`,
          boxShadow: `0 0 0 1px ${accent}25, 0 8px 40px ${accent}22`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-8 right-8 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}90 50%, transparent)` }}
        />

        {/* Огромное число + суффикс */}
        <span
          className="text-[72px] font-extrabold leading-none tracking-[-0.04em]"
          style={{ color: accent, textShadow: `0 0 32px ${accent}55` }}
        >
          {value}
          {suffix && <span className="text-[52px]">{suffix}</span>}
        </span>

        {/* Подпись */}
        <div className="mt-4 text-lg font-semibold text-white">{label}</div>

        {/* Мелкая подпись */}
        {caption && (
          <div className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/55">{caption}</div>
        )}
      </div>
    </div>
  );
}
