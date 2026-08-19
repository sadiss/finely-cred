import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, PlayCircle } from 'lucide-react';
import { MARKETING_HUB_CONTENT_SHELL, MarketingSectionHeader, MarketingVividActionTile } from './marketingHubUi';

const STEPS = [
  {
    id: 'find',
    step: '1',
    title: 'Find new people',
    detail: 'Caleb\'s Find room runs live metro search — approve matches into your pipeline.',
    href: '/admin/marketing?tab=desk&helper=find',
    accent: 'emerald' as const,
    helpId: 'marketing_domain',
  },
  {
    id: 'board',
    step: '2',
    title: 'Review the daily desk',
    detail: 'Board shows New → Talking → Booked. Clean junk and queue mail from the same desk.',
    href: '/admin/marketing?tab=desk&helper=board',
    accent: 'sky' as const,
    helpId: 'nurture_lane',
  },
  {
    id: 'followup',
    step: '3',
    title: 'Follow up & book sessions',
    detail: 'Leads & CRM for pipeline moves. Comms sequences for nurture. Alex for booked calls.',
    href: '/admin/marketing?tab=leads',
    accent: 'violet' as const,
    helpId: 'booked_7d',
  },
] as const;

export function MarketingWatchHowStrip() {
  const navigate = useNavigate();

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} space-y-3`}>
      <MarketingSectionHeader
        eyebrow="Watch how"
        title="Three steps that move the week"
        subtitle="Follow in order — each step opens the real desk, not a demo."
        helpId="weekly_focus"
      />
      <div className="grid sm:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <MarketingVividActionTile
            key={s.id}
            accent={s.accent}
            eyebrow={`Step ${s.step}`}
            title={s.title}
            detail={s.detail}
            helpId={s.helpId}
            onClick={() => navigate(s.href)}
          />
        ))}
      </div>
    </div>
  );
}
