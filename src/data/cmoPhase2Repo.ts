import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type {
  CmoAsset,
  CmoAudienceSnapshot,
  CmoCampaign,
  CmoCreativeMemory,
  CmoDirective,
  CmoEngagement,
  CmoEvent,
  CmoModelState,
  CmoScheduledPost,
  CmoSettings,
} from '../domain/cmoPhase2';
import { cmoNowIso } from '../domain/cmoPhase2';

const KEY = 'finely.cmo.phase2.v1';
const VERSION = 1;

type Store = {
  settings: CmoSettings;
  events: CmoEvent[];
  audiences: CmoAudienceSnapshot[];
  campaigns: CmoCampaign[];
  assets: CmoAsset[];
  scheduledPosts: CmoScheduledPost[];
  engagements: CmoEngagement[];
  directives: CmoDirective[];
  memories: CmoCreativeMemory[];
  model: CmoModelState;
};

function defaultSettings(): CmoSettings {
  return {
    id: 'default',
    updatedAt: cmoNowIso(),
    dailyLeadTarget: 200,
    qualifiedLeadTarget: 60,
    bookedCallTarget: 20,
    approvalMode: 'approve_then_execute',
    safeGrowthOnly: true,
    humorLevel: 7,
    creativityLevel: 9,
    technicalDepth: 8,
    conversionAggression: 8,
    blockedBehaviors: [
      'fake engagement',
      'spam outreach',
      'platform rule bypass',
      'captcha bypass',
      'rate-limit evasion',
      'guaranteed credit/funding claims',
      'scraping where prohibited',
    ],
    requiredReviewFor: ['post_published', 'outreach_sent', 'compliance_flagged', 'reply_received'],
    brandVoice: {
      defaultTone: 'serious_funny',
      tagline: 'Premium credit, funding, and business growth moves without the nonsense.',
      approvedPhrases: ['custom roadmap', 'funding readiness', 'credit strategy', 'results vary', 'book a consultation'],
      bannedPhrases: ['guaranteed approval', 'guaranteed deletion', 'wipe your credit clean', 'instant funding', '100% approval'],
    },
    linkRegistry: [
      { id: 'booking', label: 'Book Consultation', kind: 'booking', url: '/consultation', active: true },
      { id: 'pricing', label: 'Pricing', kind: 'pricing', url: '/pricing', active: true },
      { id: 'affiliate', label: 'Affiliate Program', kind: 'affiliate', url: '/affiliate', active: true },
      { id: 'agents', label: 'Credit Specialist / Agent Path', kind: 'careers', url: '/agents', active: true },
      { id: 'bookstore', label: 'Bookstore', kind: 'bookstore', url: '/bookstore', active: true },
      { id: 'shorts_placeholder', label: 'Shorts/Reels Channel', kind: 'shorts', url: 'https://replace-with-real-shorts-or-reels-url.example', active: false },
    ],
  };
}

function defaultModel(): CmoModelState {
  return { id: 'default', updatedAt: cmoNowIso(), channelStats: {}, hookWeights: {}, ctaWeights: {}, audienceWeights: {} };
}

function defaultStore(): Store {
  return {
    settings: defaultSettings(),
    events: [],
    audiences: [],
    campaigns: [],
    assets: [],
    scheduledPosts: [],
    engagements: [],
    directives: [],
    memories: [],
    model: defaultModel(),
  };
}

function loadStore(): Store {
  const raw = loadJson<Partial<Store>>(KEY, defaultStore(), VERSION);
  const base = defaultStore();
  return {
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    events: Array.isArray(raw.events) ? raw.events : [],
    audiences: Array.isArray(raw.audiences) ? raw.audiences : [],
    campaigns: Array.isArray(raw.campaigns) ? raw.campaigns : [],
    assets: Array.isArray(raw.assets) ? raw.assets : [],
    scheduledPosts: Array.isArray(raw.scheduledPosts) ? raw.scheduledPosts : [],
    engagements: Array.isArray(raw.engagements) ? raw.engagements : [],
    directives: Array.isArray(raw.directives) ? raw.directives : [],
    memories: Array.isArray(raw.memories) ? raw.memories : [],
    model: { ...base.model, ...(raw.model ?? {}) },
  };
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function exportCmoPhase2Store(): Store {
  return loadStore();
}

export function importCmoPhase2Store(store: Partial<Store>) {
  const cur = loadStore();
  saveStore({ ...cur, ...store, settings: { ...cur.settings, ...(store.settings ?? {}) }, model: { ...cur.model, ...(store.model ?? {}) } });
}

export function getCmoSettings(): CmoSettings {
  return loadStore().settings;
}

export function updateCmoSettings(patch: Partial<CmoSettings>): CmoSettings {
  const store = loadStore();
  const next = { ...store.settings, ...patch, updatedAt: cmoNowIso() } as CmoSettings;
  store.settings = next;
  saveStore(store);
  return next;
}

export function listCmoEvents(limit = 500): CmoEvent[] {
  return loadStore().events.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.max(1, limit));
}

