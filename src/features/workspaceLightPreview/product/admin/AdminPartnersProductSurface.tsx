import React from 'react';
import PartnersPrimarySignatureSurface from './PartnersPrimarySignatureSurface';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';

/**
 * `/admin/partners` and `/admin/partners/:id` share one product surface.
 *
 * Locked rule: card → enhanced inspector popup over the portfolio.
 * Deep link `:id` opens the same inspector (URL sync only) — never default-route
 * to AdminPartnerFileProductSurface / legacy PartnerDetailPage full page.
 */
export default function AdminPartnersProductSurface(props: WorkspaceProductSurfaceProps) {
  return <PartnersPrimarySignatureSurface {...props} />;
}
