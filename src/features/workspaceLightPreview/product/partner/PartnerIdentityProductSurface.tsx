import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { listProcessedDocumentsByPartner } from '../../../../data/documentsRepo';
import { listCasesByPartner } from '../../../../data/casesRepo';
import { bureauLinksByGroup } from '../../../../lib/bureauFreezeCatalog';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

type JourneyStopId = 'ftc' | 'freeze' | 'disputes' | 'vault';

type JourneyStop = {
  id: JourneyStopId;
  label: string;
  description: string;
  complete: boolean;
  current: boolean;
  meta: string;
  actionLabel: string;
  onOpen: () => void;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; disputeCount: number; documentCount: number };

const RUNWAY_ACCENTS: Array<'emerald' | 'sky' | 'violet' | 'rose'> = ['emerald', 'sky', 'violet', 'rose'];

function buildJourneyStops(
  disputeCount: number,
  documentCount: number,
  mapPortalHref: (href: string) => string,
  navigate: (path: string) => void,
  onSelectStop: (id: JourneyStopId) => void,
): JourneyStop[] {
  const ftcDone = documentCount > 0;
  const disputesStarted = disputeCount > 0;

  return [
    {
      id: 'ftc',
      label: 'FTC report',
      description: 'File at identitytheft.gov and save the confirmation PDF to your documents vault.',
      complete: ftcDone,
      current: !ftcDone,
      meta: ftcDone ? `${documentCount} proof file${documentCount === 1 ? '' : 's'} on file` : 'File first',
      actionLabel: 'Open identitytheft.gov',
      onOpen: () => window.open('https://www.identitytheft.gov/', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'freeze',
      label: 'Bureau freezes',
      description: 'Place fraud alerts or full freezes at Equifax, Experian, and TransUnion.',
      complete: false,
      current: ftcDone && !disputesStarted,
      meta: '3 major bureaus',
      actionLabel: 'Review freeze links',
      onOpen: () => onSelectStop('freeze'),
    },
    {
      id: 'disputes',
      label: 'Dispute fraud',
      description: 'Flag unauthorized accounts with factual findings and evidence from your vault.',
      complete: disputesStarted && documentCount > 0,
      current: ftcDone && disputesStarted,
      meta: disputeCount ? `${disputeCount} open round${disputeCount === 1 ? '' : 's'}` : 'Start in Disputes',
      actionLabel: 'Open disputes',
      onOpen: () => navigate(mapPortalHref('/portal/disputes')),
    },
    {
      id: 'vault',
      label: 'Proof vault',
      description: 'Store police reports, FTC confirmations, and bureau responses as they arrive.',
      complete: documentCount >= 2,
      current: ftcDone && documentCount > 0 && documentCount < 2,
      meta: documentCount ? `${documentCount} document${documentCount === 1 ? '' : 's'}` : 'Vault empty',
      actionLabel: 'Open documents',
      onOpen: () => navigate(mapPortalHref('/portal/documents')),
    },
  ];
}

export default function PartnerIdentityProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? ShieldAlert;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/identity-theft');
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [activeStop, setActiveStop] = useState<JourneyStopId>('ftc');

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const disputes = listCasesByPartner(partnerId!);
      const documents = listProcessedDocumentsByPartner(partnerId!);
      if (!cancelled) {
        setState({
          status: 'ready',
          disputeCount: disputes.filter((item) => item.status !== 'closed').length,
          documentCount: documents.length,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load identity recovery right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  useEffect(() => {
    if (state.status !== 'ready' && !isDemo) return;
    const disputeCount = state.status === 'ready' ? state.disputeCount : 1;
    const documentCount = state.status === 'ready' ? state.documentCount : 0;
    const stops = buildJourneyStops(disputeCount, documentCount, mapPortalHref, navigate, setActiveStop);
    const current = stops.find((s) => s.current);
    if (current) setActiveStop(current.id);
  }, [state, isDemo, mapPortalHref, navigate]);

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: 'What should I do first if I suspect identity theft?', contextLabel: 'Identity theft' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderStopDetail = (stop: JourneyStop, disputeCount: number, documentCount: number) => {
    if (stop.id === 'freeze') {
      return (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 flex items-start gap-4`} data-fc-accent="emerald">
              <FileCheck2 size={24} className="text-emerald-500 shrink-0" />
              <div>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>FTC Identity Theft Report</div>
                <a href="https://www.identitytheft.gov/" target="_blank" rel="noreferrer" className={`mt-2 inline-block ${FINELY_OS_ENTITY_ACCENT_LINK} text-base font-bold`}>
                  Open identitytheft.gov
                </a>
              </div>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 flex items-start gap-4`} data-fc-accent="violet">
              <AlertTriangle size={24} className="text-violet-500 shrink-0" />
              <div>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Prescreen opt-out</div>
                <a href="https://www.optoutprescreen.com/" target="_blank" rel="noreferrer" className={`mt-2 inline-block ${FINELY_OS_ENTITY_ACCENT_LINK} text-base font-bold`}>
                  OptOutPrescreen.com
                </a>
              </div>
            </div>
          </div>
          {(['credit_bureau', 'specialty', 'banking'] as const).map((group) => (
            <div
              key={group}
              className={`${finelyOsCatalogCard(group === 'credit_bureau' ? 'sky' : group === 'specialty' ? 'rose' : 'emerald')} p-6 lg:p-8`}
              data-fc-accent={group === 'credit_bureau' ? 'sky' : group === 'specialty' ? 'rose' : 'emerald'}
            >
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3 font-bold`}>
                {group === 'credit_bureau' ? 'Major credit bureaus' : group === 'specialty' ? 'Innovis, SageStream, NCTUE & more' : 'Banking reports'}
              </div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {bureauLinksByGroup(group).map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer" className={`${FINELY_OS_ENTITY_ACCENT_LINK} text-sm font-bold`}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (stop.id === 'vault' || stop.id === 'ftc') {
      return (
        <div className="space-y-4">
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{stop.description}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={stop.onOpen} className={FINELY_OS_PRIMARY_BTN}>
              {stop.actionLabel} <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
              Documents vault <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{stop.description}</p>
        <ol className={`list-decimal pl-5 space-y-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          <li>File FTC report and save confirmation PDF to Documents Vault.</li>
          <li>Place fraud alerts or full freezes at all three bureaus.</li>
          <li>Dispute fraudulent or inaccurate tradelines in Dispute Center.</li>
          <li>Upload bureau responses and creditor letters as they arrive.</li>
          <li>Message your case team if you need escalation support.</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/disputes'))} className={FINELY_OS_SUCCESS_BTN}>
            Dispute center <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/messages'))} className={FINELY_OS_SECONDARY_BTN}>
            Communication hub <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
            Open vault <ArrowRight size={14} />
          </button>
        </div>
        <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
          {documentCount ? `${documentCount} proof document${documentCount === 1 ? '' : 's'} on file` : 'Vault empty'} · {disputeCount ? `${disputeCount} open dispute${disputeCount === 1 ? '' : 's'}` : 'No disputes started'}
        </p>
      </div>
    );
  };

  const renderProtectionRunway = (disputeCount: number, documentCount: number) => {
    const stops = buildJourneyStops(disputeCount, documentCount, mapPortalHref, navigate, setActiveStop);
    const currentStop = stops.find((s) => s.id === activeStop) ?? stops.find((s) => s.current) ?? stops[0];
    const completedCount = stops.filter((s) => s.complete).length;

    return (
      <section className="fc-wlp-id-runway" data-surface-layout="timeline-runway">
        <div className="space-y-6">
          <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-4 p-6 lg:p-8`}>
            <ShieldAlert size={24} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Identity theft support</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                File your FTC report, freeze bureau files, and keep proof organized in Documents Vault.
              </p>
            </div>
          </div>

          <div className="fc-wlp-id-runway-track" role="tablist" aria-label="Identity recovery runway">
            {stops.map((stop, index) => (
              <button
                key={stop.id}
                type="button"
                role="tab"
                aria-selected={activeStop === stop.id}
                className={`fc-wlp-id-runway-stop ${finelyOsCatalogCard(RUNWAY_ACCENTS[index % RUNWAY_ACCENTS.length])}`}
                data-fc-accent={RUNWAY_ACCENTS[index % RUNWAY_ACCENTS.length]}
                data-current={activeStop === stop.id ? 'true' : stop.current ? 'true' : undefined}
                data-complete={stop.complete ? 'true' : undefined}
                onClick={() => setActiveStop(stop.id)}
              >
                <span className="fc-wlp-id-runway-marker">
                  {stop.complete ? <Check size={14} strokeWidth={3} /> : index + 1}
                </span>
                <strong>{stop.label}</strong>
                <p>{stop.meta}</p>
              </button>
            ))}
          </div>

          <div className={`fc-wlp-id-runway-detail ${finelyOsCatalogCard('rose')}`} data-fc-accent="rose">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Step {stops.findIndex((s) => s.id === currentStop.id) + 1} of {stops.length}</p>
            <h3 className={`mt-1 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{currentStop.label}</h3>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{currentStop.description}</p>
            <div className="mt-6">{renderStopDetail(currentStop, disputeCount, documentCount)}</div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
            <div className="fc-wlp-eyebrow">What to do next</div>
            <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              {completedCount} of {stops.length} steps complete
            </p>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {documentCount
                ? disputeCount
                  ? 'Keep disputes moving with vault proof.'
                  : 'Open Disputes for unauthorized accounts.'
                : 'File your FTC report first.'}
            </p>
            {guideActions}
          </div>
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
            <ShieldCheck size={20} />
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Freezes stop new accounts while disputes work through.</p>
            <button type="button" onClick={() => setActiveStop('freeze')} className={FINELY_OS_SECONDARY_BTN}>
              Bureau freeze links
            </button>
          </div>
        </aside>
      </section>
    );
  };

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Identity theft'}
        title={demoSpec?.title ?? 'Lock down your identity, then remove what was never yours.'}
        description={demoSpec?.description ?? 'Four recovery stops — FTC, freezes, disputes, and proof vault.'}
        status={`${demoSpec?.status ?? '2 steps remaining'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Start identity recovery'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {renderProtectionRunway(1, 0)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading identity recovery" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Identity theft"
        title="Lock down your identity, then remove what was never yours."
        description="File with the FTC, freeze bureau files, dispute fraud, and store proof in your vault."
        status="Could not load identity recovery"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load identity recovery"
          description={state.message}
          action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>}
        />
      </ProductHubScaffold>
    );
  }

  const { disputeCount, documentCount } = state;

  const metrics: ProductMetric[] = [
    { label: 'Bureau freezes', value: '0 of 3', hint: 'Complete all three bureaus', accent: 'rose', icon: ShieldAlert, onClick: () => setActiveStop('freeze') },
    { label: 'FTC report', value: documentCount ? 'On file' : 'Needed', hint: documentCount ? 'Proof in vault' : 'File at identitytheft.gov', accent: 'emerald', icon: FileCheck2, onClick: () => window.open('https://www.identitytheft.gov/', '_blank', 'noopener,noreferrer') },
    { label: 'Fraud disputes', value: disputeCount, hint: disputeCount ? 'Open rounds' : 'Start in Disputes', accent: 'violet', icon: ShieldAlert, onClick: () => navigate(mapPortalHref('/portal/disputes')) },
    { label: 'Proof documents', value: documentCount, hint: 'Police, FTC, bureau mail', accent: 'sky', icon: ExternalLink, onClick: () => navigate(mapPortalHref('/portal/documents')) },
  ];

  const runway = renderProtectionRunway(disputeCount, documentCount);

  const content = partner ? (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.identityTheft]}>
      {runway}
    </EntitlementGate>
  ) : (
    runway
  );

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Identity theft"
      title="Lock down your identity, then remove what was never yours."
      description="File with the FTC, freeze bureau files, dispute fraud, and store proof in your vault."
      status={`${disputeCount ? `${disputeCount} open dispute${disputeCount === 1 ? '' : 's'}` : 'Protective steps first'} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="jewel"
      primaryAction={<ProductPagePrimaryAction label="Start identity recovery" onClick={() => setActiveStop('ftc')} />}
      metrics={metrics}
      metricTitle="Protection status"
      metricDescription="Each control shows whether it is active."
    >
      {content}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
