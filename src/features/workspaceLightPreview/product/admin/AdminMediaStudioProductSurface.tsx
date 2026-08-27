import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContentStudioDepartmentPage } from '../../../studioCommandOs/ContentStudioDepartmentPage';
import { listContentStudioAssets, listContentStudioJobs } from '../../../studioCommandOs/contentStudioRepo';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

export default function AdminMediaStudioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [searchParams, setSearchParams] = useSearchParams();
  const studioView = searchParams.get('view') === 'advanced' ? 'advanced' : 'home';

  const jobs = useMemo(() => listContentStudioJobs(), []);
  const assets = useMemo(() => listContentStudioAssets(), []);
  const reviewCount = jobs.filter((j) => j.status === 'needs_review').length;
  const readyCount = assets.filter((a) => a.status === 'approved' || a.status === 'published').length;

  const openWizard = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    next.delete('room');
    next.set('wizard', 'open');
    setSearchParams(next, { replace: true });
  };

  const openProductionFloor = () => {
    const next = new URLSearchParams(searchParams);
    next.set('view', 'advanced');
    if (!next.get('room')) next.set('room', 'intake');
    next.delete('wizard');
    setSearchParams(next, { replace: true });
  };

  const isContentStudio = pageId === 'content-studio';
  const title = isContentStudio ? 'Content studio' : 'Media studio';
  const description = isContentStudio
    ? 'Write scripts, design assets, and publish partner education content.'
    : 'Produce videos, voice, and creative assets for partner campaigns.';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title={title}
      description={description}
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label={studioView === 'advanced' ? 'Open wizard' : 'Start video wizard'}
          onClick={openWizard}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={openProductionFloor}>
          Production floor
        </button>
      }
      metrics={[
        { label: 'Production jobs', value: String(jobs.length), hint: 'Tracked requests with audit trail', accent: 'sky' },
        { label: 'Assets', value: String(assets.length), hint: 'Videos, guides, audio, and covers', accent: 'emerald' },
        { label: 'Review queue', value: String(reviewCount), hint: 'Awaiting brand and compliance sign-off', accent: 'rose' },
        { label: 'Ready to reuse', value: String(readyCount), hint: 'Approved or published for site surfaces', accent: 'violet' },
      ]}
      metricTitle="Studio coverage"
      metricDescription="Plan a clip in the compose canvas or open the production floor for full workrooms."
    >
      <span hidden data-surface-kind="real" data-surface-key={`admin:${pageId}`} />
      <ContentStudioDepartmentPage composeLayout />
      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
