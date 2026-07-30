'use client';

import { Play, Eye } from 'lucide-react';
import { PreviewProps, str, num } from './types';
import { resolveMediaUrl } from '@/lib/media';

export function VideoPreview({ values }: PreviewProps) {
  const title = str(values.title, 'Название видео появится здесь');
  const videoId = str(values.videoId);
  const platform = str(values.platform, 'youtube');
  const views = num(values.views, 0);
  const duration = str(values.duration);
  const thumbnailUrl = str(values.thumbnailUrl);

  const ytThumb =
    !thumbnailUrl && videoId && platform === 'youtube'
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : '';
  const cover = thumbnailUrl || ytThumb;

  const platformLabel: Record<string, string> = {
    youtube: 'YouTube',
    rutube: 'RuTube',
    vkvideo: 'VK Видео',
    vk: 'VK Видео',
  };

  return (
    <div className="mx-auto w-full max-w-[340px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="overflow-hidden rounded-2xl p-[1.5px]"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #0D0925)',
          boxShadow: '0 0 24px rgba(124,58,237,0.25)',
        }}
      >
        <div className="overflow-hidden rounded-[13px]" style={{ background: '#0D0925' }}>
          {/* THUMBNAIL */}
          <div className="relative aspect-video w-full overflow-hidden">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(cover)} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(167,139,250,0.24), transparent 55%), #120A2D',
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.9)',
                    border: '1.5px solid rgba(167,139,250,0.7)',
                  }}
                >
                  <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                </div>
              </div>
            )}

            {/* play overlay (when cover present) */}
            {cover && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(13,9,37,0.85) 0%, rgba(13,9,37,0.1) 45%, transparent 100%)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      background: 'rgba(124,58,237,0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1.5px solid rgba(167,139,250,0.7)',
                    }}
                  >
                    <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                  </div>
                </div>
              </>
            )}

            {/* duration badge */}
            {duration && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 backdrop-blur-sm">
                <span className="font-mono text-[11px] font-medium text-white/90">{duration}</span>
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="flex flex-col gap-3 p-4">
            <h3
              className="text-sm font-bold leading-snug tracking-tight text-white"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/55">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-mono text-[11px]">{views.toLocaleString('ru-RU')}</span>
              </div>

              <span
                className="rounded-lg px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider"
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  color: '#A78BFA',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
                }}
              >
                {platformLabel[platform] || platform}
              </span>
            </div>
          </div>

          <div
            className="h-[2px] w-full"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #FB923C, #7C3AED)' }}
          />
        </div>
      </div>
    </div>
  );
}
