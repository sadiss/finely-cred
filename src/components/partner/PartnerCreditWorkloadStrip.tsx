import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  computePartnerCreditWorkloadSnapshot,
  formatCreditWorkloadSummary,
  type PartnerCreditWorkloadSnapshot,
} from '../../lib/partnerCreditWorkloadSnapshot';
import { NEGATIVE_PLAYBOOKS, type NegativeType } from '../../creditReports/negativePlaybooks';
import { finelyOsCatalogCard, finelyOsGlowKpi } from '../../features/os/finelyOsLightUi';

const DISPLAY_ORDER: NegativeType[] = [
  'collection',
  'inquiry',
  'public_record',
  'repossession',
  'foreclosure',
  'student_loan',
  'bankruptcy',
  'identity_theft',
];

function negativeLabel(key: NegativeType): string {
  if (key === 'collection') return 'Coll. & charge-offs';
  const label = NEGATIVE_PLAYBOOKS[key]?.label ?? key;
  return label.replace(/ verification| accounting/gi, '').slice(0, 22);
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
  const negativeChips = DISPLAY_ORDER.filter((k) => {
    if (k === 'collection') {
      const n = (snap.negativeCounts.collection ?? 0) + (snap.negativeCounts.charge_off ?? 0);
      return n > 0;
    }
    return (snap.negativeCounts[k] ?? 0) > 0;
  }).slice(0, compact ? 4 : 6);

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
    <div className={`${finelyOsCatalogCard('sky')} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-base font-extrabold text-white">
          <BarChart3 size={18} className="text-sky-300" />
          Credit workload
        </div>
        <div className="text-sm font-bold text-white/70">{formatCreditWorkloadSummary(snap)}</div>
      </div>
      <div className="flex flex-wrap gap-3">
        {negativeChips.map((k, i) => (
          <div key={k} className={`${finelyOsGlowKpi((['sky', 'violet', 'emerald', 'rose'] as const)[i % 4])} px-4 py-3`}>
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/70">{negativeLabel(k)}</div>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {k === 'collection'
                ? (snap.negativeCounts.collection ?? 0) + (snap.negativeCounts.charge_off ?? 0)
                : snap.negativeCounts[k]}
            </div>
          </div>
        ))}
        {workChips.map((c, i) => (
          <div key={c.label} className={`${finelyOsGlowKpi((['violet', 'emerald', 'sky', 'rose'] as const)[i % 4])} px-4 py-3`}>
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/70">{c.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
