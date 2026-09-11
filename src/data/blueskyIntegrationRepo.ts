import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.blueskyIntegration.v1';

export type BlueskyIntegrationConfig = {
  handle: string;
  appPassword: string;
  status: 'idle' | 'connected' | 'error';
  lastCheckedAt?: string;
  lastError?: string;
  did?: string;
};

const DEFAULT: BlueskyIntegrationConfig = {
  handle: '',
  appPassword: '',
  status: 'idle',
};

export function loadBlueskyIntegrationConfig(): BlueskyIntegrationConfig {
  return loadJson<BlueskyIntegrationConfig>(KEY, DEFAULT, 1);
}

export function saveBlueskyIntegrationConfig(cfg: BlueskyIntegrationConfig) {
  saveJson(KEY, cfg, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function isBlueskyIntegrationLive(): boolean {
  const cfg = loadBlueskyIntegrationConfig();
  return cfg.status === 'connected' && Boolean(cfg.handle.trim() && cfg.appPassword.trim());
}
