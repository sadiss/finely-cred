import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { MARKETING_HUB_CONTENT_SHELL, MarketingVividActionTile } from './marketingHubUi';
import { MarketingHelpButton } from './MarketingHelpModal';
import { FINELY_OS_ENTITY_SUBLABEL } from '../os/finelyOsLightUi';

const NAV_STEPS = [
  {
    accent: 'emerald' as const,
    title: 'Start here',
    detail: 'Weekly focus, three jobs, channel setup',
    href: '/admin/marketing?tab=start',
    helpId: 'weekly_focus',
  },
  {
    accent: 'violet' as const,
    title: 'Marketing plan',
    detail: 'Promote · Nurture · Communicate lanes',
    href: '/admin/marketing?tab=plan',
    helpId: 'promote_lane',
  },
  {
    accent: 'sky' as const,
    title: 'Daily desk',
    detail: 'Caleb find, board, mail — today’s mission',
    href: '/admin/marketing?tab=desk',
    helpId: 'marketing_domain',
  },
  {
    accent: 'fuchsia' as const,
    title: 'Team',
    detail: 'Agents, tasks, workrooms',
    href: '/admin/marketing?tab=team',
    helpId: 'agents_domain',
  },
  {
    accent: 'amber' as const,
    title: 'Leads & CRM',
    detail: 'Pipeline, nurture, booked sessions',
    href: '/admin/marketing?tab=leads',
    helpId: 'nurture_lane',
  },
];

/** Quick map — how to navigate the marketing hub */
export function MarketingNavGuide() {
  const navigate = useNavigate();

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL}`}>
      <div className="flex items-center gap-2 mb-3">
        <Compass size={16} className="text-sky-300" />
        <p className={FINELY_OS_ENTITY_SUBLABEL}>How to navigate</p>
        <MarketingHelpButton helpId="capability_percent" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {NAV_STEPS.map((s) => (
          <MarketingVividActionTile
            key={s.href}
            accent={s.accent}
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
