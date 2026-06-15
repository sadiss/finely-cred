import { DEFAULT_META_INTEGRATION, type MetaIntegrationConfig } from '../domain/metaIntegration';

const STORAGE_KEY = 'finely.metaIntegration.v1';
/** Legacy Social Hub key — migrated once into STORAGE_KEY on read. */
const LEGACY_META_KEY = 'finely.meta.integration.v1';

function migrateLegacyMetaConfig(): MetaIntegrationConfig {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_META_KEY);
    if (!legacyRaw) return DEFAULT_META_INTEGRATION;
    const parsed = JSON.parse(legacyRaw) as { v?: number; data?: MetaIntegrationConfig } | MetaIntegrationConfig;
    const legacyData =
      parsed && typeof parsed === 'object' && 'v' in parsed && parsed.v === 1 && parsed.data
        ? parsed.data
        : (parsed as MetaIntegrationConfig);
    const merged = { ...DEFAULT_META_INTEGRATION, ...legacyData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_META_INTEGRATION;
  }
}

export function loadMetaIntegrationConfig(): MetaIntegrationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyMetaConfig();
    return { ...DEFAULT_META_INTEGRATION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_META_INTEGRATION;
  }
}

export function saveMetaIntegrationConfig(cfg: MetaIntegrationConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function isMetaIntegrationLive(): boolean {
  const cfg = loadMetaIntegrationConfig();
  return cfg.status === 'connected' && Boolean(cfg.webhookVerified);
}
