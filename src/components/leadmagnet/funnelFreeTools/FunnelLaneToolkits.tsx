import React, { useMemo } from 'react';
import { FunnelToolkitChecklistPanel } from './FunnelToolkitChecklistPanel';
import { PublicInquiryBudgetCalculator } from '../../funding/PublicInquiryBudgetCalculator';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../features/os/finelyOsLightUi';
import { Clock, TrendingUp } from 'lucide-react';

const TIMING_LADDER = [
  { week: 'Week 0', action: 'Pull reports — confirm AU tradeline age & reporting status', risk: 'Low' },
  { week: 'Week 2–4', action: 'Let AU post — avoid new hard pulls', risk: 'Low' },
  { week: 'Month 2', action: 'Re-check utilization & mix — plan next move', risk: 'Medium' },
  { week: 'Month 3+', action: 'Funding apps only if inquiry budget allows', risk: 'High if rushed' },
];

const AGENCY_ITEMS = [
  { id: 'brand_kit', label: 'White-label brand kit configured', hint: 'Logo, colors, domain email for partner comms.' },
  { id: 'compliance_copy', label: 'Compliance-safe promo copy approved', hint: 'No outcome guarantees in marketing.' },
  { id: 'onboarding_sop', label: 'Partner onboarding SOP documented', hint: 'Intake → report → dispute → funding handoff.' },
  { id: 'partner_portal', label: 'Partner portal walkthrough complete', hint: 'Know dispute, debt, and funding lanes.' },
  { id: 'first_lead', label: 'First lead magnet funnel live', hint: 'QR or link with UTM tracking.' },
  { id: 'nurture_seq', label: 'Nurture sequence tested', hint: 'Welcome email + 7-day follow-up.' },
];

const SPECIALIST_ITEMS = [
  { id: 'profile', label: 'Specialist profile completed', hint: 'Bio, specialties, availability.' },
  { id: 'dispute_lab', label: 'Dispute workflow lab finished', hint: 'Evidence vault + letter stream basics.' },
  { id: 'compliance', label: 'Compliance training acknowledged', hint: 'Educational positioning only.' },
  { id: 'first_partner', label: 'First partner activation plan', hint: 'Target niche and outreach script.' },
  { id: 'os_tour', label: 'Partner OS tour complete', hint: 'Dashboard, letters, reports, messaging.' },
];

const AFFILIATE_ITEMS = [
  { id: 'link', label: 'Referral link generated', hint: 'Unique code with attribution tracking.' },
  { id: 'qr', label: 'QR asset saved', hint: 'Print-ready for events and flyers.' },
  { id: 'copy_pack', label: 'Compliant social copy customized', hint: 'No income or score guarantees.' },
  { id: 'funnel_map', label: 'Funnel map chosen', hint: 'Match referrals to restore, debt, or business lanes.' },
];

type Props = { leadId: string; email: string };

export function FunnelTradelineTimingPlanner() {
  return (
    <div className="space-y-4">
      <PublicInquiryBudgetCalculator />
      <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-3 text-left`}>
        <div className="flex items-center gap-2 text-fuchsia-200 text-[10px] font-black uppercase tracking-widest">
          <Clock size={14} /> Tradeline timing ladder
        </div>
        <div className="grid gap-2">
          {TIMING_LADDER.map((row) => (
            <div key={row.week} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-black/20">
              <div>
                <div className={`text-xs font-bold text-fuchsia-300 uppercase tracking-wider`}>{row.week}</div>
                <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{row.action}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase shrink-0 ${row.risk === 'High if rushed' ? 'text-rose-300' : row.risk === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>
                {row.risk}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FunnelAgencyActivationToolkit({ leadId, email }: Props) {
  return (
    <FunnelToolkitChecklistPanel
      leadId={leadId}
      email={email}
      funnelId="agency"
      title="30-day agency launch kit"
      subtitle="White-label OS onboarding — check off each milestone before your first partner."
      accent="violet"
      items={AGENCY_ITEMS}
      footerTip="Book your solutions advisor call to review compliance positioning for your market."
    />
  );
}

export function FunnelSpecialistActivationToolkit({ leadId, email }: Props) {
  return (
    <FunnelToolkitChecklistPanel
      leadId={leadId}
      email={email}
      funnelId="specialist_apply"
      title="Specialist activation workbook"
      subtitle="From application to first partner — track your onboarding milestones."
      accent="emerald"
      items={SPECIALIST_ITEMS}
    />
  );
}

export function FunnelAffiliateReferralToolkit({ leadId, email }: Props) {
  const refCode = useMemo(() => `FC-${leadId.slice(0, 8).toUpperCase()}`, [leadId]);
  const referralUrl = useMemo(() => {
    if (typeof window === 'undefined') return `https://finelycred.com/g/${refCode}`;
    return `${window.location.origin}/g/${refCode}?utm_source=affiliate&utm_medium=toolkit`;
  }, [refCode]);

  return (
    <div className="space-y-4">
      <FunnelToolkitChecklistPanel
        leadId={leadId}
        email={email}
        funnelId="affiliate"
        title="Affiliate referral launch kit"
        subtitle="Set up links, QR, and compliant copy before your first referral."
        accent="fuchsia"
        items={AFFILIATE_ITEMS}
      />
      <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-3 text-left`}>
        <div className="flex items-center gap-2 text-fuchsia-200 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={14} /> Your referral preview
        </div>
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Code</div>
        <div className={`font-mono text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{refCode}</div>
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-2`}>Share link</div>
        <input readOnly value={referralUrl} className="w-full text-xs font-mono p-2 rounded-lg bg-black/30 border border-white/10 text-emerald-200" onFocus={(e) => e.target.select()} />
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Full referral dashboard unlocks in your portal preview. Educational referrals only — no income guarantees.
        </p>
      </div>
    </div>
  );
}
