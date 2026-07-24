/**
 * Letter body safety — keep mailed/PDF letter content free of:
 * - Spoken educational disclaimers ("not legal advice", "results vary", …)
 * - Partner email / Finely-branded emails / login emails
 * - SSN, DOB, driver's license, bank account, passwords
 *
 * UI chrome may still show compliance footnotes outside the letter paper.
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

/**
 * Scrub letter plain text before PDF / mail / draft HTML conversion.
 * Does not invent content — only removes unsafe lines/phrases.
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

  // Spoken integrity preamble block (courtroom pack)
  out = out.replace(
    /EDUCATIONAL USE ONLY\s*[—\-]\s*NOT LEGAL ADVICE[\s\S]*?Results vary\.\s*/gi,
    '',
  );
  out = out.replace(
    /This Answer is educational in form and must be edited to match Defendant's honest knowledge and local rules\.\s*/gi,
    'Edit every admission to match Defendant\'s honest knowledge and local rules. ',
  );
  out = out.replace(
    /This letter is educational consumer advocacy under the Fair Credit Reporting Act\.\s*It is not legal advice and does not create an attorney-client relationship\.\s*/gi,
    '',
  );
  out = out.replace(/\(?Educational self-help\s*[·\-|,]\s*not legal advice\s*[·\-|,]\s*results vary\)?\s*/gi, '');
  out = out.replace(/APPLICABLE LAW \(verify in your jurisdiction\s*[—\-]\s*educational reference only\)/gi, 'APPLICABLE LAW (verify in your jurisdiction)');

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
  const plainish = scrubLetterBodyForMail(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  );
  // Prefer scrubbing the HTML string in place for common patterns
  let out = String(html || '');
  out = out.replace(FINELY_EMAIL_RE, '');
  out = out.replace(ANY_EMAIL_RE, '');
  out = out.replace(DISCLAIMER_PHRASE_RE, '');
  out = out.replace(/Email:\s*[^<\n]+/gi, '');
  out = out.replace(/Email Address:\s*[^<\n]+/gi, '');
  void plainish;
  return out;
}
