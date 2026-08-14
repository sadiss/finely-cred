/**
 * Shared validation-request clauses — first-draft defaults + intro word variants.
 */

/** Appended before the closing signature on validation_request (Round 1). */
export const VALIDATION_30_DAY_RECEIPT_BLOCK = `You have thirty (30) days from receipt of this letter to provide this validation. Until you do:

You must cease all collection activity on this account, including phone calls, letters, and any attempt to collect.
You may not report, or continue reporting, this account to any credit bureau under 15 U.S.C. § 1681s-2(a)(3).
You may not sell, transfer, or place this account with another agency or attorney.
If validation is not provided within this 30-day window, you are required by law to cease all further collection efforts and, if reported, must request deletion of this account from all consumer reporting agencies. Continued collection activity or credit reporting without proper validation will be treated as a violation of the FDCPA and FCRA, and I reserve the right to pursue all available remedies, including filing complaints with the CFPB and my state Attorney General, and pursuing statutory damages.`;

/** Stable legal tail — identical across intro variants. */
const VALIDATION_INTRO_LEGAL_TAIL =
  'Please refrain from contacting me by any form of communication unless and until you provide complete proof and a proper written response to every question stated below, as required by the laws cited for the alleged debt you say I owe. Under 15 U.S.C. § 1692g(a)-(b), I am exercising my right to request validation, and I request that you cease collection activity until you mail proper validation.';

/** Opening clause only — minor wording shifts; critical cites and demands stay. */
export const VALIDATION_INTRO_OPENERS: readonly string[] = [
  'I am writing in response to your communication regarding an alleged debt.',
  'This letter responds to your communication concerning an alleged debt.',
  'I write regarding your communication about an alleged debt.',
  'I am responding to your written communication regarding an alleged debt.',
  'Your communication concerns an alleged debt, and I am exercising my validation rights in writing.',
  'I received your communication regarding an alleged debt and respond in writing as follows.',
] as const;

export const VALIDATION_INTRO_VARIANT_COUNT = VALIDATION_INTRO_OPENERS.length;

export function validationIntroParagraph(variantIndex = 0): string {
  const idx = ((variantIndex % VALIDATION_INTRO_OPENERS.length) + VALIDATION_INTRO_OPENERS.length) % VALIDATION_INTRO_OPENERS.length;
  return `${VALIDATION_INTRO_OPENERS[idx]} ${VALIDATION_INTRO_LEGAL_TAIL}`;
}

const INTRO_SECTION_START = 'To Whom It May Concern:';
const INTRO_SECTION_END = 'This request is not a refusal to pay';

const THIRTY_DAY_MARKER = 'You have thirty (30) days from receipt of this letter';

/** Insert the 30-day block before Sincerely when missing (vault / legacy drafts). */
export function ensureValidation30DayBlockInBody(plainBody: string): string {
  const plain = plainBody.replace(/\r\n/g, '\n');
  if (plain.includes(THIRTY_DAY_MARKER)) return plain;
  const match = plain.match(/\n(Sincerely,?\n)/i);
  if (!match || match.index == null) {
    return `${plain.trim()}\n\n${VALIDATION_30_DAY_RECEIPT_BLOCK}`;
  }
  const idx = match.index;
  return `${plain.slice(0, idx).trim()}\n\n${VALIDATION_30_DAY_RECEIPT_BLOCK}\n\n${plain.slice(idx + 1).trimStart()}`;
}

/** Swap only the intro paragraph in an existing plain-text validation letter. */
export function replaceValidationIntroInBody(plainBody: string, variantIndex: number): string | null {
  const plain = plainBody.replace(/\r\n/g, '\n');
  const startIdx = plain.indexOf(INTRO_SECTION_START);
  const endIdx = plain.indexOf(INTRO_SECTION_END);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return null;

  const before = plain.slice(0, startIdx + INTRO_SECTION_START.length);
  const after = plain.slice(endIdx);
  const intro = `\n\n${validationIntroParagraph(variantIndex)}\n\n`;
  return `${before}${intro}${after}`;
}
