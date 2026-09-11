/** Client-side provider routing — server ai-gateway picks model tier from taskType. */

export type AiProviderHint = 'openai' | 'gemini' | 'anthropic' | 'groq';

function isPartnerPiiChat(t: string): boolean {
  return (
    t.includes('portal_chat') ||
    t.includes('partner_workspace') ||
    t.includes('letter_draft') ||
    t.includes('legal_debt') ||
    t.includes('public_chat') ||
    t.includes('public_concierge')
  );
}

function isMarketingDraft(t: string): boolean {
  return (
    t.includes('social') ||
    t.includes('caption') ||
    t.includes('copy') ||
    t.includes('content') ||
    t.includes('marketing') ||
    t.includes('cmo') ||
    t.includes('esther') ||
    t.includes('lydia') ||
    t.includes('community') ||
    t.includes('course_outline') ||
    t.includes('lesson_script')
  );
}

export function resolveAiProviderHint(taskType: string, explicit?: AiProviderHint): AiProviderHint {
  if (explicit) return explicit;
  const t = (taskType || '').toLowerCase();
  if (isPartnerPiiChat(t)) return 'openai';
  if (t.includes('coowner') || t.includes('ops.coowner') || t.includes('ops.agent')) return 'anthropic';
  if (isMarketingDraft(t)) return 'gemini';
  if (
    t.includes('lead_intel') ||
    t.includes('doc') ||
    t.includes('extract') ||
    t.includes('classify') ||
    t.includes('vision') ||
    t.includes('ocr')
  ) {
    return 'gemini';
  }
  if (t.includes('legal') || t.includes('compliance') || t.includes('policy') || t.includes('admin_ops')) {
    return 'anthropic';
  }
  return 'openai';
}
