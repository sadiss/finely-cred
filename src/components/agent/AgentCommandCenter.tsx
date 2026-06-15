import React from 'react';
import { ClipboardList, MessageSquare, Rocket, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgentOperatingModel } from '../../domain/agentProgram';
import { computeAgentRevenueSplit } from '../../domain/agentProgram';
import { getAgencyTierById } from '../../config/pricingCatalog';

import { CS } from '../../config/creditSpecialistProgram';

const DAILY_CHECKLIST = [
  'Review open client tasks & next actions',
  'Check your Finely partnership line in portal messages',
  'Upload or QA one dispute letter batch',
  'Log mentor checkpoint if in apprenticeship',
];

const EFFICIENCY_SHORTCUTS = [
  { label: 'Growth & lead pitch', path: `${CS.hubPath}?tab=growth`, icon: Rocket },
  { label: 'Partnership line', path: '/portal/messages?hub=team&topic=credit_specialist_program', icon: MessageSquare },
  { label: 'New client intake', path: '/admin/partners', icon: Users },
  { label: 'Dispute center', path: '/portal/disputes', icon: Zap },
  { label: 'Template library', path: '/portal/templates', icon: Rocket },
  { label: 'Letter studio', path: '/portal/letters', icon: ClipboardList },
  { label: 'Media / marketing', path: '/portal/education', icon: Rocket },
];

export function AgentCommandCenter({ model }: { model: AgentOperatingModel }) {
  const navigate = useNavigate();
  const split = computeAgentRevenueSplit(model);
  const tier = getAgencyTierById(model.capacityTierId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">Today&apos;s focus</div>
        <ul className="space-y-2">
          {DAILY_CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-amber-500 mt-1">•</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
          <span className="text-emerald-300 font-semibold">{split.agentSharePct}% keep</span>
          <span className="text-white/55"> on client revenue at </span>
          <span className="text-white/80">{split.phaseLabel}</span>
          <span className="text-white/45"> — move levers to &quot;You&quot; to increase it.</span>
        </div>
      </div>

      <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Work faster</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EFFICIENCY_SHORTCUTS.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex items-center gap-2 px-3 py-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.05] text-left text-[10px] font-black uppercase tracking-widest text-white/65"
            >
              <Icon size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        {tier ? (
          <div className="text-xs text-white/45 pt-1">
            Capacity: {tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit} clients •{' '}
            {tier.seatLimit === -1 ? 'Unlimited' : tier.seatLimit} seats •{' '}
            <span className="capitalize">{(tier.whiteLabelLevel ?? '').replace(/_/g, ' ')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
