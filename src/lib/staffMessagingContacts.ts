import { getStaffMemberById, listAllMessageableStaff } from '../data/staffRoster';
import { getAgentPersona } from '../domain/agentPersonas';
import { staffMemberFullName, type StaffDepartment, type StaffMember } from '../domain/staffMember';
import type { VideoParticipantRole } from '../domain/videoCalls';
import { FINELY_TEAM_CONTACTS_LEGACY, type TeamContact } from './teamContacts';

const DEPARTMENT_EMOJI: Record<StaffDepartment, string> = {
  credit_operations: '🎓',
  dispute_processing: '⚖️',
  funding: '💼',
  debt_resolution: '🏛️',
  partner_success: '💬',
  growth_sessions: '🤝',
  marketing: '📣',
  internal_ops: '🛡️',
};

function roleForPersona(personaId: string): VideoParticipantRole {
  if (personaId === 'affiliate_specialist' || personaId === 'social_creator') return 'affiliate';
  if (personaId === 'sales_closer' || personaId === 'lead_converter' || personaId === 'appointment_setter') {
    return 'finely_staff';
  }
  return 'finely_staff';
}

export function staffMemberToTeamContact(staff: StaffMember): TeamContact {
  const persona = getAgentPersona(staff.primaryRoleId);
  return {
    id: staff.id,
    name: staffMemberFullName(staff),
    role: roleForPersona(staff.primaryRoleId),
    title: staff.displayTitle ?? persona?.displayTitle ?? persona?.role ?? staff.bioLine,
    emoji: DEPARTMENT_EMOJI[staff.department] ?? '👤',
    staffMemberId: staff.id,
    personaId: staff.primaryRoleId,
    department: staff.department,
  };
}

/** Resolve legacy inbox ids or staff roster ids to a contact card. */
export function resolveTeamContact(id: string): TeamContact | undefined {
  const legacy = FINELY_TEAM_CONTACTS_LEGACY.find((c) => c.id === id);
  if (legacy) return legacy;
  const staff = getStaffMemberById(id);
  if (staff?.active) return staffMemberToTeamContact(staff);
  return undefined;
}

/** @deprecated use resolveTeamContact */
export function teamContactById(id: string): TeamContact | undefined {
  return resolveTeamContact(id);
}

/** Every active roster member partners can message directly. */
export function listAllTeamContacts(): TeamContact[] {
  return listAllMessageableStaff().map(staffMemberToTeamContact);
}

export function departmentLabel(dept: StaffDepartment): string {
  const labels: Record<StaffDepartment, string> = {
    credit_operations: 'Credit ops',
    dispute_processing: 'Disputes',
    funding: 'Funding',
    debt_resolution: 'Debt',
    partner_success: 'Partner success',
    growth_sessions: 'Sales & sessions',
    marketing: 'Marketing',
    internal_ops: 'Internal ops',
  };
  return labels[dept] ?? dept;
}
