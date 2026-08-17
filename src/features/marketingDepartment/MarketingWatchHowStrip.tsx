import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, PlayCircle } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';

const STEPS = [
  {
    id: 'find',
    step: '1',
    title: 'Find new people',
    detail: 'Caleb\'s Find room runs live metro search — approve matches into your pipeline.',
    href: '/admin/marketing?tab=desk&helper=find',
  },
  {
    id: 'board',
    step: '2',
    title: 'Review the daily desk',
    detail: 'Board shows New → Talking → Booked. Clean junk and queue mail from the same desk.',
    href: '/admin/marketing?tab=desk&helper=board',
  },
  {
    id: 'followup',
    step: '3',
    title: 'Follow up & book sessions',
    detail: 'Leads & CRM for pipeline moves. Comms sequences for nurture. Alex for booked calls.',
    href: '/admin/marketing?tab=leads',
  },
] as const;

export function MarketingWatchHowStrip() {
  const navigate = useNavigate();

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Watch how</p>
          <h3 className={`${FINELY_OS_ENTITY_TITLE} text-lg`}>Three steps that move the week</h3>
        </div>
        <PlayCircle size={22} className="text-sky-300/80 shrink-0" aria-hidden />
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate(s.href)}
            className="rounded-xl border border-white/10 bg-black/25 p-3 text-left hover:border-sky-400/35 hover:bg-sky-500/5 transition"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">Step {s.step}</span>
            <div className="mt-1 font-semibold text-white text-sm">{s.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.detail}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300/90">
              Open <ChevronRight size={12} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
