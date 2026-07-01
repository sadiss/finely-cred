import { CmoManagedAccount, CmoSocialPlatform } from '../../domain/cmoPhase4';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createManualCmoAccount(input: {
  platform: CmoSocialPlatform;
  label: string;
  handle?: string;
  publicUrl?: string;
  ownerType?: CmoManagedAccount['ownerType'];
  dailyLeadTarget?: number;
  dailyPostTarget?: number;
}): CmoManagedAccount {
  const now = new Date().toISOString();
  return {
    id: id('acct'),
    platform: input.platform,
    label: input.label,
    handle: input.handle,
    publicUrl: input.publicUrl,
    ownerType: input.ownerType ?? 'brand',
    status: input.platform === 'manual' ? 'connected' : 'needs_auth',
    publishMode: 'manual_copy_paste',
    scopes: [],
    healthScore: 70,
    dailyLeadTarget: input.dailyLeadTarget,
    dailyPostTarget: input.dailyPostTarget,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDefaultFinelyAccountPlan(): CmoManagedAccount[] {
  return [
    createManualCmoAccount({ platform: 'instagram', label: 'Finely Cred Instagram', ownerType: 'brand', dailyLeadTarget: 35, dailyPostTarget: 3 }),
    createManualCmoAccount({ platform: 'tiktok', label: 'Finely Cred TikTok', ownerType: 'brand', dailyLeadTarget: 45, dailyPostTarget: 4 }),
    createManualCmoAccount({ platform: 'youtube', label: 'Finely Cred YouTube Shorts', ownerType: 'brand', dailyLeadTarget: 40, dailyPostTarget: 3 }),
    createManualCmoAccount({ platform: 'linkedin', label: 'Finely Cred LinkedIn', ownerType: 'brand', dailyLeadTarget: 25, dailyPostTarget: 2 }),
    createManualCmoAccount({ platform: 'facebook', label: 'Finely Cred Facebook', ownerType: 'brand', dailyLeadTarget: 20, dailyPostTarget: 2 }),
    createManualCmoAccount({ platform: 'email', label: 'Finely Cred Email Nurture', ownerType: 'brand', dailyLeadTarget: 20, dailyPostTarget: 1 }),
    createManualCmoAccount({ platform: 'sms', label: 'Finely Cred SMS Follow-Up', ownerType: 'brand', dailyLeadTarget: 15, dailyPostTarget: 1 }),
  ];
}

export function summarizeCmoAccountTargets(accounts: CmoManagedAccount[]): { dailyLeads: number; dailyPosts: number; connected: number; needsAuth: number } {
  return accounts.reduce(
    (acc, account) => {
      acc.dailyLeads += account.dailyLeadTarget ?? 0;
      acc.dailyPosts += account.dailyPostTarget ?? 0;
      if (account.status === 'connected') acc.connected += 1;
      if (account.status === 'needs_auth') acc.needsAuth += 1;
      return acc;
    },
    { dailyLeads: 0, dailyPosts: 0, connected: 0, needsAuth: 0 },
  );
}
