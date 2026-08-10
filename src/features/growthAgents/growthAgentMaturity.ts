import { getMarketingFindReadiness, getMarketingFindGeo } from '../marketingDesk/marketingDeskHunt';
import { isSerperSearchMarkedOk } from './growthFindTest';
import { countGrowthMlLabels } from './growthMlLabels';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { loadJson } from '../../data/localJsonStore';
import { buildHuntQueries } from '../leadIntel/leadEngineAutonomy';
import { listPublicResourceVideos } from '../../data/resourceVideosRepo';
import { auditPublicSeoCatalog } from './growthSeoAuditor';
import {
  buildGrowthPillarScript,
  buildGrowthShortsPack,
  resolveGrowthPillarVideoRecord,
} from './growthPillarVideoPack';
import { getGrowthWeekFocus } from './growthWeekFocus';
import { getLastGrowthWorkerProbe } from './growthWorkerTick';
import type { GrowthAgentDef } from './growthAgentRegistry';

export type GrowthMaturityReport = {
  percent: number;
  label: string;
  items: Array<{ id: string; label: string; done: boolean }>;
};

const HANNAH_LINK_COPIED_KEY = 'finely.growth.hannah.copied_lane.v1';
const WEEK_FOCUS_KEY = 'finely.growth_week_focus.v1';

