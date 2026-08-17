/**
 * Staff social presence — maps command-center agents to social accounts.
 * Live posting requires Meta OAuth (/admin/social-hub) + compliance approval.
 */

export type StaffSocialPlatform = 'facebook' | 'instagram' | 'threads' | 'linkedin' | 'tiktok' | 'youtube';

export type StaffSocialAccountStatus =
  | 'not_started'
  | 'profile_drafted'
  | 'page_requested'
  | 'connected'
  | 'posting'
  | 'recruiting';

export type StaffSocialPresence = {
  staffId: string;
  displayName: string;
  title: string;
  /** Primary use: recruit specialists, nurture leads, brand authority, etc. */
  mission: 'recruit' | 'nurture' | 'brand' | 'geo' | 'authority';
  platforms: Partial<Record<StaffSocialPlatform, { handle?: string; status: StaffSocialAccountStatus; pageId?: string }>>;
  bioLine: string;
  disclosureRequired: boolean;
  /** When true, posts sign with this persona name (still needs human/AI disclosure in copy). */
  canPostAsHuman: boolean;
  autopilotEligible: boolean;
  socialHubRoleId?: string;
};

export const STAFF_SOCIAL_PRESENCE: StaffSocialPresence[] = [
  {
    staffId: 'scout_supreme',
    displayName: 'Sienna Roy',
    title: 'Lead Discovery Director',
    mission: 'nurture',
    platforms: {
      linkedin: { handle: '@scoutsupreme.finley', status: 'profile_drafted' },
      instagram: { handle: '@finely.leads', status: 'page_requested' },
    },
    bioLine: 'Finds qualified prospects and explains why they matter — educational credit intel only.',
    disclosureRequired: true,
    canPostAsHuman: false,
    autopilotEligible: true,
    socialHubRoleId: 'lead_converter',
  },
  {
    staffId: 'partner_recruiter',
    displayName: 'Partner Recruiter',
    title: 'Recruiting Director',
    mission: 'recruit',
    platforms: {
      facebook: { handle: 'Finely Partner Recruiting', status: 'profile_drafted' },
      instagram: { handle: '@finely.partners', status: 'profile_drafted' },
      linkedin: { handle: '@finely-partners', status: 'not_started' },
    },
    bioLine: 'Credit specialist, affiliate, and agency partner recruiting — clear paths, no hype.',
    disclosureRequired: true,
    canPostAsHuman: false,
    autopilotEligible: true,
    socialHubRoleId: 'affiliate_specialist',
  },
  {
    staffId: 'tamara_brooks',
    displayName: 'Tamara Brooks',
    title: 'VP Marketing & Brand',
    mission: 'brand',
    platforms: {
      instagram: { handle: '@finelycred', status: 'connected' },
      facebook: { handle: 'Finely Cred', status: 'connected' },
      threads: { handle: '@finelycred', status: 'page_requested' },
    },
    bioLine: 'Human brand lead — premium campaigns with honest credit education.',
    disclosureRequired: true,
    canPostAsHuman: true,
    autopilotEligible: true,
    socialHubRoleId: 'social_creator',
  },
  {
    staffId: 'pr_sentinel',
    displayName: 'PR Sentinel',
    title: 'Authority & Press Director',
    mission: 'authority',
    platforms: {
      linkedin: { handle: '@finelycred', status: 'profile_drafted' },
      facebook: { handle: 'Finely Cred', status: 'connected' },
    },
    bioLine: 'Press angles, interviews, and authority content — no manufactured proof.',
    disclosureRequired: true,
    canPostAsHuman: false,
    autopilotEligible: true,
    socialHubRoleId: 'social_creator',
  },
  {
    staffId: 'geo_commander',
    displayName: 'Geo Commander',
    title: 'City Growth Commander',
    mission: 'geo',
    platforms: {
      facebook: { handle: 'Finely Cred Local', status: 'not_started' },
      instagram: { handle: '@finely.local', status: 'not_started' },
    },
    bioLine: 'City clusters, local proof, and geo funnels — one market at a time.',
    disclosureRequired: true,
    canPostAsHuman: false,
    autopilotEligible: false,
  },
  {
    staffId: 'affiliate_wrangler',
    displayName: 'Affiliate Wrangler',
    title: 'Affiliate Growth Manager',
    mission: 'recruit',
    platforms: {
      instagram: { handle: '@finely.affiliates', status: 'profile_drafted' },
      facebook: { handle: 'Finely Affiliate Desk', status: 'not_started' },
    },
    bioLine: 'Referral loops, bounty campaigns, and partner activation rhythm.',
    disclosureRequired: true,
    canPostAsHuman: false,
    autopilotEligible: true,
    socialHubRoleId: 'affiliate_specialist',
  },
  {
    staffId: 'marcus_sterling',
    displayName: 'Marcus Sterling',
    title: 'Chief Revenue Officer',
    mission: 'nurture',
    platforms: {
      linkedin: { handle: '@marcus.sterling.finely', status: 'profile_drafted' },
    },
    bioLine: 'Revenue ethics, consult quality, and honest forecasting — human executive voice.',
    disclosureRequired: true,
    canPostAsHuman: true,
    autopilotEligible: false,
  },
];

export function getStaffSocialPresence(staffId: string): StaffSocialPresence | undefined {
  return STAFF_SOCIAL_PRESENCE.find((p) => p.staffId === staffId);
}

export function listRecruitingSocialStaff(): StaffSocialPresence[] {
  return STAFF_SOCIAL_PRESENCE.filter((p) => p.mission === 'recruit' || p.mission === 'nurture');
}

export function countConnectedSocialAccounts(): number {
  return STAFF_SOCIAL_PRESENCE.reduce((acc, p) => {
    return acc + Object.values(p.platforms).filter((s) => s?.status === 'connected' || s?.status === 'posting' || s?.status === 'recruiting').length;
  }, 0);
}

export function socialPresenceStatusLabel(status: StaffSocialAccountStatus): string {
  const map: Record<StaffSocialAccountStatus, string> = {
    not_started: 'Not started',
    profile_drafted: 'Profile drafted',
    page_requested: 'Page requested',
    connected: 'Connected',
    posting: 'Posting',
    recruiting: 'Recruiting',
  };
  return map[status];
}
