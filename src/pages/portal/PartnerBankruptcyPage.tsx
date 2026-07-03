import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { BankruptcyCenterView } from '../../components/bankruptcy/BankruptcyCenterView';
import { BankruptcyFilingCenterView } from '../../components/bankruptcy/BankruptcyFilingCenterView';
import { BankruptcyCommsHandoffStrip } from '../../components/bankruptcy/BankruptcyCommsHandoffStrip';
import { PartnerLaneCoachPanel } from '../../components/chat/PartnerLaneCoachPanel';
import { PartnerSuccessExperiencePanel } from '../../components/partner/PartnerSuccessExperiencePanel';
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
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { upsertLetter } from '../../data/lettersRepo';
import { newId } from '../../utils/ids';
import { DebtLetterDraftWorkspace } from '../../components/letters/DebtLetterPreview';
import { SmartProofUploader } from '../../components/evidence/SmartProofUploader';
import { getBankruptcyScenarioSelection } from '../../data/bankruptcyLaneStateRepo';
import { SELF_FILING_DISCLAIMER } from '../../legal/bankruptcyFilingKnowledgePack';

type Track = 'filing' | 'credit';

export default function PartnerBankruptcyPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [track, setTrack] = useState<Track>('filing');
  const [bkId, setBkId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState<null | { id: BankruptcyLetterType; text: string }>(null);
  const [busy, setBusy] = useState(false);
  const [addChapter, setAddChapter] = useState<BankruptcyChapter>('7');

  const cases = useMemo(() => {
    if (!partner) return [];
    void version;
    return listBankruptcyByPartner(partner.id);
  }, [partner, version]);

  const bkCase = useMemo(() => cases.find((c) => c.id === bkId) ?? cases[0] ?? null, [cases, bkId]);

  const canonical = useMemo(() => {
    if (!partner) return null;
    const partnerCf = getCustomFieldValues('partners', partner.id, FINELY_TENANT_ID);
    return getCanonicalPartnerIdentity({ partner, partnerCf });
  }, [partner]);

  const bankruptcyScenarioId = useMemo(() => {
    void version;
    return getBankruptcyScenarioSelection(partner?.id ?? '')?.scenarioId;
  }, [partner?.id, version]);

  const canTemplates = partner ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates) : false;

  if (!partner) return null;

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
      upsertLetter({
        id: newId('letter'),
        partnerId: partner.id,
        type: 'validation',
        title,
        createdAt,
        body: draft.text,
        status: 'generated',
        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
        pdfFilename: pdf.filename,
        meta: {
          context: 'template',
          templateBaseId: 'bankruptcy_center',
          templateVariantId: draft.id,
          templateTone: 'formal',
          templateVersion: 1,
          templateCategory: 'bankruptcy',
        },
      });
      navigate('/portal/letters/vault');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCase = () => {
    const c = createBankruptcyCase({ partnerId: partner.id, chapter: addChapter, status: 'pre_filing' });
    setBkId(c.id);
    setVersion((v) => v + 1);
  };

  const handleUpdateCase = (c: BankruptcyCase) => {
    upsertBankruptcyCase(c);
    setVersion((v) => v + 1);
  };

  return (
    <PageShell title="Bankruptcy Center" badge="Partner Portal">
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
        <FinelyUnifiedHubLayout
          title="Bankruptcy Center"
          subtitle="Liberation paths — save your home, stop collections, fresh start, post-discharge bureau fixes"
          accent="sky"
          tabs={[
            { id: 'filing', label: 'File bankruptcy' },
            { id: 'credit', label: 'Fix credit reporting' },
          ]}
          activeTab={track}
          onTabChange={(id) => setTrack(id as Track)}
        >
          <div className={FINELY_OS_PAGE}>
            <div className="mb-4 grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <PartnerLaneCoachPanel
                  partnerId={partner.id}
                  partnerName={canonical?.fullName || partner.profile.fullName}
                  lane={track === 'filing' ? 'bankruptcy' : 'bankruptcy_discharge'}
                  scenarioId={bankruptcyScenarioId}
                  coachSubtitle="Your on-duty bankruptcy specialist — different from bureau and debt coaches"
                  compact
                />
              </div>
              <div className="lg:col-span-2">
                <PartnerSuccessExperiencePanel partnerId={partner.id} lane="bankruptcy" compact />
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-3 mb-4 text-xs text-white/70`}>{SELF_FILING_DISCLAIMER}</div>

            {track === 'filing' || track === 'credit' ? (
              <div className="mb-4">
                <BankruptcyCommsHandoffStrip partnerId={partner.id} />
              </div>
            ) : null}

            <div className={`${finelyOsCatalogCard('violet')} !p-4 mb-4 flex flex-wrap gap-3 items-end`}>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Your bankruptcy case</label>
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
                <label className={FINELY_OS_ENTITY_LABEL}>New case chapter</label>
                <select value={addChapter} onChange={(e) => setAddChapter(e.target.value as BankruptcyChapter)} className={`${FINELY_OS_ENTITY_SELECT} mt-1`}>
                  <option value="7">Chapter 7</option>
                  <option value="13">Chapter 13</option>
                  <option value="11">Chapter 11</option>
                </select>
              </div>
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={handleAddCase}>
                <Plus size={14} /> New case
              </button>
            </div>

            {track === 'filing' ? (
              <BankruptcyFilingCenterView partner={partner} email={partner.profile.email} bkCase={bkCase} onUpdateCase={handleUpdateCase} />
            ) : (
              <>
                <div className="mb-4">
                  <SmartProofUploader
                    partner={partner}
                    email={partner.profile.email}
                    bankruptcyCaseId={bkCase?.id}
                    uploadContext="bankruptcy"
                    compact
                  />
                </div>
                <BankruptcyCenterView
                partnerName={canonical?.fullName || partner.profile.fullName}
                partnerEmail={partner.profile.email}
                partnerState={canonical?.state}
                address1={canonical?.address1 ?? canonical?.addressLine1}
                city={canonical?.city}
                postalCode={canonical?.postalCode}
                canSeeTemplates={!!canTemplates}
                onBuildDraft={(id, text) => setDraft({ id, text })}
              />
              </>
            )}

            {draft ? (
              <div className={`${finelyOsCatalogCard('sky')} !p-4 mt-4 space-y-3`}>
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
                />
              </div>
            ) : null}

            <FinelyOsPageFooter />
          </div>
        </FinelyUnifiedHubLayout>
      </EntitlementGate>
    </PageShell>
  );
}
