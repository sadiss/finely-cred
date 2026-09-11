import React from 'react';
import { ProductPageLayout } from '../../features/workspaceLightPreview/product/components/ProductPageLayout';
import { PartnerDashboardProductSurface } from '../../features/workspaceLightPreview/surfaces/PartnerDashboardProductSurface';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPortalNoticedItems } from '../../lib/finelyProactiveSignals';

/**
 * Canonical partner home. The leftover hub (KPI cards, work modals, launcher) is retired.
 * ProductRoutedPage already owns `/portal/dashboard`; this file stays as a safe fallback.
 */
export default function PartnerDashboardPage() {
  return (
    <div className="fc-senior-simple">
      <ProductPageLayout role="partner" pageId="dashboard">
        <nav className="fc-launch-lane-header mb-4 flex flex-wrap gap-2" aria-label="Dashboard rooms">
          <a id="portal-dash-overview" href="#portal-dash-overview" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Overview
          </a>
          <a id="portal-dash-journey" href="#portal-dash-journey" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Journey
          </a>
          <a id="portal-dash-activity" href="#portal-dash-activity" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Activity
          </a>
          <a id="portal-dash-modules" href="#portal-dash-modules" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Modules
          </a>
          <a id="portal-dash-workflow" href="#portal-dash-workflow" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Workflow
          </a>
        </nav>
        <FinelyNoticedStrip
          surface="light"
          items={buildPortalNoticedItems({
            reportsCount: 0,
            lettersCount: 0,
            openCasesCount: 0,
            evidenceCount: 0,
          })}
        />
        <FinelyNowDoThisStrip surface="light" />
        <a href="/enlightenment-session" className="inline-flex text-sm font-extrabold">
          Book a strategy call
        </a>
        <PartnerDashboardProductSurface embedded dataMode="real" />
      </ProductPageLayout>
    </div>
  );
}
