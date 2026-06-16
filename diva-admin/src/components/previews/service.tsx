'use client';

import { Zap, Rocket, Building2, Trophy, Check, ArrowUpRight, Sparkle } from 'lucide-react';
import { PreviewProps, str, num, bool, list } from './types';

const INDIGO = '#4F46E5';
const CORAL = '#fb923c';

// Иконка по системе налогообложения — повторяет маппинг с сайта.
function TaxIcon({ taxSystem, className }: { taxSystem: string; className?: string }) {
  if (taxSystem === 'ФСИ') return <Trophy className={className} />;
  if (taxSystem.startsWith('УСН')) return <Rocket className={className} />;
  if (taxSystem === 'ОСН') return <Building2 className={className} />;
  return <Zap className={className} />;
}

export function ServicePreview({ values }: PreviewProps) {
  const title = str(values.title, 'Название услуги');
  const taxSystem = str(values.taxSystem, 'АУСН');
  const basePrice = num(values.basePrice, 0);
  const includes = list(values.includes);
  const targetAudience = str(values.targetAudience, '');
  const isHighlighted = bool(values.isHighlighted);

  const isFsi = taxSystem === 'ФСИ';
  const unit = isFsi ? '₽ / грант' : '₽ / мес';
  // Цена: 0/пусто → «по запросу», иначе форматируем для ru-RU.
  const priceLabel = basePrice > 0 ? basePrice.toLocaleString('ru-RU') : 'по запросу';
  const showUnit = basePrice > 0;

  const accent = isFsi ? CORAL : INDIGO;

  return (
    <div className="mx-auto w-full max-w-[340px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="rounded-3xl p-[1.5px]"
        style={{
          background: `linear-gradient(135deg, ${accent}55, ${accent}10 60%, ${CORAL}30)`,
          boxShadow: isHighlighted ? `0 0 28px ${accent}40` : `0 0 18px ${accent}1f`,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden rounded-[22px]"
          style={{ background: 'rgba(9,7,18,0.99)' }}
        >
          {/* radial glow сверху */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 110% 70% at 50% 0%, ${accent}1f 0%, transparent 60%)` }}
          />

          {/* ── HEADER ───────────────────────────── */}
          <div className="relative z-10 flex flex-col gap-4 px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-3">
              {/* icon */}
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${accent}1a`, boxShadow: `0 0 0 1px ${accent}33`, color: accent }}
              >
                <TaxIcon taxSystem={taxSystem} className="h-5 w-5" />
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {/* tax-system badge */}
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ background: `${accent}1f`, color: accent, boxShadow: `0 0 0 1px ${accent}33` }}
                >
                  {taxSystem}
                </span>
                {isHighlighted && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: `${CORAL}1f`, color: CORAL, boxShadow: `0 0 0 1px ${CORAL}40` }}
                  >
                    <Sparkle className="h-2.5 w-2.5" /> Хит
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-[19px] font-extrabold leading-tight tracking-tight text-white">{title}</h3>

            {targetAudience && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{targetAudience}</p>
            )}

            {/* price */}
            <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Стоимость</span>
              <div className="flex items-baseline gap-1.5">
                {showUnit && <span className="font-mono text-[11px] text-white/55">от</span>}
                <span
                  className="text-[32px] font-extrabold leading-none tracking-[-0.03em] text-white"
                  style={showUnit ? { textShadow: `0 0 18px ${accent}66` } : undefined}
                >
                  {priceLabel}
                </span>
                {showUnit && <span className="font-mono text-[11px] text-white/55">{unit}</span>}
              </div>
            </div>
          </div>

          {/* ── INCLUDES ─────────────────────────── */}
          <div className="relative z-10 px-6 pb-5">
            <h4
              className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: CORAL }}
            >
              Перечень отчётов и работ
            </h4>
            {includes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {includes.slice(0, 8).map((item, i) => (
                  <li key={item + i} className="flex items-start gap-2 text-[12px] leading-snug text-white/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                    <span>{item}</span>
                  </li>
                ))}
                {includes.length > 8 && (
                  <li className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                    + ещё {includes.length - 8}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-[12px] italic text-white/35">Добавьте пункты «что входит» в форму.</p>
            )}
          </div>

          {/* ── FOOTER ───────────────────────────── */}
          <div
            className="relative z-10 flex items-center gap-1.5 px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: accent }}
          >
            Подробнее о тарифе <ArrowUpRight className="h-3.5 w-3.5" />
          </div>

          <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${INDIGO}, ${CORAL}, ${INDIGO})` }} />
        </div>
      </div>
    </div>
  );
}
