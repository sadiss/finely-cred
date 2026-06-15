/** Limited-time DIY portal unlock for free-guide leads — locks after expiry unless they upgrade. */

const STORAGE_KEY = 'fc.leadMagnet.trial';
export const LEAD_MAGNET_TRIAL_DAYS = 15;
const TRIAL_DAYS = LEAD_MAGNET_TRIAL_DAYS;

export type LeadMagnetTrialFeatureId =
  | 'diy_portal_trial'
  | 'report_upload_preview'
  | 'ai_checklist'
  | 'dashboard_preview';

export type LeadMagnetTrialState = {
  leadId?: string;
  email?: string;
  startedAt: string;
  expiresAt: string;
  unlockedFeatures: LeadMagnetTrialFeatureId[];
};

export const LEAD_MAGNET_TRIAL_FEATURES: {
  id: LeadMagnetTrialFeatureId;
  label: string;
  locksAfterTrial: boolean;
}[] = [
  { id: 'diy_portal_trial', label: `${LEAD_MAGNET_TRIAL_DAYS}-day DIY portal workspace`, locksAfterTrial: true },
  { id: 'report_upload_preview', label: 'Credit report upload + compare', locksAfterTrial: true },
  { id: 'ai_checklist', label: 'AI restoration checklist', locksAfterTrial: true },
  { id: 'dashboard_preview', label: 'Live restoration dashboard', locksAfterTrial: true },
];

export function startLeadMagnetTrial(args: { leadId?: string; email?: string }): LeadMagnetTrialState {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const state: LeadMagnetTrialState = {
    leadId: args.leadId,
    email: args.email?.trim().toLowerCase(),
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    unlockedFeatures: LEAD_MAGNET_TRIAL_FEATURES.map((f) => f.id),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
  return state;
}

export function getLeadMagnetTrial(): LeadMagnetTrialState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadMagnetTrialState;
  } catch {
    return null;
  }
}

export function isLeadMagnetTrialActive(state?: LeadMagnetTrialState | null): boolean {
  const trial = state ?? getLeadMagnetTrial();
  if (!trial?.expiresAt) return false;
  return Date.parse(trial.expiresAt) > Date.now();
}

export function trialDaysRemaining(state?: LeadMagnetTrialState | null): number {
  const trial = state ?? getLeadMagnetTrial();
  if (!trial?.expiresAt) return 0;
  const ms = Date.parse(trial.expiresAt) - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function isLeadMagnetFeatureUnlocked(featureId: LeadMagnetTrialFeatureId, state?: LeadMagnetTrialState | null): boolean {
  const trial = state ?? getLeadMagnetTrial();
  if (!trial?.unlockedFeatures.includes(featureId)) return false;
  return isLeadMagnetTrialActive(trial);
}

export function formatTrialExpiryLabel(state?: LeadMagnetTrialState | null): string {
  const days = trialDaysRemaining(state);
  if (days <= 0) return 'Trial expired';
  if (days === 1) return '1 day left in your DIY trial';
  return `${days} days left in your DIY trial`;
}
