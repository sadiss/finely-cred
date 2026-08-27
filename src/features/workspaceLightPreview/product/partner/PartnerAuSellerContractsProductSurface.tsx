import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleHelp,
  FileText,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { AU_SELLER } from '../../../../config/auSellerProgram';
import { upsertAuSeller } from '../../../../data/auSellerRepo';
import { nowIso } from '../../../../domain/auSeller';
import { getOrCreateSellerForSession } from '../../../../seller/getOrCreateSellerForSession';
import type { AuSeller } from '../../../../domain/auSeller';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { SellerWorkstationNav } from './PartnerAuSellerProductSurface';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
} from '../../../os/finelyOsLightUi';

const METRICS_VARIANT = 'inline' as const;
const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

const AGREEMENT_CLAUSES = [
  {
    id: 'accuracy',
    title: 'Accurate listings',
    summary: 'Listings must be accurate and supported with proof artifacts.',
    detail:
      'Every tradeline you list must match real account age, limit, and bureau reporting. Proof artifacts (screenshots or statements) are required before approval.',
  },
  {
    id: 'posting',
    title: 'Posting windows & refunds',
    summary: 'Posting windows and refund policy depend on verification and compliance.',
    detail:
      'Fulfillment windows follow your verified posting schedule. Refunds and chargebacks follow Finely compliance review — not informal side agreements.',
  },
  {
    id: 'claims',
    title: 'No misleading claims',
    summary: 'No misleading claims; documentation is required for age, limit, and ownership.',
    detail:
      'Do not promise score outcomes to partners. Finely markets inventory to partners — you supply verified tradelines and fulfill authorized-user adds on time.',
  },
  {
    id: 'signature',
    title: 'Recorded acceptance',
    summary: 'Signature acceptance is recorded on this page.',
    detail:
      'Your typed name and acceptance timestamp are stored with your seller profile. A downloadable PDF and full e-sign workflow can be enabled during compliance rollout.',
  },
] as const;

type ClauseId = (typeof AGREEMENT_CLAUSES)[number]['id'];

