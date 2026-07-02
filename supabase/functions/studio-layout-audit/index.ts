import { cors, json } from '../_shared/studioUxShared.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();
  return json({ ok: true, checks: ['side_by_side_cramped','long_list_fatigue','weak_primary_action','no_trash_flow'], recommendation: 'Use KPI row + deck + detail section pattern. Lock canvases until edit mode.' });
});
