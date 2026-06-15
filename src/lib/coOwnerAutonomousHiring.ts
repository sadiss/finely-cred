/**
 * Co-owner Ruth — autonomous hiring (executives + coverage gaps) without owner manual setup.
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import { AGENT_PERSONAS } from '../domain/agentPersonas';
import { CO_OWNER_IDENTITY } from '../domain/coOwnerIdentity';
import {
  getExecutiveHatById,
  listVacantExecutiveHats,
  type ExecutiveHat,
  type ExecutiveLevel,
} from '../domain/coOwnerExecutiveStructure';
import { listRoleCoverageGaps, loadStaffRoster } from '../data/staffRoster';
import type { StaffMember } from '../domain/staffMember';
import { pickBiblicalNameForExecutive } from './coOwnerBiblicalNames';
import { executeCoOwnerStaffAction, type CoOwnerActionResult, type CoOwnerStaffAction } from './coOwnerStaffActions';

export type AutonomousHireResult = CoOwnerActionResult & { hatId?: string; roleId?: AgentPersonaId };

function departmentForRole(roleId: AgentPersonaId): StaffMember['department'] {
  const map: Partial<Record<AgentPersonaId, StaffMember['department']>> = {
    dispute_coach: 'dispute_processing',
    finely_advisor: 'credit_operations',
    funding_strategist: 'funding',
    debt_strategist: 'debt_resolution',
    social_creator: 'marketing',
    affiliate_specialist: 'marketing',
    sales_closer: 'growth_sessions',
    support_specialist: 'partner_success',
    ops_copilot: 'internal_ops',
    compliance_agent: 'internal_ops',
  };
  return map[roleId] ?? 'partner_success';
}

function buildExecutiveHireAction(hat: ExecutiveHat): CoOwnerStaffAction {
  const name = pickBiblicalNameForExecutive(hat.id, hat.title);
  return {
    type: 'hire_staff',
    firstName: name.firstName,
    lastName: name.lastName,
    primaryRoleId: hat.agentRoleId,
    department: departmentForRole(hat.agentRoleId),
    portraitGender: name.portraitGender,
    executiveHatId: hat.id,
    bioLine: `Executive hat: ${hat.title} · ${hat.divisionLabel} · Hired by ${CO_OWNER_IDENTITY.name}`,
  };
}

function parseGapRoleId(gapLine: string): AgentPersonaId | null {
  const roleId = gapLine.split(':')[0]?.trim() as AgentPersonaId;
  if (AGENT_PERSONAS.some((p) => p.id === roleId)) return roleId;
  return null;
}

function buildGapHireAction(roleId: AgentPersonaId, gapLine: string): CoOwnerStaffAction {
  const persona = AGENT_PERSONAS.find((p) => p.id === roleId);
  const name = pickBiblicalNameForExecutive(`gap-${roleId}`, persona?.displayTitle ?? roleId);
  return {
    type: 'hire_staff',
    firstName: name.firstName,
    lastName: name.lastName,
    primaryRoleId: roleId,
    department: departmentForRole(roleId),
    portraitGender: name.portraitGender,
    bioLine: `Coverage gap fill — ${persona?.displayTitle ?? roleId} · Hired by ${CO_OWNER_IDENTITY.name} · ${gapLine}`,
  };
}

export function autonomousHireVacantExecutives(opts?: {
  max?: number;
  level?: ExecutiveLevel;
}): AutonomousHireResult[] {
  const max = opts?.max ?? 5;
  const vacant = listVacantExecutiveHats(opts?.level);
  const priority = ['c_suite', 'evp', 'svp', 'vp', 'director'] as ExecutiveLevel[];
  const sorted = [...vacant].sort(
    (a, b) => priority.indexOf(a.level) - priority.indexOf(b.level) || a.title.localeCompare(b.title),
  );
  const results: AutonomousHireResult[] = [];
  for (const hat of sorted.slice(0, max)) {
    const res = executeCoOwnerStaffAction(buildExecutiveHireAction(hat));
    results.push({ ...res, hatId: hat.id, roleId: hat.agentRoleId });
  }
  return results;
}

export function autonomousHireCoverageGaps(opts?: { max?: number }): AutonomousHireResult[] {
  const max = opts?.max ?? 4;
  const gaps = listRoleCoverageGaps(AGENT_PERSONAS.map((p) => p.id));
  const results: AutonomousHireResult[] = [];
  for (const line of gaps.slice(0, max)) {
    const roleId = parseGapRoleId(line);
    if (!roleId) continue;
    const res = executeCoOwnerStaffAction(buildGapHireAction(roleId, line));
    results.push({ ...res, roleId });
  }
  return results;
}

export function autonomousHireAll(opts?: { executiveMax?: number; gapMax?: number }): {
  executives: AutonomousHireResult[];
  gaps: AutonomousHireResult[];
  summary: string;
} {
  const executives = autonomousHireVacantExecutives({ max: opts?.executiveMax ?? 3, level: 'c_suite' });
  const gaps = autonomousHireCoverageGaps({ max: opts?.gapMax ?? 3 });
  const ok = [...executives, ...gaps].filter((r) => r.ok).length;
  const total = executives.length + gaps.length;
  return {
    executives,
    gaps,
    summary:
      total === 0
        ? `${CO_OWNER_IDENTITY.name}: no vacant executive or coverage gaps to fill.`
        : `${CO_OWNER_IDENTITY.name} hired ${ok}/${total} — ${executives.filter((r) => r.ok).length} executive(s), ${gaps.filter((r) => r.ok).length} gap fill(s).`,
  };
}

export function summarizeAutonomousHiringForCoOwner(): string {
  const roster = loadStaffRoster().filter((s) => s.active !== false);
  const ruthHires = roster.filter((s) => s.bioLine?.includes(`Hired by ${CO_OWNER_IDENTITY.name}`));
  const execHires = ruthHires.filter((s) => s.bioLine?.includes('Executive hat:'));
  return [
    `Autonomous hiring: ${ruthHires.length} staff placed by ${CO_OWNER_IDENTITY.name} (${execHires.length} executive hats)`,
    `${listVacantExecutiveHats('c_suite').length} C-suite hats still vacant — run auto_hire_staff`,
    'Ruth hires directly; owner reviews roster at /admin/ops-agent?tab=staff',
  ].join('\n');
}

export function getExecutiveHatForStaff(staffId: string): ExecutiveHat | null {
  const member = loadStaffRoster().find((s) => s.id === staffId);
  if (!member?.bioLine) return null;
  const match = member.bioLine.match(/Executive hat: ([^·]+)/);
  if (!match?.[1]) return null;
  const title = match[1].trim();
  return listVacantExecutiveHats().find((h) => h.title === title) ?? getExecutiveHatById(title) ?? null;
}
