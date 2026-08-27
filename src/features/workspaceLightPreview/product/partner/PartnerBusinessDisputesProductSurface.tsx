import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ShieldAlert, FileText, Paperclip, CircleHelp, PlayCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { createBusinessDispute, deleteBusinessDispute, listBusinessDisputes, upsertBusinessDispute } from '../../../../data/businessCreditRepo';
import type { BusinessBureau } from '../../../../domain/businessCredit';
import { BusinessDisputeDetailWorkspace } from '../../../../pages/business/BusinessDisputeDetailPage';
import { businessDisputeCaseHref, businessDisputeHubHref } from '../../../../lib/businessDisputeProductPaths';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import '../components/productBusinessDisputeWorkspace.css';
import './partnerBusinessDisputesDesk.css';

export default function PartnerBusinessDisputesProductSurface({ role, pageId, partnerId, dataMode, entityId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { pathname, search } = useLocation();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? ShieldAlert;
  const scaffoldAccent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;
  const partner = sessionPartner;

  const [version, setVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBureau, setNewBureau] = useState<BusinessBureau>('dnb');

  const disputes = useMemo(() => (partner && !isDemo ? listBusinessDisputes(partner.id) : []), [partner?.id, version, isDemo]);

  const disputeIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return params.get('disputeId')?.trim() || entityId || undefined;
  }, [entityId, search]);

  const selectedDisputeId = disputeIdFromUrl ?? null;
  const selectedDispute = disputes.find((d) => d.id === selectedDisputeId) ?? null;

  const openDispute = (id: string) => {
    setShowCreate(false);
    navigate(businessDisputeCaseHref(id, pathname, search));
  };

  const closeDisputeInspector = () => {
    setShowCreate(false);
    navigate(businessDisputeHubHref(pathname, search));
  };

  const metrics: ProductMetric[] = [
    { label: 'Disputes', value: disputes.length, hint: 'On your queue', accent: 'rose', icon: ShieldAlert, onClick: () => navigate(mapPortalHref('/business/disputes')) },
    { label: 'Letters', value: 'Vault', hint: 'Mail from Letters Vault', accent: 'emerald', icon: FileText, onClick: () => navigate(mapPortalHref('/portal/letters/vault')) },
    { label: 'Evidence', value: 'Vault', hint: 'Attach bureau proof', accent: 'sky', icon: Paperclip, onClick: () => navigate(mapPortalHref('/portal/evidence')) },
    { label: 'Bureaus', value: '3', hint: 'D&B · Experian · Equifax', accent: 'violet', icon: ShieldAlert, onClick: () => navigate(mapPortalHref('/business/bureaus')) },
  ];

  const disputesByBureau = useMemo(() => {
    const counts: Record<BusinessBureau, number> = { dnb: 0, experian_business: 0, equifax_business: 0 };
    for (const d of disputes) counts[d.bureau] += 1;
    return counts;
  }, [disputes]);

  const bureauStatusCells = [
    { id: 'all' as const, label: 'All disputes', value: disputes.length, accent: 'rose' as const },
    { id: 'dnb' as const, label: 'D&B', value: disputesByBureau.dnb, accent: 'violet' as const },
    { id: 'experian_business' as const, label: 'Experian Business', value: disputesByBureau.experian_business, accent: 'sky' as const },
    { id: 'equifax_business' as const, label: 'Equifax Business', value: disputesByBureau.equifax_business, accent: 'emerald' as const },
  ];

  const createForm = (
    <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
      <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Create a dispute</div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!partner) return;
          const d = createBusinessDispute({
            partnerId: partner.id,
            bureau: newBureau,
            title: newTitle.trim() || undefined,
          });
          setNewTitle('');
          setShowCreate(false);
          setVersion((v) => v + 1);
          openDispute(d.id);
        }}
      >
        <label className="block">
          <div className={FINELY_OS_ENTITY_LABEL}>Bureau</div>
          <select value={newBureau} onChange={(e) => setNewBureau(e.target.value as BusinessBureau)} className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}>
            <option value="dnb">D&B</option>
            <option value="experian_business">Experian Business</option>
            <option value="equifax_business">Equifax Business</option>
          </select>
        </label>
        <label className="block">
          <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Incorrect address + wrong trade line" />
        </label>
        <button type="submit" className={`${FINELY_OS_PRIMARY_BTN} w-full`}>
          <Plus size={14} /> Create dispute
        </button>
      </form>
    </div>
  );

  const inspectorBody = showCreate ? (
    createForm
  ) : selectedDisputeId && partner ? (
    <div className="space-y-4">
      <div className="fc-wlp-biz-dispute-inspector-hero">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-widest text-rose-600">Selected dispute</p>
          <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedDispute?.title ?? 'Business bureau dispute'}</h2>
          {selectedDispute ? (
            <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
              {selectedDispute.bureau.replaceAll('_', ' ')} • items:{selectedDispute.negativeItems.length} • {selectedDispute.status}
            </p>
          ) : null}
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={closeDisputeInspector}>
          Back to queue
        </button>
      </div>
      <div className="max-h-[68vh] overflow-y-auto pr-1">
        <BusinessDisputeDetailWorkspace disputeId={selectedDisputeId} embedded />
      </div>
    </div>
  ) : (
    <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
      <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Pick a dispute</h2>
      <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
        Select a case from the queue to attach evidence, generate letters, and track bureau rounds.
      </p>
      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setShowCreate(true)}>
        <Plus size={14} /> Create dispute
      </button>
    </div>
  );

  const queueDeskBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="queue-detail" data-room={selectedDisputeId ? 'dispute' : 'hub'}>
      <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="rose">
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Commercial bureau disputes</p>
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Dispute queue desk</h2>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Challenge inaccurate D&B, Experian Business, and Equifax Business entries with proof and letters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref('/portal/letters/vault'))}>
            Letters Vault
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref('/portal/evidence'))}>
            Evidence vault
          </button>
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => {
              setShowCreate((v) => !v);
              if (!showCreate) closeDisputeInspector();
            }}
          >
            <Plus size={14} /> {showCreate ? 'Hide form' : 'Create dispute'}
          </button>
        </div>
      </div>

      <div className="fc-wlp-biz-dispute-status-grid">
        {bureauStatusCells.map((cell) => (
          <div key={cell.id} className={`fc-wlp-biz-dispute-status-cell ${finelyOsCatalogCard(cell.accent)}`} data-fc-accent={cell.accent}>
            <div className={`text-sm font-extrabold uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>{cell.label}</div>
            <div className="fc-wlp-biz-dispute-status-value">{cell.value}</div>
            <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {cell.id === 'all' ? 'On your queue' : 'Open cases'}
            </div>
          </div>
        ))}
      </div>

      {!partner ? (
        <div className={FINELY_OS_NOTICE}>Sign in as a partner to create and track business bureau disputes.</div>
      ) : (
        <div className="fc-wlp-biz-dispute-desk">
          <aside className="fc-wlp-biz-dispute-queue" aria-label="Dispute queue">
            <div className="fc-wlp-biz-dispute-queue-head">Your disputes · {disputes.length}</div>
            {disputes.length === 0 ? (
              <div className={`mx-1 p-4 rounded-xl text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No disputes yet — create one in the inspector.</div>
            ) : (
              disputes.map((d, idx) => {
                const active = selectedDisputeId === d.id && !showCreate;
                const cardAccent = (['rose', 'violet', 'sky', 'emerald'] as const)[idx % 4];
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="fc-wlp-biz-dispute-queue-item"
                    data-active={active ? 'true' : undefined}
                    data-fcm-accent={cardAccent}
                    onClick={() => openDispute(d.id)}
                  >
                    <strong>{d.title}</strong>
                    <span>{d.bureau.replaceAll('_', ' ')} • {d.status}</span>
                    <span className={finelyOsStatusChip(d.status === 'draft' ? 'warn' : 'ok')}>
                      {d.negativeItems.length} item{d.negativeItems.length === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })
            )}

            {disputes.length > 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} mx-1 p-4 space-y-2`} data-fc-accent="violet">
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Quick actions on selected case</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDispute ? (
                    <>
                      <button
                        type="button"
                        className={FINELY_OS_SECONDARY_BTN}
                        onClick={() => {
                          upsertBusinessDispute({ ...selectedDispute, status: selectedDispute.status === 'draft' ? 'in_progress' : selectedDispute.status });
                          setVersion((v) => v + 1);
                        }}
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        className={FINELY_OS_DANGER_BTN}
                        onClick={() => {
                          if (!window.confirm('Delete this dispute?')) return;
                          deleteBusinessDispute(partner.id, selectedDispute.id);
                          setVersion((v) => v + 1);
                          closeDisputeInspector();
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>

          <div className="fc-wlp-biz-dispute-inspector">{inspectorBody}</div>
        </div>
      )}
    </section>
  );

  const askFinelyPrompt = 'How do I dispute an item on my business bureau file?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Business disputes' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business disputes" title="Business bureau disputes" description="Track negative items, attach evidence, generate letters." status="demo data" freshness="demo snapshot" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} metricTitle="Dispute queue" metricDescription="Queue on the left — inspector on the right." primaryAction={<ProductPagePrimaryAction label="Open disputes" onClick={() => navigate(mapPortalHref('/business/disputes'))} />}>
        {queueDeskBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business disputes" title="Business bureau disputes" description="Track commercial bureau disputes." status="Sign in required" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}>
        <ProductEmptyState title="Sign in required" description="Business disputes attach to your partner profile." action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>Sign in</button>} />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Business disputes"
      title="Business bureau disputes"
      description="Track negative items on commercial bureau files, attach evidence, generate letters, and mail from Letters Vault."
      status={`${disputes.length} dispute${disputes.length === 1 ? '' : 's'} · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Dispute queue"
      metricDescription="Select a case in the queue — work it in the inspector."
      primaryAction={<ProductPagePrimaryAction label="Create dispute" onClick={() => { setShowCreate(true); closeDisputeInspector(); }} />}
      secondaryAction={<button type="button" className="fc-wlp-btn-secondary" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Business disputes' })}>Ask Finely</button>}
    >
      {queueDeskBody}
      <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="emerald">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">{disputes.length ? 'Attach proof before mailing' : 'Open your first dispute'}</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Use factual findings with bureau screenshots — then mail from Letters Vault.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
