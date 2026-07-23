import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  computePartnerCreditWorkloadSnapshot,
  formatCreditWorkloadSummary,
  type PartnerCreditWorkloadSnapshot,
} from '../../lib/partnerCreditWorkloadSnapshot';
import { NEGATIVE_PLAYBOOKS, type NegativeType } from '../../creditReports/negativePlaybooks';
import { finelyOsGlowKpi } from '../../features/os/finelyOsLightUi';

const DISPLAY_ORDER: NegativeType[] = [
  'collection',
  'charge_off',
  'inquiry',
  'public_record',
  'repossession',
  'foreclosure',
  'student_loan',
  'bankruptcy',
  'identity_theft',
];

function negativeLabel(key: NegativeType): string {
  const label = NEGATIVE_PLAYBOOKS[key]?.label ?? key;
  return label.replace(/ verification| accounting/gi, '').slice(0, 18);
}

export function PartnerCreditWorkloadStrip({
  partnerId,
  selectedDisputes,
  evidenceByCandidateId,
  reasonsByCandidateId,
  compact = false,
}: {
  partnerId: string;
  selectedDisputes?: Array<{ key: string }>;
  evidenceByCandidateId?: Record<string, string>;
  reasonsByCandidateId?: Record<string, string[]>;
  compact?: boolean;
}) {
  const snap = useMemo(
    () =>
      computePartnerCreditWorkloadSnapshot(partnerId, {
        selectedDisputes,
        evidenceByCandidateId,
        reasonsByCandidateId,
      }),
    [partnerId, selectedDisputes, evidenceByCandidateId, reasonsByCandidateId],
  );

  return <CreditWorkloadChips snap={snap} compact={compact} />;
}

export function CreditWorkloadChips({
  snap,
  compact,
}: {
  snap: PartnerCreditWorkloadSnapshot;
  compact?: boolean;
}) {
  const negativeChips = DISPLAY_ORDER.filter((k) => (snap.negativeCounts[k] ?? 0) > 0).slice(0, compact ? 4 : 6);

  const workChips = [
    snap.selectedDisputes > 0 ? { label: 'Selected', value: snap.selectedDisputes } : null,
    snap.pendingEvidence > 0 ? { label: 'Need evidence', value: snap.pendingEvidence } : null,
    snap.pendingReasons > 0 ? { label: 'Need reasons', value: snap.pendingReasons } : null,
    snap.openDisputeCases > 0 ? { label: 'Open cases', value: snap.openDisputeCases } : null,
    snap.lettersGenerated > 0 ? { label: 'Letters', value: snap.lettersGenerated } : null,
    snap.disputeRoundsActive > 0 ? { label: 'Awaiting response', value: snap.disputeRoundsActive } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  if (!snap.reportsCount && !snap.totalNegatives && workChips.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 !p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
          <BarChart3 size={14} className="text-sky-300" />
          Credit workload
        </div>
        <div className="text-[10px] text-white/45">{formatCreditWorkloadSummary(snap)}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {negativeChips.map((k) => (
          <div key={k} className={`${finelyOsGlowKpi('sky')} !px-3 !py-2`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{negativeLabel(k)}</div>
            <div className="text-sm font-bold text-white">{snap.negativeCounts[k]}</div>
          </div>
        ))}
        {workChips.map((c) => (
          <div key={c.label} className={`${finelyOsGlowKpi('amber')} !px-3 !py-2`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{c.label}</div>
            <div className="text-sm font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
