import React, { useEffect, useMemo, useState } from 'react';
import {
  PartnerSessionOverrideProvider,
  usePartnerSession,
} from '../../auth/PartnerSessionContext';
import { WL_PAGE_BEDS, WL_ROLE_HUB_ACCENTS, type WlAccent } from './workspaceLightDesignTokens';
import { WorkspaceLightPreviewContext } from './useWorkspaceLightPreview';
import { prepareWorkspaceReviewPartner } from './product/data/workspaceReviewPartner';
import './workspaceLightPreview.css';
import './workspaceLightSurfaces.css';
import './product/workspaceProduct.css';
import './product/components/archetypes/productArchetypes.css';

export function WorkspaceLightPreviewProvider({
  surfaceId = null,
  pageBed = 'hub',
  children,
}: {
  surfaceId?: string | null;
  pageBed?: keyof typeof WL_PAGE_BEDS;
  children: React.ReactNode;
}) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [showSectionOutlines, setShowSectionOutlines] = useState(false);
  // The redesigned workspace is now the product surface. The old split/live and demo/real
  // switches created four competing experiences and routinely ejected reviewers to legacy pages.
  const viewMode = 'preview' as const;
  const dataMode = 'demo' as const;
  const [presentationMode, setPresentationMode] = useState(false);
  const { partner: sessionPartner } = usePartnerSession();
  const [reviewPartner] = useState(() => prepareWorkspaceReviewPartner());
  const previewPartner = pageBed === 'partner' && !sessionPartner ? reviewPartner : null;
  const hubAccent = (WL_ROLE_HUB_ACCENTS[pageBed] ?? 'violet') as WlAccent;
  const bed = WL_PAGE_BEDS[pageBed] ?? WL_PAGE_BEDS.hub;

  const value = useMemo(
    () => ({
      active: true as const,
      surfaceId: surfaceId ?? null,
      pageBed,
      hubAccent,
      viewMode,
      dataMode,
      presentationMode,
      setPresentationMode,
      density,
      setDensity,
      showSectionOutlines,
      setShowSectionOutlines,
    }),
    [surfaceId, pageBed, hubAccent, viewMode, dataMode, presentationMode, density, showSectionOutlines],
  );

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-fc-workspace-light-preview', '1');
    html.setAttribute('data-fc-theme', 'light');
    html.setAttribute('data-fc-wl-page-bed', pageBed);
    return () => {
      html.removeAttribute('data-fc-workspace-light-preview');
      html.removeAttribute('data-fc-wl-page-bed');
    };
  }, [pageBed]);

  useEffect(() => {
    if (!presentationMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresentationMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentationMode]);

  const previewRoot = (
    <div
        data-fc-workspace-light-preview="1"
        data-fc-theme="light"
        data-fc-wl-surface={surfaceId || undefined}
        data-fc-wl-page-bed={pageBed}
        data-fc-wl-density={density}
        data-fc-wl-outlines={showSectionOutlines ? '1' : undefined}
        data-fc-wlp-view-mode={viewMode}
        data-fc-wlp-data-mode={dataMode}
        data-fc-wlp-presentation={presentationMode ? '1' : undefined}
        className="fc-wl-preview-root min-h-screen"
        style={
          {
            '--fc-wl-bed': bed.bg,
            '--fc-wl-ink': bed.ink,
            '--fc-wl-muted': bed.muted,
            '--fc-wl-hub-accent': hubAccent,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
  );

  return (
    <WorkspaceLightPreviewContext.Provider value={value}>
      {previewPartner ? (
        <PartnerSessionOverrideProvider partner={previewPartner}>
          {previewRoot}
        </PartnerSessionOverrideProvider>
      ) : (
        previewRoot
      )}
    </WorkspaceLightPreviewContext.Provider>
  );
}
