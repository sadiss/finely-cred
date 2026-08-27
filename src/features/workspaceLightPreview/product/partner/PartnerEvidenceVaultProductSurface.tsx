import React, { useMemo, useState } from 'react';
import {
  CircleHelp,
  FileSearch,
  Mail,
  PlayCircle,
  ShieldCheck,
  Vault,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import {
  PartnerEvidenceVaultWorkspace,
  type PartnerEvidenceVaultNavigation,
  type PartnerEvidenceVaultTab,
} from '../../../../components/evidence/PartnerEvidenceVaultWorkspace';
import {
  evidenceDestination,
  evidenceVaultBucket,
  EVIDENCE_VAULT_BUCKET_LABELS,
  type EvidenceVaultBucketId,
} from '../../../../lib/evidenceVaultGrouping';
import {
  isMailEligibleEvidence,
  isSourceLinkedEvidence,
  needsEvidenceMailReview,
} from '../../../../lib/evidenceMailReview';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerEvidenceVaultSurface.css';

const VAULT_TOOLS: Array<{ id: PartnerEvidenceVaultTab; label: string; hint: string; accent: 'emerald' | 'violet' | 'rose' }> = [
  { id: 'exhibits', label: 'Exhibits', hint: 'Browse crops, replies, and proof by bucket.', accent: 'emerald' },
  { id: 'upload', label: 'Upload', hint: 'Add bureau replies with scrape intel enabled.', accent: 'violet' },
  { id: 'review', label: 'Review queue', hint: 'Confirm crops before mailing.', accent: 'rose' },
];

const BUCKET_ACCENTS: Record<string, 'emerald' | 'violet' | 'sky' | 'rose'> = {
  screenshots: 'sky',
  bureau_responses: 'violet',
  debt_docket: 'rose',
  dispute_proof: 'emerald',
};

function evidenceNavigation(map: (href: string) => string): PartnerEvidenceVaultNavigation {
  return {
    evidenceVaultPath: map('/portal/evidence'),
    reportsPath: map('/portal/reports'),
    lettersPath: map('/portal/letters'),
    disputesPath: map('/portal/disputes'),
    documentsPath: map('/portal/documents'),
    dashboardPath: map('/portal/dashboard'),
  };
}

export default function PartnerEvidenceVaultProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const email = auth.user?.email || '';
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Vault;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';

  const [activeTab, setActiveTab] = useState<PartnerEvidenceVaultTab>('exhibits');

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const navigation = useMemo(() => evidenceNavigation(mapPortalHref), [mapPortalHref]);

  const evidence = useMemo(() => {
    if (!partner) return [];
    return listEvidenceByPartner(partner.id).filter((item) => evidenceDestination(item) === 'evidence');
  }, [partner]);

  const reviewCount = useMemo(() => evidence.filter(needsEvidenceMailReview).length, [evidence]);
  const mailCount = useMemo(() => evidence.filter(isMailEligibleEvidence).length, [evidence]);
  const sourceLinked = useMemo(() => evidence.filter(isSourceLinkedEvidence).length, [evidence]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<EvidenceVaultBucketId, number>();
    for (const e of evidence) {
      const b = evidenceVaultBucket(e);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [evidence]);

  const metrics: ProductMetric[] = [
    {
      label: 'Exhibits on file',
      value: evidence.length,
      hint: 'Crops, replies, and proof',
      accent: 'emerald',
      icon: Vault,
      onClick: () => setActiveTab('exhibits'),
    },
    {
      label: 'Needs review',
      value: reviewCount,
      hint: reviewCount ? 'Confirm before mailing' : 'Nothing blocking',
      accent: 'rose',
      icon: ShieldCheck,
      onClick: () => setActiveTab('review'),
    },
    {
      label: 'Mail-eligible',
      value: mailCount,
      hint: mailCount ? 'Ready in Letter Studio' : 'Approve to unlock',
      accent: 'violet',
      icon: Mail,
      onClick: () => navigate(navigation.lettersPath),
    },
    {
      label: 'Source-linked',
      value: sourceLinked,
      hint: sourceLinked ? 'Tied to report regions' : 'Capture from reports',
      accent: 'sky',
      icon: FileSearch,
      onClick: () => navigate(navigation.reportsPath),
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: 'What exhibits should I upload for my disputes?', contextLabel: 'Evidence vault' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo && !partner) {
    return (
      <ProductEmptyState
        title="Sign in to open Evidence vault"
        description="Report crops, bureau replies, and dispute proof live here — separate from your ID and address uploads in Documents."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
            Sign in
          </button>
        }
      />
    );
  }

  if (!partner) {
    return (
      <ProductEmptyState
        title="Partner profile not found"
        description="Return to the dashboard and pick a partner context, or sign in with a partner account."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
            Return to dashboard
          </button>
        }
      />
    );
  }

  const controlRoomBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-evidence-control-room`} data-surface-layout="control-room">
      {reviewCount > 0 ? (
        <div className={`fc-wlp-evidence-alert-rail ${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
          <div className="flex items-start gap-4 min-w-0">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20">
              <ShieldCheck size={26} className="text-rose-300" />
            </div>
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Review alert</p>
              <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {reviewCount} exhibit{reviewCount === 1 ? '' : 's'} need confirmation
              </h2>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Confirm each crop matches the original report before Letter Studio can mail it.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setActiveTab('review')} className={FINELY_OS_PRIMARY_BTN}>
            Open review queue
          </button>
        </div>
      ) : (
        <div className={`fc-wlp-evidence-alert-rail ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Scrape intel ready</p>
            <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              Capture report regions or upload bureau replies
            </h2>
            <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Field extraction stays beside each exhibit so you can verify before mailing.
            </p>
          </div>
          <button type="button" onClick={() => setActiveTab('upload')} className={FINELY_OS_PRIMARY_BTN}>
            Upload exhibit
          </button>
        </div>
      )}

      <div className="fc-wlp-evidence-status-grid">
        {(['screenshots', 'bureau_responses', 'debt_docket', 'dispute_proof'] as EvidenceVaultBucketId[]).map((bucket) => {
          const count = bucketCounts.get(bucket) ?? 0;
          const bucketAccent = BUCKET_ACCENTS[bucket] ?? 'emerald';
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => setActiveTab('exhibits')}
              className={`fc-wlp-evidence-status-tile ${finelyOsCatalogCard(bucketAccent)} p-6 lg:p-8`}
              data-fc-accent={bucketAccent}
            >
              <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{count}</div>
              <div>
                <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {EVIDENCE_VAULT_BUCKET_LABELS[bucket].replace(/ &.*/, '')}
                </div>
                <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Dispute exhibit bucket</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="fc-wlp-evidence-control-deck">
        <aside className="space-y-3">
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Vault tools</h2>
          {VAULT_TOOLS.map((tool) => {
            const active = activeTab === tool.id;
            const badge =
              tool.id === 'exhibits' ? evidence.length : tool.id === 'review' ? reviewCount : undefined;
            return (
              <button
                key={tool.id}
                type="button"
                data-active={active ? 'true' : undefined}
                className={`fc-wlp-evidence-tool-rail-tile text-left ${finelyOsCatalogCard(tool.accent)} p-5 lg:p-6`}
                data-fc-accent={tool.accent}
                onClick={() => setActiveTab(tool.id)}
              >
                <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tool.label}</div>
                <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tool.hint}</p>
                {badge ? <span className="fc-wlp-evidence-tool-rail-badge">{badge}</span> : null}
              </button>
            );
          })}
          <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-2`} data-fc-accent="sky">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Quick links</p>
            <button type="button" onClick={() => navigate(navigation.reportsPath)} className={FINELY_OS_SECONDARY_BTN}>
              Credit reports
            </button>
            <button type="button" onClick={() => navigate(navigation.lettersPath)} className={FINELY_OS_SECONDARY_BTN}>
              Letter Studio
            </button>
            <button type="button" onClick={() => navigate(navigation.documentsPath)} className={FINELY_OS_SECONDARY_BTN}>
              Documents vault
            </button>
          </div>
        </aside>

        <div className="fc-wlp-evidence-control-main">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
            <PartnerEvidenceVaultWorkspace
              partner={partner}
              actorEmail={email}
              navigation={navigation}
              surface="light"
              embedded
              tab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
      <ProductHubScaffold
        role={role}
        pageId="evidence"
        eyebrow="Evidence vault"
        title="Source exhibits and dispute proof"
        description="Report crops, bureau replies, collector paper, and payment proof — each tied to the finding it supports."
        status={`${evidence.length} exhibit${evidence.length === 1 ? '' : 's'} · live data`}
        freshness={evidence.length ? 'on file' : 'empty vault'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="grid"
        primaryAction={
          <ProductPagePrimaryAction label="Upload exhibit" onClick={() => setActiveTab('upload')} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(navigation.reportsPath)}>
            Credit reports
          </button>
        }
        metrics={metrics}
        metricTitle="Control room pulse"
        metricDescription="Exhibits on file, review queue, mail-ready proof, and source-linked crops."
      >
        {controlRoomBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{reviewCount ? 'Review exhibits before mailing' : evidence.length ? 'Attach proof to letters' : 'Add your first exhibit'}</h2>
          <p>
            {reviewCount
              ? `${reviewCount} exhibit${reviewCount === 1 ? '' : 's'} need confirmation before Letter Studio can mail them.`
              : evidence.length
                ? 'Approved exhibits unlock in Letter Studio — keep crops tied to the finding they support.'
                : 'Capture a report region or upload a bureau reply to start your exhibit library.'}
          </p>
          <ol>
            <li>Upload or capture proof with scrape intel enabled.</li>
            <li>Confirm each crop matches the original report.</li>
            <li>Attach approved exhibits in Letter Studio.</li>
          </ol>
          {guideActions}
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
