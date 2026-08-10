import { getMarketingFindReadiness } from '../marketingDesk/marketingDeskHunt';
import { isSerperSearchMarkedOk } from './growthFindTest';
import { countGrowthMlLabels } from './growthMlLabels';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { GrowthAgentDef } from './growthAgentRegistry';

export type GrowthMaturityReport = {
  percent: number;
  label: string;
  items: Array<{ id: string; label: string; done: boolean }>;
};

const HANNAH_LINK_COPIED_KEY = 'finely.growth.hannah.copied_lane.v1';

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
  const items = [
    { id: 'desk', label: 'Marketing Desk turned on', done: isFeatureEnabled('marketingDesk') },
    { id: 'leadIntel', label: 'Find engine turned on', done: Boolean(readiness.steps.find((s) => s.id === 'leadIntel')?.done) },
    { id: 'supabase', label: 'Supabase connected', done: isSupabaseConfigured },
    { id: 'serper', label: 'Search tested successfully', done: isSerperSearchMarkedOk() },
    { id: 'labels', label: 'Learning labels (5+)', done: ml.total >= 5 },
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

export function getAgentMaturity(agent: GrowthAgentDef): GrowthMaturityReport {
  if (agent.id === 'lead-discovery') return getCalebMaturity();
  if (agent.wave === 0) return getCalebMaturity();
  if (agent.wave === 1 && agent.id === 'capture-links') {
    return getHannahMaturity();
  }
  return {
    percent: agent.wave > 2 ? 15 : 35,
    label: agent.wave > 2 ? 'Coming soon' : 'Wave 1 — opening tools',
    items: [{ id: 'shell', label: 'Agent profile live', done: true }],
  };
}
