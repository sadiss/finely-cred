import React, { useMemo, useRef } from 'react';
import { CircleHelp, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { useWorkspaceLightPreview } from '../../useWorkspaceLightPreview';
import { WORKSPACE_PRODUCT_ACCENT_SEQUENCE, type WorkspaceProductRole } from '../workspaceProductTokens';
import { getWorkspaceProductNavItem, resolveWorkspaceProductPreviewPath } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { deriveWorkspaceProductPageSpec } from '../data/workspaceProductDerivedPage';
import { getWorkspaceProductSurface } from '../workspaceProductSurfaceRegistry';
import { ProductCollectionSurface, type ProductCollectionItem } from './ProductCollectionSurface';
import { ProductCardObject } from './ProductCardObject';
import { ProductHubScaffold, ProductPagePrimaryAction } from './ProductHubScaffold';
import { openProductCopilot } from './ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState } from './ProductUi';
import { AdminDepartmentSuiteSurface } from './AdminDepartmentSuiteSurface';

const REVIEW_PARTNER_WORKSTATIONS = new Set([
  'letters',
  'letters-vault',
  'debt',
  'checklist',
  'reports',
  'disputes',
  'documents',
  'evidence',
  'analysis',
]);

export function WorkspaceProductModuleSurface({
  role,
  pageId,
  partnerId,
}: {
  role: WorkspaceProductRole;
  pageId?: string;
  partnerId?: string;
}) {
  const navigate = useNavigate();
  const preview = useWorkspaceLightPreview();
  const { partner: contextPartner } = usePartnerSession();
  const canUseReviewPartner =
    role === 'partner' && Boolean(pageId && REVIEW_PARTNER_WORKSTATIONS.has(pageId));
  const effectivePartnerId = partnerId ?? (canUseReviewPartner ? contextPartner?.id : undefined);
  const navItem = getWorkspaceProductNavItem(role, pageId);
  const RealSurface = getWorkspaceProductSurface(role, pageId);
  // A destination that exists in the menu always gets a page. Hand-authored specs win; anything
  // else falls back to a page derived from the destination itself rather than a dead end.
  const authoredSpec = getWorkspaceProductPageSpec(role, pageId);
  const spec = React.useMemo(
    () => authoredSpec ?? (navItem ? deriveWorkspaceProductPageSpec(role, navItem) : undefined),
    [authoredSpec, navItem, role],
  );
  const isDerived = !authoredSpec && Boolean(navItem);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const openWorkspace = () => {
    if (spec?.primaryActionPath) {
      navigate(spec.primaryActionPath);
      return;
    }
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // "Product view" is a visual choice, not permission to replace a signed-in partner's
  // workstation with fixture cards. Use the real record whenever the session supplies one;
  // demo data is only the no-session review fallback.
  const surfaceDataMode = effectivePartnerId ? 'real' : preview.dataMode;

  const collectionItems = useMemo<ProductCollectionItem[]>(
    () =>
      spec?.items.map((item, index) => ({
        ...item,
        accent: WORKSPACE_PRODUCT_ACCENT_SEQUENCE[index % WORKSPACE_PRODUCT_ACCENT_SEQUENCE.length],
        icon: navItem?.icon,
        onOpen: () =>
          navigate(
            item.target
              ? resolveWorkspaceProductPreviewPath(role, item.target)
              : navItem?.path ?? '/',
          ),
      })) ?? [],
    [navItem?.icon, navItem?.path, navigate, role, spec?.items],
  );

  // A page that has graduated to a real, data-backed surface renders that instead of the fixtures.
  if (RealSurface && pageId) {
    return (
      <React.Suspense fallback={<ProductDashboardSkeleton />}>
        <span hidden data-surface-kind="real" data-surface-key={`${role}:${pageId}`} />
        <RealSurface role={role} pageId={pageId} partnerId={effectivePartnerId} dataMode={surfaceDataMode} />
      </React.Suspense>
    );
  }

  if (!navItem || !spec) {
    return (
      <ProductEmptyState
        title="This product page is not configured"
        description="Return to the command center and choose another workspace destination."
        action={
          <button
            type="button"
            className="fc-wlp-btn-primary"
            onClick={() =>
              navigate(
                role === 'admin'
                  ? '/preview/workspace-light/admin/dashboard'
                  : '/preview/workspace-light/portal/dashboard',
              )
            }
          >
            Return to dashboard
          </button>
        }
      />
    );
  }

  if (role === 'admin' && isDerived) {
    return (
      <AdminDepartmentSuiteSurface
        navItem={navItem}
        spec={spec}
        dataMode={preview.dataMode}
      />
    );
  }

  const metrics = spec.metrics.map((metric) => ({
    ...metric,
    onClick: openWorkspace,
  }));
  const PageIcon = navItem.icon;

  return (
    <ProductHubScaffold
      role={role}
      eyebrow={spec.eyebrow}
      title={spec.title}
      description={spec.description}
      status={`${spec.status} · product workspace`}
      freshness="ready now"
      accent={navItem.accent}
      surfaceMode={navItem.surfaceMode}
      icon={navItem.icon}
      primaryAction={
        <ProductPagePrimaryAction label={spec.primaryLabel} onClick={openWorkspace} />
      }
      metrics={metrics}
      metricTitle={spec.metricTitle}
      metricDescription={spec.metricDescription}
    >
      {/* Marks how this page is backed. A fallback page renders perfectly well, so "the route
          loaded" cannot distinguish a built page from an unbuilt one — `e2e/surface-coverage.spec.ts`
          reads this to catch dead tabs. `derived` is the weakest tier: menu metadata only. */}
      <span
        hidden
        data-surface-kind={isDerived ? 'derived' : 'fixture'}
        data-surface-key={`${role}:${pageId}`}
      />
      <section ref={workspaceRef} className="fc-wlp-section">
        <div className="fc-wlp-module-layout">
          <div className="fc-wlp-module-primary">
            {role === 'partner' && pageId === 'billing' ? (
              <div className="fc-wlp-section" style={{ marginBottom: 16 }}>
                <div className="fc-wlp-eyebrow">Payment method</div>
                <div className="fc-wlp-card-strip">
                  <ProductCardObject
                    tier="obsidian"
                    label="Card on file"
                    sublabel="Primary billing method"
                    issuer="Visa"
                    last4="4242"
                    status="Active"
                    size="md"
                    showChip
                    showHologram
                    onClick={openWorkspace}
                  />
                </div>
              </div>
            ) : null}
            {isDerived ? (
              <p className="fc-wlp-section-description">{spec.derivedPlaceholder ?? spec.description}</p>
            ) : null}
            {collectionItems.length ? (
              <ProductCollectionSurface
                title={spec.collectionTitle}
                description={spec.collectionDescription}
                items={collectionItems}
                view={isDerived ? 'rows' : spec.collectionView}
                pageSize={isDerived ? 4 : undefined}
                intelligenceLabel={spec.collectionIntelligence}
              />
            ) : null}
          </div>

          <aside className="fc-wlp-page-guide">
            <div className="fc-wlp-page-guide-icon">
              <PageIcon size={22} strokeWidth={2.05} />
            </div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>{spec.guideTitle}</h2>
            <p>{spec.guideDescription}</p>
            <ol>
              {spec.guideSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="fc-wlp-page-guide-actions">
              <button
                type="button"
                onClick={() =>
                  openProductCopilot({
                    prompt: `What should I do next on ${navItem.label}?`,
                    contextLabel: navItem.label,
                  })
                }
              >
                <CircleHelp size={15} /> Ask Finely
              </button>
              <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
                <PlayCircle size={15} /> Watch how
              </button>
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
