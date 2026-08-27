import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CircleHelp,
  Cross,
  FileText,
  Gavel,
  LogIn,
  Plus,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { BusinessFundabilityScorecard } from '../../../../components/business/BusinessFundabilityScorecard';
import { HetaSocietyDisputeTracker } from '../../../../components/heta/HetaSocietyDisputeTracker';
import { HosBrandMark } from '../../../../components/heta/HosBrandMark';
import {
  HEAD_OF_SOCIETY_NAME,
  HEAD_OF_SOCIETY_PATH,
  HETA_SOCIETY_CAREER_PATHS,
  HETA_SOCIETY_DISPUTE_LIMIT,
  HETA_SOCIETY_SHORT,
} from '../../../../config/hetaSocietyProgram';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { getHetaMemberByPartner, registerHetaSocietyMember } from '../../../../lib/hetaSocietyMembership';
import {
  hetaDisputeSlotsRemaining,
  hetaDisputeSlotsUsed,
  listHetaSocietyDisputes,
} from '../../../../lib/hetaSocietyDisputes';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { arrangeAccents } from '../workspaceAccentArrangement';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, ProductPanel, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { finelyOsCatalogCard } from '../../../os/finelyOsLightUi';
import './partnerHosHubSurface.css';

const METRICS_VARIANT = 'grid' as const;
const HOS_PURPOSE =
  'Your private restoration file — dispute slots, bureau reports, letters, and business credit in one member lane.';

const MOSAIC_TILES = [
  { id: 'disputes' as const, label: 'Start dispute', hint: 'Add negative items', icon: Gavel, accent: 'emerald' as const },
  { id: 'reports' as const, label: 'Upload report', hint: 'Bureau PDFs', icon: Upload, accent: 'violet' as const },
  { id: 'letters' as const, label: 'Letter workspace', hint: 'Round one mail', icon: FileText, accent: 'sky' as const },
  { id: 'business' as const, label: 'Business credit', hint: 'Entity & vendors', icon: Building2, accent: 'rose' as const },
];

type HosMosaicView = (typeof MOSAIC_TILES)[number]['id'];

