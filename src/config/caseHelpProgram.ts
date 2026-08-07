/** Case desk / case-help Role OS config — membership roles, not a new auth enum. */

export const CASE_HELP_MEMBERSHIP_ROLES = ['paralegal', 'attorney', 'consultant'] as const;
export type CaseHelpMembershipRole = (typeof CASE_HELP_MEMBERSHIP_ROLES)[number];

export const CASE_HELP = {
  programName: 'Case Desk',
  hubName: 'Case Help Hub',
  hubPath: '/case-help/hub',
  publicPath: '/careers/case-help',
  guidePath: '/case-desk-guide',
  guideReadPath: '/case-desk-guide/read',
  messagesDeepLink: '/portal/messages?hub=team&topic=case_help',
  /** Hub is available only after admin approval → claim/signup + membership. */
  accessNote: 'Apply first. Hub access opens after admin approval and account claim — not on bare apply.',
} as const;

export function isCaseHelpMembershipRole(role: string | undefined | null): role is CaseHelpMembershipRole {
  return CASE_HELP_MEMBERSHIP_ROLES.includes(String(role || '') as CaseHelpMembershipRole);
}
