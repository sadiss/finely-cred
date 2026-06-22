import {
  DEFAULT_DISTRIBUTION_CHANNELS,
  type DistributionCampaign,
  type DistributionChannel,
  type DistributionJob,
  type DistributionLinkAsset,
  type DistributionStore,
} from '../domain/leadDistribution';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.lead_distribution.v1';

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function defaultLinkAssets(): DistributionLinkAsset[] {
  const t = nowIso();
  return [
    {
      id: 'asset-free-guide',
      label: 'Free dispute letter guide (lead magnet)',
      kind: 'lead_magnet',
      path: '/free-guide?guide=credit-dispute-letter-guide',
      utmCampaign: 'lead_magnet_guide',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-consultation',
      label: 'Strategy call booking',
      kind: 'consultation',
      path: '/consultation?lane=Personal+Credit',
      utmCampaign: 'consultation_book',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-pricing',
      label: 'Personal credit restore pricing',
      kind: 'pricing',
      path: '/services/personal-credit-restore',
      utmCampaign: 'pricing_personal',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-resources',
      label: 'Resources library',
      kind: 'resources',
      path: '/resources',
      utmCampaign: 'resources_hub',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-affiliate-toolkit',
      label: 'Affiliate toolkit funnel',
      kind: 'custom',
      path: '/affiliate-toolkit',
      utmCampaign: 'acq_affiliate',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-specialist-apply',
      label: 'Credit specialist apply',
      kind: 'custom',
      path: '/credit-specialist-apply',
      utmCampaign: 'acq_specialist',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-au-seller',
      label: 'AU seller signup',
      kind: 'custom',
      path: '/signup?role=au_seller',
      utmCampaign: 'acq_au_seller',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'asset-business-guide',
      label: 'Business credit guide',
      kind: 'lead_magnet',
      path: '/free-business-guide',
      utmCampaign: 'acq_business_credit',
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function loadStore(): DistributionStore {
  const base = loadJson<DistributionStore>(
    KEY,
    {
      version: 1,
      linkAssets: defaultLinkAssets(),
      channels: DEFAULT_DISTRIBUTION_CHANNELS,
      campaigns: [],
      jobs: [],
    },
    1,
  );
  if (!base.linkAssets?.length) base.linkAssets = defaultLinkAssets();
  if (!base.channels?.length) base.channels = DEFAULT_DISTRIBUTION_CHANNELS;
  if (!base.campaigns) base.campaigns = [];
  if (!base.jobs) base.jobs = [];
  return base;
}

function saveStore(store: DistributionStore) {
  saveJson(KEY, store, 1);
  window.dispatchEvent(new Event('finely:store'));
}

export function listDistributionLinkAssets(): DistributionLinkAsset[] {
  return loadStore().linkAssets.filter((a) => a.enabled);
}

export function listAllDistributionLinkAssets(): DistributionLinkAsset[] {
  return loadStore().linkAssets;
}

export function upsertDistributionLinkAsset(
  patch: Partial<DistributionLinkAsset> & Pick<DistributionLinkAsset, 'label' | 'path' | 'kind'>,
  id?: string,
): DistributionLinkAsset {
  const store = loadStore();
  const t = nowIso();
  if (id) {
    const idx = store.linkAssets.findIndex((a) => a.id === id);
    if (idx >= 0) {
      store.linkAssets[idx] = { ...store.linkAssets[idx], ...patch, updatedAt: t };
      saveStore(store);
      return store.linkAssets[idx];
    }
  }
  const next: DistributionLinkAsset = {
    id: uid('asset'),
    enabled: true,
    createdAt: t,
    updatedAt: t,
    ...patch,
  };
  store.linkAssets.push(next);
  saveStore(store);
  return next;
}

export function listDistributionChannels(): DistributionChannel[] {
  return loadStore().channels;
}

export function patchDistributionChannel(id: string, patch: Partial<DistributionChannel>): DistributionChannel | null {
  const store = loadStore();
  const idx = store.channels.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.channels[idx] = { ...store.channels[idx], ...patch };
  saveStore(store);
  return store.channels[idx];
}

export function listDistributionCampaigns(): DistributionCampaign[] {
  return loadStore().campaigns.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertDistributionCampaign(
  patch: Omit<Partial<DistributionCampaign>, 'id'> & {
    name: string;
    linkAssetId: string;
    messageTemplate: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
  },
  id?: string,
): DistributionCampaign {
  const store = loadStore();
  const t = nowIso();
  if (id) {
    const idx = store.campaigns.findIndex((c) => c.id === id);
    if (idx >= 0) {
      store.campaigns[idx] = {
        ...store.campaigns[idx],
        ...patch,
        updatedAt: t,
      };
      saveStore(store);
      return store.campaigns[idx];
    }
  }
  const next: DistributionCampaign = {
    id: uid('camp'),
    channelIds: patch.channelIds ?? ['ch-manual'],
    wisdomLevel: patch.wisdomLevel ?? 3,
    enabled: patch.enabled ?? true,
    scheduleCron: patch.scheduleCron,
    createdAt: t,
    updatedAt: t,
    ...patch,
  };
  store.campaigns.push(next);
  saveStore(store);
  return next;
}

export function listDistributionJobs(limit = 100): DistributionJob[] {
  return loadStore()
    .jobs.slice()
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, limit);
}

export function addDistributionJobs(jobs: DistributionJob[]) {
  const store = loadStore();
  store.jobs.push(...jobs);
  store.jobs = store.jobs
    .slice()
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 500);
  saveStore(store);
}

export function patchDistributionJob(id: string, patch: Partial<DistributionJob>): DistributionJob | null {
  const store = loadStore();
  const idx = store.jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  store.jobs[idx] = { ...store.jobs[idx], ...patch };
  saveStore(store);
  return store.jobs[idx];
}

export function exportDistributionStore(): DistributionStore {
  return loadStore();
}

export function importDistributionJobsFromExport(jobs: DistributionJob[]) {
  addDistributionJobs(jobs);
}
