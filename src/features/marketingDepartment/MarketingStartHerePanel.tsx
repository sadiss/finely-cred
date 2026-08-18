import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Mail, Target } from 'lucide-react';
import { MARKETING_HUB_CONTENT_SHELL, MarketingSectionHeader, MarketingVividActionTile } from './marketingHubUi';

const START_JOBS = [
  {
    id: 'leads',
    title: 'Get leads',
    blurb: 'Find people who need credit help and add them to your pipeline.',
    icon: Target,
    accent: 'emerald' as const,
    href: '/admin/marketing?tab=desk&helper=find',
    cta: 'Find new people',
    helpId: 'marketing_domain',
  },
  {
    id: 'content',
    title: 'Create content',
    blurb: 'Short video, captions, and tracked links for social and ads.',
    icon: Film,
    accent: 'violet' as const,
    href: '/admin/marketing?tab=content',
    cta: 'Open Content Studio',
    helpId: 'video_wizard',
  },
  {
    id: 'followup',
    title: 'Follow up',
    blurb: 'Email, sequences, and booked sessions for warm CRM leads.',
    icon: Mail,
    accent: 'fuchsia' as const,
    href: '/admin/marketing?tab=leads',
    cta: 'Open leads & CRM',
    helpId: 'nurture_lane',
  },
] as const;

export function MarketingStartHerePanel() {
  const navigate = useNavigate();

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} space-y-3`}>
      <MarketingSectionHeader
        eyebrow="Start here"
        title="Three jobs that move the week"
        subtitle="Each tile is a full workspace — not a shortcut to a empty page."
        helpId="weekly_focus"
      />
      <div className="grid sm:grid-cols-3 gap-3">
        {START_JOBS.map((job) => (
          <MarketingVividActionTile
            key={job.id}
            accent={job.accent}
            eyebrow="This week"
            title={job.title}
            detail={job.blurb}
            helpId={job.helpId}
            onClick={() => navigate(job.href)}
          />
        ))}
      </div>
    </div>
  );
}
