import React, { useMemo, useState } from 'react';
import {
  CircleHelp,
  FileText,
  Gavel,
  PlayCircle,
  Plus,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { hasEntitlement } from '../../../../data/billingRepo';
import { BankruptcyCenterView } from '../../../../components/bankruptcy/BankruptcyCenterView';
import { BankruptcyFilingCenterView } from '../../../../components/bankruptcy/BankruptcyFilingCenterView';
import { BankruptcyCommsHandoffStrip } from '../../../../components/bankruptcy/BankruptcyCommsHandoffStrip';
import { PartnerLaneCoachPanel } from '../../../../components/chat/PartnerLaneCoachPanel';
import { PartnerSuccessExperiencePanel } from '../../../../components/partner/PartnerSuccessExperiencePanel';
import type { BankruptcyLetterType } from '../../../../domain/bankruptcyLegal';
import type { BankruptcyCase, BankruptcyChapter } from '../../../../domain/bankruptcyCase';
import {
  createBankruptcyCase,
  listBankruptcyByPartner,
  upsertBankruptcyCase,
} from '../../../../data/bankruptcyRepo';
import { getCanonicalPartnerIdentity } from '../../../../utils/canonicalPartnerIdentity';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { getCustomFieldValues } from '../../../../data/customFieldValuesRepo';
import { generateTextPdfToVault } from '../../../../letters/generateTextPdf';
import { stripLetterVendorBranding } from '../../../../lib/letterBodySafety';
import { upsertLetter } from '../../../../data/lettersRepo';
import { newId } from '../../../../utils/ids';
import { DebtLetterDraftWorkspace } from '../../../../components/letters/DebtLetterPreview';
import { SmartProofUploader } from '../../../../components/evidence/SmartProofUploader';
import { getBankruptcyScenarioSelection } from '../../../../data/bankruptcyLaneStateRepo';
import { SELF_FILING_DISCLAIMER } from '../../../../legal/bankruptcyFilingKnowledgePack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerBankruptcyCaseDesk.css';

type Track = 'filing' | 'credit';

const TRACK_META: Record<Track, { label: string; hint: string; accent: 'sky' | 'violet'; icon: React.ComponentType<{ size?: number }> }> = {
  filing: { label: 'File bankruptcy', hint: 'Petition steps and case status', accent: 'sky', icon: Gavel },
  credit: { label: 'Fix credit reporting', hint: 'Discharge accuracy and letters', accent: 'violet', icon: FileText },
};

export default function PartnerBankruptcyProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Scale;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;
  const partner = partnerId ? sessionPartner : sessionPartner;

  const [track, setTrack] = useState<Track>('filing');
  const [bkId, setBkId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState<null | { id: BankruptcyLetterType; text: string }>(null);
  const [busy, setBusy] = useState(false);
  const [addChapter, setAddChapter] = useState<BankruptcyChapter>('7');

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const cases = useMemo(() => {
    if (!partner || isDemo) return [];
    void version;
    return listBankruptcyByPartner(partner.id);
  }, [partner, version, isDemo]);

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

  const saveDraft = async () => {
    if (!draft || !partner) return;
    setBusy(true);
    try {
      const createdAt = new Date().toISOString();
      const title = `Bankruptcy: ${draft.id}`;
      const mailBody = stripLetterVendorBranding(draft.text);
      const pdf = await generateTextPdfToVault({
        text: mailBody,
        filename: `Letter_bankruptcy_${draft.id}_${createdAt.slice(0, 10)}.pdf`,
        meta: { partnerId: partner.id, context: 'bankruptcy', letterSpecId: draft.id },
      });
      upsertLetter({
        id: newId('letter'),
        partnerId: partner.id,
        type: 'validation',
        title,
        createdAt,
        body: mailBody,
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
      navigate(mapPortalHref('/portal/letters/vault'));
    } finally {
      setBusy(false);
    }
  };

  const handleAddCase = () => {
    if (!partner) return;
    const c = createBankruptcyCase({ partnerId: partner.id, chapter: addChapter, status: 'pre_filing' });
    setBkId(c.id);
    setVersion((v) => v + 1);
  };

  const handleUpdateCase = (c: BankruptcyCase) => {
    upsertBankruptcyCase(c);
    setVersion((v) => v + 1);
  };

  const askFinelyPrompt = 'What should I do next on my bankruptcy case?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Bankruptcy' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderCaseDesk = (demoMode: boolean) => {
    if (!partner && !demoMode) {
      return (
        <ProductEmptyState
          title="Sign in required"
          description="Bankruptcy tools attach to your partner profile."
          action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>Sign in</button>}
        />
      );
    }

    if (demoMode) {
      return (
        <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="queue-detail">
          <div className="fc-wlp-bk-case-desk">
            <aside className="fc-wlp-bk-case-spine" aria-label="Bankruptcy cases">
              <div className="fc-wlp-bk-case-spine-head">Your cases</div>
              <button type="button" className="fc-wlp-bk-case-spine-item" data-active="true" data-fcm-accent="rose">
                <strong>Ch 7 · pre-filing</strong>
                <span>Demo case</span>
              </button>
              <div className="fc-wlp-bk-track-rail" role="tablist" aria-label="Bankruptcy tracks">
                {(Object.keys(TRACK_META) as Track[]).map((trackId) => {
                  const meta = TRACK_META[trackId];
                  const Icon = meta.icon;
                  return (
                    <button key={trackId} type="button" role="tab" className="fc-wlp-bk-track-btn" data-active={trackId === 'filing' ? 'true' : undefined} data-fcm-accent={meta.accent}>
                      <Icon size={16} /> {meta.label}
                    </button>
                  );
                })}
              </div>
            </aside>
            <div className="fc-wlp-bk-inspector">
              <div className="fc-wlp-bk-inspector-hero" data-fcm-accent="sky">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-sky-700">Filing workspace</p>
                  <h2>Organize your case before you file</h2>
                  <p>Sign in to manage live cases, upload proof, and fix post-discharge reporting.</p>
                </div>
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/login')}>Sign in</button>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <EntitlementGate partnerId={partner!.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
        <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="queue-detail">
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <PartnerLaneCoachPanel
                partnerId={partner!.id}
                partnerName={canonical?.fullName || partner!.profile.fullName}
                lane={track === 'filing' ? 'bankruptcy' : 'bankruptcy_discharge'}
                scenarioId={bankruptcyScenarioId}
                coachSubtitle="Your on-duty bankruptcy specialist"
                compact
              />
            </div>
            <div className="lg:col-span-2">
              <PartnerSuccessExperiencePanel partnerId={partner!.id} lane="bankruptcy" compact />
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 text-base font-bold`} data-fc-accent="rose">
            {SELF_FILING_DISCLAIMER}
          </div>

          <div className="fc-wlp-bk-case-desk">
            <aside className="fc-wlp-bk-case-spine" aria-label="Bankruptcy cases">
              <div className="fc-wlp-bk-case-spine-head">Your cases</div>
              {cases.length === 0 ? (
                <div className={`mx-2 mb-2 p-4 rounded-xl text-sm font-bold ${FINELY_OS_LUXURY_EMPTY}`}>No cases yet — create one below.</div>
              ) : (
                cases.map((c, idx) => {
                  const active = bkCase?.id === c.id;
                  const cardAccent = (['rose', 'violet', 'sky', 'emerald'] as const)[idx % 4];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="fc-wlp-bk-case-spine-item"
                      data-active={active ? 'true' : undefined}
                      data-fcm-accent={cardAccent}
                      onClick={() => setBkId(c.id)}
                    >
                      <strong>Ch {c.chapter} · {c.status.replaceAll('_', ' ')}</strong>
                      <span>{c.caseNumber || c.id.slice(0, 8)}</span>
                      {active ? <span className={finelyOsStatusChip('warn')}>Selected</span> : null}
                    </button>
                  );
                })
              )}

              <div className={`${finelyOsCatalogCard('emerald')} mx-1 p-4 space-y-3`} data-fc-accent="emerald">
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>New case chapter</div>
                  <select value={addChapter} onChange={(e) => setAddChapter(e.target.value as BankruptcyChapter)} className={`${FINELY_OS_ENTITY_SELECT} mt-1 w-full`}>
                    <option value="7">Chapter 7</option>
                    <option value="13">Chapter 13</option>
                    <option value="11">Chapter 11</option>
                  </select>
                </label>
                <button type="button" className={`${FINELY_OS_PRIMARY_BTN} w-full`} onClick={handleAddCase}>
                  <Plus size={14} /> New case
                </button>
              </div>

              <div className="fc-wlp-bk-track-rail" role="tablist" aria-label="Bankruptcy tracks">
                {(Object.keys(TRACK_META) as Track[]).map((trackId) => {
                  const meta = TRACK_META[trackId];
                  const Icon = meta.icon;
                  const active = track === trackId;
                  return (
                    <button
                      key={trackId}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className="fc-wlp-bk-track-btn"
                      data-active={active ? 'true' : undefined}
                      data-fcm-accent={meta.accent}
                      onClick={() => setTrack(trackId)}
                    >
                      <Icon size={16} /> {meta.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="fc-wlp-bk-inspector">
              <div className="fc-wlp-bk-inspector-hero" data-fcm-accent={TRACK_META[track].accent}>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">{TRACK_META[track].label}</p>
                  <h2>{track === 'filing' ? 'Prepare and file your case' : 'Fix reporting after discharge'}</h2>
                  <p>{TRACK_META[track].hint}</p>
                  {bkCase ? (
                    <span className={`mt-3 inline-flex ${finelyOsStatusChip('ok')}`}>
                      <ShieldCheck size={14} /> Ch {bkCase.chapter} · {bkCase.status.replaceAll('_', ' ')}
                    </span>
                  ) : (
                    <span className={`mt-3 inline-flex ${finelyOsStatusChip('warn')}`}>Select or create a case</span>
                  )}
                </div>
                {bkCase ? (
                  <label className="block min-w-[200px]">
                    <div className={FINELY_OS_ENTITY_LABEL}>Active case</div>
                    <select value={bkCase.id} onChange={(e) => setBkId(e.target.value || null)} className={`${FINELY_OS_ENTITY_SELECT} mt-1 w-full`}>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          Ch {c.chapter} • {c.status} • {c.caseNumber || c.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <BankruptcyCommsHandoffStrip partnerId={partner!.id} />

              {track === 'filing' ? (
                <BankruptcyFilingCenterView
                  partner={partner!}
                  email={partner!.profile.email}
                  bkCase={bkCase}
                  onUpdateCase={handleUpdateCase}
                />
              ) : (
                <>
                  <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
                    <SmartProofUploader
                      partner={partner!}
                      email={partner!.profile.email}
                      bankruptcyCaseId={bkCase?.id}
                      uploadContext="bankruptcy"
                      compact
                    />
                  </div>
                  <BankruptcyCenterView
                    partnerId={partner!.id}
                    partnerName={canonical?.fullName || partner!.profile.fullName}
                    partnerEmail={partner!.profile.email}
                    partnerState={canonical?.state}
                    address1={canonical?.address1 ?? canonical?.addressLine1}
                    city={canonical?.city}
                    postalCode={canonical?.postalCode}
                    canSeeTemplates={!!canTemplates}
                    onBuildDraft={(id, text) => setDraft({ id, text })}
                  />
                </>
              )}
            </div>
          </div>

          {draft ? (
            <div className="fc-wlp-bk-compose-drawer" data-fcm-accent="emerald">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-2xl font-extrabold">Draft — {draft.id}</h3>
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

          <aside className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2 className="text-2xl font-extrabold">Accuracy first, then rebuild</h2>
            <p className="text-base font-bold text-slate-600">Dispute inaccurate reporting, confirm public record details, then add rebuild accounts on a schedule.</p>
            {guideActions}
          </aside>
        </section>
      </EntitlementGate>
    );
  };

  const metrics: ProductMetric[] = [
    { label: 'Cases', value: isDemo ? '1' : String(cases.length), hint: 'Chapter 7, 11, or 13', accent: 'rose', icon: Scale, onClick: () => setTrack('filing') },
    { label: 'Track', value: track === 'filing' ? 'Filing' : 'Credit', hint: TRACK_META[track].hint, accent: 'sky', icon: Gavel, onClick: () => setTrack('filing') },
    { label: 'Discharge fixes', value: track === 'credit' ? 'Active' : '—', hint: 'Post-discharge letters', accent: 'violet', icon: FileText, onClick: () => setTrack('credit') },
    { label: 'Specialist', value: 'On duty', hint: 'Bankruptcy lane coach', accent: 'emerald', icon: ShieldCheck, onClick: () => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Bankruptcy' }) },
  ];

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Bankruptcy'}
        title={demoSpec?.title ?? 'Understand the filing, then rebuild deliberately after it.'}
        description={demoSpec?.description ?? 'Bankruptcy is a legal decision — this workspace organizes it and plans the recovery that follows.'}
        status={`${demoSpec?.status ?? 'Discharged · rebuilding'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metrics={metrics}
        metricTitle="Bankruptcy desk"
        metricDescription="Cases, filing steps, and post-discharge credit fixes."
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open bankruptcy workspace'} onClick={() => navigate(mapPortalHref('/portal/bankruptcy'))} />}
      >
        {renderCaseDesk(true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Bankruptcy"
        title="Understand the filing, then rebuild deliberately after it."
        description="Bankruptcy is a legal decision — this workspace organizes it and plans the recovery that follows."
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="Sign in required"
          description="Bankruptcy tools attach to your partner profile."
          action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>Sign in</button>}
        />
      </ProductHubScaffold>
    );
  }

  const statusHeadline = bkCase
    ? `Ch ${bkCase.chapter} · ${bkCase.status.replaceAll('_', ' ')}`
    : cases.length
      ? `${cases.length} case${cases.length === 1 ? '' : 's'} on file`
      : 'No case started yet';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Bankruptcy"
      title="Understand the filing, then rebuild deliberately after it."
      description="Bankruptcy is a legal decision — this workspace organizes it and plans the recovery that follows."
      status={`${statusHeadline} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Bankruptcy desk"
      metricDescription="Cases, filing steps, and post-discharge credit fixes."
      primaryAction={
        <ProductPagePrimaryAction
          label={bkCase ? (track === 'filing' ? 'Continue filing steps' : 'Fix credit reporting') : 'Create your first case'}
          onClick={() => {
            if (!bkCase) handleAddCase();
            else if (track !== 'credit') setTrack('filing');
          }}
        />
      }
    >
      {renderCaseDesk(false)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
