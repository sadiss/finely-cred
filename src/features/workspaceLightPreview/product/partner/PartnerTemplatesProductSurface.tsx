import React, { useMemo } from 'react';
import {
  BookOpen,
  CircleHelp,
  Layers,
  LayoutTemplate,
  PenLine,
  PlayCircle,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { TemplateLibraryHub } from '../../../../components/templates/TemplateLibraryHub';
import { listSavedReasonsByPartner } from '../../../../data/partnerReasonPacksRepo';
import { listVisibleTemplateVaultItemsForPartner } from '../../../../data/templateVaultRepo';
import { getFactualDisputeReasonsLibrary } from '../../../../creditReports/disputeReasons';
import { TEMPLATE_BASES } from '../../../../templates';
import { FINELY_TENANT_ID } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

type HubSection = 'overview' | 'vault' | 'reasons' | 'bases';

const SECTION_TILES: Array<{
  id: HubSection;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'overview', label: 'Overview', hint: 'Start here', accent: 'rose', icon: Sparkles },
  { id: 'vault', label: 'My templates', hint: 'Saved letter bodies', accent: 'violet', icon: Upload },
  { id: 'reasons', label: 'Reasons library', hint: 'Dispute snippets', accent: 'emerald', icon: BookOpen },
  { id: 'bases', label: 'Starter bases', hint: 'Professional scaffolds', accent: 'sky', icon: Layers },
];

export default function PartnerTemplatesProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const [params, setParams] = useSearchParams();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(
    () => (partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner),
    [partnerId, sessionPartner],
  );
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? LayoutTemplate;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partner;
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);
  const section = ((params.get('section') as HubSection) || 'overview') as HubSection;

  const vaultCount = useMemo(() => {
    if (!partner) return 0;
    return listVisibleTemplateVaultItemsForPartner({
      tenantId: partner.tenantId || FINELY_TENANT_ID,
      partnerId: partner.id,
    }).length;
  }, [partner]);

  const savedReasonCount = useMemo(
    () => (partner ? listSavedReasonsByPartner(partner.id).length : 0),
    [partner],
  );
  const builtInReasonCount = useMemo(
    () => Object.values(getFactualDisputeReasonsLibrary()).reduce((a, b) => a + b.reasons.length, 0),
    [],
  );

  const askFinelyPrompt = 'Which template or reason should I use for my next dispute letter?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Template library' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const metrics: ProductMetric[] = [
    {
      label: 'Vault',
      value: isDemo ? 4 : vaultCount,
      hint: 'Saved templates',
      accent: 'violet',
      icon: Upload,
      onClick: () => setParams({ section: 'vault' }),
    },
    {
      label: 'Saved reasons',
      value: isDemo ? 6 : savedReasonCount,
      hint: 'Custom snippets',
      accent: 'emerald',
      icon: BookOpen,
      onClick: () => setParams({ section: 'reasons' }),
    },
    {
      label: 'Starter bases',
      value: TEMPLATE_BASES.length,
      hint: 'Scaffolds',
      accent: 'sky',
      icon: Layers,
      onClick: () => setParams({ section: 'bases' }),
    },
    {
      label: 'Built-in',
      value: builtInReasonCount,
      hint: 'Reason library',
      accent: 'rose',
      icon: Sparkles,
      onClick: () => setParams({ section: 'reasons' }),
    },
  ];

  const sectionCounts: Record<HubSection, number | string> = {
    overview: 'Start',
    vault: isDemo ? 4 : vaultCount,
    reasons: isDemo ? 6 : savedReasonCount,
    bases: TEMPLATE_BASES.length,
  };

  const selectSection = (id: HubSection) => setParams({ section: id });

  const renderComposeStudio = (activePartner: typeof partner | null, demoMode: boolean) => (
    <section className="fc-wlp-section space-y-6" data-surface-layout="catalog-mosaic">
      <div className="fc-wlp-templates-compose">
        <nav className="fc-wlp-templates-compose-rail" aria-label="Template library tools">
          {SECTION_TILES.map((tile) => {
            const Icon = tile.icon;
            const active = section === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                className="fc-wlp-templates-compose-rail-btn"
                data-active={active ? 'true' : undefined}
                data-fcm-accent={tile.accent}
                onClick={() => selectSection(tile.id)}
                aria-label={tile.label}
              >
                <Icon size={20} />
                {tile.label}
              </button>
            );
          })}
        </nav>

        <div className={`${finelyOsCatalogCard('violet')} fc-wlp-compose-canvas min-w-0 p-6 lg:p-8`} data-fc-accent="violet">
          <div className="mb-5">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Letter studio prep</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              {SECTION_TILES.find((t) => t.id === section)?.label ?? 'Overview'}
            </h2>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {SECTION_TILES.find((t) => t.id === section)?.hint ?? 'Pick a tool from the rail.'}
            </p>
          </div>
          {activePartner ? (
            <TemplateLibraryHub partner={activePartner} unifiedShell />
          ) : (
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Sign in to browse saved templates and reasons.</p>
          )}
        </div>

        <aside className="fc-wlp-templates-compose-preview">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Vault</p>
            <div className={`text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{sectionCounts.vault}</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Saved letter bodies ready for Letter Studio.</p>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Reasons</p>
            <div className={`text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{sectionCounts.reasons}</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Custom snippets plus {builtInReasonCount} built-in findings.</p>
          </div>
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-3`} data-fc-accent="rose">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Next step</p>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Open Letter Studio to attach disputes and mail.</p>
            {guideActions}
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/letters'))} className={FINELY_OS_PRIMARY_BTN}>
              Open Letter Studio
            </button>
          </div>
        </aside>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Template library'}
        title={demoSpec?.title ?? 'Start every letter from a proven template instead of a blank page.'}
        description={
          demoSpec?.description ??
          'Saved templates, dispute reasons, and starter bases — then draft in Letter Studio.'
        }
        status={`${demoSpec?.status ?? '4 vault templates'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metrics={metrics}
        metricTitle="Letter building blocks"
        metricDescription="Vault templates, saved reasons, and starter bases feed Letter Studio."
        primaryAction={
          <ProductPagePrimaryAction
            label="Open Letter Studio"
            onClick={() => navigate(mapPortalHref('/portal/letters'))}
          />
        }
      >
        {renderComposeStudio(null, true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Template library"
        title="Sign in to use your template library"
        description="Your saved templates, reasons, and starter bases appear here once you are signed in."
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="Partner profile required"
          description="Sign in to save templates, browse dispute reasons, and open Letter Studio."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Template library"
      title="Letter building hub"
      description="Start from a proven letter or document instead of a blank page."
      status={`${vaultCount} vault · ${savedReasonCount} saved reasons · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metrics={metrics}
      metricTitle="Letter building blocks"
      metricDescription="Vault templates, saved reasons, and starter bases feed Letter Studio."
      primaryAction={
        <ProductPagePrimaryAction
          label="Open Letter Studio"
          onClick={() => navigate(mapPortalHref('/portal/letters'))}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setParams({ section: 'reasons' })}>
          <PenLine size={14} /> Saved reasons
        </button>
      }
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.templates]}>
        {renderComposeStudio(partner, false)}
      </EntitlementGate>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
