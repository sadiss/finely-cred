import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent } from './growthAgentRegistry';
import { getAgentMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import {
  auditPublicSeoCatalog,
  getTopSeoIssues,
  summarizeSeoAudit,
} from './growthSeoAuditor';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { listPublicResourceVideos } from '../../data/resourceVideosRepo';
import type { SeoAuditRouteResult } from './growthSeoAuditor';

function sortAuditForPublicVideos(rows: SeoAuditRouteResult[], publicVideosLive: boolean): SeoAuditRouteResult[] {
  if (!publicVideosLive) return rows;
  const videoRoutes = rows.filter((r) => r.path.includes('/resources/videos'));
  const rest = rows.filter((r) => !r.path.includes('/resources/videos'));
  return [...videoRoutes, ...rest];
}

export function GrowthAgentLydiaWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('seo-local')!;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const publicVideoCount = useMemo(() => {
    void tick;
    return listPublicResourceVideos().length;
  }, [tick]);

  const auditResults = useMemo(() => sortAuditForPublicVideos(auditPublicSeoCatalog(), publicVideoCount > 0), [publicVideoCount]);
  const summary = useMemo(() => summarizeSeoAudit(auditResults), [auditResults]);
  const topIssues = useMemo(() => getTopSeoIssues(auditResults, 5), [auditResults]);
  const maturity = useMemo(() => getAgentMaturity(agent), [agent]);
  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      alertMessage={
        publicVideoCount > 0
          ? `${publicVideoCount} public resource video(s) — video library routes pinned to top of audit.`
          : summary.issueCount > 0
            ? `${summary.issueCount} SEO checks to review across ${summary.routesWithIssues} routes.`
            : 'Catalog looks healthy — keep titles and descriptions within range.'
      }
      alertTone={summary.issueCount > 0 ? 'warning' : 'success'}
      primaryAction={{
        label: 'Open monitoring',
        onClick: () => navigate('/admin/monitoring'),
      }}
      secondaryAction={{
        label: 'Public resources',
        onClick: () => navigate('/resources'),
      }}
      nextStep={results.todaySentence}
      setupBlock={<p className={FINELY_OS_ENTITY_BODY}>Wave 2 preview — catalog audit runs from publicSeoCatalog.</p>}
      lastRunBlock={
        <p className={FINELY_OS_ENTITY_BODY}>
          Scanned {summary.routeCount} public routes · {summary.issueCount} issue flags · schema on{' '}
          {auditResults.filter((r) => r.hasSchema).length} routes.
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Routes with issues: {summary.routesWithIssues}</li>
          <li>Clean routes: {summary.routeCount - summary.routesWithIssues}</li>
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Top 5 issues</div>
        {topIssues.length === 0 ? (
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>No issues flagged — titles, descriptions, and schema look within range.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {topIssues.map((row, i) => (
              <li key={`${row.path}-${row.issue.code}-${i}`} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                <div className="font-mono text-xs text-sky-200/90">{row.path}</div>
                <div className="mt-1 text-white/90">{row.issue.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Full catalog audit</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Title 20–60 chars · description 50–160 chars · hasSchema flag.</p>
        <FinelyOsPaginatedStack
          items={auditResults}
          pageSize={8}
          renderItem={(row) => (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-white">{row.title}</div>
                {row.issues.length === 0 ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
              </div>
              <div className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{row.path}</div>
              {row.issues.length > 0 ? (
                <ul className={`mt-2 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {row.issues.map((issue) => (
                    <li key={issue.code}>{issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 text-xs text-emerald-200/90`}>Within range · schema marked</p>
              )}
              <a
                href={`${origin}${row.path}`}
                target="_blank"
                rel="noreferrer"
                className={`${FINELY_OS_SECONDARY_BTN} mt-3 inline-flex`}
              >
                Preview page
              </a>
            </div>
          )}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources')}>
          Partner resources hub
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/monitoring')}>
          SEO & monitoring
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/access')}>
          Access & launch checks
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
