import { cors, json, safeString, clamp, blockedCopy } from '../_shared/studioUxShared.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();
  try {
    const input = await req.json().catch(() => ({}));
    const prompt = safeString(input.prompt, 'Create a 28-second Finely Cred premium video.');
    const durationSec = clamp(input.durationSec, 6, 90, 28);
    const flags = blockedCopy(prompt);
    const scenes = Array.from({ length: Math.max(4, Math.min(10, Math.round(durationSec / 4))) }).map((_, i) => ({
      beat: i === 0 ? 'Hook' : i === Math.max(4, Math.min(10, Math.round(durationSec / 4))) - 1 ? 'CTA' : `Proof point ${i}`,
      durationSec: Math.max(2, Math.round(durationSec / Math.max(4, Math.min(10, Math.round(durationSec / 4))))),
      visualPrompt: `Premium Finely Cred finance visual, cinematic, no text, scene ${i + 1}, based on: ${prompt}`,
      motionPrompt: 'Smooth professional camera motion, subtle parallax, premium lighting.',
      caption: i === 0 ? 'Make your next credit move clear.' : i === Math.max(4, Math.min(10, Math.round(durationSec / 4))) - 1 ? 'Download the guide or book a review.' : 'A cleaner path starts with better structure.',
      voiceover: 'Finely Cred helps you understand the next step without unrealistic promises.',
      complianceNote: 'No guaranteed approval, deletion, score, or funding result is promised.'
    }));
    return json({ ok: true, mode: 'server_plan', title: safeString(input.title, 'Finely Cred Video Plan'), durationSec, scenes, complianceFlags: flags.length ? flags : ['review_before_publish'] });
  } catch (e) { return json({ ok: false, error: e?.message || 'failed' }, 500); }
});
