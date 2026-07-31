export type VideoRenderProvider = 'local_webm' | 'elevenlabs_voice' | 'kling' | 'runway' | 'avatar' | 'image_gen';

export type VideoProviderStatus = {
  id: VideoRenderProvider;
  label: string;
  ready: boolean;
  /** Honest lane label for UI */
  lane: 'live' | 'planned';
  hint: string;
};

function envReady(key: string): boolean {
  try {
    const v = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key];
    return Boolean(v && String(v).trim().length > 0);
  } catch {
    return false;
  }
}

/**
 * Readiness for UI — cinematic providers stay Planned until adapters return playable media.
 * Env keys alone must NOT flip Kling/Runway to "ready" (keys ≠ live API path).
 */
export function listVideoProviderStatuses(): VideoProviderStatus[] {
  const supabase = envReady('VITE_SUPABASE_URL') && envReady('VITE_SUPABASE_ANON_KEY');
  const aiGateway = supabase;
  const eleven = aiGateway;
  const klingKey = envReady('VITE_KLING_API_KEY') || envReady('KLING_API_KEY');
  const runwayKey = envReady('VITE_RUNWAY_API_KEY') || envReady('RUNWAY_API_KEY');

  return [
    {
      id: 'local_webm',
      label: 'Presenter Mode (WebM)',
      ready: true,
      lane: 'live',
      hint: 'Stills + captions + VO stitch in browser',
    },
    {
      id: 'image_gen',
      label: 'Scene images',
      ready: aiGateway,
      lane: aiGateway ? 'live' : 'planned',
      hint: aiGateway ? 'AI gateway configured' : 'Connect Supabase + AI gateway',
    },
    {
      id: 'elevenlabs_voice',
      label: 'Voice render',
      ready: eleven,
      lane: eleven ? 'live' : 'planned',
      hint: eleven ? 'Narration via Voice Studio / gateway' : 'Enable AI gateway for VO',
    },
    {
      id: 'kling',
      label: 'Kling motion',
      ready: false,
      lane: 'planned',
      hint: klingKey
        ? 'API key present — adapter still stubbed (not live)'
        : 'Planned — wire server adapter in Phase 1',
    },
    {
      id: 'runway',
      label: 'Runway Gen',
      ready: false,
      lane: 'planned',
      hint: runwayKey
        ? 'API key present — adapter still stubbed (not live)'
        : 'Planned — wire server adapter in Phase 1',
    },
    {
      id: 'avatar',
      label: 'Avatar presenter',
      ready: false,
      lane: 'planned',
      hint: 'HeyGen/Tavus hooks only — not wired',
    },
  ];
}

/** Score only counts Presenter / image / voice lanes (excludes Planned cinematic stubs). */
export function videoProviderReadinessScore(): number {
  const liveCapable = listVideoProviderStatuses().filter(
    (s) => s.id === 'local_webm' || s.id === 'image_gen' || s.id === 'elevenlabs_voice',
  );
  const ready = liveCapable.filter((s) => s.ready).length;
  return Math.round((ready / Math.max(1, liveCapable.length)) * 100);
}
