import React, { useMemo, useState } from 'react';
import { ArrowRight, Lock, Sparkles, Crown, Building2, Landmark, BriefcaseBusiness } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { hasEntitlement } from '../../data/billingRepo';
import { getFeatureFlags, isNoraCapitalConfigured } from '../../data/settingsRepo';
import { PartnerFundingCommandStrip } from '../../components/partner/PartnerFundingCommandStrip';
import { FundingLadderPanel } from '../../components/funding/FundingLadderPanel';
import { submitPartnerFundingHandoff } from '../../lib/noraFundingHandoff';
import { FinelyBridgeConnectorPanel } from '../../components/bridge/FinelyBridgeConnectorPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Lane = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  entitlementKey?: string;
  icon: React.ReactNode;
};

const LANES: Lane[] = [
  {
    id: 'lane_funding_readiness',
    title: 'Funding Readiness',
    subtitle: 'Blueprint → scorecard → execution',
    description: 'Structured readiness milestones, lender-facing packaging, and execution checklists.',
    entitlementKey: 'wealth_paths_access',
    icon: <Sparkles size={18} className="text-emerald-300" />,
  },
  {
    id: 'lane_business_credit',
    title: 'Business Credit Build',
    subtitle: 'Vendor sequencing + fundability',
    description: 'Corporate credit build steps, vendor sequencing, compliance, and reporting milestones.',
    entitlementKey: 'wealth_builder_dfy',
    icon: <Building2 size={18} className="text-fuchsia-300" />,
  },
  {
    id: 'lane_capital_deployment',
    title: 'Capital Deployment',
    subtitle: 'Where wealth paths begin',
    description: 'Plan and deploy funding into wealth-building vehicles with structured guardrails.',
    entitlementKey: 'wealth_paths_premium',
    icon: <Landmark size={18} className="text-sky-300" />,
  },
  {
    id: 'lane_nora_capital',
    title: 'Nora Capital Group (Connected Path)',
    subtitle: 'Funding applications + accelerator',
    description: 'Connect to Nora Capital Group for funding applications when your credit file is funding-ready.',
    entitlementKey: 'wealth_paths_premium',
    icon: <BriefcaseBusiness size={18} className="text-violet-300" />,
  },
];

