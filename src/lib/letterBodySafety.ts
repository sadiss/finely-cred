/**
 * Letter body safety — keep mailed/PDF letter content free of:
 * - Spoken educational disclaimers ("not legal advice", "results vary", …)
 * - Coach / admin / journey instructions ("Step 1", "Ask Finely", "Build this", …)
 * - Partner email / Finely-branded emails / login emails
 * - SSN, DOB, driver's license, bank account, passwords
 *
 * UI chrome may still show compliance footnotes and guided steps outside the letter paper.
 */

const DISCLAIMER_LINE_RE =
  /^\s*(?:[-*•]\s*)?(?:EDUCATIONAL(?:\s+USE|\s+SELF-HELP|\s+REFERENCE|\s+ONLY)?|Educational(?:\s+use|\s+self-help|\s+reference|\s+only)?).*$/im;

const DISCLAIMER_PHRASE_RE =
  /\(?\s*(?:Educational(?:\s+self-help|\s+reference|\s+use|\s+only)?|EDUCATIONAL(?:\s+USE|\s+SELF-HELP|\s+REFERENCE|\s+ONLY)?)\s*[·\-|,]?\s*(?:not\s+legal\s+advice|NOT\s+LEGAL\s+ADVICE).*?(?:results\s+vary)?\.?\s*\)?/gi;

const NOT_LEGAL_ADVICE_LINE_RE =
  /^\s*.*\b(?:not\s+legal\s+advice|NOT\s+LEGAL\s+ADVICE)\b.*$/gim;

const RESULTS_VARY_LINE_RE = /^\s*.*\bresults\s+vary\b.*$/gim;

const EMAIL_LINE_RE =
  /^\s*(?:E-?mail(?:\s+Address)?|Email)\s*[:=]\s*\S+@\S+\s*$/gim;

const ANY_EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const FINELY_EMAIL_RE = /\b[A-Z0-9._%+-]+@(?:finelycred\.com|finely\.local|finelycred\.local)\b/gi;

const SSN_RE =
  /\b(?:SSN|Social\s*Security(?:\s*Number)?)\s*[:=]?\s*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b|\b\d{3}-\d{2}-\d{4}\b/gi;

const DOB_RE =
  /\b(?:DOB|Date\s*of\s*Birth|Birth\s*Date)\s*[:=]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi;