export function isHannahCampaignLinkCopied(): boolean {
  try {
    return localStorage.getItem(HANNAH_LINK_COPIED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHannahCampaignLinkCopied(): void {
  try {
    localStorage.setItem(HANNAH_LINK_COPIED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function getHannahMaturity(): GrowthMaturityReport {
  const copied = isHannahCampaignLinkCopied();
  const items = [
    { id: 'page', label: 'Lead acquisition page available', done: true },
    { id: 'campaign', label: 'Campaign link copied once', done: copied },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label: copied ? 'Wave 1 — syndicate your link' : 'Wave 1 — use Copy link',
    items,
  };
}

export function getCalebMaturity(): GrowthMaturityReport {
  const readiness = getMarketingFindReadiness();
  const ml = countGrowthMlLabels();
  const workerProbed = Boolean(getLastGrowthWorkerProbe());
  const items = [
    { id: 'desk', label: 'Marketing Desk turned on', done: isFeatureEnabled('marketingDesk') },
    { id: 'leadIntel', label: 'Find engine turned on', done: Boolean(readiness.steps.find((s) => s.id === 'leadIntel')?.done) },
    { id: 'supabase', label: 'Supabase connected', done: isSupabaseConfigured },
    { id: 'serper', label: 'Search tested successfully', done: isSerperSearchMarkedOk() },
    { id: 'labels', label: 'Learning labels (5+)', done: ml.total >= 5 },
    { id: 'worker', label: 'Nightly worker probed once', done: workerProbed },
    { id: 'agents', label: 'Growth Agents home live', done: true },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label: percent >= 80 ? 'Ready to hunt daily' : percent >= 40 ? 'Finish setup, then hunt' : 'Needs setup',
    items,
  };
}

function weekFocusRaw(): { city?: string; lane?: string; pillarVideoId?: string; updatedAt?: string } {
  return loadJson(WEEK_FOCUS_KEY, {}, 1);
}

export function getEstherMaturity(): GrowthMaturityReport {
  const focus = getGrowthWeekFocus();
  const raw = weekFocusRaw();
  const city = focus.city.trim();
  const cityConfigured = city.length > 0 && city.toLowerCase() !== 'united states';
  const calebGeoSync =
    getMarketingFindGeo().trim().toLowerCase() === city.toLowerCase() && city.length > 0;
  const queries = buildHuntQueries({ lane: focus.lane, location: city || 'United States' });
  const queryPackReady = queries.length > 0 && queries[0]!.trim().length > 3;
  const laneSaved = Boolean(raw.lane || raw.updatedAt);
  const pillarSet = Boolean(focus.pillarVideoId?.trim());

  const items = [
    { id: 'lane', label: 'Week lane saved', done: laneSaved },
    { id: 'city', label: 'Target city set (not US default)', done: cityConfigured },
    { id: 'sync', label: 'Caleb Find city matches focus', done: calebGeoSync },
    { id: 'queries', label: 'Hunt query pack for lane', done: queryPackReady },
    { id: 'pillar', label: 'Pillar video linked (optional)', done: pillarSet },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label:
      percent >= 80
        ? 'Week focus drives Caleb + video'
        : percent >= 40
          ? 'Set city + sync Caleb'
          : 'Open This week’s focus',
    items,
  };
}

function videoCatalogSeoIssueCount(): number {
  const rows = auditPublicSeoCatalog().filter((r) => r.path.includes('/resources/videos'));
  if (!rows.length) return 99;
  return Math.min(...rows.map((r) => r.issues.length));
}

export function getLydiaMaturity(): GrowthMaturityReport {
  const publicVideos = listPublicResourceVideos().length;
  const videoSeoIssues = videoCatalogSeoIssueCount();
  const audit = auditPublicSeoCatalog();
  const routesClean = audit.filter((r) => r.issues.length === 0).length;
  const catalogScanned = audit.length > 0;

  const items = [
    { id: 'catalog', label: 'Public SEO catalog scanned', done: catalogScanned },
    { id: 'publicVideo', label: 'One public resource video', done: publicVideos >= 1 },
    { id: 'videoSeo', label: 'Video route ≤2 SEO warnings', done: videoSeoIssues <= 2 },
    { id: 'cleanRoutes', label: 'Majority of routes clean', done: routesClean >= Math.ceil(audit.length * 0.6) },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label:
      percent >= 75
        ? 'SEO ready for video + funnels'
        : percent >= 50
          ? 'Publish video · fix warnings'
          : 'Wave 2 — audit public pages',
    items,
  };
}

function pillarMaturityBase() {
  const record = resolveGrowthPillarVideoRecord();
  const focus = getGrowthWeekFocus();
  const pillarLinked = Boolean(record);
  const focusMatches =
    !focus.pillarVideoId?.trim() ||
    !record ||
    record.id === focus.pillarVideoId ||
    record.resourceVideoId === focus.pillarVideoId;
  const hasIntel = Boolean(record?.uploadAnalysisId || record?.contentStudioAssetId || record?.resourceVideoId);
  return { record, pillarLinked, focusMatches, hasIntel };
}

export function getMiriamMaturity(): GrowthMaturityReport {
  const { record, pillarLinked, focusMatches, hasIntel } = pillarMaturityBase();
  const shortsReady = record
    ? buildGrowthShortsPack({ record }).includes('SHORTS PACK')
    : false;
  const promoteReady = Boolean(record && (record.lifecycle === 'promote' || record.lifecycle === 'publish'));

  const items = [
    { id: 'pillar', label: 'Pillar video on file', done: pillarLinked },
    { id: 'intel', label: 'Upload intel or studio asset', done: hasIntel },
    { id: 'shorts', label: 'Shorts pack generated', done: shortsReady },
    { id: 'focus', label: 'Matches Esther pillar id', done: focusMatches },
    { id: 'promote', label: 'Promote / publish step reached', done: promoteReady },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label:
      percent >= 80
        ? 'Copy shorts + Hannah link'
        : percent >= 40
          ? 'Finish pillar in Content Studio'
          : 'Wave 3 — link a pillar video',
    items,
  };
}

export function getJordanMaturity(): GrowthMaturityReport {
  const { record, pillarLinked, focusMatches, hasIntel } = pillarMaturityBase();
  const script = record ? buildGrowthPillarScript({ record }).trim() : '';
  const scriptReady = script.length > 40;

  const items = [
    { id: 'pillar', label: 'Pillar video on file', done: pillarLinked },
    { id: 'intel', label: 'Upload intel or studio asset', done: hasIntel },
    { id: 'script', label: 'Pillar script outline ready', done: scriptReady },
    { id: 'focus', label: 'Matches Esther pillar id', done: focusMatches },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return {
    percent,
    label:
      percent >= 75
        ? 'Produce cuts from pillar'
        : percent >= 50
          ? 'Add script beats'
          : 'Wave 3 — import pillar upload',
    items,
  };
}

export function getAgentMaturity(agent: GrowthAgentDef): GrowthMaturityReport {
  if (agent.id === 'lead-discovery') return getCalebMaturity();
  if (agent.wave === 0) return getCalebMaturity();
  if (agent.wave === 1 && agent.id === 'capture-links') {
    return getHannahMaturity();
  }
  if (agent.id === 'marketing-director') return getEstherMaturity();
  if (agent.id === 'seo-local') return getLydiaMaturity();
  if (agent.id === 'social') return getMiriamMaturity();
  if (agent.id === 'media') return getJordanMaturity();
  return {
    percent: agent.wave > 2 ? 15 : 35,
    label: agent.wave > 2 ? 'Coming soon' : 'Wave 1 — opening tools',
    items: [{ id: 'shell', label: 'Agent profile live', done: true }],
  };
}
