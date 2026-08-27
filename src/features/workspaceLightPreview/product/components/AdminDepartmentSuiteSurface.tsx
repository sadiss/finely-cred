import React, { useMemo } from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import {
  getAdminServiceLine,
  getWorkspaceProductNav,
  type AdminServiceLineId,
  type WorkspaceProductNavItem,
} from '../workspaceProductNav';
import { useAdminProductPathResolver } from '../partner/usePartnerProductNavigation';
import type { AdminStageTone } from './ProductAdminStage';
import {
  AdminContextCommand,
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
} from './ProductAdminStage';
import { ProductCollectionSurface, type ProductCollectionItem } from './ProductCollectionSurface';
import { ProductPagePrimaryAction } from './ProductHubScaffold';
import { WORKSPACE_PRODUCT_ACCENT_SEQUENCE } from '../workspaceProductTokens';
import './adminDepartmentSuiteSurface.css';

const TONE_BY_SERVICE: Record<AdminServiceLineId, AdminStageTone> = {
  command: 'command',
  delivery: 'docket',
  growth: 'pipeline',
  studio: 'studio',
  finance: 'control',
  team: 'people',
  platform: 'control',
};

export function AdminDepartmentSuiteSurface({
  navItem,
  spec,
}: {
  navItem: WorkspaceProductNavItem;
  spec: WorkspaceProductPageSpec;
  dataMode: 'demo' | 'real';
}) {
  const navigate = useNavigate();
  const resolvePath = useAdminProductPathResolver();
  const service = navItem.service as AdminServiceLineId;
  const line = getAdminServiceLine(service);
  const siblings = useMemo(
    () => getWorkspaceProductNav('admin').filter((item) => item.service === service && item.id !== navItem.id),
    [service, navItem.id],
  );
  const PageIcon = navItem.icon;

  const relatedItems = useMemo<ProductCollectionItem[]>(
    () =>
      (spec.items.length ? spec.items : siblings.slice(0, 4).map((item) => ({
        id: item.id,
        title: item.label,
        description: item.description,
        meta: line.label,
        status: 'ready' as const,
        actionKind: 'open' as const,
        target: item.path,
      }))).slice(0, 4).map((item, index) => ({
        ...item,
        accent: WORKSPACE_PRODUCT_ACCENT_SEQUENCE[index % WORKSPACE_PRODUCT_ACCENT_SEQUENCE.length],
        icon: siblings.find((s) => s.label === item.title)?.icon ?? PageIcon,
        onOpen: () =>
          navigate(
            item.target
              ? resolvePath(item.target)
              : resolvePath(navItem.legacyPath ?? navItem.path),
          ),
      })),
    [PageIcon, line.label, navigate, resolvePath, siblings, spec.items, navItem.legacyPath, navItem.path],
  );

  const openPrimary = () => navigate(resolvePath(spec.primaryActionPath ?? navItem.legacyPath ?? navItem.path));

  return (
    <AdminStageShell
      family="department-suite"
      signature={`${service}-suite-canvas`}
      accent={line.accent}
    >
      <span hidden data-surface-kind="derived" data-surface-key={`admin:${navItem.id}`} />

      <AdminStageHero
        tone={TONE_BY_SERVICE[service]}
        accent={line.accent}
        eyebrow={`Admin workspace · ${line.label}`}
        title={spec.title}
        description={spec.derivedPlaceholder ?? spec.description}
        status={`${spec.status} · product workspace`}
        freshness="ready now"
        icon={PageIcon}
        primaryAction={
          <ProductPagePrimaryAction label={spec.primaryLabel} onClick={openPrimary} />
        }
      />

      <AdminStageSection
        eyebrow={navItem.label}
        title={`Work on ${navItem.label}`}
        description={spec.derivedPlaceholder ?? spec.description}
        tone="light"
      >
        <p className="fc-wlp-section-description">{spec.derivedPlaceholder ?? spec.description}</p>
      </AdminStageSection>

      {relatedItems.length ? (
        <AdminStageSection
          eyebrow="Related pages"
          title={spec.collectionTitle}
          description={spec.collectionDescription}
          tone="light"
        >
          <ProductCollectionSurface
            title={spec.collectionTitle}
            description={spec.collectionDescription}
            items={relatedItems}
            view="rows"
            pageSize={4}
            intelligenceLabel={spec.collectionIntelligence}
          />
        </AdminStageSection>
      ) : null}

      <AdminContextCommand
        label={`${line.label} navigator`}
        title={spec.guideTitle}
        description={spec.guideDescription}
        steps={spec.guideSteps}
        prompt={`What should I do next on ${navItem.label}, and which ${line.label} room should I use?`}
        contextLabel={navItem.label}
        onWatch={() => navigate('/resources#presenter-demo')}
      />

      <div className="fc-wlp-suite-footnote">
        <Compass size={13} />
        <span>Related pages stay in the menu — they are shortcuts, not the work on this screen.</span>
        <Sparkles size={13} />
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </AdminStageShell>
  );
}
