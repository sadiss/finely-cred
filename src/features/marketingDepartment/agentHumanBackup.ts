import { STAFF_MEMBERS_BASE } from '../staffCommandCenter/staffDirectory';
import type { GrowthAgentDef } from '../growthAgents/growthAgentRegistry';
import { getMarketingDeskAssignee } from '../marketingDesk/marketingDeskAssignee';

/** Human executive paired with a growth agent via staff directory defaultPairings / legacy ids. */
export function resolveHumanBackupForAgent(agent: GrowthAgentDef): { name: string; title: string } | null {
  const keys = new Set([agent.id, ...(agent.legacyIds ?? [])]);

  for (const staff of STAFF_MEMBERS_BASE) {
    if (staff.kind !== 'human_staff') continue;
    const pairHit = (staff.defaultPairings ?? []).some((p) => keys.has(p));
    if (pairHit) return { name: staff.name, title: staff.title };
  }

  return null;
}

/** Global Marketing Desk seat — all desk-created tasks route here. */
export function getDeskWorkGoesToLabel(): string {
  const seat = getMarketingDeskAssignee();
  return seat.label?.trim() || 'Marketing desk';
}
