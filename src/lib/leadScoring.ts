import type { LeadCapture } from '../domain/leads';

export type LeadScoreBand = 'cold' | 'warm' | 'hot' | 'qualified';

export type LeadScoreResult = {
  score: number;
  band: LeadScoreBand;
  fit: 'credit' | 'debt' | 'business' | 'tradelines' | 'general';
  reasons: string[];
  suggestedAction: string;
  suggestedPersonaId: string;
  suggestedSequenceId: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scoreLead(lead: LeadCapture): LeadScoreResult {
  let score = 40;
  const reasons: string[] = [];
  const interest = `${lead.interest ?? ''} ${lead.offer ?? ''} ${lead.funnelPath ?? ''}`.toLowerCase();

  let fit: LeadScoreResult['fit'] = 'general';
  if (interest.includes('debt') || interest.includes('summons') || interest.includes('collection')) {
    fit = 'debt';
    score += 15;
    reasons.push('Debt lane signal');
  } else if (
    interest.includes('financing_preapproval') ||
    interest.includes('preapproval') ||
    interest.includes('pre-approval') ||
    lead.offer === 'financing_preapproval'
  ) {
    fit = 'credit';
    score += 16;
    reasons.push('Financing pre-approval interest');
  } else if (interest.includes('business') || interest.includes('corporate') || interest.includes('funding')) {
    fit = 'business';
    score += 15;
    reasons.push('Business credit signal');
  } else if (interest.includes('tradeline') || interest.includes('authorized user')) {
    fit = 'tradelines';
    score += 12;
    reasons.push('Tradeline interest');
  } else if (interest.includes('dispute') || interest.includes('restore') || interest.includes('credit')) {
    fit = 'credit';
    score += 12;
    reasons.push('Personal restore signal');
  }

  if (lead.consentEmailMarketing) {
    score += 8;
    reasons.push('Email marketing opt-in');
  }
  if (lead.consentSmsMarketing) {
    score += 6;
    reasons.push('SMS opt-in');
  }
  if (lead.phone?.trim().length >= 10) {
    score += 5;
    reasons.push('Valid phone on file');
  }
  if (lead.referralCode?.trim()) {
    score += 10;
    reasons.push('Referral attributed');
  }
  if (lead.source === 'chat') {
    score += 8;
    reasons.push('Engaged via live chat');
  }
  if (lead.source === 'lead_magnet') {
    score += 6;
    reasons.push('Lead magnet conversion');
  }
  if (interest.includes('meta_lead') || lead.utmSource === 'facebook' || lead.utmMedium === 'lead_ad') {
    score += 12;
    reasons.push('Meta Lead Ad capture');
  }
  if (interest.includes('bulk_import')) {
    score += 3;
    reasons.push('Bulk import — verify enrichment');
  }

  const isSpecialistRecruit =
    interest.includes('credit_specialist') ||
    interest.includes('specialist') ||
    lead.offer === 'credit_specialist_join' ||
    lead.offer === 'credit_specialist_guide' ||
    lead.offer === 'agent_application' ||
    (lead.funnelPath ?? '').includes('credit-specialist');

  if (isSpecialistRecruit) {
    score += 14;
    reasons.push('Credit Specialist recruiting signal');
  }

  score = clamp(score, 0, 100);

  let band: LeadScoreBand = 'cold';
  if (score >= 75) band = 'qualified';
  else if (score >= 58) band = 'hot';
  else if (score >= 45) band = 'warm';

  const suggestedPersonaId = isSpecialistRecruit
    ? 'lead_converter'
    : fit === 'debt'
      ? 'debt_strategist'
      : fit === 'business'
        ? 'funding_strategist'
        : fit === 'tradelines'
          ? 'sales_closer'
          : 'lead_converter';

  const isFinancingPreapproval =
    lead.offer === 'financing_preapproval' ||
    interest.includes('financing_preapproval') ||
    interest.includes('preapproval') ||
    interest.includes('pre-approval');

  const suggestedSequenceId =
    interest.includes('meta_lead') || lead.utmSource === 'facebook' || lead.utmMedium === 'lead_ad'
      ? 'seq_meta_lead'
      : isSpecialistRecruit
        ? 'seq_specialist_apply_funnel'
        : isFinancingPreapproval
          ? 'seq_financing_preapproval'
          : fit === 'debt'
            ? 'seq_debt_funnel'
            : fit === 'business'
              ? 'seq_business_funnel'
              : fit === 'tradelines'
                ? 'seq_tradeline_funnel'
                : 'seq_credit_funnel';

  const suggestedAction = isSpecialistRecruit
    ? band === 'qualified' || band === 'hot'
      ? 'Route to Credit Specialists CRM · confirm 3-lead + 30-day commitment · book activation'
      : 'Enroll specialist nurture · send join / pricing hub'
    : isFinancingPreapproval
      ? band === 'qualified' || band === 'hot'
        ? 'Confirm pre-approval status · book financing readiness consult · route to in-house contract lane'
        : 'Enroll financing pre-approval nurture · send pricing + strategy session'
      : band === 'qualified'
        ? 'Book strategy call + assign sales persona'
        : band === 'hot'
          ? 'Send personalized follow-up + portal trial nudge'
          : band === 'warm'
            ? 'Enroll nurture sequence + share free guide'
            : 'Add to research queue — enrich before outreach';

  return { score, band, fit, reasons, suggestedAction, suggestedPersonaId, suggestedSequenceId };
}

export type LeadKanbanStage = 'new' | 'researching' | 'contacted' | 'replied' | 'qualified' | 'converted';

export function kanbanStageForLead(lead: LeadCapture): LeadKanbanStage {
  const { band } = scoreLead(lead);
  if (band === 'qualified') return 'qualified';
  if (lead.source === 'chat') return 'contacted';
  if (lead.source === 'lead_magnet') return 'replied';
  return 'new';
}

/** Map kanban stage to lead_ops stage (local CRM). */
export function leadOpsStageForLead(lead: LeadCapture): import('../domain/leadOps').LeadStage {
  if (lead.offer === 'enlightenment_session') return 'booked';
  const k = kanbanStageForLead(lead);
  if (k === 'converted') return 'converted';
  if (k === 'qualified') return 'booked';
  if (k === 'contacted' || k === 'replied') return 'contacted';
  return 'new';
}
