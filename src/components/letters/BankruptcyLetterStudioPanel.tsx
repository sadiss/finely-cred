import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import type { BankruptcyLetterType } from '../../domain/bankruptcyLegal';
import type { BankruptcyCase, BankruptcyChapter } from '../../domain/bankruptcyCase';
import {
  createBankruptcyCase,
  listBankruptcyByPartner,
  upsertBankruptcyCase,
} from '../../data/bankruptcyRepo';
import { getCanonicalPartnerIdentity } from '../../utils/canonicalPartnerIdentity';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { hasEntitlement } from '../../data/billingRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { BankruptcyCenterView } from '../bankruptcy/BankruptcyCenterView';
import { BankruptcyFilingCenterView } from '../bankruptcy/BankruptcyFilingCenterView';
import { DebtProofCaptureStrip } from '../debt/DebtProofCaptureStrip';
import { PartnerDebtSnapshotStrip } from '../debt/PartnerDebtSnapshotStrip';
import { DebtLetterDraftWorkspace } from './DebtLetterPreview';
import { LetterStepPath } from './LetterStepPath';
import { LetterDisclaimerFooter } from './LetterAddressSummary';
import { buildDebtLetterPathSteps, runDebtLetterStep, type DebtLetterStepId } from '../../lib/letterDebtFlow';
import { SELF_FILING_DISCLAIMER } from '../../legal/bankruptcyFilingKnowledgePack';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { upsertLetter } from '../../data/lettersRepo';
import { newId } from '../../utils/ids';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

type Track = 'filing' | 'credit';

