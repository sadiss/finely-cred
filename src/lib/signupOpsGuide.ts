/** Admin-facing signup, password, and email delivery reference. */

export type SignupRoleId = 'client' | 'au_seller' | 'agent' | 'affiliate' | 'admin';

export type SignupRoleGuide = {
  id: SignupRoleId;
  label: string;
  signupPath: string;
  postAuthHome: string;
  passwordSetup: string;
  welcomeEmail: string;
  adminReset: string;
};

export const SIGNUP_ROLE_GUIDES: SignupRoleGuide[] = [
  {
    id: 'client',
    label: 'Client / Partner',
    signupPath: '/signup or /onboarding → role Client → Profile & account',
    postAuthHome: '/portal/dashboard',
    passwordSetup:
      'User chooses their own password on the final Profile & account step (min 8 chars). No auto-generated password.',
    welcomeEmail:
      'Finely welcome email sends after partner record is created if Admin → Settings → Comms delivery is ON and SendGrid is configured.',
    adminReset:
      'Partner detail → Access & auth → Send password reset email. User receives Supabase reset link to set a new password.',
  },
  {
    id: 'au_seller',
    label: 'AU Seller',
    signupPath: '/signup?role=au_seller or Career → AU Seller',
    postAuthHome: '/au-seller/hub',
    passwordSetup: 'Same self-chosen password on Profile & account step.',
    welcomeEmail: 'Lane-specific AU seller welcome + seq_au_seller_onboard nurture when comms delivery is ON.',
    adminReset: 'Partner detail → Access & auth → Send password reset email.',
  },
  {
    id: 'agent',
    label: 'Credit Specialist (Agent)',
    signupPath: '/signup?role=agent',
    postAuthHome: '/agent/hub',
    passwordSetup: 'Self-chosen password on Profile & account step.',
    welcomeEmail: 'Specialist welcome + seq_specialist_apply_funnel when comms delivery is ON.',
    adminReset: 'Partner detail → Access & auth → Send password reset email.',
  },
  {
    id: 'affiliate',
    label: 'Affiliate',
    signupPath: '/signup?role=affiliate or /affiliate',
    postAuthHome: '/affiliate/hub',
    passwordSetup: 'Self-chosen password on Profile & account step.',
    welcomeEmail: 'Affiliate welcome + seq_affiliate_funnel when comms delivery is ON.',
    adminReset: 'Partner detail → Access & auth → Send password reset email.',
  },
  {
    id: 'admin',
    label: 'Admin / Team',
    signupPath: 'Admin → Team & Roles invite, or pre-seeded admin_emails + first login',
    postAuthHome: '/dashboard',
    passwordSetup:
      'If invited via Team & Roles, user sets password on first signup. Platform admins use forgot-password if needed.',
    welcomeEmail: 'No partner welcome email — admin/staff use dashboard access.',
    adminReset: 'Team member uses /forgot-password, or another admin sends reset from partner/access panel if linked.',
  },
];

export function landingPathForRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === 'affiliate') return '/affiliate/hub';
  if (r === 'au_seller') return '/au-seller/hub';
  if (r === 'agent') return '/agent/hub';
  if (r === 'admin') return '/dashboard';
  return '/portal/dashboard';
}

export function signupSummaryForRole(role: string): SignupRoleGuide | undefined {
  const r = role.trim().toLowerCase() as SignupRoleId;
  return SIGNUP_ROLE_GUIDES.find((g) => g.id === r) ?? SIGNUP_ROLE_GUIDES.find((g) => g.id === 'client');
}
