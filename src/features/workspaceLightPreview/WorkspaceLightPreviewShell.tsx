import React from 'react';
import { useLocation } from 'react-router-dom';
import { WorkspaceLightPreviewProvider } from './WorkspaceLightPreviewProvider';
import {
  WORKSPACE_LIGHT_PREVIEW_SURFACES,
  type WorkspaceLightPreviewSurface,
} from './workspaceLightPreviewCatalog';
import { finelyOsCatalogCard } from '../os/finelyOsLightUi';
import { ProductReviewToolbar } from './product/components/ProductReviewToolbar';

function surfaceForPath(pathname: string): WorkspaceLightPreviewSurface | undefined {
  return WORKSPACE_LIGHT_PREVIEW_SURFACES.find((s) => s.path === pathname);
}

/**
 * Preview-only product review chrome. It never ships into the live routes.
 */
export function WorkspaceLightPreviewShell({
  surfaceId,
  pageBed = 'hub',
  children,
  showSwitcher = true,
}: {
  surfaceId?: string;
  pageBed?: 'hub' | 'admin' | 'partner' | 'business' | 'seller';
  children: React.ReactNode;
  showSwitcher?: boolean;
}) {
  const { pathname } = useLocation();
  const active = surfaceForPath(pathname);
  const resolvedId = surfaceId ?? active?.id ?? null;

  return (
    <WorkspaceLightPreviewProvider surfaceId={resolvedId} pageBed={pageBed}>
      {showSwitcher ? <ProductReviewToolbar active={active} /> : null}
      {children}
    </WorkspaceLightPreviewProvider>
  );
}

export function WorkspaceLightSectionHeader({
  sectionId,
  title,
  subtitle,
}: {
  sectionId: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="fc-wl-section-header mb-4" data-fc-wl-section-header={sectionId}>
      <div className="fc-wl-section-eyebrow">{sectionId.replace(/-/g, ' ')}</div>
      <h2 className="fc-wl-section-title">{title}</h2>
      {subtitle ? <p className="fc-wl-section-sub">{subtitle}</p> : null}
    </div>
  );
}

/** Hub catalog tile accent rotation */
export function workspaceLightHubTileClass(accent: WorkspaceLightPreviewSurface['accent'], idx: number) {
  const accents = ['emerald', 'violet', 'sky', 'fuchsia'] as const;
  const raw = accent || accents[idx % accents.length];
  const mapped = raw === 'navy' || raw === 'rose' ? 'fuchsia' : raw;
  return finelyOsCatalogCard(mapped);
}
