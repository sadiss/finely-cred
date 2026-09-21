import { loadJson, saveJson } from '../data/localJsonStore';
import type { MeetingVideoPrefs } from './meetingVideoQuality';
import { ACADEMY_HUDDLE_VIDEO_DEFAULTS, LOUNGE_HOST_VIDEO_DEFAULTS } from './meetingVideoQuality';

const KEY = 'finely.meeting.videoPrefs.v1';

export type MeetingHostContext = 'guest' | 'lounge' | 'academy_huddle' | 'admin';

export function defaultPrefsForContext(ctx: MeetingHostContext): MeetingVideoPrefs {
  if (ctx === 'academy_huddle') return { ...ACADEMY_HUDDLE_VIDEO_DEFAULTS };
  if (ctx === 'lounge' || ctx === 'admin') return { ...LOUNGE_HOST_VIDEO_DEFAULTS };
  return {
    videoMode: 'smooth',
    beautyEnabled: true,
    beautyStrength: 28,
    virtualBackground: 'blur',
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  };
}

export function getMeetingVideoPrefs(ctx: MeetingHostContext = 'guest'): MeetingVideoPrefs {
  const stored = loadJson<Partial<MeetingVideoPrefs>>(KEY, {}, 1);
  const base = defaultPrefsForContext(ctx);
  return { ...base, ...stored };
}

export function saveMeetingVideoPrefs(prefs: MeetingVideoPrefs) {
  saveJson(KEY, prefs, 1);
}
