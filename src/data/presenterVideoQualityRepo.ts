import { loadJson, saveJson } from './localJsonStore';
import {
  DEFAULT_PRESENTER_QUALITY,
  type PresenterVideoQualityProfile,
} from '../domain/presenterVideoQuality';

const KEY = 'finely.presenter_video_quality.v1';
const VERSION = 1;

type Store = {
  adminOverride?: PresenterVideoQualityProfile;
};

function loadStore(): Store {
  return loadJson<Store>(KEY, {}, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

/** Admin export saved as the live quality reference (blob vault + metadata). */
export function getAdminPresenterQualityOverride(): PresenterVideoQualityProfile | null {
  return loadStore().adminOverride ?? null;
}

export function saveAdminPresenterQualityOverride(profile: PresenterVideoQualityProfile): PresenterVideoQualityProfile {
  const next: PresenterVideoQualityProfile = {
    ...profile,
    source: 'admin_export',
    exportedAt: profile.exportedAt ?? new Date().toISOString(),
  };
  saveStore({ adminOverride: next });
  return next;
}

export function clearAdminPresenterQualityOverride() {
  saveStore({});
}

/** Merge manifest defaults with optional admin export override. */
export function resolvePresenterQualityProfile(
  manifestProfile: PresenterVideoQualityProfile,
): PresenterVideoQualityProfile {
  const override = getAdminPresenterQualityOverride();
  if (!override?.blobRef) return manifestProfile;
  return {
    ...manifestProfile,
    ...override,
    source: 'admin_export',
    manifestUrl: manifestProfile.manifestUrl,
    videoUrl: manifestProfile.videoUrl,
  };
}

export function isUsingAdminReference(profile: PresenterVideoQualityProfile): boolean {
  return profile.source === 'admin_export' && Boolean(profile.blobRef);
}

export { DEFAULT_PRESENTER_QUALITY };
