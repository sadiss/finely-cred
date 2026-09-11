import React from 'react';
import { ProductPageLayout } from '../../features/workspaceLightPreview/product/components/ProductPageLayout';
import AdminDashboardProductAdapter from '../../features/workspaceLightPreview/product/admin/AdminDashboardProductAdapter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildAdminNoticedItems } from '../../lib/finelyProactiveSignals';

/**
 * Canonical admin home. The leftover KPI-catalog dashboard is retired.
 * ProductRoutedPage already owns `/admin`; this file stays as a safe fallback.
 */
export default function AdminDashboardPage() {
  const goLiveBlocked = 0;

  return (
    <div className="fc-senior-simple">
      <ProductPageLayout role="admin" pageId="dashboard">
        <nav className="fc-launch-lane-header mb-4 flex flex-wrap items-center gap-2" aria-label="Admin rooms">
          <a id="admin-overview" href="#admin-overview" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Overview
          </a>
          <a id="admin-ops" href="#admin-ops" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Operations
          </a>
          <a id="admin-modules" href="#admin-modules" className="fc-scroll-section rounded-xl px-3 py-2 text-sm font-extrabold">
            Modules
          </a>
          <a href="/admin/launch-os#go-live" className="rounded-xl px-3 py-2 text-sm font-extrabold">
            Go-live center{goLiveBlocked ? ` · ${goLiveBlocked} blocked` : ''}
          </a>
        </nav>
        <FinelyNoticedStrip
          surface="light"
          items={buildAdminNoticedItems({
            slaBreaches: 0,
            partnersWithoutReports: 0,
            openCases: 0,
            goLiveBlocked,
          })}
        />
        <FinelyNowDoThisStrip surface="light" />
        <AdminDashboardProductAdapter role="admin" pageId="dashboard" dataMode="real" />
      </ProductPageLayout>
    </div>
  );
}
