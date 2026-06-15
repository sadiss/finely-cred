import type { PlatformCronResult } from './platformCron';
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.platformCron.last.v1';

export function saveLastPlatformCronResult(result: PlatformCronResult) {
  saveJson(KEY, result, 1);
}

export function getLastPlatformCronResult(): PlatformCronResult | null {
  const hit = loadJson<PlatformCronResult | null>(KEY, null, 1);
  return hit?.at ? hit : null;
}