const DL_RE =
  /\b(?:Driver'?s?\s*License|DL\s*#?|State\s*ID)\s*[:=]?\s*[A-Z0-9\-]{5,20}\b/gi;

const BANK_ACCT_RE =
  /\b(?:Bank\s*Account|Routing|Account\s*Number)\s*[:=]?\s*\d{6,17}\b/gi;

const PASSWORD_RE = /\b(?:Password|Passcode|Temp(?:orary)?\s*Password)\s*[:=]\s*\S+/gi;

const EMAIL_ABOVE_RE =
  /You may send electronically to my email address above or mail the information to me at my home address also listed above\./gi;

/** Finely Cred / vendor letterhead lines — never on partner-facing mailed letters. */
const FINELY_BRAND_LINE_RE =
  /^\s*.*\b(?:FINELY CRED|Finely Cred|FinelyCred)\b.*$/gim;

const EDUCATIONAL_WORKFLOW_LINE_RE =
  /^\s*.*\b(?:Educational workflow|educational workflow)\b.*$/gim;

const GENERATED_INTERNAL_LINE_RE =
  /^\s*.*\bGenerated for internal dispute workflow\b.*$/gim;

const EDUCATIONAL_DRAFT_FOOTER_LINE_RE =
  /^\s*.*\bEducational draft(?: only)?\.?\s*(?:Review with a licensed attorney|Review with a licensed attorney\/qualified professional).*$/gim;

const VERIFY_BEFORE_MAILING_LINE_RE =
  /^\s*.*\bVerify facts before mailing(?: or submission)?\.?\s*$/gim;

const FINELY_BRAND_INLINE_RE =
  /\b(?:FINELY CRED|Finely Cred|FinelyCred)\s*[•·\-|,]\s*(?:Educational workflow document|Educational draft|Educational reference only)[^.\n]*/gi;

const SIGNATURE_CLOSING_RE = /^(Sincerely,|Thank you,|Regards,|Respectfully,)$/im;

/** True when body looks like hearing-kit / playbook guidance rather than a mailed letter. */
export function isHearingKitGuidanceBody(text: string): boolean {
  const t = String(text || '');
  return (
    /COURT-DAY (?:PREP )?KIT/i.test(t) ||
    (/^OPENING \(30/im.test(t) && /WITNESS QUESTIONS/i.test(t) && /OBJECTION PHRASES/i.test(t))
  );
}

/** Court-day prep kit is hearing guidance in UI — never a mailed/vault letter body. */
export function isCourtDayKitId(id?: string | null): boolean {
  const s = String(id || '').trim().toLowerCase();
  return s === 'courtroom_day_kit' || s === 'court_courtroom_day_kit' || s.endsWith('_courtroom_day_kit');
}

/** True when an email looks Finely-invented / brand login — never put on letters or partner profiles. */
export function isSyntheticFinelyEmail(email?: string | null): boolean {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  return /@(?:finelycred\.com|finely\.local|finelycred\.local)$/i.test(e) || /roosevelt\.corelus\.court@/i.test(e);
}

/**
 * Partner profile email for CRM/login only.
 * Never invent Finely-branded addresses; leave empty when missing or synthetic.
 */
export function safePartnerContactEmail(email?: string | null): string | undefined {
  const e = String(email || '').trim();
  if (!e) return undefined;
  if (isSyntheticFinelyEmail(e)) return undefined;
  return e;
}

function scrubCoachAndMetaProse(text: string): string {
  let out = text;

  // Integrity coach preamble that used to leak into court packs
  out = out.replace(
    /Delete any statement that is not truthful\.\s*Do not deny an account, transaction, signature, payment, or communication you know is genuine\.\s*Do not sign anything containing facts you cannot honestly state\.\s*/gi,
    '',
  );

  // Coach / editor instructions that must never print on paper
  out = out.replace(
    /Edit every admission to match Defendant'?s honest knowledge and local rules\.\s*/gi,
    '',
  );
  out = out.replace(/Delete any sentence that is not truthful\.\s*/gi, '');
  out = out.replace(
    /\(Assert only those that apply in your jurisdiction and facts\.\s*Strike those that do not\.\)\s*/gi,
    '',
  );
  out = out.replace(/\(EDIT TO MATCH HONEST KNOWLEDGE\)\s*/gi, '');
  out = out.replace(/SPECIFIC RESPONSES\s*\(EDIT TO MATCH HONEST KNOWLEDGE\)/gi, 'SPECIFIC RESPONSES');

  // Catalog teaching blocks that must not appear in mailables
  out = out.replace(/\nKEY PRINCIPLE\n[\s\S]*?(?=\n(?:WHEN THIS LETTER APPLIES|APPLICABLE LAW|DEMANDS AND REQUESTS|PRESERVATION OF RIGHTS)\n)/gi, '\n');
  out = out.replace(/\nWHEN THIS LETTER APPLIES\n[\s\S]*?(?=\n(?:APPLICABLE LAW|DEMANDS AND REQUESTS|PRESERVATION OF RIGHTS)\n)/gi, '\n');
  out = out.replace(/APPLICABLE LAW \(verify in your jurisdiction(?:\s*[—\-]\s*educational reference only)?\)/gi, 'APPLICABLE LAW');

  // Journey / product meta lines
  out = out.replace(/^\s*(?:Step\s*\d+\s*[-—:].*|Ask Finely.*|Build this(?:\s+letter)?(?:\s+next)?.*)\s*$/gim, '');
  out = out.replace(/\bAsk Finely\b/gi, '');
  out = out.replace(/\bBuild this letter next\b/gi, '');
  out = out.replace(/^\s*(?:ADMIN(?:ISTRATIVE)?\s*NOTE|INTERNAL NOTE|EDITOR NOTE)\s*[:=].*$/gim, '');
  out = out.replace(/^\s*What to do next\s*[:=].*$/gim, '');
  out = out.replace(/NOTE:\s*This is an educational outline[\s\S]*?filing fee\.\s*/gi, '');
  out = out.replace(/──\s*WHAT NOT TO SAY\s*──[\s\S]*?(?=──\s*WHAT TO SAY\s*──|Respectfully|$)/gi, '');
  out = out.replace(/──\s*WHAT TO SAY\s*──[\s\S]*?(?=Respectfully|$)/gi, '');
  out = out.replace(/✗\s*Do not [^\n]+\n?/gi, '');
  out = out.replace(/✓\s*"[^"]+"\n?/gi, '');

  // Hearing-kit blocks if they leaked into a draft (kit is UI-only)
  if (isHearingKitGuidanceBody(out)) {
    out = '';
  }

  return out;
}

function scrubVendorBrandingProse(text: string): string {
  let out = text;
  out = out.replace(FINELY_BRAND_LINE_RE, '');
  out = out.replace(EDUCATIONAL_WORKFLOW_LINE_RE, '');
  out = out.replace(GENERATED_INTERNAL_LINE_RE, '');
  out = out.replace(EDUCATIONAL_DRAFT_FOOTER_LINE_RE, '');
  out = out.replace(VERIFY_BEFORE_MAILING_LINE_RE, '');
  out = out.replace(FINELY_BRAND_INLINE_RE, '');
  out = out.replace(
    /^\s*.*\b(?:Educational reference only|educational reference only)\b.*$/gim,
    '',
  );
  out = out.replace(
    /^\s*.*\b(?:Educational self-help|EDUCATIONAL SELF-HELP)\b.*$/gim,
    '',
  );
  out = out.replace(
    /^\s*.*\bfunding subject to underwriting\b.*$/gim,
    '',
  );
  return out;
}

/** Ensure "Sincerely," then blank line then signature name in plain text. */
export function normalizeLetterSignatureSpacing(text: string): string {
  const lines = String(text || '').split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    out.push(line);
    if (SIGNATURE_CLOSING_RE.test(line.trim())) {
      const next = (lines[i + 1] ?? '').trim();
      const afterNext = (lines[i + 2] ?? '').trim();
      if (next && !SIGNATURE_CLOSING_RE.test(next) && !afterNext) {
        out.push('');
      }
    }
  }
  return out.join('\n');
}

/** Ensure "Sincerely," then blank line then signature name in HTML. */
export function normalizeLetterSignatureSpacingHtml(html: string): string {
  let out = String(html || '');
  out = out.replace(
    /(Sincerely,|Thank you,|Regards,|Respectfully,)(\s*(?:<br\s*\/?>\s*)+)(?!<br\s*\/?>)/gi,
    '$1<br/><br/>',
  );
  out = out.replace(
    /(Sincerely,|Thank you,|Regards,|Respectfully,)\s*<\/p>\s*<p>\s*(?!<br)/gi,
    '$1</p><p><br/></p><p>',
  );
  return out;
}

/**
 * Strip Finely Cred branding, letterheads, and educational footers from plain-text letter bodies.
 * Call before save, PDF generation, and paper preview.
 */
export function stripLetterVendorBranding(text: string): string {
  let out = scrubLetterBodyForMail(text);
  out = scrubVendorBrandingProse(out);
  out = normalizeLetterSignatureSpacing(out);
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

/**
 * Strip Finely Cred branding, letterheads, and educational footers from HTML letter bodies.
 */
export function stripLetterVendorBrandingHtml(html: string): string {
  let out = scrubLetterHtmlForMail(html);
  out = out.replace(/<div[^>]*>\s*(?:FINELY CRED|Finely Cred|FinelyCred)\s*<\/div>/gi, '');
  out = out.replace(FINELY_BRAND_INLINE_RE, '');
  out = out.replace(
    /<div[^>]*>\s*[^<]*(?:Educational draft|Educational workflow|Generated for internal dispute workflow)[^<]*<\/div>/gi,
    '',
  );
  out = out.replace(
    /<p[^>]*>\s*[^<]*(?:Educational draft|Educational workflow|Generated for internal dispute workflow|not legal advice)[^<]*<\/p>/gi,
    (block) => (/I do not waive|reserve all rights|Defendant does not waive/i.test(block) ? block : ''),
  );
  out = normalizeLetterSignatureSpacingHtml(out);
  return out.trim();
}

/**
 * Scrub letter plain text before PDF / mail / draft HTML conversion.
 * Does not invent content — only removes unsafe / instructional lines and phrases.
 */
export function scrubLetterBodyForMail(text: string): string {
  let out = String(text || '');

  // Drop whole disclaimer lines first
  out = out.replace(DISCLAIMER_LINE_RE, '');
  out = out.replace(NOT_LEGAL_ADVICE_LINE_RE, (line) => {
    // Keep operational sentences that mention rights without spoken disclaimer footers
    if (/I do not waive|Defendant does not waive|reserve all rights/i.test(line) && !/educational/i.test(line)) {
      return line.replace(/\b(?:not\s+legal\s+advice|educational(?:\s+\w+)*)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    }
    return '';
  });
  out = out.replace(RESULTS_VARY_LINE_RE, (line) => (/reserve|rights|demand/i.test(line) ? line : ''));
  out = out.replace(DISCLAIMER_PHRASE_RE, '');

  // Spoken integrity / educational blocks (never rewrite into coach copy)
  out = out.replace(
    /EDUCATIONAL USE ONLY\s*[—\-]\s*NOT LEGAL ADVICE[\s\S]*?Results vary\.\s*/gi,
    '',
  );
  out = out.replace(
    /This Answer is educational in form and must be edited to match Defendant's honest knowledge and local rules\.\s*/gi,
    '',
  );
  out = out.replace(
    /This letter is educational consumer advocacy under the Fair Credit Reporting Act\.\s*It is not legal advice and does not create an attorney-client relationship\.\s*/gi,
    '',
  );
  out = out.replace(/\(?Educational self-help\s*[·\-|,]\s*not legal advice\s*[·\-|,]\s*results vary\)?\s*/gi, '');

  out = scrubCoachAndMetaProse(out);

  // Never print email / sensitive IDs on the letter page
  out = out.replace(EMAIL_LINE_RE, '');
  out = out.replace(/^\s*Email Address:\s*.*$/gim, '');
  out = out.replace(FINELY_EMAIL_RE, '');
  out = out.replace(ANY_EMAIL_RE, '');
  out = out.replace(EMAIL_ABOVE_RE, 'Please mail the information to me at my home address listed above.');
  out = out.replace(SSN_RE, '[REDACTED]');
  out = out.replace(DOB_RE, '[REDACTED]');
  out = out.replace(DL_RE, '[REDACTED]');
  out = out.replace(BANK_ACCT_RE, '[REDACTED]');
  out = out.replace(PASSWORD_RE, '[REDACTED]');

  // Collapse excess blank lines from removals
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

/** Strip email from HTML letter drafts (safety net after plainTextToHtml). */
export function scrubLetterHtmlForMail(html: string): string {
  const plainish = stripLetterVendorBranding(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  );
  let out = String(html || '');
  out = out.replace(FINELY_EMAIL_RE, '');
  out = out.replace(ANY_EMAIL_RE, '');
  out = out.replace(DISCLAIMER_PHRASE_RE, '');
  out = out.replace(FINELY_BRAND_INLINE_RE, '');
  out = out.replace(/Email:\s*[^<\n]+/gi, '');
  out = out.replace(/Email Address:\s*[^<\n]+/gi, '');
  void plainish;
  return out;
}
