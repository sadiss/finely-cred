import React from 'react';
import { AutomationStudioPremiumPage } from '../../features/studioCommandOs/AutomationStudioPremiumPage';
import type { AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';

export default function AdminAutomationsPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  return <AutomationStudioPremiumPage embedded={embedded} />;
}
