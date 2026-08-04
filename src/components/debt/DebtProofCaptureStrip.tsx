import React, { useMemo, useState } from 'react';
import type { Partner } from '../../domain/partners';
import type { DebtCase } from '../../domain/debt';
import type { ParsedCreditReport } from '../../domain/creditReports';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { UnifiedEvidenceCapture } from '../evidence/UnifiedEvidenceCapture';
import { FINELY_OS_ENTITY_BODY } from '../../features/os/finelyOsLightUi';
import type { FinelyOsGlowAccent } from '../../features/os/finelyOsLightUi';

const ACCENT_BORDER: Record<FinelyOsGlowAccent, string> = {
  emerald: 'border-emerald-400/30',
  fuchsia: 'border-fuchsia-400/30',
  sky: 'border-sky-400/30',
  amber: 'border-amber-400/30',
  rose: 'border-rose-400/30',
  violet: 'border-violet-400/30',
};

function mapUploadContext(
  uploadContext: 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy' | 'validation' | 'court',
): 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy' {
  if (uploadContext === 'foreclosure') return 'foreclosure';
  if (uploadContext === 'repossession') return 'repossession';
  if (uploadContext === 'bankruptcy') return 'bankruptcy';
  return 'debt';
}

export function DebtProofCaptureStrip({
  partner,
  debt,
  debtCaseId,
  bankruptcyCaseId,
  accent = 'emerald',
  uploadContext = 'debt',
  defaultOpen,
  proofCount: proofCountProp,
  onUploaded,
  onDebtChange,
  reports,
  autoApplyOnHighConfidence = true,
}: {
  partner: Partner;
  debt?: DebtCase | null;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
  accent?: FinelyOsGlowAccent;
  uploadContext?: 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy' | 'validation' | 'court';
  /** Force details open on mount */
  defaultOpen?: boolean;
  /** Override auto-counted evidence files */
  proofCount?: number;
  onUploaded?: () => void;
  /** Required for scrape Apply to write addresses onto the open Validation / Court case. */
  onDebtChange?: (d: DebtCase) => void;
  reports?: Array<{ id?: string; parsed?: ParsedCreditReport | null }>;
  autoApplyOnHighConfidence?: boolean;
}) {
  const [version, setVersion] = useState(0);
  const evidenceCount = useMemo(() => {
    void version;
    if (proofCountProp != null) return proofCountProp;
    return listEvidenceByPartner(partner.id).length;
  }, [partner.id, proofCountProp, version]);

  const [open, setOpen] = useState(() => defaultOpen === true || (defaultOpen !== false && evidenceCount === 0));

  const summaryLabel =
    evidenceCount > 0
      ? `Proof & uploads (${evidenceCount} in vault — Documents is the hub)`
      : 'Proof & uploads (optional — Documents vault is the hub)';

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`rounded-xl border bg-black/25 !p-3 ${ACCENT_BORDER[accent] ?? ACCENT_BORDER.emerald}`}
    >
      <summary className="cursor-pointer select-none text-sm font-semibold text-white">{summaryLabel}</summary>
      <div className="mt-3 space-y-2">
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Same capture deck as Documents — type chips, drag-drop, camera, gallery, and scrape intel. Optional here;{' '}
          <span className="text-white/75">Documents</span> is the full hub. Scraped party addresses auto-fill empty
          Validation / Court mailing fields when a case is open.
        </p>
        <UnifiedEvidenceCapture
          partner={partner}
          email={partner.profile.email}
          debt={debt ?? null}
          debtCaseId={debtCaseId || debt?.id}
          bankruptcyCaseId={bankruptcyCaseId}
          uploadContext={mapUploadContext(uploadContext)}
          compact
          enableScrape
          reports={reports}
          onDebtChange={onDebtChange}
          autoApplyOnHighConfidence={Boolean(onDebtChange) && autoApplyOnHighConfidence}
          onUploaded={() => {
            setVersion((v) => v + 1);
            onUploaded?.();
          }}
        />
      </div>
    </details>
  );
}
