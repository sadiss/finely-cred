export type VideoRenderProvider = 'local_webm' | 'elevenlabs_voice' | 'kling' | 'runway' | 'avatar' | 'image_gen';

export type VideoProviderStatus = {
  id: VideoRenderProvider;
  label: string;
  ready: boolean;
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

export function listVideoProviderStatuses(): VideoProviderStatus[] {
  const supabase = envReady('VITE_SUPABASE_URL') && envReady('VITE_SUPABASE_ANON_KEY');
  const aiGateway = supabase;
  const eleven = aiGateway;
  const kling = envReady('VITE_KLING_API_KEY') || envReady('KLING_API_KEY');
  const runway = envReady('VITE_RUNWAY_API_KEY') || envReady('RUNWAY_API_KEY');

  return [
    { id: 'local_webm', label: 'Local WebM export', ready: true, hint: 'Scene stitch + download in browser' },
    { id: 'image_gen', label: 'Scene images', ready: aiGateway, hint: aiGateway ? 'AI gateway configured' : 'Connect Supabase + AI gateway' },
    { id: 'elevenlabs_voice', label: 'Voice render', ready: eleven, hint: eleven ? 'Narration via gateway' : 'Enable AI gateway for VO' },
    { id: 'kling', label: 'Kling motion', ready: kling, hint: kling ? 'API key detected' : 'Set VITE_KLING_API_KEY for live motion' },
    { id: 'runway', label: 'Runway Gen', ready: runway, hint: runway ? 'API key detected' : 'Set VITE_RUNWAY_API_KEY for cinematic clips' },
    { id: 'avatar', label: 'Avatar presenter', ready: aiGateway, hint: 'Avatar lane hooks ready — provider key optional' },
  ];
}

export function videoProviderReadinessScore(): number {
  const statuses = listVideoProviderStatuses();
  const ready = statuses.filter((s) => s.ready).length;
  return Math.round((ready / statuses.length) * 100);
}
