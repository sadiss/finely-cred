import { corsHeaders, jsonResponse, buildId } from '../_shared/sovereignGrowthShared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const payload = await req.json().catch(() => ({}));
  const source = payload.source ?? 'unknown';
  const route = payload.route ?? 'business-credit-guide';
  const city = payload.city ?? 'unknown';
  return jsonResponse({
    ok: true,
    eventId: buildId('route'),
    shortLink: `/go/${route}?src=${encodeURIComponent(source)}&city=${encodeURIComponent(city)}`,
    owners: ['capture-architect', 'liora-lifecycle', 'appointment-architect'],
    next: ['track click', 'capture form', 'create CRM event', 'queue nurture draft'],
  });
});
