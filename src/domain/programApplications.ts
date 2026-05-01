export type ProgramApplicationKind = 'affiliate' | 'agent';
export type ProgramApplicationStatus = 'new' | 'reviewing' | 'approved' | 'rejected';

export type ProgramApplication = {
  id: string;
  kind: ProgramApplicationKind;
  status: ProgramApplicationStatus;

  fullName: string;
  email: string;
  phone?: string;

  companyName?: string;
  roleTitle?: string;
  website?: string;
  socials?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    other?: string;
  };

  audienceSize?: number;
  monthlyLeadsEstimate?: number;
  niche?: string;
  regionsServed?: string;

  referralCode?: string;
  payoutPreference?: 'stripe' | 'paypal' | 'zelle' | 'cash_app' | 'other' | string;
  payoutHandle?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

