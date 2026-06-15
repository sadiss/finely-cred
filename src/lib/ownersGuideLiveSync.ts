/** Phase 46 — merge live platform state into static owners guide sections. */
import type { OwnersGuideSection } from '../data/ownersGuideModel';
import { listAllWebhookEndpoints } from '../data/webhooksRepo';
import { listFunnelExperiments } from '../data/funnelExperimentsRepo';
import { listPartnerApiKeys } from '../data/partnerApiKeysRepo';

type LivePatch = { id: string; bullets: string[] };

export function buildLiveOwnersGuidePatches(): LivePatch[] {
  const patches: LivePatch[] = [];
  const now = new Date().toLocaleDateString();

  const webhooks = listAllWebhookEndpoints();
  const enabledHooks = webhooks.filter((w) => w.enabled);
  if (enabledHooks.length > 0) {
    patches.push({
      id: 'platform_os',
      bullets: [
        `Live (${now}): ${enabledHooks.length} webhook endpoint(s) active — Integration Hub at /admin/integrations.`,
      ],
    });
  }

  const experiments = listFunnelExperiments().filter((e) => e.enabled);
  if (experiments.length > 0) {
    patches.push({
      id: 'leads',
      bullets: [
        `Live (${now}): ${experiments.length} funnel A/B experiment(s) running — /admin/funnel-experiments.`,
      ],
    });
  }

  const apiKeys = listPartnerApiKeys();
  if (apiKeys.length > 0) {
    patches.push({
      id: 'platform_os',
      bullets: [
        `Live (${now}): ${apiKeys.length} partner API key(s) issued — rotate in Integration Hub.`,
      ],
    });
  }

  patches.push({
    id: 'platform_os',
    bullets: [
      `Live (${now}): Notifications center at /admin/notifications and /portal/notifications.`,
      `Live (${now}): Contextual ? help on admin and portal screens links here.`,
    ],
  });

  return patches;
}

export function mergeOwnersGuideSections(base: OwnersGuideSection[]): OwnersGuideSection[] {
  const byId = new Map<string, string[]>();
  for (const patch of buildLiveOwnersGuidePatches()) {
    const existing = byId.get(patch.id) ?? [];
    byId.set(patch.id, [...existing, ...patch.bullets]);
  }

  return base.map((section) => {
    const extra = byId.get(section.id);
    if (!extra?.length) return section;
    const mergedBullets = [...section.bullets];
    for (const b of extra) {
      if (!mergedBullets.some((x) => x.startsWith(b.slice(0, 20)))) mergedBullets.push(b);
    }
    return { ...section, bullets: mergedBullets };
  });
}
