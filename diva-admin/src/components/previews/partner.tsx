'use client';

import { Github, Globe, Send, ArrowRight } from 'lucide-react';
import { PreviewProps, str, num, bool, list } from './types';

const CATEGORY_LABEL: Record<string, string> = {
  fullstack: 'Full-stack',
  mobile: 'Mobile',
  ai: 'AI / ML',
  devops: 'DevOps',
  design: 'Design',
  other: 'Другое',
};

export function PartnerPreview({ values }: PreviewProps) {
  const name = str(values.name, 'Имя партнёра');
  const logoUrl = str(values.logoUrl);
  const role = str(values.role, 'Роль · специализация');
  const bio = str(values.bio, 'Краткое описание партнёра появится здесь.');
  const skills = list(values.skills);
  const badge = str(values.badge, 'team');
  const category = str(values.category, 'fullstack');
  const available = bool(values.available);
  const hue = num(values.hue, 240);

  const hsl = `hsl(${hue}, 72%, 58%)`;
  const hslDim = `hsl(${hue}, 55%, 25%)`;
  const hslDeep = `hsl(${hue}, 60%, 15%)`;
  const initials = name.split(' ').slice(0, 2).map((w) => w[0] || '').join('') || 'Д';

  return (
    <div className="mx-auto w-full max-w-[320px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="rounded-2xl p-[1.5px]" style={{ background: `linear-gradient(135deg, ${hsl}, ${hslDeep})`, boxShadow: `0 0 22px ${hsl}30` }}>
        <div className="relative flex flex-col overflow-hidden rounded-[13px]" style={{ background: 'rgba(10,6,20,0.99)' }}>
          {/* TOP HERO ZONE */}
          <div
            className="relative flex flex-col items-center px-5 pt-6 pb-5 text-center"
            style={{ background: `linear-gradient(160deg, ${hslDeep} 0%, rgba(10,6,20,0.6) 100%)`, borderBottom: `1px solid ${hsl}20` }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 80% at 50% 0%, ${hsl}22 0%, transparent 65%)` }} />
            <div aria-hidden className="pointer-events-none absolute top-0 left-8 right-8 h-px" style={{ background: `linear-gradient(90deg, transparent, ${hsl}90 50%, transparent)` }} />

            {/* badges */}
            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-center gap-1.5">
              {badge === 'team' ? (
                <span className="rounded-full bg-violet-600/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/35">✦ Команда ДИВА</span>
              ) : (
                <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[9px] font-medium text-white/35 ring-1 ring-white/[0.08]">Клиент</span>
              )}
              {available && (
                <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5" style={{ background: 'rgba(16,185,129,0.1)', boxShadow: '0 0 0 1px rgba(16,185,129,0.25)' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[9px] font-semibold text-emerald-400">Доступен</span>
                </span>
              )}
            </div>

            {/* avatar / logo */}
            <div className="relative z-10 mb-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-16 w-16 rounded-2xl object-contain"
                  style={{ background: 'rgba(255,255,255,0.06)', boxShadow: `0 0 0 3px ${hsl}30, 0 0 32px ${hsl}40` }}
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${hslDim}, ${hsl})`, boxShadow: `0 0 0 3px ${hsl}30, 0 0 32px ${hsl}40, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* name + role */}
            <div className="relative z-10">
              <h3 className="text-[17px] font-extrabold leading-tight tracking-tight text-white">{name}</h3>
              <p className="mt-0.5 font-mono text-[11px] tracking-wide" style={{ color: `${hsl}cc` }}>{role}</p>
            </div>

            {/* category pill */}
            <div className="relative z-10 mt-3 flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: `${hsl}15`, boxShadow: `0 0 0 1px ${hsl}30` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hsl, boxShadow: `0 0 5px ${hsl}` }} />
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: hsl }}>{CATEGORY_LABEL[category] || category}</span>
            </div>
          </div>

          {/* BOTTOM CONTENT ZONE */}
          <div className="flex flex-1 flex-col gap-3 p-5">
            <p className="text-[12px] leading-[1.7] text-white/50" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{bio}</p>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 6).map((skill, i) => (
                  <span
                    key={skill + i}
                    className="rounded-lg px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider"
                    style={i < 3
                      ? { background: `${hsl}15`, color: hsl, boxShadow: `0 0 0 1px ${hsl}30` }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', boxShadow: '0 0 0 1px rgba(255,255,255,0.07)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${hsl}15` }}>
              <div className="flex items-center gap-0.5">
                {str(values.githubLink) && <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30" style={{ background: 'rgba(255,255,255,0.04)' }}><Github className="h-3.5 w-3.5" /></span>}
                {str(values.portfolioLink) && <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30" style={{ background: 'rgba(255,255,255,0.04)' }}><Globe className="h-3.5 w-3.5" /></span>}
                {str(values.telegramLink) && <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30" style={{ background: 'rgba(255,255,255,0.04)' }}><Send className="h-3.5 w-3.5" /></span>}
              </div>
              <span className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold" style={{ background: `linear-gradient(135deg, ${hsl}25, ${hsl}15)`, color: hsl, boxShadow: `0 0 0 1px ${hsl}40` }}>
                Связаться <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${hsl}, #FB923C, ${hsl})` }} />
        </div>
      </div>
    </div>
  );
}
