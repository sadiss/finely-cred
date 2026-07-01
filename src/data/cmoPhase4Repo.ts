import { loadJson, saveJson } from './localJsonStore';
import {
  CmoAccountHealthReport,
  CmoManagedAccount,
  CmoPhase4Settings,
  CmoPhase4State,
  CmoProviderCapability,
  CmoPublishAsset,
  CmoPublishJob,
  CmoWebhookEvent,
  DEFAULT_CMO_PHASE4_SETTINGS,
} from '../domain/cmoPhase4';

const KEY = 'fc.cmo.phase4.account.ops.v1';
const VERSION = 1;

export const defaultCmoProviderCapabilities: CmoProviderCapability[] = [
  {
    platform: 'manual',
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    supportsShorts: true,
    supportsComments: false,
    supportsDm: false,
    supportsScheduling: true,
    supportsAnalyticsImport: false,
    requiresHumanApproval: true,
    credentialKeyNames: [],
    safetyNotes: ['Manual mode is safest: CMO prepares the post, admin publishes it.'],
  },
  {
    platform: 'linkedin',
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    supportsShorts: false,
    supportsComments: true,
    supportsDm: false,
    supportsScheduling: false,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    safetyNotes: ['Use only official API permissions and approved account scopes.'],
  },
  {
    platform: 'youtube',
    supportsText: true,
    supportsImage: false,
    supportsVideo: true,
    supportsShorts: true,
    supportsComments: true,
    supportsDm: false,
    supportsScheduling: false,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    safetyNotes: ['Use official upload/comment APIs only; no scraping or engagement automation.'],
  },
  {
    platform: 'instagram',
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    supportsShorts: true,
    supportsComments: true,
    supportsDm: true,
    supportsScheduling: false,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['META_APP_ID', 'META_APP_SECRET'],
    safetyNotes: ['Use approved business account APIs and respect platform review requirements.'],
  },
  {
    platform: 'tiktok',
    supportsText: true,
    supportsImage: false,
    supportsVideo: true,
    supportsShorts: true,
    supportsComments: false,
    supportsDm: false,
    supportsScheduling: false,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    safetyNotes: ['Official posting only after app approval and required user/account authorization.'],
  },
  {
    platform: 'facebook',
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    supportsShorts: true,
    supportsComments: true,
    supportsDm: true,
    supportsScheduling: false,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['META_APP_ID', 'META_APP_SECRET'],
    safetyNotes: ['Business integrations require approved permissions and connected pages.'],
  },
  {
    platform: 'email',
    supportsText: true,
    supportsImage: true,
    supportsVideo: false,
    supportsShorts: false,
    supportsComments: false,
    supportsDm: false,
    supportsScheduling: true,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['EMAIL_PROVIDER_API_KEY'],
    safetyNotes: ['Respect consent, unsubscribe rules, suppression lists, and throttling.'],
  },
  {
    platform: 'sms',
    supportsText: true,
    supportsImage: false,
    supportsVideo: false,
    supportsShorts: false,
    supportsComments: false,
    supportsDm: false,
    supportsScheduling: true,
    supportsAnalyticsImport: true,
    requiresHumanApproval: true,
    credentialKeyNames: ['SMS_PROVIDER_API_KEY'],
    safetyNotes: ['Respect TCPA-style consent, opt-out language, and suppression lists.'],
  },
];

const fallback: CmoPhase4State = {
  accounts: [],
  capabilities: defaultCmoProviderCapabilities,
  assets: [],
  queue: [],
  healthReports: [],
  webhookEvents: [],
  settings: DEFAULT_CMO_PHASE4_SETTINGS,
};

export function loadCmoPhase4State(): CmoPhase4State {
  return loadJson<CmoPhase4State>(KEY, fallback, VERSION);
}

export function saveCmoPhase4State(state: CmoPhase4State): void {
  saveJson(KEY, state, VERSION);
}

export function updateCmoPhase4Settings(settings: Partial<CmoPhase4Settings>): CmoPhase4State {
  const state = loadCmoPhase4State();
  const next = { ...state, settings: { ...state.settings, ...settings } };
  saveCmoPhase4State(next);
  return next;
}

export function upsertCmoManagedAccount(account: CmoManagedAccount): CmoPhase4State {
  const state = loadCmoPhase4State();
  const accounts = [...state.accounts.filter((item) => item.id !== account.id), account];
  const next = { ...state, accounts };
  saveCmoPhase4State(next);
  return next;
}

export function removeCmoManagedAccount(accountId: string): CmoPhase4State {
  const state = loadCmoPhase4State();
  const next = {
    ...state,
    accounts: state.accounts.filter((item) => item.id !== accountId),
    queue: state.queue.filter((item) => item.accountId !== accountId),
  };
  saveCmoPhase4State(next);
  return next;
}

export function upsertCmoPublishAsset(asset: CmoPublishAsset): CmoPhase4State {
  const state = loadCmoPhase4State();
  const assets = [...state.assets.filter((item) => item.id !== asset.id), asset];
  const next = { ...state, assets };
  saveCmoPhase4State(next);
  return next;
}

export function upsertCmoPublishJob(job: CmoPublishJob): CmoPhase4State {
  const state = loadCmoPhase4State();
  const queue = [...state.queue.filter((item) => item.id !== job.id), job];
  const next = { ...state, queue };
  saveCmoPhase4State(next);
  return next;
}

export function addCmoAccountHealthReport(report: CmoAccountHealthReport): CmoPhase4State {
  const state = loadCmoPhase4State();
  const healthReports = [report, ...state.healthReports].slice(0, 250);
  const next = { ...state, healthReports };
  saveCmoPhase4State(next);
  return next;
}

export function addCmoWebhookEvent(event: CmoWebhookEvent): CmoPhase4State {
  const state = loadCmoPhase4State();
  const webhookEvents = [event, ...state.webhookEvents].slice(0, 500);
  const next = { ...state, webhookEvents };
  saveCmoPhase4State(next);
  return next;
}
