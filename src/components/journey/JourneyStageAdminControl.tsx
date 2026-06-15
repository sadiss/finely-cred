import React, { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { Partner, PartnerJourneyStage } from '../../domain/partners';
import { adminUpsertPartner } from '../../data/partnersRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { inferPartnerJourneyStage, syncPartnerJourneyStage } from '../../lib/partnerLifecycleEngine';
import { emitPartnerStageChanged } from '../../lib/crmLifecycleBridge';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL_INNER,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

const STAGES: { id: PartnerJourneyStage; label: string }[] = [
  { id: 'intake', label: 'Intake' },
  { id: 'report_upload', label: 'Reports upload' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'letters', label: 'Letters' },
  { id: 'mailing', label: 'Mailing' },
  { id: 'funding', label: 'Funding' },
  { id: 'complete', label: 'Complete' },
];

type Props = {
  partner: Partner;
  actorEmail?: string;
  onUpdated?: () => void;
};

/** Admin/case-team control — partners cannot self-advance journey steps. */
export function JourneyStageAdminControl({ partner, actorEmail, onUpdated }: Props) {
  const current = partner.journeyStage ?? 'intake';
  const inferred = inferPartnerJourneyStage(partner.id, current);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const syncFromSignals = async () => {
    setBusy(true);
    setHint(null);
    try {
      const next = await syncPartnerJourneyStage(partner.id, 'admin_sync');
      if (next && next !== current) {
        setHint(`Advanced to ${STAGES.find((s) => s.id === next)?.label ?? next} from Work OS signals.`);
      } else {
        setHint(`Signals match current step (${STAGES.find((s) => s.id === current)?.label ?? current}).`);
      }
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Case journey step</div>
      <p className={`text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
        Partners see this on their expedition map. Only your team can move them forward — they cannot change it themselves.
      </p>
      {inferred !== current ? (
        <p className={`text-xs text-amber-200/90 ${FINELY_OS_ENTITY_BODY}`}>
          Signals suggest: <strong>{STAGES.find((s) => s.id === inferred)?.label ?? inferred}</strong>
        </p>
      ) : null}
      <select
        value={current}
        onChange={async (e) => {
          const next = e.target.value as PartnerJourneyStage;
          const previous = partner.journeyStage;
          await adminUpsertPartner({
            ...partner,
            journeyStage: next,
            journeySignals: {
              ...(partner.journeySignals ?? {}),
              assignedByTeam: true,
              assignedAt: new Date().toISOString(),
            },
          });
          emitPartnerStageChanged({ partnerId: partner.id, previousStage: previous, stage: next, reason: 'admin_manual' });
          addAuditEvent({
            partnerId: partner.id,
            actorType: 'admin',
            actorEmail,
            action: `partner.journey_stage_set:${next}`,
            entityType: 'partner',
            entityId: partner.id,
            meta: { journeyStage: next },
          });
          onUpdated?.();
        }}
        className={FINELY_OS_ENTITY_SELECT}
      >
        {STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="button" disabled={busy} onClick={() => void syncFromSignals()} className={FINELY_OS_SECONDARY_BTN}>
        {busy ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Auto-sync from signals
      </button>
      {hint ? <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{hint}</p> : null}
    </div>
  );
}
