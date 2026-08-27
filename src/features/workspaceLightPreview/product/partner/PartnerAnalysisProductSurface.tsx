import React, { useMemo, useState } from 'react';
import {
  CircleHelp,
  FileSearch,
  FileText,
  Lightbulb,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import {
  PartnerStrategyReportsWorkspace,
  type PartnerStrategyReportsNavigation,
  type StrategyReportsVaultTab,
} from '../../../../components/reports/PartnerStrategyReportsWorkspace';
import { listCreditAnalysisReportsByPartner } from '../../../../data/creditAnalysisReportsRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
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
import './partnerAnalysisSurface.css';

const VAULT_ROOMS: Array<{ id: StrategyReportsVaultTab; label: string; hint: string; accent: 'sky' | 'emerald'; icon: typeof Lightbulb }> = [
  {
    id: 'overview',
    label: 'Intel briefing',
    hint: 'Findings, CFPB intel, and how deliverables flow here.',
    accent: 'sky',
    icon: Lightbulb,
  },
  {
    id: 'reports',
    label: 'Saved PDFs',
    hint: 'Open, download, and share strategy deliverables.',
    accent: 'emerald',
    icon: FileText,
  },
];

function strategyReportsNavigation(map: (href: string) => string): PartnerStrategyReportsNavigation {
  return {
    reportsPath: map('/portal/reports'),
    documentsPath: map('/portal/documents'),
  };
}

export default function PartnerAnalysisProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? FileText;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';

  const [activeTab, setActiveTab] = useState<StrategyReportsVaultTab>('reports');

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const navigation = useMemo(() => strategyReportsNavigation(mapPortalHref), [mapPortalHref]);

  const reports = useMemo(
    () => (partner ? listCreditAnalysisReportsByPartner(partner.id) : []),
    [partner],
  );
  const sourceReportCount = useMemo(
    () => new Set(reports.map((item) => item.reportId).filter(Boolean)).size,
    [reports],
  );
  const latestReport = reports[0];

  const metrics: ProductMetric[] = [
    {
      label: 'Saved PDFs',
      value: reports.length,
      hint: reports.length ? 'Strategy reports on file' : 'Generate from Credit Reports',
      accent: 'violet',
      icon: FileText,
      onClick: () => setActiveTab('reports'),
    },
    {
      label: 'Source reports',
      value: sourceReportCount,
      hint: 'Bureau files parsed',
      accent: 'sky',
      icon: FileSearch,
      onClick: () => navigate(mapPortalHref('/portal/reports')),
    },
    {
      label: 'Latest',
      value: latestReport
        ? new Date(latestReport.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '—',
      hint: 'Most recent deliverable',
      accent: 'rose',
      icon: Sparkles,
      onClick: () => setActiveTab('reports'),
    },
    {
      label: 'Format',
      value: 'PDF',
      hint: 'Open or download',
      accent: 'emerald',
      icon: FileText,
      onClick: () => setActiveTab('reports'),
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: 'How do I generate a strategy report?', contextLabel: 'Strategy vault' })}
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
        title="Sign in to open Strategy vault"
        description="Saved credit-analysis PDFs appear here after you generate them from Credit Reports."
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

  const vaultBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="strategy-vault">
      <div
        className={`fc-wlp-strategy-vault-hero ${finelyOsCatalogCard('violet')} p-6 lg:p-8`}
        data-fc-accent="violet"
      >
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Strategy vault</p>
            <h2 className={`mt-1 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              {latestReport ? latestReport.filename || 'Latest strategy PDF' : 'Your analysis library'}
            </h2>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {reports.length
                ? `${reports.length} saved deliverable${reports.length === 1 ? '' : 's'} from Credit Reports — intel briefing and PDF shelf below.`
                : 'Upload a bureau report in Credit Reports, then generate your first strategy PDF here.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(navigation.reportsPath)} className={FINELY_OS_PRIMARY_BTN}>
              Open Credit Reports
            </button>
            <button type="button" onClick={() => navigate(navigation.documentsPath)} className={FINELY_OS_SECONDARY_BTN}>
              Documents vault
            </button>
          </div>
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Deliverable runway</div>
          <div className="fc-wlp-strategy-vault-runway" role="list" aria-label="Strategy report timeline">
            {reports.map((report, index) => {
              const nodeAccent = index % 4 === 0 ? 'violet' : index % 4 === 1 ? 'sky' : index % 4 === 2 ? 'emerald' : 'rose';
              const isLatest = index === 0;
              return (
                <button
                  key={report.id}
                  type="button"
                  role="listitem"
                  data-latest={isLatest ? 'true' : undefined}
                  data-active={activeTab === 'reports' && isLatest ? 'true' : undefined}
                  className={`fc-wlp-strategy-vault-runway-node ${finelyOsCatalogCard(nodeAccent)} p-5 lg:p-6 text-left`}
                  data-fc-accent={nodeAccent}
                  onClick={() => setActiveTab('reports')}
                >
                  <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {isLatest ? 'Latest' : new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>
                    {report.filename || 'Strategy PDF'}
                  </div>
                  <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {report.sourceReportFilename ? `From ${report.sourceReportFilename}` : 'Credit analysis deliverable'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="fc-wlp-strategy-vault-spine">
        <aside className="space-y-3">
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Vault rooms</h2>
          {VAULT_ROOMS.map((room) => {
            const Icon = room.icon;
            const active = activeTab === room.id;
            return (
              <button
                key={room.id}
                type="button"
                data-active={active ? 'true' : undefined}
                className={`fc-wlp-strategy-vault-spine-tile text-left ${finelyOsCatalogCard(room.accent)} p-5 lg:p-6`}
                data-fc-accent={room.accent}
                onClick={() => setActiveTab(room.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{room.label}</div>
                    <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{room.hint}</p>
                    {room.id === 'reports' && reports.length ? (
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        {reports.length} PDF{reports.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="fc-wlp-strategy-vault-stage">
          <div className={`${finelyOsCatalogCard(activeTab === 'overview' ? 'sky' : 'emerald')} p-6 lg:p-8`} data-fc-accent={activeTab === 'overview' ? 'sky' : 'emerald'}>
            <PartnerStrategyReportsWorkspace
              partner={partner}
              navigation={navigation}
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
        pageId="analysis"
        eyebrow="Strategy vault"
        title="Your credit analysis library"
        description="Saved PDF deliverables from Credit Reports — separate from dispute exhibits in Evidence vault."
        status={reports.length ? `${reports.length} saved · live data` : 'No reports yet · live data'}
        freshness={latestReport?.createdAt ? 'recent activity' : 'no reports yet'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="grid"
        primaryAction={
          <ProductPagePrimaryAction
            label="Open Credit Reports"
            onClick={() => navigate(navigation.reportsPath)}
          />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveTab('reports')}>
            Saved PDFs
          </button>
        }
        metrics={metrics}
        metricTitle="Vault pulse"
        metricDescription="Saved PDFs, source bureau files, and your latest deliverable."
      >
        {vaultBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{reports.length ? 'Open your latest strategy PDF' : 'Generate your first strategy report'}</h2>
          <p>
            {reports.length
              ? 'Download or share the most recent analysis, then refresh after your next bureau upload.'
              : 'Parse a bureau file in Credit Reports, then generate a strategy PDF — it lands here automatically.'}
          </p>
          <ol>
            <li>Upload and parse a bureau report.</li>
            <li>Generate the strategy PDF from Credit Reports.</li>
            <li>Return here to open or download every version.</li>
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