export default function PartnerAuSellerContractsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const mappedNavigate = useMappedPartnerNavigate();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? FileText;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [version, setVersion] = useState(0);
  const seller = useMemo(() => {
    if (isDemo) return null;
    return getOrCreateSellerForSession({ user: auth.user }) as AuSeller | null;
  }, [auth.user, isDemo, version]);

  const [selectedClauseId, setSelectedClauseId] = useState<ClauseId>('accuracy');
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);

  const selectedClause = AGREEMENT_CLAUSES.find((c) => c.id === selectedClauseId) ?? AGREEMENT_CLAUSES[0];

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const contractAccepted = isDemo ? false : Boolean(seller?.contract?.acceptedAt);
  const dashboardPath = mapPortalHref(AU_SELLER.dashboardPath);

  const accept = () => {
    if (!seller) return;
    if (!accepted) return;
    const sig = (name || seller.fullName || '').trim();
    if (!sig) return;
    upsertAuSeller({
      ...seller,
      contract: {
        acceptedAt: nowIso(),
        acceptedName: sig,
        version: 'v1',
      },
      status: seller.status === 'pending' ? 'active' : seller.status,
    });
    window.dispatchEvent(new Event('finely:store'));
    mappedNavigate(dashboardPath);
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Agreement',
      value: contractAccepted ? 'Accepted' : 'Pending',
      hint: contractAccepted ? 'Seller agreement on file' : 'Accept to submit listings',
      accent: 'emerald',
      onClick: () => setSelectedClauseId('signature'),
    },
    {
      label: 'Clauses',
      value: AGREEMENT_CLAUSES.length,
      hint: 'Terms you agree to',
      accent: 'violet',
      onClick: () => setSelectedClauseId('accuracy'),
    },
    {
      label: 'Version',
      value: seller?.contract?.version ?? 'v1',
      hint: 'Current agreement version',
      accent: 'sky',
    },
    {
      label: 'Status',
      value: isDemo ? 'Demo' : seller?.status ?? '—',
      hint: 'Seller account state',
      accent: 'rose',
    },
  ];

  if (!isDemo && !auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Seller contracts"
        title="Sign in to review the seller agreement"
        description="Acceptance is required before inventory can be submitted for partner review."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState title="Sign in required" description="Contract acceptance attaches to your seller profile." />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && !seller) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Seller contracts"
        title="Create your seller profile first"
        description="Onboarding must include the AU seller lane before you can accept the agreement."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Open seller hub" onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.hubPath))} />}
      >
        <ProductEmptyState title="No seller profile" description="Finish AU seller onboarding to accept the agreement." />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Seller contracts"
      title="Seller agreement ledger"
      description="Scan each clause, inspect terms on the right, and accept to unlock listing submission."
      status={contractAccepted ? 'Agreement accepted' : 'Acceptance required'}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      metrics={metrics}
      metricTitle="Contract ledger"
      metricDescription="Dense clause rows on the left — full terms and signature on the right."
      primaryAction={
        contractAccepted || isDemo ? (
          <ProductPagePrimaryAction label="Seller dashboard" onClick={() => mappedNavigate(dashboardPath)} />
        ) : (
          <button
            type="button"
            className="fc-wlp-btn-primary"
            onClick={accept}
            disabled={!accepted || !(name || seller?.fullName)}
          >
            Accept & continue <ArrowRight size={14} />
          </button>
        )
      }
    >
      <section className="fc-wlp-section space-y-6" data-surface-layout="ledger">
        <SellerWorkstationNav active="contracts" mapHref={mapPortalHref} onNavigate={mappedNavigate} />

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] gap-6 items-start">
          <div className="fc-wlp-arch-ledger min-w-0" data-fcm-accent="emerald">
            <div className="fc-wlp-arch-ledger-header fcm-depth fcm-specular" data-bed="dark" data-fcm-accent="emerald">
              <span className="fcm-grain" aria-hidden />
              <span className="fc-wlp-arch-ledger-header-title">Seller agreement clauses</span>
              <div className="fc-wlp-arch-ledger-header-stats">
                <span className="fc-wlp-arch-ledger-header-stat">
                  <strong>{contractAccepted ? 'Accepted' : 'Pending'}</strong>
                  <em>Status</em>
                </span>
                <span className="fc-wlp-arch-ledger-header-stat fc-wlp-arch-ledger-header-stat--total">
                  <strong>{AGREEMENT_CLAUSES.length}</strong>
                  <em>Clauses</em>
                </span>
              </div>
            </div>

            <div className="fc-wlp-arch-ledger-rows">
              {AGREEMENT_CLAUSES.map((clause, index) => {
                const rowAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[index % 4];
                const active = selectedClauseId === clause.id;
                return (
                  <button
                    key={clause.id}
                    type="button"
                    onClick={() => setSelectedClauseId(clause.id)}
                    className="fc-wlp-arch-ledger-row w-full text-left"
                    data-fcm-accent={rowAccent}
                    data-active={active ? 'true' : undefined}
                  >
                    <div className="fc-wlp-arch-ledger-row-main">
                      <FileText size={16} className="shrink-0 opacity-80" />
                      <div className="min-w-0">
                        <div className="font-bold">{clause.title}</div>
                        <div className="text-sm opacity-80 mt-0.5">{clause.summary}</div>
                      </div>
                    </div>
                    <span className="fc-wlp-arch-ledger-row-action">Inspect</span>
                  </button>
                );
              })}
            </div>

            {contractAccepted && seller?.contract?.acceptedAt ? (
              <div className={`mt-4 p-4 ${FINELY_OS_ENTITY_BODY}`}>
                Accepted {new Date(seller.contract.acceptedAt).toLocaleString()} as{' '}
                <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{seller.contract.acceptedName}</span>.
              </div>
            ) : null}
          </div>

          <aside className={`space-y-4 p-6 lg:p-8 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Terms inspector</span>
            </div>
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedClause.title}</h2>
            <p className={FINELY_OS_ENTITY_BODY}>{selectedClause.detail}</p>

            {!contractAccepted && !isDemo ? (
              <div className={`space-y-4 p-5 ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
                  <div>
                    <div className={FINELY_OS_ENTITY_VALUE}>I accept the seller agreement</div>
                    <div className={FINELY_OS_ENTITY_BODY}>You cannot submit listings for approval without acceptance.</div>
                  </div>
                </label>
                <div>
                  <label className={formLabel}>Signature name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={seller?.fullName || 'Full name'}
                    className={formInput}
                  />
                </div>
                <button
                  type="button"
                  onClick={accept}
                  disabled={!accepted || !(name || seller?.fullName)}
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 w-full justify-center`}
                >
                  <ShieldCheck size={14} /> Accept & continue <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className={FINELY_OS_NOTICE_SUCCESS}>
                {isDemo
                  ? 'Demo mode — sign in to record a live signature on your seller profile.'
                  : 'Agreement accepted. You can submit listings with proof for partner review.'}
              </div>
            )}

            <button
              type="button"
              className="fc-wlp-btn-secondary w-full justify-center"
              onClick={() => openProductCopilot({ prompt: 'What does the AU seller agreement require?', contextLabel: 'Seller contracts' })}
            >
              <CircleHelp size={14} /> Ask Finely
            </button>
            <button type="button" className="fc-wlp-btn-secondary w-full justify-center" onClick={() => navigate('/resources#presenter-demo')}>
              <PlayCircle size={14} /> Watch how
            </button>
          </aside>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
