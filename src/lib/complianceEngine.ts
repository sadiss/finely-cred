/** Educational-only guards for AI, chat, letters, and voice (Phase 38). */

export const EDUCATIONAL_DISCLAIMER =
  'Educational only — not legal advice. Verify compliance and local rules before you act.';

export const AI_CHAT_FOOTER =
  'Finely AI provides educational guidance only. For legal advice, consult a licensed attorney.';

export function appendEducationalDisclaimer(text: string, opts?: { force?: boolean }): string {
  const t = text.trim();
  if (!opts?.force && /educational only|not legal advice/i.test(t)) return t;
  return `${t}\n\n${EDUCATIONAL_DISCLAIMER}`;
}

export function guardAiChatOutput(text: string): string {
  let out = text.trim();
  if (/guarantee|100% removal|delete every negative/i.test(out)) {
    out = out.replace(/\bguarantee\b/gi, 'may help with');
    out = out.replace(/100% removal/gi, 'potential improvement');
  }
  return appendEducationalDisclaimer(out);
}

/** Sanitize dispute letter / PDF body before client delivery (Phase 38). */
export function guardLetterOutput(text: string): string {
  let out = text.trim();
  out = out.replace(/\b(guarantee|guaranteed)\b/gi, 'may request');
  out = out.replace(/\b(will delete|must delete)\b/gi, 'request deletion of');
  if (/you are a lawyer|legal advice/i.test(out) && !/not legal advice/i.test(out)) {
    out = `${out}\n\n${EDUCATIONAL_DISCLAIMER}`;
  }
  return appendEducationalDisclaimer(out);
}

export function complianceBlockForJurisdiction(state?: string): string {
  const st = (state ?? '').trim().toUpperCase();
  if (!st) return EDUCATIONAL_DISCLAIMER;
  return `${EDUCATIONAL_DISCLAIMER} Jurisdiction note: confirm ${st} procedures with counsel.`;
}

/** Sanitize free-guide / PDF bullet text before render (Phase 38). */
export function guardPdfBodyText(text: string): string {
  let out = text.trim();
  out = out.replace(/\b(guarantee|guaranteed)\b/gi, 'may request');
  out = out.replace(/\b(will delete|must delete)\b/gi, 'request deletion of');
  out = out.replace(/\b100% removal\b/gi, 'potential improvement');
  return out;
}

/** Sanitize TTS / voice script before render (Phase 38). */
export function guardVoiceScript(text: string): string {
  let out = text.trim();
  out = out.replace(/\b(guarantee|guaranteed)\b/gi, 'may help with');
  out = out.replace(/\b100% removal\b/gi, 'potential improvement');
  out = out.replace(/\b(will delete|must delete)\b/gi, 'request deletion of');
  if (!/educational only|not legal advice/i.test(out)) {
    out = `${out}\n\n${EDUCATIONAL_DISCLAIMER}`;
  }
  return out;
}

export function pdfDisclaimerFooter(state?: string): string {
  return complianceBlockForJurisdiction(state);
}
