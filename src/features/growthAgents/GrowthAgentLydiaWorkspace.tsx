import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent } from './growthAgentRegistry';
import { getLydiaMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { getGrowthWeekFocus } from './growthWeekFocus';
import { buildLocalSeoChecklist } from './growthLocalSeoChecklist';
import { GrowthAgentLydiaCommandGuide } from './GrowthAgentLydiaCommandGuide';
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
  finelyOsMicroStat,
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

  const focus = useMemo(() => {
    void tick;
    return getGrowthWeekFocus();
  }, [tick]);

  const localChecklist = useMemo(
    () => buildLocalSeoChecklist(focus.city, focus.laneLabel),
    [focus.city, focus.laneLabel, focus.pillarVideoId, focus.ctaPath],
  );

  const publicVideoCount = useMemo(() => {
    void tick;
    return listPublicResourceVideos().length;
  }, [tick]);

  const auditResults = useMemo(() => sortAuditForPublicVideos(auditPublicSeoCatalog(), publicVideoCount > 0), [publicVideoCount]);
  const summary = useMemo(() => summarizeSeoAudit(auditResults), [auditResults]);
  const topIssues = useMemo(() => getTopSeoIssues(auditResults, 5), [auditResults]);
  const maturity = useMemo(() => {
    void tick;
    return getLydiaMaturity();
  }, [tick]);
  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cityConfigured = focus.city.trim().length > 0 && focus.city.toLowerCase() !== 'united states';

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentLydiaCommandGuide tick={tick} />}
      alertMessage={
        cityConfigured
          ? `Local checklist for ${focus.city} · lane ${focus.laneLabel}. Fix catalog issues before geo syndication.`
          : 'Set city in Esther — local checklist uses United States default until then.'
      }
      alertTone={summary.issueCount > 0 ? 'warning' : 'info'}
      primaryAction={{
        label: 'Marketing Desk · Board',
        onClick: () => navigate('/admin/marketing?tab=desk&helper=board'),
      }}
      secondaryAction={{
        label: 'Content Studio',
        onClick: () => navigate('/admin/marketing?tab=content?room=video'),
      }}
      nextStep={results.todaySentence}
      setupBlock={
        <ul className="space-y-1 text-sm">
          {maturity.items.map((i) => (
            <li key={i.id} className={i.done ? 'text-emerald-300/90' : 'text-amber-200/90'}>
              {i.done ? '✓' : '○'} {i.label}
            </li>
          ))}
        </ul>
      }
      lastRunBlock={
        <p className={FINELY_OS_ENTITY_BODY}>
          Scanned {summary.routeCount} routes · {summary.issueCount} flags · focus city {focus.city}
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Week lane: {focus.laneLabel}</li>
          <li>Local items: {localChecklist.length}</li>
          <li>Public videos: {publicVideoCount}</li>
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Local SEO checklist · {focus.city}</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Pulled from Esther week focus — complete before directory posts with Hannah links.
        </p>
        <ul className="mt-3 space-y-2">
          {localChecklist.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">{item.label}</span>
                {finelyOsStatusChip('warn')}
              </div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</p>
              {item.href ? (
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} mt-2`}
                  onClick={() => {
                    if (item.href!.startsWith('http') || item.href!.startsWith('/admin')) navigate(item.href!);
                    else window.open(`${origin}${item.href}`, '_blank', 'noreferrer');
                  }}
                >
                  Open
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={finelyOsMicroStat('sky')}>Lane: {focus.laneLabel}</span>
          <span className={finelyOsMicroStat('violet')}>CTA: {focus.ctaPath}</span>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Top 5 catalog issues</div>
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
          pageSize={6}
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
                <p className="mt-2 text-xs text-emerald-200/90">Within range · schema marked</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing?tab=desk&helper=board')}>
          Desk · Board
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing?tab=content?room=video')}>
          Content Studio
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/marketing-director')}>
          Esther · week focus
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/monitoring')}>
          SEO monitoring
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
