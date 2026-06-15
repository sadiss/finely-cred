/**
 * Co-owner Ruth — executable staff & agent operations (hire, promote, shift assign).
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import type { AgentTrainingPhaseId } from '../domain/agentProgram';
import { AGENT_TRAINING_PHASES } from '../domain/agentProgram';
import { getAgentOperatingModel, saveAgentOperatingModel } from '../data/agentProgramRepo';
import { listRoleCoverageGaps, loadStaffRoster, upsertStaffMember } from '../data/staffRoster';
import type { StaffMember } from '../domain/staffMember';
import { CO_OWNER_IDENTITY } from '../domain/coOwnerIdentity';
import { getExecutiveHatById } from '../domain/coOwnerExecutiveStructure';
import { newId } from '../utils/ids';
import { extractFirstJsonObject } from '../utils/jsonExtract';

export type CoOwnerStaffAction =
  | {
      type: 'hire_staff';
      firstName: string;
      lastName: string;
      primaryRoleId: AgentPersonaId;
      department: StaffMember['department'];
      bioLine?: string;
      portraitGender?: StaffMember['portraitGender'];
      executiveHatId?: string;
    }
  | { type: 'promote_staff'; staffId: string; newRoleId: AgentPersonaId }
  | { type: 'promote_agent'; userId: string; trainingPhase: AgentTrainingPhaseId }
  | { type: 'deactivate_staff'; staffId: string };

export type CoOwnerActionResult = { ok: boolean; message: string; detail?: unknown };

const ACTION_BLOCK_RE = /```coowner-action\s*([\s\S]*?)```/gi;

export function parseCoOwnerActionsFromAssistant(text: string): CoOwnerStaffAction[] {
  const actions: CoOwnerStaffAction[] = [];
  let m: RegExpExecArray | null;
  while ((m = ACTION_BLOCK_RE.exec(text)) !== null) {
    const parsed = extractFirstJsonObject(m[1] ?? '') as CoOwnerStaffAction | null;
    if (parsed?.type) actions.push(parsed);
  }
  return actions;
}

export function executeCoOwnerStaffAction(action: CoOwnerStaffAction): CoOwnerActionResult {
  switch (action.type) {
    case 'hire_staff': {
      const id = newId('staff');
      const hat = action.executiveHatId ? getExecutiveHatById(action.executiveHatId) : null;
      const member: StaffMember = {
        id,
        firstName: action.firstName.trim(),
        lastName: action.lastName.trim(),
        primaryRoleId: action.primaryRoleId,
        department: action.department,
        portraitGender: action.portraitGender ?? 'neutral',
        avatarPath: `staff-portrait://${id}`,
        bioLine:
          action.bioLine ??
          (hat
            ? `Executive hat: ${hat.title} · Hired by ${CO_OWNER_IDENTITY.name}`
            : `Hired by ${CO_OWNER_IDENTITY.name} — ${action.primaryRoleId.replace(/_/g, ' ')}`),
        shiftBlocks: [{ days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 }],
        active: true,
      };
      upsertStaffMember(member);
      return {
        ok: true,
        message: `Hired ${member.firstName} ${member.lastName} as ${action.primaryRoleId}.`,
        detail: member,
      };
    }
    case 'promote_staff': {
      const roster = loadStaffRoster();
      const existing = roster.find((s) => s.id === action.staffId);
      if (!existing) return { ok: false, message: `Staff member ${action.staffId} not found.` };
      upsertStaffMember({ ...existing, primaryRoleId: action.newRoleId });
      return {
        ok: true,
        message: `Promoted ${existing.firstName} ${existing.lastName} to ${action.newRoleId}.`,
      };
    }
    case 'deactivate_staff': {
      const roster = loadStaffRoster();
      const existing = roster.find((s) => s.id === action.staffId);
      if (!existing) return { ok: false, message: `Staff member ${action.staffId} not found.` };
      upsertStaffMember({ ...existing, active: false });
      return { ok: true, message: `Deactivated ${existing.firstName} ${existing.lastName}.` };
    }
    case 'promote_agent': {
      const phases = AGENT_TRAINING_PHASES.map((p) => p.id);
      if (!phases.includes(action.trainingPhase)) {
        return { ok: false, message: `Invalid training phase: ${action.trainingPhase}` };
      }
      const model = getAgentOperatingModel(action.userId);
      if (!model) return { ok: false, message: `No agent model for user ${action.userId}.` };
      saveAgentOperatingModel(action.userId, { ...model, trainingPhase: action.trainingPhase });
      return {
        ok: true,
        message: `Promoted agent user to ${action.trainingPhase} phase.`,
      };
    }
    default:
      return { ok: false, message: 'Unknown action type.' };
  }
}

export function getCoOwnerStaffSnapshot() {
  const roster = loadStaffRoster();
  const roleIds = [
    ...new Set(
      roster
        .filter((s) => s.active !== false)
        .map((s) => s.primaryRoleId),
    ),
  ] as AgentPersonaId[];
  const monitorIds =
    roleIds.length > 0
      ? roleIds
      : (['finely_advisor', 'dispute_coach', 'support_specialist'] as AgentPersonaId[]);
  const gaps = listRoleCoverageGaps(monitorIds);
  return {
    activeStaff: roster.filter((s) => s.active !== false).length,
    totalStaff: roster.length,
    coverageGaps: gaps.slice(0, 8),
    recentHires: roster.filter((s) => s.bioLine?.includes(`Hired by ${CO_OWNER_IDENTITY.name}`)).slice(-5),
  };
}

export const CO_OWNER_ACTION_PROMPT_APPEND = `
When coverage gaps or vacant executive hats require staffing, ${CO_OWNER_IDENTITY.name} HIRES directly — do not ask the owner to set up roster entries manually.

Include executable action blocks when hiring or promoting:

\`\`\`coowner-action
{"type":"hire_staff","firstName":"Daniel","lastName":"Benjamin","primaryRoleId":"dispute_coach","department":"dispute_processing","portraitGender":"masculine","executiveHatId":"exec_global_cfo","bioLine":"Executive hat: Chief Financial Officer · Hired by Ruth"}
\`\`\`

Valid types: hire_staff (optional executiveHatId, portraitGender), promote_staff (staffId + newRoleId), promote_agent (userId + trainingPhase), deactivate_staff.

For C-suite and director vacancies, hire with biblical first names and executiveHatId when known. Confirm what you did in plain language after the block.
`;
