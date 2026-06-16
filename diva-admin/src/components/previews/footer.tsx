'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import { PreviewProps, str, list, json } from './types';

type NavCol = { title: string; links: { label: string; href: string }[] };

export function FooterPreview({ values }: PreviewProps) {
  const email = str(values.email, 'email@company.com');
  const phones = list(values.phones);
  const address = str(values.address);
  const workHours = str(values.workHours);
  const legalInfo = str(values.legalInfo);
  const copyright = str(values.copyright);
  const navColumns = json<NavCol[]>(values.navColumns, []);

  return (
    <div className="rounded-xl p-5 text-white/80" style={{ background: '#0d0a1a', fontFamily: 'Inter, sans-serif' }}>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {/* brand */}
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-extrabold text-white" style={{ background: '#4F46E5' }}>Д</div>
            <div className="leading-none">
              <div className="text-base font-extrabold tracking-tight text-white">ДИВА</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">Бухгалтерия для стартапов</div>
            </div>
          </div>
          <a className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] text-white/50">
            <Mail className="h-3 w-3" /> {email}
          </a>
          {workHours && <p className="mt-1 font-mono text-[10px] text-white/35">{workHours}</p>}
        </div>

        {/* nav columns */}
        {(navColumns.length ? navColumns : [{ title: 'Колонка', links: [] }]).slice(0, 2).map((col, i) => (
          <div key={i}>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {(col.links || []).slice(0, 5).map((l, j) => (
                <li key={j} className="text-[12px] text-white/55">{l.label}</li>
              ))}
            </ul>
          </div>
        ))}

        {/* contacts */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{navColumns[2]?.title || 'Контакты'}</h4>
          <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-white/55">
            {phones.map((p) => (
              <span key={p} className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-white/40" /> {p}</span>
            ))}
            {address && <span className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-white/40" /> {address}</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {legalInfo && <p className="font-mono text-[10px] text-white/40">{legalInfo}</p>}
        {copyright && <p className="font-mono text-[10px] text-white/40">{copyright}</p>}
      </div>
    </div>
  );
}
