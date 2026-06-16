'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { LayoutGrid, Square } from 'lucide-react';
import { PreviewFrame } from './frame';
import type { PreviewProps } from './types';

import { PartnerPreview } from './partner';
import { HeroPreview } from './hero';
import { FooterPreview } from './footer';
import { AnnouncementMessagePreview } from './announcement-message';
import { ServicePreview } from './service';
import { ReviewPreview } from './review';
import { TeamMemberPreview } from './team-member';
import { FaqPreview } from './faq';
import { VideoPreview } from './video';
import { TrustPillarPreview } from './trust-pillar';
import { SiteStatisticPreview } from './site-statistic';
import { CaseStudyPreview } from './case-study';
import { AnnouncementPreview } from './announcement';
import { SocialLinkPreview } from './social-link';

const PREVIEWS: Record<string, ComponentType<PreviewProps>> = {
  partners: PartnerPreview,
  'hero-configs': HeroPreview,
  'footer-configs': FooterPreview,
  'announcement-messages': AnnouncementMessagePreview,
  services: ServicePreview,
  reviews: ReviewPreview,
  'team-members': TeamMemberPreview,
  faqs: FaqPreview,
  videos: VideoPreview,
  'trust-pillars': TrustPillarPreview,
  'site-statistics': SiteStatisticPreview,
  'case-studies': CaseStudyPreview,
  announcements: AnnouncementPreview,
  'social-links': SocialLinkPreview,
};

// Singleton-блоки — это и есть «вся секция», лента контекста не нужна.
const NO_SECTION = new Set(['hero-configs', 'footer-configs']);

export function hasPreview(slug: string): boolean {
  return slug in PREVIEWS;
}

type Row = { id: string } & Record<string, unknown>;

export function EntityPreview({
  slug,
  values,
  excludeId,
}: {
  slug: string;
  values: Record<string, unknown>;
  excludeId?: string;
}) {
  const Comp = PREVIEWS[slug];
  const sectionable = !NO_SECTION.has(slug);
  const [mode, setMode] = useState<'card' | 'section'>(sectionable ? 'section' : 'card');
  const [others, setOthers] = useState<Row[]>([]);

  useEffect(() => {
    if (!sectionable) return;
    let alive = true;
    fetch(`/api/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const rows: Row[] = (d.data || []).filter((x: Row) => x.id !== excludeId);
        setOthers(rows.slice(0, 6));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug, excludeId, sectionable]);

  if (!Comp) return null;

  return (
    <div className="space-y-3">
      {sectionable && (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          <button
            onClick={() => setMode('section')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              mode === 'section' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> В секции
          </button>
          <button
            onClick={() => setMode('card')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              mode === 'card' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="h-4 w-4" /> Карточка
          </button>
        </div>
      )}

      {mode === 'card' || !sectionable ? (
        <PreviewFrame>
          <Comp values={values} />
        </PreviewFrame>
      ) : (
        <PreviewFrame label="Как встанет в секцию сайта" padded={false}>
          <div className="flex gap-4 overflow-x-auto p-6">
            {/* Редактируемая карточка — подсвечена */}
            <div className="relative shrink-0">
              <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg">
                {excludeId ? 'Редактируется' : 'Новая'}
              </span>
              <div className="w-[300px] rounded-[18px] ring-2 ring-brand-400 ring-offset-2 ring-offset-[#14102a]">
                <Comp values={values} />
              </div>
            </div>
            {/* Соседние существующие карточки для контекста */}
            {others.map((row) => (
              <div key={row.id} className="w-[300px] shrink-0 opacity-90">
                <Comp values={row} />
              </div>
            ))}
            {others.length === 0 && (
              <div className="flex w-[220px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-xs text-white/40">
                Других записей пока нет — здесь появятся соседние карточки
              </div>
            )}
          </div>
        </PreviewFrame>
      )}
    </div>
  );
}
