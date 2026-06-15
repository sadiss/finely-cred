import type { AgentPersonaId } from '../domain/agentPersonas';
import type { StaffDepartment } from '../domain/staffMember';
import type { VideoParticipantRole } from '../domain/videoCalls';

export type TeamContact = {
  id: string;
  name: string;
  role: VideoParticipantRole;
  title: string;
  emoji: string;
  staffMemberId?: string;
  personaId?: AgentPersonaId;
  department?: StaffDepartment;
};

/** Legacy generic inbox contacts — kept for older threads. */
export const FINELY_TEAM_CONTACTS_LEGACY: TeamContact[] = [
  { id: 'specialist', name: 'Your credit specialist', role: 'specialist', title: 'Restoration lead', emoji: '🎓' },
  { id: 'case_mgr', name: 'Case manager', role: 'finely_staff', title: 'Finely Cred ops', emoji: '📋' },
  { id: 'disputes', name: 'Disputes analyst', role: 'finely_staff', title: 'Metro2 & rounds', emoji: '⚖️' },
  { id: 'funding', name: 'Funding advisor', role: 'finely_staff', title: 'Business credit lane', emoji: '💼' },
  { id: 'affiliate', name: 'Affiliate partner', role: 'affiliate', title: 'Referral network', emoji: '🤝' },
  { id: 'support', name: 'Support concierge', role: 'finely_staff', title: 'Hub & scheduling', emoji: '💬' },
];

/** @deprecated Prefer listAllTeamContacts() from staffMessagingContacts */
export const FINELY_TEAM_CONTACTS = FINELY_TEAM_CONTACTS_LEGACY;
