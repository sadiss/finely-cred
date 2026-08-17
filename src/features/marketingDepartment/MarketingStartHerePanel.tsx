import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Mail, Target } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  finelyOsDeckTile,
} from '../os/finelyOsLightUi';

const START_JOBS = [
  {
    id: 'leads',
    title: 'Get leads',
    blurb: 'Find people who need credit help and add them to your pipeline.',
    icon: Target,
    accent: 'emerald' as const,
    href: '/admin/marketing?tab=desk&helper=find',
    cta: 'Find new people',
  },
  {
    id: 'content',
    title: 'Create content',
    blurb: 'Short video, captions, and tracked links for social and ads.',
    icon: Film,
    accent: 'violet' as const,
    href: '/admin/marketing?tab=content',
    cta: 'Open Content Studio',
  },
  {
    id: 'followup',
    title: 'Follow up',
    blurb: 'Email, sequences, and booked sessions for warm CRM leads.',
    icon: Mail,
    accent: 'fuchsia' as const,
    href: '/admin/marketing?tab=leads',
    cta: 'Open leads & CRM',
  },
] as const;

export function MarketingStartHerePanel() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Start here</p>
        <h2 className={FINELY_OS_ENTITY_TITLE}>Three jobs that move the week</h2>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Pick one — each opens the full workspace behind it, not a simplified substitute.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {START_JOBS.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => navigate(job.href)}
            className={`${finelyOsDeckTile(job.accent)} text-left !p-4`}
          >
            <job.icon size={20} className="mb-2 opacity-80" />
            <div className="font-bold text-white">{job.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{job.blurb}</p>
            <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-300/90">
              {job.cta} →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
