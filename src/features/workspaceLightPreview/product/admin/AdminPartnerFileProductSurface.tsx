/**
 * Legacy escape route — not registered in workspaceProductSurfaceRegistry.
 *
 * Wave 1R locked rule: `/admin/partners` and `/admin/partners/:id` always render
 * AdminPartnersProductSurface → PartnerRecordInspector popup.
 * This file only exists for historical imports; it redirects to the portfolio inspector.
 */
import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useMappedAdminNavigate } from '../partner/usePartnerProductNavigation';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import {
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
} from '../components/ProductAdminStage';

function inspectorPath(partnerRouteId: string): string {
  const partnerId = decodeURIComponent(partnerRouteId);
  return `/admin/partners/${encodeURIComponent(partnerId)}?tab=overview`;
}

/** @deprecated Prefer PartnerRecordInspector on AdminPartnersProductSurface. */
export default function AdminPartnerFileProductSurface({
  partnerRouteId,
}: WorkspaceProductSurfaceProps & { partnerRouteId: string }) {
  const navigate = useMappedAdminNavigate();
  const target = inspectorPath(partnerRouteId);

  useEffect(() => {
    navigate(target, { replace: true });
  }, [navigate, target]);

  return (
    <AdminStageShell family="portfolio-suite" signature="partner-file-redirect" accent="emerald">
      <span hidden data-surface-kind="redirect" data-surface-key="admin:partners:detail-legacy" />
      <AdminStageHero
        tone="people"
        accent="emerald"
        eyebrow="Partners portfolio"
        title="Opening partner inspector…"
        description="Partner files live in the partners portfolio inspector — not a separate legacy workstation."
        status="Redirecting"
        freshness="portfolio inspector"
        icon={Users}
        primaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(target, { replace: true })}>
            <Users size={15} /> Open inspector now
          </button>
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/partners', { replace: true })}>
            <Users size={15} /> All partners
          </button>
        }
      />

      <AdminStageSection
        eyebrow="What changed"
        title="One partner file UI"
        description="Card clicks and deep links open the enhanced inspector over the portfolio. This legacy route forwards you there automatically."
        tone="light"
      >
        <p className="fc-wlp-section-description">
          If you are not redirected in a moment, use <strong>Open inspector now</strong> above.
        </p>
      </AdminStageSection>
    </AdminStageShell>
  );
}
