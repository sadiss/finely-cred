import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LEAD_MAGNET_FUNNELS, type LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

/** Phase 11 — cross-sell other free guide stacks after capture. */
export function FunnelUpgradeStack({ current }: { current: LeadMagnetFunnelConfig }) {
  const others = LEAD_MAGNET_FUNNELS.filter((f) => f.id !== current.id);
  if (!others.length) return null;

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 text-left">
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-200 mb-2`}>Complete your free stack</div>
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY} mb-3`}>
        Unlock complementary guides — debt validation, business credit, tradelines, and personal restore playbooks.
      </p>
      <ul className="space-y-2">
        {others.map((f) => {
          const agent = resolveStaffOnDuty(f.agentPersonaId);
          return (
            <li key={f.id}>
              <a
                href={f.path}
                className={`flex items-center justify-between gap-2 ${finelyOsInlineListItem()} px-3 py-2 text-sm hover:border-emerald-500/30 transition-colors`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  {agent ? (
                    <StaffPortraitImg staff={agent} className="w-9 h-9 rounded-full border border-white/[0.08] shrink-0" />
                  ) : null}
                  <span className="min-w-0">
                    <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{f.heroHighlight}</span>
                    <span className={`${FINELY_OS_ENTITY_BODY} text-xs block`}>
                      {f.agentRole} · {agent ? `${agent.firstName} ${agent.lastName}` : f.agentDisplayName}
                    </span>
                  </span>
                </span>
                <ArrowRight size={14} className="text-emerald-300 shrink-0" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
