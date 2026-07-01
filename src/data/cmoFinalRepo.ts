import { loadJson, saveJson } from './localJsonStore';
import {
  CmoDirective,
  CmoFeatureCapability,
  CmoGrowthEvent,
  CmoLayoutAudit,
  CmoLeadGrowthPlan,
  CmoLinkRecord,
  CmoMlFeatureVector,
  CmoMlModelState,
  CmoOpportunity,
  CmoPageSignal,
  CmoPersonalitySettings,
  CmoSiteChange,
  CmoStaffMessage,
  DEFAULT_CMO_PERSONALITY_SETTINGS,
} from '../domain/cmoFinal';

const VERSION = 1;
const keys = {
  settings: 'fc:cmo-final:settings',
  messages: 'fc:cmo-final:messages',
  directives: 'fc:cmo-final:directives',
  links: 'fc:cmo-final:links',
  pageSignals: 'fc:cmo-final:page-signals',
  changes: 'fc:cmo-final:changes',
  audits: 'fc:cmo-final:layout-audits',
  events: 'fc:cmo-final:growth-events',
  vectors: 'fc:cmo-final:feature-vectors',
  model: 'fc:cmo-final:ml-model',
  leadPlans: 'fc:cmo-final:lead-plans',
  features: 'fc:cmo-final:feature-capabilities',
  opportunities: 'fc:cmo-final:opportunities',
};

export const cmoId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const cmoNow = () => new Date().toISOString();

export function getCmoSettings(): CmoPersonalitySettings {
  return loadJson<CmoPersonalitySettings>(keys.settings, DEFAULT_CMO_PERSONALITY_SETTINGS, VERSION);
}

export function saveCmoSettings(settings: CmoPersonalitySettings): CmoPersonalitySettings {
  const next = { ...settings, lastUpdatedAt: cmoNow() };
  saveJson(keys.settings, next, VERSION);
  return next;
}

export function listCmoMessages(): CmoStaffMessage[] {
  return loadJson<CmoStaffMessage[]>(keys.messages, [], VERSION);
}

export function addCmoMessage(message: Omit<CmoStaffMessage, 'id' | 'createdAt'>): CmoStaffMessage {
  const next: CmoStaffMessage = { ...message, id: cmoId('msg'), createdAt: cmoNow() };
  saveJson(keys.messages, [next, ...listCmoMessages()].slice(0, 250), VERSION);
  return next;
}

export function listCmoDirectives(): CmoDirective[] {
  return loadJson<CmoDirective[]>(keys.directives, [], VERSION);
}

export function upsertCmoDirective(directive: CmoDirective): CmoDirective {
  const existing = listCmoDirectives();
  const next = [directive, ...existing.filter((item) => item.id !== directive.id)].slice(0, 500);
  saveJson(keys.directives, next, VERSION);
  return directive;
}

export function listCmoLinks(): CmoLinkRecord[] {
  return loadJson<CmoLinkRecord[]>(keys.links, seedCmoLinks(), VERSION);
}

export function upsertCmoLink(link: CmoLinkRecord): CmoLinkRecord {
  const existing = listCmoLinks();
  const next = [link, ...existing.filter((item) => item.id !== link.id)];
  saveJson(keys.links, next, VERSION);
  return link;
}

export function listCmoPageSignals(): CmoPageSignal[] {
  return loadJson<CmoPageSignal[]>(keys.pageSignals, [], VERSION);
}

export function saveCmoPageSignal(signal: CmoPageSignal): CmoPageSignal {
  const existing = listCmoPageSignals();
  const next = [signal, ...existing.filter((item) => item.route !== signal.route)].slice(0, 300);
  saveJson(keys.pageSignals, next, VERSION);
  addCmoGrowthEvent({ type: 'site_snapshot_created', route: signal.route, metadata: { title: signal.title, area: signal.area } });
  return signal;
}

export function listCmoSiteChanges(): CmoSiteChange[] {
  return loadJson<CmoSiteChange[]>(keys.changes, [], VERSION);
}

export function addCmoSiteChanges(changes: CmoSiteChange[]): CmoSiteChange[] {
  if (changes.length === 0) return listCmoSiteChanges();
  const next = [...changes, ...listCmoSiteChanges()].slice(0, 500);
  saveJson(keys.changes, next, VERSION);
  changes.forEach((change) => {
    addCmoGrowthEvent({ type: 'site_change_detected', route: change.route, metadata: { changeType: change.changeType, severity: change.severity } });
  });
  return next;
}

export function listCmoLayoutAudits(): CmoLayoutAudit[] {
  return loadJson<CmoLayoutAudit[]>(keys.audits, [], VERSION);
}

export function saveCmoLayoutAudit(audit: CmoLayoutAudit): CmoLayoutAudit {
  const next = [audit, ...listCmoLayoutAudits().filter((item) => item.route !== audit.route)].slice(0, 300);
  saveJson(keys.audits, next, VERSION);
  addCmoGrowthEvent({ type: 'layout_audit_completed', route: audit.route, value: audit.score, metadata: { ...audit } });
  return audit;
}

