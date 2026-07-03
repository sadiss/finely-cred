import { HUMAN_STAFF_AGENTS } from '../humanStaffOs/humanStaffDirectory';
import type { HumanStaffAgentId } from '../humanStaffOs/types';
import { setSelectedHumanStaff } from '../humanStaffOs/humanStaffRepo';
import { setSelectedStaff } from './staffCommandRepo';

const HUMAN_AGENT_IDS = new Set<string>(HUMAN_STAFF_AGENTS.map((a) => a.id));

/** Keep Command Center and Human Staff OS selections aligned when IDs overlap. */
export function syncStaffSelectionToHumanOs(staffIds: string[]) {
  const overlap = staffIds.filter((id): id is HumanStaffAgentId => HUMAN_AGENT_IDS.has(id)).slice(0, 3);
  if (overlap.length) setSelectedHumanStaff(overlap);
}

export function syncHumanSelectionToCommandCenter(agentIds: HumanStaffAgentId[]) {
  const overlap = agentIds.filter((id) => HUMAN_AGENT_IDS.has(id)).slice(0, 3);
  if (overlap.length) setSelectedStaff(overlap);
}