function formatJoined(iso?: string): string {
  if (!iso) return 'Member';
  try {
    return `Member since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Member';
  }
}

export default function PartnerHosHubProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Cross;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [mosaicView, setMosaicView] = useState<HosMosaicView>('disputes');
  const [version, setVersion] = useState(0);

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const member = useMemo(() => {
    if (!partner?.id) return null;
    return getHetaMemberByPartner(partner.id);
  }, [partner?.id, version]);

  useEffect(() => {
    if (!partner?.id || !partner.profile.email) return;
    const existing = getHetaMemberByPartner(partner.id);
    if (existing) return;
    if (partner.lane === 'heta_society') {
      registerHetaSocietyMember({
        leadId: `partner_${partner.id}`,
        email: partner.profile.email,
        fullName: partner.profile.fullName,
        partnerId: partner.id,
      });
      setVersion((v) => v + 1);
    }
  }, [partner]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const ownerKey = member?.leadId ?? (partner?.id ? `partner_${partner.id}` : '');
  const email = partner?.profile.email ?? member?.email ?? '';
  const slotsUsed = ownerKey ? hetaDisputeSlotsUsed(ownerKey) : 0;
  const slotsLeft = ownerKey ? hetaDisputeSlotsRemaining(ownerKey) : HETA_SOCIETY_DISPUTE_LIMIT;
  const activeDisputes = ownerKey ? listHetaSocietyDisputes(ownerKey).length : 0;
  const slotPct = Math.round((slotsUsed / HETA_SOCIETY_DISPUTE_LIMIT) * 100);

  const reportsPath = mapPortalHref('/portal/reports');
  const lettersPath = mapPortalHref('/portal/letters');
  const businessPath = mapPortalHref('/business/dashboard');
  const loginPath = '/onboarding?lane=heta_society&next=/portal/hos';

  const openDisputes = () => {
    setMosaicView('disputes');
    requestAnimationFrame(() => {
      document.getElementById('hos-dispute-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const askFinelyPrompt = 'What should I do next on my Head of Society restoration file?';

  const growthAccents = useMemo(() => arrangeAccents(HETA_SOCIETY_CAREER_PATHS.length), []);

  const renderMosaicDetail = () => {
    if (mosaicView === 'disputes') {
      return (
        <div id="hos-dispute-tracker">
          {ownerKey && email ? (
            <HetaSocietyDisputeTracker ownerKey={ownerKey} email={email} title="Your restoration file" />
          ) : (
            <ProductEmptyState
              title="Member file not linked yet"
              description={`Enter your access key on the ${HEAD_OF_SOCIETY_NAME} member entrance, then log in with the same email to unlock dispute slots.`}
              action={
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(`${HEAD_OF_SOCIETY_PATH}#hos-access`)}>
                  Enter access key
                </button>
              }
            />
          )}
        </div>
      );
    }
    if (mosaicView === 'reports') {
      return (
        <ProductPanel
          title="Upload bureau reports"
          subtitle="Attach Equifax, Experian, or TransUnion PDFs so each dispute item carries the evidence behind it."
          accent="violet"
          emphasis="raised"
        >
          <p className="fc-wlp-panel-copy">
            Reports live in your full portal workspace — upload once, then link files to each HOS dispute item from the tracker.
          </p>
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(reportsPath)}>
            <Upload size={15} /> Open reports workstation
          </button>
        </ProductPanel>
      );
    }
    if (mosaicView === 'letters') {
      return (
        <ProductPanel
          title="Letter workspace"
          subtitle="Generate dispute letters, mark them ready, and track when each round was mailed."
          accent="sky"
          emphasis="raised"
        >
          <p className="fc-wlp-panel-copy">
            Round-one letters and mail tracking stay in the letters workstation — use the dispute tracker to mark items sent.
          </p>
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(lettersPath)}>
            <FileText size={15} /> Open letter workspace
          </button>
        </ProductPanel>
      );
    }
    return (
      <ProductPanel title="Business credit starter" subtitle="Entity checklist and fundability when personal restoration is moving." accent="rose" emphasis="raised">
        {partner ? <BusinessFundabilityScorecard partner={partner} /> : null}
        <button type="button" className="fc-wlp-btn-primary mt-4" onClick={() => navigate(businessPath)}>
          <Building2 size={15} /> Open business hub
        </button>
      </ProductPanel>
    );
  };

  const mosaicLayout = (
    <div className="fc-hos-mosaic" data-surface-layout="catalog-mosaic">
      <header className={`fc-hos-member-hero ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
        <div className="flex items-start gap-3 min-w-0">
          <HosBrandMark size={40} className="shrink-0" alt="" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide opacity-70">{HEAD_OF_SOCIETY_NAME}</p>
            <p className="text-xl font-extrabold">{partner?.profile.fullName ?? 'Member'}</p>
            <p className="text-sm font-semibold opacity-70">{formatJoined(member?.joinedAt)} · {email || 'member file'}</p>
          </div>
        </div>
        <div className="fc-hos-slot-meter">
          <div className="text-sm font-extrabold">
            Dispute slots · {slotsUsed}/{HETA_SOCIETY_DISPUTE_LIMIT}
          </div>
          <div className="fc-hos-slot-meter-bar">
            <div className="fc-hos-slot-meter-fill" style={{ width: `${slotPct}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold">{slotsLeft} available · {activeDisputes} active</p>
        </div>
      </header>
      <div className="fc-hos-mosaic-grid" role="tablist" aria-label="Member benefits">
        {MOSAIC_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              type="button"
              role="tab"
              aria-selected={mosaicView === tile.id}
              className={`fc-hos-mosaic-tile ${finelyOsCatalogCard(tile.accent)}`}
              data-fc-accent={tile.accent}
              data-active={mosaicView === tile.id ? 'true' : undefined}
              onClick={() => setMosaicView(tile.id)}
            >
              <span className="fc-hos-mosaic-tile-icon" data-fc-accent={tile.accent}>
                <Icon size={20} />
              </span>
              <span className="text-lg font-extrabold">{tile.label}</span>
              <span className="fc-hos-mosaic-tile-hint">{tile.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="fc-hos-mosaic-detail">{renderMosaicDetail()}</div>
      <div>
        <h2 className="text-xl font-extrabold mb-3">Growth opportunities</h2>
        <div className="fc-hos-growth-mosaic">
          {HETA_SOCIETY_CAREER_PATHS.map((path, index) => (
            <button
              key={path.id}
              type="button"
              className={`fc-hos-growth-card ${finelyOsCatalogCard(growthAccents[index] as 'emerald' | 'violet' | 'sky')}`}
              data-fc-accent={growthAccents[index]}
              onClick={() => navigate(path.path)}
            >
              {path.title}
              <p>{path.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="fc-wlp-btn-secondary"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? HEAD_OF_SOCIETY_NAME })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
    </div>
  );

  const demoMetrics: ProductMetric[] = [
    {
      label: 'Dispute slots',
      value: `2/${HETA_SOCIETY_DISPUTE_LIMIT}`,
      hint: 'Items tracked in your HOS file',
      accent: 'emerald',
      icon: Gavel,
      onClick: openDisputes,
    },
    {
      label: 'Active items',
      value: 2,
      hint: 'Open restoration items',
      accent: 'violet',
      icon: FileText,
      onClick: openDisputes,
    },
    {
      label: 'Slots available',
      value: HETA_SOCIETY_DISPUTE_LIMIT - 2,
      hint: 'Room for new negative items',
      accent: 'sky',
      icon: Plus,
      onClick: openDisputes,
    },
    {
      label: 'Member status',
      value: HETA_SOCIETY_SHORT,
      hint: 'Invite-only restoration lane',
      accent: 'rose',
      icon: Cross,
      onClick: () => navigate(mapPortalHref('/portal/hos')),
    },
  ];

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="hos-hub"
        eyebrow={HETA_SOCIETY_SHORT}
        title="Head of Society"
        description={HOS_PURPOSE}
        status={`${slotsLeft || 3} dispute slots available · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label="Start dispute" onClick={openDisputes} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(reportsPath)}>
            Upload report
          </button>
        }
        metrics={demoMetrics}
        metricTitle="Member file summary"
        metricDescription="Four counts so you know how many HOS dispute slots you have before you add items."
      >
        <section className="fc-wlp-section">
          {mosaicLayout}
          <ProductEmptyState
            title="Sign in to open your HOS dispute tracker"
            description="Demo mode shows the member mosaic — sign in with the email you used when you redeemed your access key."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="hos-hub"
        eyebrow={HETA_SOCIETY_SHORT}
        title="Head of Society"
        description={HOS_PURPOSE}
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Log in" onClick={() => navigate(loginPath)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title={`${HEAD_OF_SOCIETY_NAME} member login`}
            description={`Log in with the email you used to join ${HEAD_OF_SOCIETY_NAME} (${HETA_SOCIETY_SHORT}). If you have not redeemed an access key yet, enter it on the member entrance first.`}
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(loginPath)}>
                <LogIn size={15} /> Log in
              </button>
            }
          />
        </section>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return <ProductDashboardSkeleton label="Loading your HOS file" />;
  }

  const liveMetrics: ProductMetric[] = [
    {
      label: 'Dispute slots',
      value: `${slotsUsed}/${HETA_SOCIETY_DISPUTE_LIMIT}`,
      hint: `${slotPct}% of your HOS allowance in use`,
      accent: 'emerald',
      icon: Gavel,
      onClick: openDisputes,
    },
    {
      label: 'Active items',
      value: activeDisputes,
      hint: activeDisputes ? 'Items in your restoration file' : 'No items added yet',
      accent: 'violet',
      icon: FileText,
      onClick: openDisputes,
    },
    {
      label: 'Slots available',
      value: slotsLeft,
      hint: slotsLeft ? 'Room for new negative items' : 'All slots are in use',
      accent: 'sky',
      icon: Plus,
      onClick: openDisputes,
    },
    {
      label: 'Member status',
      value: HETA_SOCIETY_SHORT,
      hint: formatJoined(member?.joinedAt),
      accent: 'rose',
      icon: Cross,
      onClick: () => navigate(HEAD_OF_SOCIETY_PATH),
    },
  ];

  const statusHeadline = slotsLeft
    ? `${slotsLeft} dispute slot${slotsLeft === 1 ? '' : 's'} available`
    : 'All dispute slots in use';

  return (
    <ProductHubScaffold
      role={role}
      pageId="hos-hub"
      eyebrow={HETA_SOCIETY_SHORT}
      title="Head of Society"
      description={HOS_PURPOSE}
      status={`${statusHeadline} · live data`}
      freshness={member?.joinedAt ? formatJoined(member.joinedAt) : email || 'member file'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label="Start dispute" onClick={openDisputes} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(reportsPath)}>
          Upload report
        </button>
      }
      metrics={liveMetrics}
      metricTitle="Member file summary"
      metricDescription="Dispute slots, active items, and membership status at a glance."
    >
      <section className="fc-wlp-section">{mosaicLayout}</section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
