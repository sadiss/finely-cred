import React from 'react';
import type { Partner } from '../../domain/partners';
import type { EvidenceItem } from '../../domain/evidence';
import type { LetterRecord, LetterType } from '../../domain/letters';
import { PartnerCreditWorkloadStrip } from '../partner/PartnerCreditWorkloadStrip';
import { LetterStudioSavedVaultStrip } from './LetterStudioSavedVaultStrip';
import { FINELY_OS_ENTITY_BODY, finelyOsCatalogCardCompact } from '../../features/os/finelyOsLightUi';
import type { LetterStudioTrackMode } from './LetterTrackTabs';

const ALL_STUDIO_LETTER_TYPES: LetterType[] = ['dispute', 'validation', 'court'];

export function LetterStudioOverviewPanel({
  partner,
  mode,
  storeVersion,
  evidence,
  onOpenFullVault,
  vaultHighlightLetterId,
  suppressVaultAutoPreview,
  onVaultLetterSaved,
  canMailLetters,
  onMailLetter,
}: {
  partner: Partner;
  mode: LetterStudioTrackMode;
  storeVersion: number;
  evidence: EvidenceItem[];
  onOpenFullVault?: () => void;
  vaultHighlightLetterId?: string | null;
  suppressVaultAutoPreview?: boolean;
  onVaultLetterSaved?: () => void;
  canMailLetters?: boolean;
  onMailLetter?: (letter: LetterRecord) => void;
}) {
  const vaultCommon = {
    partnerId: partner.id,
    storeVersion,
    evidence,
    onOpenFullVault,
    highlightLetterId: vaultHighlightLetterId ?? null,
    suppressAutoPreview: suppressVaultAutoPreview,
    onLetterSaved: onVaultLetterSaved,
    canMail: canMailLetters,
    onMailLetter,
  };

  return (
    <div className="space-y-4">
      {mode === 'credit' ? (
        <section className={`${finelyOsCatalogCardCompact('sky')} !p-4 space-y-3`}>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-sky-200/90">Credit analysis</div>
            <h3 className="text-base font-black text-white tracking-tight mt-0.5">What needs attention on your report</h3>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Negative counts, open cases, and letter progress — review here before you work in Bureaus.
            </p>
          </div>
          <PartnerCreditWorkloadStrip partnerId={partner.id} compact />
        </section>
      ) : (
        <section className={`${finelyOsCatalogCardCompact('violet')} !p-4`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-200/90">Letters overview</div>
          <h3 className="text-base font-black text-white tracking-tight mt-0.5">All saved letters</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Bureau disputes, validation, and court/affidavit PDFs in one place. Each work tab also keeps its own vault for letters you generate there.
          </p>
        </section>
      )}

      <LetterStudioSavedVaultStrip
        {...vaultCommon}
        types={ALL_STUDIO_LETTER_TYPES}
        accent="emerald"
        groupByBureau
        title="Letters vault — all saved letters"
        subtitle="Credit bureau disputes, validation, and court/affidavit letters — preview, mail, or delete. Work tabs show letters for that track too."
      />
    </div>
  );
}
