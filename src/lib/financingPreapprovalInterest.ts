/**
 * In-house financing pre-approval interest — intent tracking + optional lead capture.
 * Opens the external pre-approval application (SSOT URL from denefitsProgram).
 */
import {
  FINANCING_PREAPPROVAL_OFFER_ID,
  FINANCING_PREAPPROVAL_PUBLIC,
  FINANCING_PREAPPROVAL_URL,
} from '../config/denefitsProgram';
import { submitLeadCapture } from '../data/leadsRepo';
import type { LeadCapture, LeadOffer, LeadSource } from '../domain/leads';
import { emitPlatformEvent } from '../domain/platformEvents';
import { getLeadAttribution } from './leadAttribution';

const INTENT_KEY = 'finely.financing_preapproval_intent.v1';

export type FinancingPreapprovalIntent = {
  offer: typeof FINANCING_PREAPPROVAL_OFFER_ID;
  source: LeadSource | string;
  funnelPath?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  leadId?: string;
  openedApplication: boolean;
  createdAt: string;
};

export function getFinancingPreapprovalUrl(): string {
  return FINANCING_PREAPPROVAL_URL;
}

export function openFinancingPreapprovalApplication(): void {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = FINANCING_PREAPPROVAL_URL;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

function saveIntent(intent: FinancingPreapprovalIntent) {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
  } catch {
    // ignore quota / private mode
  }
}

export function loadFinancingPreapprovalIntent(): FinancingPreapprovalIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinancingPreapprovalIntent;
  } catch {
    return null;
  }
}

export type StartFinancingPreapprovalArgs = {
  source?: LeadSource;
  funnelPath?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  consentToContact?: boolean;
  /** When false, only track intent (still opens URL by default). */
  openApplication?: boolean;
  /** When true and contact + consent present, create a lead capture. */
  captureLead?: boolean;
};

export type StartFinancingPreapprovalResult = {
  intent: FinancingPreapprovalIntent;
  lead?: LeadCapture;
  openedApplication: boolean;
};

/**
 * Track pre-approval interest, optionally capture a lead, and open the application.
 */
export async function startFinancingPreapprovalInterest(
  args: StartFinancingPreapprovalArgs = {},
): Promise<StartFinancingPreapprovalResult> {
  const source = args.source ?? 'lead_magnet';
  const funnelPath = args.funnelPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const openApplication = args.openApplication !== false;
  const attr = getLeadAttribution();

  let lead: LeadCapture | undefined;
  const email = (args.email ?? '').trim();
  const fullName = (args.fullName ?? '').trim();
  const phone = (args.phone ?? '').trim();
  const shouldCapture =
    args.captureLead !== false && Boolean(email && fullName && args.consentToContact);

  if (shouldCapture) {
    const result = await submitLeadCapture({
      source,
      offer: FINANCING_PREAPPROVAL_OFFER_ID as LeadOffer,
      interest: FINANCING_PREAPPROVAL_PUBLIC.interestTag,
      fullName,
      email,
      phone,
      consentToContact: true,
      referralCode: attr?.referralCode,
      promoterRole: attr?.promoterRole,
      promoType: attr?.promoType,
      promoAsset: attr?.promoAsset,
      utmSource: attr?.utmSource ?? 'homepage',
      utmMedium: attr?.utmMedium ?? 'financing_preapproval',
      utmCampaign: attr?.utmCampaign ?? FINANCING_PREAPPROVAL_OFFER_ID,
      funnelPath,
      funnelId: FINANCING_PREAPPROVAL_OFFER_ID,
      goal: 'credit',
      giveawayStack: ['In-house financing pre-approval'],
    });
    lead = result.lead;
  }

  const intent: FinancingPreapprovalIntent = {
    offer: FINANCING_PREAPPROVAL_OFFER_ID,
    source,
    funnelPath,
    fullName: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    leadId: lead?.id,
    openedApplication: openApplication,
    createdAt: new Date().toISOString(),
  };
  saveIntent(intent);

  emitPlatformEvent({
    type: 'funnel.step_completed',
    tenantId: 'default',
    entityType: 'financing_preapproval',
    entityId: FINANCING_PREAPPROVAL_OFFER_ID,
    leadId: lead?.id,
    payload: {
      offer: FINANCING_PREAPPROVAL_OFFER_ID,
      source,
      funnelPath,
      openedApplication: openApplication,
      capturedLead: Boolean(lead),
    },
  });

  if (openApplication) openFinancingPreapprovalApplication();

  return { intent, lead, openedApplication: openApplication };
}
