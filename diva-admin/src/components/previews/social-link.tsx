'use client';

import { Send, Youtube, MessageCircle, Video, Globe, ArrowUpRight } from 'lucide-react';
import { PreviewProps, str } from './types';

const BRAND: Record<string, { color: string; label: string; action: string }> = {
  vk: { color: '#0077FF', label: 'ВКонтакте', action: 'отзывы и новости' },
  telegram: { color: '#29B6F6', label: 'Telegram', action: 'быстрые разборы' },
  youtube: { color: '#FF0000', label: 'YouTube', action: 'видео-инструкции' },
  rutube: { color: '#A544FF', label: 'RuTube', action: 'записи эфиров' },
};

function iconFor(platform: string) {
  switch (platform) {
    case 'telegram':
      return Send;
    case 'youtube':
      return Youtube;
    case 'vk':
      return MessageCircle;
    case 'rutube':
      return Video;
    default:
      return Globe;
  }
}

export function SocialLinkPreview({ values }: PreviewProps) {
  const platform = str(values.platform, 'vk');
  const brand = BRAND[platform];
  const accent = str(values.iconColor) || (brand ? brand.color : '#A78BFA');
  const label = str(values.label) || (brand ? brand.label : 'Соцсеть');
  const actionText = str(values.actionText) || (brand ? brand.action : 'смотреть');

  const Icon = iconFor(platform);

  return (
    <div className="mx-auto w-full max-w-[280px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Icon */}
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `${accent}26`,
            boxShadow: `0 0 0 1px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          <Icon className="h-7 w-7" style={{ color: accent }} strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{label}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              {actionText}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-white/30 transition-colors group-hover:text-white">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}
