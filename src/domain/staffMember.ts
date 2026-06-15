import type { AgentPersonaId } from './agentPersonas';

export type StaffDepartment =
  | 'credit_operations'
  | 'dispute_processing'
  | 'funding'
  | 'debt_resolution'
  | 'partner_success'
  | 'growth_sessions'
  | 'marketing'
  | 'internal_ops';

export type StaffShiftBlock = {
  days: number[];
  startHour: number;
  endHour: number;
};

export type PortraitGender = 'feminine' | 'masculine' | 'neutral';

export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  primaryRoleId: AgentPersonaId;
  department: StaffDepartment;
  displayTitle?: string;
  /** Legacy PNG path or custom URL — shared role PNGs are replaced by deterministic portraits. */
  avatarPath: string;
  /** Drives unique silhouette in generated portrait SVG. */
  portraitGender: PortraitGender;
  bioLine: string;
  shiftBlocks: StaffShiftBlock[];
  active: boolean;
};

export function staffMemberFullName(m: StaffMember): string {
  return `${m.firstName} ${m.lastName}`.trim();
}
