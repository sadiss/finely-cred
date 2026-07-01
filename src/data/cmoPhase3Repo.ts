import type {
  CmoAutonomousRun,
  CmoAutopilotSettings,
  CmoBrief,
  CmoCampaignPlaybook,
  CmoChannelModelState,
  CmoExperiment,
  CmoIntegrationHealth,
  CmoLeadQuota,
} from '../domain/cmoPhase3';
import { DEFAULT_CMO_BLOCKED_BEHAVIORS } from '../domain/cmoPhase3';

const STORAGE_KEY = 'finelycred.cmo.phase3.autopilot.v1';

type CmoPhase3Store = {
  settings: CmoAutopilotSettings;
  playbooks: CmoCampaignPlaybook[];
  runs: CmoAutonomousRun[];
  briefs: CmoBrief[];
  experiments: CmoExperiment[];
  channelModels: CmoChannelModelState[];
  integrationHealth: CmoIntegrationHealth[];
};

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function defaultSettings(): CmoAutopilotSettings {
  const stamp = now();
  return {
    id: 'cmo_autopilot_settings',
    autonomyLevel: 'draft_only',
    dailyLeadTarget: 200,
    dailyQualifiedLeadTarget: 60,
    dailyBookedCallTarget: 20,
    requireHumanApprovalForExternalPublish: true,
    requireHumanApprovalForOutboundSend: true,
    requireHumanApprovalForComplianceRisk: 'medium',
    maxDailyOutboundEmails: 250,
    maxDailyOutboundSms: 100,
    maxDailySocialPostsPerChannel: 5,
    brandVoice: 'serious_funny',
    humorLevel: 3,
    allowedChannels: [
      'lead_intel',
      'crm_reactivation',
      'email',
      'sms',
      'affiliate',
      'partner_outreach',
      'youtube_shorts',
      'instagram_reels',
      'linkedin',
      'press_pr',
      'interviews_podcasts',
      'webinar',
      'seo_content',
      'referral',
    ],
    blockedBehaviors: DEFAULT_CMO_BLOCKED_BEHAVIORS,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function defaultChannelModels(): CmoChannelModelState[] {
  const stamp = now();
  return [
    'lead_intel',
    'crm_reactivation',
    'email',
    'sms',
    'affiliate',
    'partner_outreach',
    'youtube_shorts',
    'instagram_reels',
    'tiktok',
    'linkedin',
    'press_pr',
    'interviews_podcasts',
    'webinar',
    'seo_content',
    'referral',
  ].map((channel) => ({
    channel: channel as CmoChannelModelState['channel'],
    alpha: 2,
    beta: 8,
    confidence: 0.2,
    averageLeadValue: 250,
    lastUpdatedAt: stamp,
  }));
}

function defaultStore(): CmoPhase3Store {
  return {
    settings: defaultSettings(),
    playbooks: [],
    runs: [],
    briefs: [],
    experiments: [],
    channelModels: defaultChannelModels(),
    integrationHealth: [],
  };
}

function readStore(): CmoPhase3Store {
  if (typeof window === 'undefined') return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return { ...defaultStore(), ...JSON.parse(raw) };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: CmoPhase3Store): CmoPhase3Store {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
  return store;
}

export function getCmoPhase3Store(): CmoPhase3Store {
  return readStore();
}

export function getCmoAutopilotSettings(): CmoAutopilotSettings {
  return readStore().settings;
}

export function updateCmoAutopilotSettings(patch: Partial<CmoAutopilotSettings>): CmoAutopilotSettings {
  const store = readStore();
  const settings = { ...store.settings, ...patch, updatedAt: now() };
  writeStore({ ...store, settings });
  return settings;
}

export function listCmoPlaybooks(): CmoCampaignPlaybook[] {
  return readStore().playbooks;
}

export function saveCmoPlaybook(playbook: CmoCampaignPlaybook): CmoCampaignPlaybook {
  const store = readStore();
  const existing = store.playbooks.filter((item) => item.id !== playbook.id);
  const saved = { ...playbook, updatedAt: now() };
  writeStore({ ...store, playbooks: [saved, ...existing].slice(0, 100) });
  return saved;
}

export function saveManyCmoPlaybooks(playbooks: CmoCampaignPlaybook[]): CmoCampaignPlaybook[] {
  const store = readStore();
  const map = new Map(store.playbooks.map((item) => [item.id, item]));
  playbooks.forEach((item) => map.set(item.id, { ...item, updatedAt: now() }));
  writeStore({ ...store, playbooks: Array.from(map.values()).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 150) });
  return readStore().playbooks;
}

export function createCmoRun(run: Omit<CmoAutonomousRun, 'id' | 'createdAt' | 'updatedAt'>): CmoAutonomousRun {
  const store = readStore();
  const stamp = now();
  const saved: CmoAutonomousRun = { ...run, id: id('run'), createdAt: stamp, updatedAt: stamp };
  writeStore({ ...store, runs: [saved, ...store.runs].slice(0, 100) });
  return saved;
}

export function listCmoRuns(): CmoAutonomousRun[] {
  return readStore().runs;
}

export function saveCmoBrief(brief: Omit<CmoBrief, 'id' | 'createdAt'>): CmoBrief {
  const store = readStore();
  const saved: CmoBrief = { ...brief, id: id('brief'), createdAt: now() };
  writeStore({ ...store, briefs: [saved, ...store.briefs].slice(0, 90) });
  return saved;
}

export function listCmoBriefs(): CmoBrief[] {
  return readStore().briefs;
}

export function saveCmoExperiment(experiment: CmoExperiment): CmoExperiment {
  const store = readStore();
  const existing = store.experiments.filter((item) => item.id !== experiment.id);
  const saved = { ...experiment, updatedAt: now() };
  writeStore({ ...store, experiments: [saved, ...existing].slice(0, 100) });
  return saved;
}

export function listCmoExperiments(): CmoExperiment[] {
  return readStore().experiments;
}

export function updateCmoChannelModel(channel: CmoChannelModelState['channel'], leads: number, nonLeads: number, averageLeadValue?: number): CmoChannelModelState {
  const store = readStore();
  const models = store.channelModels.length ? store.channelModels : defaultChannelModels();
  const next = models.map((model) => {
    if (model.channel !== channel) return model;
    const alpha = Math.max(1, model.alpha + Math.max(0, leads));
    const beta = Math.max(1, model.beta + Math.max(0, nonLeads));
    return {
      ...model,
      alpha,
      beta,
      confidence: Number((alpha / (alpha + beta)).toFixed(4)),
      averageLeadValue: averageLeadValue ?? model.averageLeadValue,
      lastUpdatedAt: now(),
    };
  });
  writeStore({ ...store, channelModels: next });
  return next.find((model) => model.channel === channel)!;
}

export function listCmoChannelModels(): CmoChannelModelState[] {
  return readStore().channelModels.length ? readStore().channelModels : defaultChannelModels();
}

export function saveCmoIntegrationHealth(items: CmoIntegrationHealth[]): CmoIntegrationHealth[] {
  const store = readStore();
  writeStore({ ...store, integrationHealth: items });
  return items;
}

export function listCmoIntegrationHealth(): CmoIntegrationHealth[] {
  return readStore().integrationHealth;
}

export function resetCmoPhase3DemoState(): CmoPhase3Store {
  return writeStore(defaultStore());
}

export function makeCmoId(prefix: string): string {
  return id(prefix);
}
