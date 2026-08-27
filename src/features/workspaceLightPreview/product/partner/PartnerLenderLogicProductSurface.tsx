import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CircleHelp,
  Landmark,
  PlayCircle,
  ShieldAlert,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCreditScoreSnapshots } from '../../../../data/creditScoreSnapshotsRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { LenderLogicEngine } from '../../../../components/dashboard/LenderLogicEngine';
import { FinelyOsAlertBanner } from '../../../../features/os/FinelyOsAlertBanner';
import {
  formatLenderMarketLine,
  resolveLenderMarketSignals,
  type LenderMarketSignals,
} from '../../../../lib/lenderMarketSignals';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerLenderLogicControlRoom.css';

const SERVICE_LINE_ID = 'funding' as const;

type ControlFamily = 'profile' | 'utilization' | 'business' | 'relationship';

const CONTROL_FAMILIES: Array<{
  id: ControlFamily;
  label: string;
  focus: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'profile', label: 'Credit profile', focus: 'Score and bureau middle', accent: 'sky', icon: TrendingUp },
  { id: 'utilization', label: 'Utilization', focus: 'Revolving balance optics', accent: 'rose', icon: ShieldAlert },
  { id: 'business', label: 'Business signals', focus: 'Revenue and time in business', accent: 'violet', icon: Building2 },
  { id: 'relationship', label: 'Bank relationship', focus: 'Deposits and existing ties', accent: 'emerald', icon: Landmark },
];

const RUNWAY_CHIPS = [
  { family: 'profile' as const, label: 'Profile', accent: 'sky' as const, icon: TrendingUp },
  { family: 'utilization' as const, label: 'Utilization', accent: 'rose' as const, icon: ShieldAlert },
  { family: 'business' as const, label: 'Business', accent: 'violet' as const, icon: Building2 },
  { family: 'relationship' as const, label: 'Bank ties', accent: 'emerald' as const, icon: Landmark },
];

type LenderInputs = {
  score: number | null;
  utilizationPct: number;
  revenueMonthly: number;
  timeInBusinessMonths: number;
  hasRelationship: boolean;
  willingToOpenDeposits: boolean;
  zip?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
};

