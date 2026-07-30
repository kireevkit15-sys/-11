'use client';

import { Award, Briefcase, Quote, GraduationCap } from 'lucide-react';
import { PreviewProps, str, num, bool } from './types';
import { resolveMediaUrl } from '@/lib/media';

const BRAND = '#4F46E5';
const ACCENT = '#fb923c';

export function TeamMemberPreview({ values }: PreviewProps) {
  const fullName = str(values.fullName, 'Имя сотрудника');
  const position = str(values.position, 'Должность · специализация');
  const photoUrl = str(values.photoUrl);
  const bio = str(values.bio, 'Краткое описание сотрудника появится здесь.');
  const education = str(values.education);
  const yearsExperience = num(values.yearsExperience, 0);
  const specialization = str(values.specialization);
  const quote = str(values.quote);
  const isFounder = bool(values.isFounder);

  const initials =
    fullName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase() || 'Д';

  const brandGradient = `linear-gradient(145deg, ${BRAND} 0%, ${BRAND}cc 55%, ${ACCENT}66 100%)`;

  return (
    <div className="mx-auto w-full max-w-[320px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="relative flex flex-col overflow-hidden rounded-[18px]"
        style={{
          background: isFounder ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.07)',
          border: `1px solid ${isFounder ? `${BRAND}55` : `${BRAND}22`}`,
          boxShadow: '0 8px 36px rgba(0,0,0,0.40), inset 0 1.5px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Coral accent strip for founder */}
        {isFounder && (
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0 z-[2] w-[3px]"
            style={{ background: ACCENT, boxShadow: `0 0 20px ${ACCENT}99` }}
          />
        )}

        {/* PHOTO AREA — portrait 4:5 */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{ aspectRatio: '4 / 5', borderRadius: '17px 17px 0 0' }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(photoUrl)}
              alt={fullName}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: 'center top' }}
            />
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: brandGradient }} />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="select-none font-extrabold"
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                    letterSpacing: '-0.04em',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {initials}
                </span>
              </div>
            </>
          )}

          {/* Founder badge */}
          {isFounder && (
            <div
              className="absolute left-2.5 top-2.5 z-[2] flex items-center gap-1 rounded-md px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
              style={{ background: `${ACCENT}e6`, boxShadow: `0 2px 12px ${ACCENT}73` }}
            >
              <Award className="h-2.5 w-2.5" />
              Основатель
            </div>
          )}

          {/* Bottom gradient fade */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-[40%]"
            style={{ background: 'linear-gradient(to top, rgba(10,6,20,0.75) 0%, transparent 100%)' }}
          />
        </div>

        {/* INFO AREA */}
        <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
          {/* Years of experience */}
          <div>
            <div
              className="font-extrabold leading-none text-white"
              style={{ fontSize: '1.2rem', letterSpacing: '-0.03em' }}
            >
              {yearsExperience}
            </div>
            <div
              className="mt-0.5 flex items-center gap-1 text-[8px] uppercase tracking-[0.20em]"
              style={{ color: `${BRAND}cc`, fontFamily: 'monospace' }}
            >
              <Briefcase className="h-2.5 w-2.5" />
              лет опыта
            </div>
          </div>

          {/* Name + position */}
          <div>
            <h3
              className="font-bold leading-tight text-white"
              style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}
            >
              {fullName}
            </h3>
            <p
              className="mt-1 text-[8.5px] font-medium uppercase leading-[1.4] tracking-[0.18em]"
              style={{ color: `${ACCENT}cc`, fontFamily: 'monospace' }}
            >
              {position}
            </p>
          </div>

          {/* Specialization */}
          {specialization && (
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/60">
              <GraduationCap className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: `${BRAND}cc` }} />
              {specialization}
            </p>
          )}

          {/* Education */}
          {education && (
            <p className="text-[10.5px] leading-relaxed text-white/45">{education}</p>
          )}

          {/* Bio — line-clamp 3 */}
          <p
            className="text-[11.5px] leading-[1.6] text-white/55"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {bio}
          </p>

          {/* Quote */}
          {quote && (
            <p
              className="mt-1 flex items-start gap-1.5 text-[11px] italic leading-relaxed"
              style={{ color: `${ACCENT}`, borderLeft: `2px solid ${ACCENT}b3`, paddingLeft: 10 }}
            >
              <Quote className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {quote}
            </p>
          )}
        </div>

        {/* Bottom brand strip */}
        <div
          className="h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, ${BRAND}, ${ACCENT}, ${BRAND})` }}
        />
      </div>
    </div>
  );
}
