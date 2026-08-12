import React, { useMemo, useRef, useState } from 'react';
import { ScrollText } from 'lucide-react';
import type { LetterRecord, LetterType } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import { listLettersByPartner } from '../../data/lettersRepo';
import { deleteLetter } from '../../data/lettersRepo';
import { SavedLetterCard, SAVED_LETTER_DECK_ACCENTS } from './SavedLetterCard';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

export function LetterStudioSavedVaultStrip({
  partnerId,
  types,
  title = 'Letters vault',
  subtitle = 'Saved PDFs from this studio — open, mail, or edit without leaving the page.',
  storeVersion = 0,
  evidence = [],
  onOpenFullVault,
  accent = 'emerald',
  highlightLetterId = null,
  suppressAutoPreview = false,
  onLetterSaved,
  canMail: canMailProp,
  onMailLetter,
}: {
  partnerId: string;
  types: LetterType[];
  title?: string;
  subtitle?: string;
  storeVersion?: number;
  evidence?: EvidenceItem[];
  onOpenFullVault?: () => void;
  accent?: 'emerald' | 'violet' | 'amber' | 'sky' | 'rose';
  highlightLetterId?: string | null;
  /** When true, highlight vault cards but do not auto-open preview/detail modals. */
  suppressAutoPreview?: boolean;
  onLetterSaved?: () => void;
  /** Defaults to platform letterMailing feature flag when omitted */
  canMail?: boolean;
  onMailLetter?: (letter: LetterRecord) => void;
}) {
  const [openErr, setOpenErr] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const draftPreviewOpeners = useRef(new Map<string, () => void>());
  const canMail = canMailProp ?? isFeatureEnabled('letterMailing');

  const letters = useMemo(() => {
    void storeVersion;
    void refresh;
    const typeSet = new Set(types);
    return listLettersByPartner(partnerId)
      .filter((l) => !l.archivedAt && typeSet.has(l.type))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [partnerId, types, storeVersion, refresh]);

  const openPdf = async (l: LetterRecord) => {
    setOpenErr(null);
    if (l.pdfBlobRef) {
      const result = await openBlobRefInNewTab({ blobRef: l.pdfBlobRef, mimeType: 'application/pdf' });
      if (!result.ok) setOpenErr(result.message);
      return;
    }
    if (l.body) {
      const openDraft = draftPreviewOpeners.current.get(l.id);
      if (openDraft) {
        openDraft();
        return;
      }
      setOpenErr('Draft saved — click the card to read the letter, or use Save PDF → Vault to add a PDF.');
      return;
    }
    setOpenErr('No PDF on this letter yet — open the card to read the saved draft, or generate a PDF from the preview.');
  };

  return (
    <section
      id="fc-letter-studio-vault"
      className={`${finelyOsCatalogCardCompact(accent)} !p-4 sm:!p-5 space-y-4 scroll-mt-4`}
      data-fc-studio-vault-strip="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white">
            <ScrollText size={18} className="shrink-0 opacity-80" />
            <h3 className="text-base sm:text-lg font-black tracking-tight">{title}</h3>
          </div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>{subtitle}</p>
        </div>
        {onOpenFullVault ? (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onOpenFullVault}>
            Open full vault
          </button>
        ) : null}
      </div>

      {openErr ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{openErr}</div>
      ) : null}

      {letters.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          No saved letters yet. Choose a validation letter above — it saves here automatically. Add a PDF anytime with{' '}
          <span className="text-white font-semibold">Save PDF → Vault</span> in the preview.
        </p>
      ) : (
        <FinelyOsPaginatedStack
          items={letters}
          pageSize={6}
          itemSpacingClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          renderItem={(l, index) => (
            <SavedLetterCard
              key={l.id}
              id={`studio-vault-${l.id}`}
              letter={l}
              deckAccent={SAVED_LETTER_DECK_ACCENTS[index % SAVED_LETTER_DECK_ACCENTS.length]}
              highlighted={highlightLetterId === l.id}
              defaultSnapshotOpen={!suppressAutoPreview && highlightLetterId === l.id}
              autoOpenPreview={!suppressAutoPreview && highlightLetterId === l.id}
              evidence={evidence}
              canMail={canMail}
              pdfDisabled={false}
              mailDisabled={!l.pdfBlobRef}
              onOpenLetter={(openPreview) => {
                draftPreviewOpeners.current.set(l.id, openPreview);
                return () => {
                  draftPreviewOpeners.current.delete(l.id);
                };
              }}
              onOpenPdf={() => void openPdf(l)}
              onMail={onMailLetter ? () => onMailLetter(l) : undefined}
              onDelete={() => {
                void deleteLetter({ letterId: l.id }).then(() => {
                  draftPreviewOpeners.current.delete(l.id);
                  setRefresh((v) => v + 1);
                });
              }}
              onSaved={() => {
                setRefresh((v) => v + 1);
                onLetterSaved?.();
              }}
            />
          )}
        />
      )}
    </section>
  );
}