export function addCmoEvent(event: Omit<CmoEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): CmoEvent {
  const store = loadStore();
  const created: CmoEvent = { id: event.id ?? newId('cmoevt'), createdAt: event.createdAt ?? cmoNowIso(), ...event };
  store.events.unshift(created);
  store.events = store.events.slice(0, 10000);
  saveStore(store);
  return created;
}

export function listCmoAudiences(): CmoAudienceSnapshot[] {
  return loadStore().audiences.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertCmoAudience(audience: CmoAudienceSnapshot): CmoAudienceSnapshot {
  const store = loadStore();
  const idx = store.audiences.findIndex((x) => x.id === audience.id);
  if (idx >= 0) store.audiences[idx] = audience;
  else store.audiences.unshift(audience);
  saveStore(store);
  return audience;
}

export function listCmoCampaigns(): CmoCampaign[] {
  return loadStore().campaigns.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCmoCampaign(id: string): CmoCampaign | null {
  return loadStore().campaigns.find((c) => c.id === id) ?? null;
}

export function upsertCmoCampaign(campaign: CmoCampaign): CmoCampaign {
  const store = loadStore();
  const next = { ...campaign, updatedAt: cmoNowIso() };
  const idx = store.campaigns.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.campaigns[idx] = next;
  else store.campaigns.unshift(next);
  saveStore(store);
  return next;
}

export function deleteCmoCampaign(id: string): boolean {
  const store = loadStore();
  const before = store.campaigns.length;
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  store.assets = store.assets.filter((a) => a.campaignId !== id);
  store.scheduledPosts = store.scheduledPosts.filter((p) => p.campaignId !== id);
  const changed = store.campaigns.length !== before;
  if (changed) saveStore(store);
  return changed;
}

export function listCmoAssets(campaignId?: string): CmoAsset[] {
  return loadStore().assets.filter((a) => !campaignId || a.campaignId === campaignId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertCmoAsset(asset: CmoAsset): CmoAsset {
  const store = loadStore();
  const next = { ...asset, updatedAt: cmoNowIso() };
  const idx = store.assets.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.assets[idx] = next;
  else store.assets.unshift(next);
  saveStore(store);
  return next;
}

export function listCmoScheduledPosts(campaignId?: string): CmoScheduledPost[] {
  return loadStore().scheduledPosts.filter((p) => !campaignId || p.campaignId === campaignId).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

export function upsertCmoScheduledPost(post: CmoScheduledPost): CmoScheduledPost {
  const store = loadStore();
  const next = { ...post, updatedAt: cmoNowIso() };
  const idx = store.scheduledPosts.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.scheduledPosts[idx] = next;
  else store.scheduledPosts.unshift(next);
  saveStore(store);
  return next;
}

export function listCmoEngagements(limit = 500): CmoEngagement[] {
  return loadStore().engagements.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, limit));
}

export function upsertCmoEngagement(item: CmoEngagement): CmoEngagement {
  const store = loadStore();
  const next = { ...item, updatedAt: cmoNowIso() };
  const idx = store.engagements.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.engagements[idx] = next;
  else store.engagements.unshift(next);
  saveStore(store);
  return next;
}

export function listCmoDirectives(limit = 250): CmoDirective[] {
  return loadStore().directives.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, limit));
}

export function upsertCmoDirective(directive: CmoDirective): CmoDirective {
  const store = loadStore();
  const next = { ...directive, updatedAt: cmoNowIso() };
  const idx = store.directives.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.directives[idx] = next;
  else store.directives.unshift(next);
  saveStore(store);
  return next;
}

export function listCmoMemories(limit = 500): CmoCreativeMemory[] {
  return loadStore().memories.slice().sort((a, b) => b.score150 - a.score150 || b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, limit));
}

export function upsertCmoMemory(memory: CmoCreativeMemory): CmoCreativeMemory {
  const store = loadStore();
  const next = { ...memory, updatedAt: cmoNowIso() };
  const idx = store.memories.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.memories[idx] = next;
  else store.memories.unshift(next);
  saveStore(store);
  return next;
}

export function getCmoModelState(): CmoModelState {
  return loadStore().model;
}

export function saveCmoModelState(model: CmoModelState): CmoModelState {
  const store = loadStore();
  const next = { ...model, updatedAt: cmoNowIso() };
  store.model = next;
  saveStore(store);
  return next;
}

export function cmoSummary() {
  const store = loadStore();
  const campaigns = store.campaigns;
  const events = store.events;
  const leads = events.filter((e) => e.type === 'lead_created').length;
  const booked = events.filter((e) => e.type === 'call_booked').length;
  const revenue = events.filter((e) => e.type === 'revenue_recorded').reduce((sum, e) => sum + (Number(e.value) || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const pendingDirectives = store.directives.filter((d) => d.status === 'needs_review' || d.status === 'draft').length;
  const scheduled = store.scheduledPosts.filter((p) => p.status === 'scheduled' || p.status === 'approved').length;
  return { leads, booked, revenue, activeCampaigns, pendingDirectives, scheduled, events: events.length };
}