function deriveLenderInputs(partner: Partner): LenderInputs {
  const snapshots = listCreditScoreSnapshots(partner.id);
  const latestScore = snapshots[0]?.headlineScore;
  const routeKey = partner.primaryRoute || 'personal_restore';
  const personal = partner.routes?.[routeKey]?.personal ?? {};
  const business = (partner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business ?? {};
  const routeScore = partner.routes?.[routeKey]?.score;
  const resolvedScore =
    typeof latestScore === 'number' ? latestScore : typeof routeScore === 'number' ? routeScore : null;
  return {
    score: resolvedScore,
    utilizationPct: typeof business.utilizationPct === 'number' ? business.utilizationPct : 9,
    revenueMonthly:
      typeof business.revenueMonthly === 'number'
        ? business.revenueMonthly
        : partner.financial?.annualIncome
          ? Math.round(partner.financial.annualIncome / 12)
          : 12_000,
    timeInBusinessMonths: typeof business.timeInBusinessMonths === 'number' ? business.timeInBusinessMonths : 12,
    hasRelationship: Boolean(business.hasBankRelationship),
    willingToOpenDeposits: business.willingToOpenDeposits !== false,
    zip: personal.postalCode,
    state: personal.state,
    city: personal.city,
    address: personal.address1,
    address2: personal.address2,
  };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: Partner; inputs: LenderInputs };

export default function PartnerLenderLogicProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Landmark;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/business/lender-logic');
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;
  const reportsPath = mapPortalHref('/portal/reports');

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<ControlFamily>('profile');
  const [marketSignals, setMarketSignals] = useState<LenderMarketSignals | null>(null);
  const [marketLine, setMarketLine] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const partner = getPartnerSync(partnerId!);
      if (!partner) throw new Error('Partner profile not found.');
      const inputs = deriveLenderInputs(partner);
      if (!cancelled) setState({ status: 'ready', partner, inputs });
    } catch (err: unknown) {
      if (!cancelled) setState({ status: 'error', message: (err as Error)?.message || 'Could not load lender logic right now.' });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoInputs: LenderInputs = useMemo(
    () => ({
      score: null,
      utilizationPct: 11,
      revenueMonthly: 12_000,
      timeInBusinessMonths: 14,
      hasRelationship: false,
      willingToOpenDeposits: true,
      zip: '30301',
      state: 'GA',
      city: 'Atlanta',
    }),
    [],
  );

  const inputs = state.status === 'ready' ? state.inputs : demoInputs;

  useEffect(() => {
    let cancelled = false;
    void resolveLenderMarketSignals({ state: inputs.state, zip: inputs.zip }).then((signals) => {
      if (cancelled) return;
      setMarketSignals(signals);
      setMarketLine(formatLenderMarketLine(signals));
    });
    return () => {
      cancelled = true;
    };
  }, [inputs.state, inputs.zip]);

  const askFinelyPrompt = 'Which lender should I target first based on my current profile?';
  const selectedMeta = CONTROL_FAMILIES.find((f) => f.id === selectedFamily) ?? CONTROL_FAMILIES[0];

  const familyDetail = useMemo((): { headline: string; body: string; status: 'ok' | 'warn' } => {
    switch (selectedFamily) {
      case 'profile':
        return inputs.score != null
          ? {
              headline: `Middle score model: ${inputs.score}`,
              body: 'Lenders weight your middle bureau score first. Refresh after each report pull.',
              status: inputs.score >= 680 ? 'ok' : 'warn',
            }
          : {
              headline: 'No score on file',
              body: 'Upload a credit report so lender matches use your real middle score — not a guess.',
              status: 'warn',
            };
      case 'utilization':
        return {
          headline: `${inputs.utilizationPct}% revolving utilization`,
          body: 'Most planning presets target 12% or below before high-limit applications.',
          status: inputs.utilizationPct <= 12 ? 'ok' : 'warn',
        };
      case 'business':
        return {
          headline: `$${inputs.revenueMonthly.toLocaleString()}/mo · ${inputs.timeInBusinessMonths} months`,
          body: 'Revenue consistency and time in business affect fintech and SBA-style matches.',
          status: inputs.timeInBusinessMonths >= 12 ? 'ok' : 'warn',
        };
      default:
        return {
          headline: inputs.hasRelationship ? 'Existing relationship on file' : 'No relationship flagged',
          body: inputs.willingToOpenDeposits
            ? 'Willing to open deposits — credit unions and community banks score higher.'
            : 'Mark deposit willingness to unlock relationship-friendly lenders.',
          status: inputs.hasRelationship || inputs.willingToOpenDeposits ? 'ok' : 'warn',
        };
    }
  }, [inputs, selectedFamily]);

  const runwayChipValue = (family: ControlFamily): string => {
    switch (family) {
      case 'profile':
        return inputs.score != null ? String(inputs.score) : '—';
      case 'utilization':
        return `${inputs.utilizationPct}%`;
      case 'business':
        return `$${(inputs.revenueMonthly / 1000).toFixed(0)}k`;
      default:
        return inputs.hasRelationship ? 'On file' : inputs.willingToOpenDeposits ? 'Willing' : 'None';
    }
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Middle score',
      value: inputs.score ?? '—',
      hint: inputs.score != null ? 'From latest snapshot' : 'Upload a report',
      accent: 'sky',
      icon: TrendingUp,
      onClick: () => (inputs.score != null ? setSelectedFamily('profile') : navigate(reportsPath)),
    },
    {
      label: 'Utilization',
      value: `${inputs.utilizationPct}%`,
      hint: inputs.utilizationPct <= 12 ? 'On target' : 'Above 12% target',
      accent: 'rose',
      icon: ShieldAlert,
      onClick: () => setSelectedFamily('utilization'),
    },
    {
      label: 'Revenue',
      value: `$${inputs.revenueMonthly.toLocaleString()}`,
      hint: `${inputs.timeInBusinessMonths} months in business`,
      accent: 'violet',
      icon: Building2,
      onClick: () => setSelectedFamily('business'),
    },
    {
      label: 'Relationship',
      value: inputs.hasRelationship ? 'On file' : inputs.willingToOpenDeposits ? 'Willing' : 'None',
      hint: 'Deposits and bank ties',
      accent: 'emerald',
      icon: Landmark,
      onClick: () => setSelectedFamily('relationship'),
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Lender logic' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const fundingRunwayBody = (
    <section className="fc-partner-lender-funding-runway" data-surface-layout="timeline-mosaic">
      <header className="fc-partner-lender-runway-band" aria-label="Funding runway">
        <div className="fc-partner-lender-runway-main">
          <span className="fc-partner-lender-runway-eyebrow">
            <Landmark size={14} /> Lender logic
          </span>
          <h2 className="fc-partner-lender-runway-title">Your funding runway</h2>
          <p className="fc-partner-lender-runway-purpose">
            Score, utilization, business revenue, and bank ties — matched to published lender criteria.
          </p>
        </div>
        <div className="fc-partner-lender-runway-chips" role="list" aria-label="Input signals">
          {RUNWAY_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const active = selectedFamily === chip.family;
            return (
              <button
                key={chip.family}
                type="button"
                role="listitem"
                data-active={active ? 'true' : undefined}
                className="fc-partner-lender-runway-chip"
                data-fc-accent={chip.accent}
                onClick={() => setSelectedFamily(chip.family)}
              >
                <span className="fc-partner-lender-runway-chip-icon">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className="fc-partner-lender-runway-chip-copy">
                  <strong>{runwayChipValue(chip.family)}</strong>
                  <span>{chip.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {marketLine ? (
        <div className="fc-partner-lender-alert-rail" role="status">
          <Target size={18} className="shrink-0" />
          <span>
            {marketLine}
            {marketSignals?.noraNote ? ` · ${marketSignals.noraNote}` : null}
          </span>
        </div>
      ) : null}

      {inputs.score == null ? (
        <div className="space-y-3">
          <FinelyOsAlertBanner
            tone="info"
            surface="light"
            message="Upload a credit report so lender matches use your real middle score — not a guess."
          />
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(reportsPath)}>
            <Upload size={14} /> Open reports
          </button>
        </div>
      ) : null}

      <div className="fc-partner-lender-mosaic" aria-label="Profile input families">
        {CONTROL_FAMILIES.map((family) => {
          const Icon = family.icon;
          const selected = family.id === selectedFamily;
          return (
            <button
              key={family.id}
              type="button"
              data-selected={selected ? 'true' : undefined}
              className={`fc-partner-lender-mosaic-tile ${finelyOsCatalogCard(family.accent)}`}
              data-fc-accent={family.accent}
              onClick={() => setSelectedFamily(family.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon size={22} className="shrink-0 opacity-90" />
                <span className={finelyOsStatusChip(selected ? 'ok' : 'warn')}>{selected ? 'Selected' : 'Review'}</span>
              </div>
              <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{family.label}</div>
              <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{family.focus}</p>
            </button>
          );
        })}
      </div>

      <div className={`fc-partner-lender-spotlight ${finelyOsCatalogCard(selectedMeta.accent)}`} data-fc-accent={selectedMeta.accent}>
        <div className="fc-partner-lender-spotlight-grid">
          <div className="space-y-3 min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>{selectedMeta.label}</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{familyDetail.headline}</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{familyDetail.body}</p>
            <span className={finelyOsStatusChip(familyDetail.status)}>
              {familyDetail.status === 'ok' ? 'On target' : 'Needs attention'}
            </span>
          </div>
          <div className="fc-partner-lender-spotlight-actions">
            {selectedFamily === 'profile' && inputs.score == null ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(reportsPath)}>
                <Upload size={14} /> Upload report
              </button>
            ) : null}
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref('/portal/readiness'))}>
              Tune profile <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className={`fc-partner-lender-engine-bed ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Target size={20} />
            <span className={`text-base font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>Lender match engine</span>
          </div>
          <LenderLogicEngine
            layout="full"
            surface="light"
            userScore={inputs.score ?? undefined}
            utilizationPct={inputs.utilizationPct}
            revenueMonthly={inputs.revenueMonthly}
            timeInBusinessMonths={inputs.timeInBusinessMonths}
            zip={inputs.zip}
            state={inputs.state}
            city={inputs.city}
            address={inputs.address}
            address2={inputs.address2}
            hasRelationship={inputs.hasRelationship}
            willingToOpenDeposits={inputs.willingToOpenDeposits}
          />
        </div>
      </div>
    </section>
  );

  const scaffold = (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Lender logic"
      title="Which lenders fit your profile today?"
      description="Planning matches from published criteria — never approvals or guarantees."
      status={isDemo ? 'Demo snapshot' : 'Live planning matches'}
      freshness={marketLine ? 'market signals loaded' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="instrument"
      primaryAction={
        inputs.score != null ? (
          <ProductPagePrimaryAction label="Run full engine" onClick={() => navigate(livePath)} />
        ) : (
          <ProductPagePrimaryAction label="Upload report" onClick={() => navigate(reportsPath)} />
        )
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(serviceLine.upsellPath)}>
          Explore funding path
        </button>
      }
      metrics={metrics}
      metricTitle="Lender signals"
      metricDescription="Score, utilization, business revenue, and bank relationship inputs."
    >
      {fundingRunwayBody}
      <aside className="fc-wlp-page-guide mt-6">
        <div className="fc-wlp-page-guide-icon">
          <PageIcon size={22} strokeWidth={2.05} />
        </div>
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2>Review inputs, then run matches</h2>
        <p>Each input family changes which lenders surface in the engine. Tune profile fields before you apply.</p>
        <ol>
          <li>Check middle score and utilization.</li>
          <li>Confirm business revenue and time in business.</li>
          <li>Run lender matches and pick your first target.</li>
        </ol>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
        Results vary · not legal advice · funding subject to underwriting
        {isDemo ? ' · demo data' : ''}
      </p>
    </ProductHubScaffold>
  );

  if (isDemo) {
    return scaffold;
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading lender logic" />;
  }

  if (state.status === 'error') {
    return (
      <ProductEmptyState
        title="We couldn't load lender logic"
        description={state.message}
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>
            Try again
          </button>
        }
      />
    );
  }

  return scaffold;
}
