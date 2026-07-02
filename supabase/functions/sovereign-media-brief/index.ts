import { corsHeaders, jsonResponse, buildId, blockedCopy } from '../_shared/sovereignGrowthShared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const payload = await req.json().catch(() => ({}));
  const title = String(payload.title ?? 'Media brief');
  const blocked = blockedCopy(`${title} ${payload.angle ?? ''}`);
  if (blocked.length) return jsonResponse({ ok: false, blocked, message: 'Media brief blocked by compliance guard.' }, 400);
  return jsonResponse({
    ok: true,
    id: buildId('media-brief'),
    title,
    channel: payload.channel ?? 'instagram',
    mediaType: payload.mediaType ?? 'short_video',
    scriptBeats: ['first-frame hook', 'plain-English problem', 'checklist proof', 'tracked CTA', 'safe disclaimer'],
    voiceDirection: 'Calm, premium, useful, no guarantees.',
    nextStep: 'Create draft in Media Studio or external video/voice tool after approval.',
  });
});
