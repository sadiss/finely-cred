import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Mail, PlayCircle, Users } from 'lucide-react';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import {
  buildGrowthResultsSnapshot,
  captureGrowthBaselineIfEmpty,
  compareToBaseline,
} from './growthResultsMetrics';
import { GrowthDailyPlaybook } from './GrowthDailyPlaybook';
import { GrowthFailurePlaybooks } from './GrowthFailurePlaybooks';
import { GrowthAgentInfraStrip } from './GrowthAgentInfraStrip';
import { GrowthAgentBreadcrumb } from './GrowthAgentWorkspaceShell';
import { countGrowthMlLabels } from './growthMlLabels';

export function GrowthResultsScoreboard() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    captureGrowthBaselineIfEmpty();
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const mlLabels = useMemo(() => {
    void tick;
    return countGrowthMlLabels();
  }, [tick]);

  const snap = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const delta = useMemo(() => {
    void tick;
    return compareToBaseline();
  }, [tick]);

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <GrowthAgentBreadcrumb section="Results" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Results</div>
          <h2 className={`${FINELY_OS_ENTITY_TITLE} text-white`}>What happened this week</h2>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Booked calls and signups — not vanity counts.</p>
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/growth-agents/lead-discovery')}>
          Caleb · Find new people
        </button>
      </div>

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>What to do today</div>
        <p className="mt-1 text-sm font-medium text-white">{snap.todaySentence}</p>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Focus: {snap.weekFocusLabel}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <FinelyOsOverviewStatTile icon={Users} label="Booked calls (7d)" value={String(snap.booked7d)} accent="emerald" iconAccent="emerald" />
        <FinelyOsOverviewStatTile icon={BarChart3} label="Guide signups (7d)" value={String(snap.signups7d)} accent="sky" iconAccent="sky" />
        <FinelyOsOverviewStatTile icon={PlayCircle} label="Video signups (7d)" value={String(snap.videoSignups7d)} accent="fuchsia" iconAccent="fuchsia" />
        <FinelyOsOverviewStatTile icon={Users} label="People saved (7d)" value={String(snap.foundSaved7d)} accent="amber" iconAccent="amber" />
        <FinelyOsOverviewStatTile icon={Mail} label="Replies (7d)" value={String(snap.replies7d)} accent="rose" iconAccent="rose" />
        <FinelyOsOverviewStatTile icon={BarChart3} label="Needs review" value={String(snap.needsReview)} accent="violet" iconAccent="violet" />
      </div>

      {mlLabels.total > 0 ? (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Learning system: {mlLabels.total} fit labels ({mlLabels.approve} good · {mlLabels.reject} wrong) — helps rank Today&apos;s 10.
        </p>
      ) : (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Learning system: mark Good fit / Wrong fit on Review people to improve ranking.
        </p>
      )}

      {delta ? (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Since baseline: booked {delta.bookedDelta >= 0 ? '+' : ''}
          {delta.bookedDelta}, signups {delta.signupsDelta >= 0 ? '+' : ''}
          {delta.signupsDelta}, saved {delta.foundDelta >= 0 ? '+' : ''}
          {delta.foundDelta}
        </p>
      ) : null}

      {snap.lastFindSummary ? (
        <div className={finelyOsCatalogCardCompact('sky')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Last find run</div>
          <p className="mt-1 text-sm text-white/90">{snap.lastFindSummary}</p>
        </div>
      ) : null}

      {snap.topLaneLabel ? (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Top lane pace (30d): {snap.topLaneLabel} — {snap.topLaneRatePct}% found → booked
        </p>
      ) : null}

      <GrowthAgentInfraStrip />

      <GrowthFailurePlaybooks replies7d={snap.replies7d} />

      <GrowthDailyPlaybook />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents')}>
          All specialists
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing?tab=desk')}>
          Marketing Desk
        </button>
      </div>

      <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </div>
  );
}
