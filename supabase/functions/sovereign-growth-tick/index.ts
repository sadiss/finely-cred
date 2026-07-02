import { corsHeaders, jsonResponse, buildId } from '../_shared/sovereignGrowthShared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const payload = await req.json().catch(() => ({}));
  const city = payload.city ?? 'Dallas';
  const missionId = buildId('mission');
  return jsonResponse({
    ok: true,
    mode: 'internal_command_tick',
    missionId,
    city,
    created: [
      'staff_notification_review',
      'geo_cell_status_check',
      'lead_capture_route_review',
      'media_plan_review',
    ],
    note: 'This function is an internal command tick. External sends/publishes remain approval-gated.',
  });
});