export function listCmoGrowthEvents(): CmoGrowthEvent[] {
  return loadJson<CmoGrowthEvent[]>(keys.events, [], VERSION);
}

export function addCmoGrowthEvent(event: Omit<CmoGrowthEvent, 'id' | 'createdAt'>): CmoGrowthEvent {
  const nextEvent: CmoGrowthEvent = { ...event, id: cmoId('evt'), createdAt: cmoNow() };
  saveJson(keys.events, [nextEvent, ...listCmoGrowthEvents()].slice(0, 2500), VERSION);
  return nextEvent;
}

export function listCmoFeatureVectors(): CmoMlFeatureVector[] {
  return loadJson<CmoMlFeatureVector[]>(keys.vectors, [], VERSION);
}

export function addCmoFeatureVector(vector: Omit<CmoMlFeatureVector, 'id' | 'createdAt'>): CmoMlFeatureVector {
  const next: CmoMlFeatureVector = { ...vector, id: cmoId('vec'), createdAt: cmoNow() };
  saveJson(keys.vectors, [next, ...listCmoFeatureVectors()].slice(0, 2500), VERSION);
  return next;
}

export function getCmoMlModelState(): CmoMlModelState {
  return loadJson<CmoMlModelState>(keys.model, seedCmoMlModelState(), VERSION);
}

export function saveCmoMlModelState(model: CmoMlModelState): CmoMlModelState {
  saveJson(keys.model, { ...model, lastTrainedAt: cmoNow() }, VERSION);
  return model;
}

export function listCmoLeadGrowthPlans(): CmoLeadGrowthPlan[] {
  return loadJson<CmoLeadGrowthPlan[]>(keys.leadPlans, [], VERSION);
}

export function saveCmoLeadGrowthPlan(plan: CmoLeadGrowthPlan): CmoLeadGrowthPlan {
  saveJson(keys.leadPlans, [plan, ...listCmoLeadGrowthPlans()].slice(0, 100), VERSION);
  return plan;
}

export function listCmoFeatureCapabilities(): CmoFeatureCapability[] {
  return loadJson<CmoFeatureCapability[]>(keys.features, [], VERSION);
}

export function saveCmoFeatureCapabilities(features: CmoFeatureCapability[]): CmoFeatureCapability[] {
  saveJson(keys.features, features, VERSION);
  return features;
}

export function listCmoOpportunities(): CmoOpportunity[] {
  return loadJson<CmoOpportunity[]>(keys.opportunities, [], VERSION);
}

export function upsertCmoOpportunity(opportunity: CmoOpportunity): CmoOpportunity {
  const existing = listCmoOpportunities();
  const next = [opportunity, ...existing.filter((item) => item.id !== opportunity.id)].slice(0, 600);
  saveJson(keys.opportunities, next, VERSION);
  return opportunity;
}

function seedCmoLinks(): CmoLinkRecord[] {
  const now = cmoNow();
  return [
    {
      id: 'link_booking_consultation',
      label: 'Book Consultation',
      url: '/consultation',
      type: 'booking',
      routeHints: ['/', '/pricing', '/business-funding', '/affiliate'],
      campaignHints: ['consultation', 'credit repair', 'business funding'],
      isActive: true,
      notes: 'Primary booking path. Keep this visible near proof, offers, and high-intent objections.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'link_affiliate_program',
      label: 'Affiliate Program',
      url: '/affiliate',
      type: 'affiliate',
      routeHints: ['/affiliate', '/agents', '/resources'],
      campaignHints: ['affiliate', 'partners', 'referrals'],
      isActive: true,
      notes: 'Primary partner growth path.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'link_shorts_placeholder',
      label: 'Shorts / Reels Proof Path',
      url: 'https://replace-with-your-shorts-or-reels-url.example',
      type: 'shorts',
      routeHints: ['/', '/resources', '/bookstore'],
      campaignHints: ['short form video', 'proof', 'education'],
      isActive: false,
      notes: 'Replace with real Shorts, Reels, TikTok, or social proof link.',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function seedCmoMlModelState(): CmoMlModelState {
  const now = cmoNow();
  const channels: CmoMlModelState['channels'] = [
    'shorts',
    'instagram_reels',
    'tiktok',
    'youtube',
    'linkedin',
    'facebook',
    'email',
    'sms',
    'affiliate',
    'press',
    'podcast',
    'webinar',
    'seo',
    'partners',
    'events',
    'retargeting',
  ].map((channel) => ({
    channel: channel as CmoMlModelState['channels'][number]['channel'],
    impressions: 0,
    clicks: 0,
    leads: 0,
    bookedCalls: 0,
    conversions: 0,
    revenue: 0,
    alpha: 2,
    beta: 8,
    lastUpdatedAt: now,
  }));
  return {
    version: 1,
    channels,
    winningSignals: ['specific audience', 'clear CTA', 'proof', 'fast next step'],
    weakSignals: ['generic copy', 'missing offer', 'missing CTA', 'unsafe claims'],
    recommendedExperiments: ['Shorts-to-consultation loop', 'affiliate proof campaign', 'interview authority sprint'],
    lastTrainedAt: now,
  };
}