export default function PartnerWealthPathsPage() {
  const navigate = useNavigate();
  const { partner, refresh } = usePartnerSession();
  type WealthTab = 'overview' | 'lanes' | 'ladder';
  const [tab, setTab] = useState<WealthTab>('lanes');
  const features = getFeatureFlags();
  const [handoffBusy, setHandoffBusy] = useState(false);
  const noraOn = isNoraCapitalConfigured();

  const reportCount = useMemo(() => {
    if (!partner) return 0;
    return Number(partner.journeySignals?.legacyReportCount ?? 0);
  }, [partner]);

  const letterCount = useMemo(() => {
    if (!partner) return 0;
    return Number(partner.journeySignals?.legacyLetterCount ?? 0);
  }, [partner]);

  const hasAnyAccess = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, 'wealth_paths_access') || hasEntitlement(partner.id, 'wealth_paths_premium');
  }, [partner]);

  const unlockPath = partner ? '/portal/billing#plans-section' : '/pricing';

  return (
    <PageShell
      badge="Partner Portal"
      title="Wealth Paths"
      subtitle="Lane-based programs that unlock after your build. This is where credit becomes capital."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Wealth paths"
          title="Where credit becomes capital"
          subtitle="Lane-based programs that unlock after your build — funding readiness, business credit, and Nora Capital connection."
          accent="emerald"
          kpis={[
            { label: 'Lanes', value: String(LANES.length), hint: 'Programs', accent: 'emerald' },
            { label: 'Reports', value: String(reportCount), hint: 'Uploaded', accent: 'violet' },
            { label: 'Letters', value: String(letterCount), hint: 'Generated', accent: 'amber' },
            { label: 'Access', value: hasAnyAccess ? 'Unlocked' : 'Locked', hint: 'Wealth builder', accent: hasAnyAccess ? 'emerald' : 'rose' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'lanes', label: 'Lanes' },
            { id: 'ladder', label: 'Funding ladder' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as WealthTab)}
          primaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          secondaryAction={{ label: partner ? 'Unlock in billing' : 'View pricing', onClick: () => navigate(unlockPath) }}
        >
          {tab === 'overview' && (
            <>
              {partner ? (
                <PartnerFundingCommandStrip
                  partner={partner}
                  reportCount={reportCount}
                  letterCount={letterCount}
                  onApply={() => {
                    if (handoffBusy) return;
                    setHandoffBusy(true);
                    void submitPartnerFundingHandoff(partner).then((r) => {
                      setHandoffBusy(false);
                      if (r.ok) refresh();
                      else window.alert(r.error ?? 'Funding handoff failed.');
                    });
                  }}
                />
              ) : null}

              {partner ? (
                <FinelyBridgeConnectorPanel
                  partner={partner}
                  reportCount={reportCount}
                  letterCount={letterCount}
                  mode="origination"
                  onPartnerRefresh={() => refresh()}
                />
              ) : null}

              {!features.wealthPaths && (
                <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
                  <div className="inline-flex items-center gap-2 text-fuchsia-200">
                    <Lock size={18} />
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>Module gated</span>
                  </div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Wealth Paths are currently disabled in settings. Enable them in{' '}
                    <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>/admin/settings</span> → Features.
                  </div>
                </div>
              )}

              <div className={`${finelyOsCatalogCard('violet')} !p-5 md:p-8 space-y-4`}>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 ${finelyOsStatusChip('warn')}`}>
                      <Crown size={14} /> Wealth Builder
                    </div>
                    <div className={`max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
                      Your Wealth Paths unlock based on your program. Start with Wealth Builder DIY/DFY, then unlock premium lanes
                      (including Nora Capital Group connection) in the Advanced Wealth Builder.
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate(unlockPath)} className={FINELY_OS_SUCCESS_BTN}>
                    {partner ? 'Unlock in Billing' : 'View Wealth Builder pricing'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {features.wealthPaths && !hasAnyAccess && (
                <div className={FINELY_OS_LUXURY_EMPTY}>
                  You don&apos;t have access to Wealth Paths yet. Choose a Wealth Builder program to unlock lanes.
                </div>
              )}
            </>
          )}

          {tab === 'ladder' && partner ? <FundingLadderPanel partnerId={partner.id} /> : null}

          {tab === 'lanes' && (
        <div className="grid md:grid-cols-2 gap-6">
          {LANES.map((lane) => {
            const locked = (() => {
              if (!partner) return false;
              if (!lane.entitlementKey) return false;
              return !hasEntitlement(partner.id, lane.entitlementKey);
            })();
            return (
              <div key={lane.id} className={`${finelyOsListItem(!locked, locked ? 'violet' : 'emerald')} p-6 ${locked ? 'opacity-80' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony !p-0 w-10 h-10 flex items-center justify-center`}>
                      {lane.icon}
                    </div>
                    <div className="space-y-1">
                      <div className={FINELY_OS_ENTITY_VALUE}>{lane.title}</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{lane.subtitle}</div>
                    </div>
                  </div>
                  {locked && (
                    <div className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <Lock size={14} />
                      Locked
                    </div>
                  )}
                </div>

                <p className={`mt-4 ${FINELY_OS_ENTITY_BODY} leading-relaxed`}>{lane.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {locked ? (
                    <button type="button" onClick={() => navigate(unlockPath)} className={FINELY_OS_SECONDARY_BTN}>
                      Unlock in Billing <ArrowRight size={14} />
                    </button>
                  ) : lane.id === 'lane_nora_capital' && noraOn && partner ? (
                    <>
                      <button
                        type="button"
                        disabled={handoffBusy}
                        onClick={() => {
                          setHandoffBusy(true);
                          void submitPartnerFundingHandoff(partner).then((r) => {
                            setHandoffBusy(false);
                            if (r.ok) refresh();
                            else window.alert(r.error ?? 'Funding handoff failed.');
                          });
                        }}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        Apply for funding <ArrowRight size={14} />
                      </button>
                      <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
                        View readiness <ArrowRight size={14} />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
                      Open lane <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