export function BankruptcyLetterStudioPanel({
  partner,
  onSavedToVault,
  showPathSwitcher,
  onSwitchToValidation,
  onSwitchToCourt,
}: {
  partner: Partner;
  onSavedToVault?: (letterId: string) => void;
  showPathSwitcher?: boolean;
  onSwitchToValidation?: () => void;
  onSwitchToCourt?: () => void;
}) {
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track>('filing');
  const [bkId, setBkId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState<null | { id: BankruptcyLetterType; text: string }>(null);
  const [busy, setBusy] = useState(false);
  const [addChapter, setAddChapter] = useState<BankruptcyChapter>('7');

  const cases = useMemo(() => {
    void version;
    return listBankruptcyByPartner(partner.id);
  }, [partner.id, version]);

  const bkCase = useMemo(() => cases.find((c) => c.id === bkId) ?? cases[0] ?? null, [cases, bkId]);

  const canonical = useMemo(() => {
    const partnerCf = getCustomFieldValues('partners', partner.id, FINELY_TENANT_ID);
    return getCanonicalPartnerIdentity({ partner, partnerCf });
  }, [partner]);

  const canTemplates = hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates);

  const [savedLetterId, setSavedLetterId] = useState<string | null>(null);

  const bkPathSteps = useMemo(
    () =>
      buildDebtLetterPathSteps({
        track: 'bankruptcy',
        hasCase: Boolean(bkCase),
        proofCount: 0,
        hasChosenLetter: Boolean(draft),
        hasDraftBody: Boolean(draft?.text?.trim()),
        savedToVault: Boolean(savedLetterId),
      }),
    [bkCase, draft, savedLetterId],
  );

  const runBkStep = (id: DebtLetterStepId) => {
    runDebtLetterStep(id, {
      openDraft: () => {
        if (draft) document.getElementById('fc-bk-step-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      openVault: () => navigate('/portal/letters/vault'),
    });
    if (id === 'escalate') navigate('/portal/escalations?tab=regulatory');
  };

  const runBkContinue = () => {
    const main = bkPathSteps.filter((s) => !s.optional);
    const next = main.find((s) => !s.done && !s.disabled) ?? main.find((s) => !s.done) ?? null;
    if (next) runBkStep(next.id as DebtLetterStepId);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const createdAt = new Date().toISOString();
      const title = `Bankruptcy: ${draft.id}`;
      const pdf = await generateTextPdfToVault({
        text: draft.text,
        filename: `FinelyCred_bankruptcy_${draft.id}_${createdAt.slice(0, 10)}.pdf`,
        meta: { partnerId: partner.id, context: 'bankruptcy', letterSpecId: draft.id },
      });
      const letterId = newId('letter');
      upsertLetter({
        id: letterId,
        partnerId: partner.id,
        title,
        type: 'validation',
        bureau: null,
        status: 'generated',
        createdAt,
        updatedAt: createdAt,
        body: draft.text,
        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
        pdfFilename: pdf.filename,
        meta: {
          context: 'bankruptcy',
          templateBaseId: 'bankruptcy_center',
          templateVariantId: draft.id,
          templateCategory: 'bankruptcy',
        },
      } as any);
      setDraft(null);
      setSavedLetterId(letterId);
      onSavedToVault?.(letterId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <LetterStepPath
        title="Bankruptcy letter path"
        steps={bkPathSteps}
        onStep={(id) => runBkStep(id as DebtLetterStepId)}
        onContinue={runBkContinue}
      />
      <PartnerDebtSnapshotStrip partnerId={partner.id} compact accent="sky" />
      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={finelyOsMicroStat('sky')}>Bankruptcy workstation</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showPathSwitcher && onSwitchToValidation ? (
              <button type="button" onClick={onSwitchToValidation} className={FINELY_OS_SECONDARY_BTN}>
                Validation <ArrowRight size={12} />
              </button>
            ) : null}
            {showPathSwitcher && onSwitchToCourt ? (
              <button type="button" onClick={onSwitchToCourt} className={FINELY_OS_SECONDARY_BTN}>
                Court <ArrowRight size={12} />
              </button>
            ) : null}
            <div className="flex gap-1.5 p-1 rounded-lg border border-white/10 bg-black/25">
            {(
              [
                { id: 'filing' as const, label: 'File' },
                { id: 'credit' as const, label: 'Bureau disputes' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTrack(t.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                  track === t.id ? 'bg-sky-500/25 text-sky-100' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t.label}
              </button>
            ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-white/60">{SELF_FILING_DISCLAIMER}</p>
      </div>

      <div id="fc-debt-step-case" className={`${finelyOsCatalogCardCompact('violet')} flex flex-wrap gap-3 items-end scroll-mt-3`}>
        <div>
          <label className={FINELY_OS_ENTITY_LABEL}>Bankruptcy case</label>
          <select
            value={bkCase?.id ?? ''}
            onChange={(e) => setBkId(e.target.value || null)}
            className={`${FINELY_OS_ENTITY_SELECT} mt-1 min-w-[200px]`}
          >
            <option value="">— Select or create —</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                Ch {c.chapter} • {c.status} • {c.caseNumber || c.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={FINELY_OS_ENTITY_LABEL}>New chapter</label>
          <select
            value={addChapter}
            onChange={(e) => setAddChapter(e.target.value as BankruptcyChapter)}
            className={`${FINELY_OS_ENTITY_SELECT} mt-1`}
          >
            <option value="7">Chapter 7</option>
            <option value="13">Chapter 13</option>
            <option value="11">Chapter 11</option>
          </select>
        </div>
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
          onClick={() => {
            const c = createBankruptcyCase({ partnerId: partner.id, chapter: addChapter, status: 'pre_filing' });
            setBkId(c.id);
            setVersion((v) => v + 1);
          }}
        >
          <Plus size={14} /> New case
        </button>
      </div>

      <div id="fc-debt-step-choose" className="scroll-mt-3">
      {track === 'filing' ? (
        <BankruptcyFilingCenterView
          partner={partner}
          email={partner.profile.email}
          bkCase={bkCase}
          onUpdateCase={(c) => {
            upsertBankruptcyCase(c);
            setVersion((v) => v + 1);
          }}
        />
      ) : (
        <BankruptcyCenterView
          partnerId={partner.id}
          partnerName={canonical?.fullName || partner.profile.fullName}
          partnerEmail={partner.profile.email}
          partnerState={canonical?.state}
          address1={canonical?.address1 ?? canonical?.addressLine1}
          city={canonical?.city}
          postalCode={canonical?.postalCode}
          canSeeTemplates={canTemplates}
          onBuildDraft={(id, text) => setDraft({ id, text })}
        />
      )}

      {draft ? (
        <div id="fc-bk-step-draft" className={`${finelyOsCatalogCardCompact('sky')} space-y-4 scroll-mt-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-white text-sm">Draft — {draft.id}</h3>
            <div className="flex gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void saveDraft()}>
                Save to vault
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setDraft(null)}>
                Close
              </button>
            </div>
          </div>
          <DebtLetterDraftWorkspace
            text={draft.text}
            onTextChange={(text) => setDraft({ ...draft, text })}
            accent="sky"
            editorLabel="Bankruptcy letter"
            heroLayout
          />
        </div>
      ) : null}
      </div>

      {partner ? (
        <div id="fc-debt-step-proof" className="scroll-mt-3">
          <DebtProofCaptureStrip
            partner={partner}
            bankruptcyCaseId={bkCase?.id}
            accent="sky"
            uploadContext="bankruptcy"
          />
        </div>
      ) : null}
      <LetterDisclaimerFooter />
    </div>
  );
}
