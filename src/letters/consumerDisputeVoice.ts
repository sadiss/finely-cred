/**
 * Canonical consumer voice for credit dispute letters and education.
 * Human first — noticed something wrong, real-life impact, pulled report, learned FCRA, then dispute.
 */

export const CONSUMER_DISPUTE_OPENING = `To Whom It May Concern,

I am writing because inaccurate information on my credit report is blocking real goals in my life. I have been denied credit, quoted higher rates, or turned down for housing and financing I need. This is not a minor reporting error — it is preventing me from moving forward.

When I pulled my credit report and compared it carefully to my records and the attached screenshot exhibits, I found reporting that is factually wrong, internally inconsistent, or impossible to reconcile with what actually occurred.

Under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681i, I have the right to dispute inaccurate information. I am not trying to avoid legitimate obligations. I am asking you to review the specific factual problems listed below and delete any field or account that is reporting incorrectly.

This letter applies only to the item(s) listed below. Each numbered reason states one factual problem visible on my report. After reviewing the exhibit and the reasons, please delete the inaccurate reporting.`;

export const CONSUMER_DISPUTE_OPENING_CONVERSATIONAL = `Hello,

Something on my credit report does not add up, and it is getting in the way of everyday life — I have been denied or quoted worse terms when trying to get credit, finance a car, rent an apartment, and move forward with goals that depend on a fair, accurate file.

I pulled my report, compared it to my own records and the attached screenshots, and found reporting that is factually wrong or contradicts itself on the same account screen.

I looked into my rights under the Fair Credit Reporting Act (FCRA) and learned that I can dispute information that is inaccurate. I am not disputing debts that are truly mine and correctly reported. I am asking you to review the specific item(s) below, look at the factual problems I list, and delete what is reporting incorrectly.

This letter applies only to the items listed below.`;

export const CONSUMER_ITEM_DISPUTE_STATEMENT = `The attached exhibit shows the account fields as they appear on my report. The numbered factual reasons below identify specific inaccuracies or contradictions visible on that screen.`;

export const CONSUMER_REQUESTED_RESOLUTION = [
  'Review the attached exhibit and each numbered factual reason.',
  'Delete any account or field that is reporting inaccurately as described.',
  'Send me an updated copy of my credit report showing what was deleted or corrected.',
];

export const CONSUMER_REQUEST_FOR_RESULTS = `Please send written confirmation of what was deleted or corrected. If anything is maintained, explain exactly which field was verified and what documentation was relied upon.

Thank you for taking this seriously. An accurate credit file matters for housing, transportation, and basic financial stability.`;

/** Lines for the free guide example letter (PDF + preview). */
export const CONSUMER_EXAMPLE_LETTER_LINES = [
  '[Your Full Name]',
  '[Your Address]',
  '[City, State ZIP]',
  '[Date]',
  '',
  '[Credit Bureau Name]',
  '[Bureau Dispute Address]',
  '',
  'Re: Dispute of Inaccurate Information — Account #[Last 4 digits]',
  '',
  'To Whom It May Concern:',
  '',
  'I am writing because something on my credit report does not look right, and it is affecting my life in real ways. I have been denied for credit and turned down for things I need — including a car loan and an apartment I was applying for. When I pulled my own report and compared it to my records, I found information that appears inaccurate.',
  '',
  'After doing my own research, I learned that under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681i, I have the right to dispute information I believe is wrong. I am not trying to avoid legitimate debts. I am asking you to investigate what is reporting and fix what does not belong there or cannot be verified.',
  '',
  'The account I am disputing:',
  '- Creditor / furnisher: [Creditor Name]',
  '- Account number (last 4): [XXXX]',
  '- What looks wrong: [e.g., balance, status, dates, payment history — be specific]',
  '',
  'When I reviewed my report, the fields for this account do not match my records. I have attached [Exhibit A: screenshot or document] showing the contradiction. Please reinvestigate, correct or delete inaccurate reporting, and tell me how you verified anything you keep on my file.',
  '',
  'Please send me updated results within the time frame required by law.',
  '',
  'Sincerely,',
  '[Handwritten Signature]',
  '[Printed Name]',
];

export type DisputeGuideStep = {
  id: string;
  heading: string;
  lead: string;
  paragraphs: string[];
  bullets: string[];
  powerMove: string;
};

/** Elaborated 5-step framework — shared by PDF guide, freeGuides, and funnel UI. */
export const DISPUTE_GUIDE_FIVE_STEPS: DisputeGuideStep[] = [
  {
    id: 'step-1',
    heading: 'Step 1 — Identify the target item',
    lead: 'One clean target beats ten scattered complaints.',
    paragraphs: [
      'Start by pulling your own report from each bureau (or a tri-merge if you have one). Read it like a detective, not a victim: you are looking for one tradeline where the story on paper does not match reality.',
      'Do not dispute everything at once. Bureaus and OCR systems flag “shotgun” letters. One negative per letter, one clear inaccuracy per round — that is how consumers win reinvestigations that actually stick.',
    ],
    bullets: [
      'Download or request your report (AnnualCreditReport.com, monitoring service, or bureau directly). Same-day pulls are best when you are actively disputing.',
      'Circle ONE negative tradeline per letter — the item hurting you most (collections, charge-offs, lates, wrong balances).',
      'Screenshot the exact fields: account name, status, balance, credit limit, date opened, date of first delinquency, last reported, and the 24-month payment grid.',
      'Write down why it looks wrong in plain English before you open a template (“status says paid but grid shows 90-day lates”).',
      'Save screenshots to your Documents / Evidence vault before you draft — never dispute from memory.',
      'Note which bureau page it appeared on (Equifax, Experian, or TransUnion) — you mail each bureau separately.',
    ],
    powerMove:
      'Power move: If the same account reports differently on two bureaus, that inconsistency alone can be Round 1 — screenshot both side by side as Exhibit A.',
  },
  {
    id: 'step-2',
    heading: 'Step 2 — Choose your dispute lane',
    lead: 'Pick the strongest honest angle — accuracy, verifiability, or completeness.',
    paragraphs: [
      'Every dispute falls into one of three lanes. You are not arguing feelings; you are pointing at what the file shows versus what can be proven.',
      'The lane you choose determines which exhibits you attach and which FCRA duty you invoke. Switching lanes mid-round weakens your paper trail — commit to one clean theory per letter.',
    ],
    bullets: [
      'Inaccurate reporting: internal contradictions (status vs payment history, balance vs limit, dates that do not timeline).',
      'Unverifiable: the furnisher cannot produce a signed agreement, account ownership chain, or proof the debt is yours as reported.',
      'Incomplete: required Metro2 fields missing, wrong account type, or masked identifiers that prevent you from confirming the tradeline.',
      'Identity mismatch: name/address variants splitting your file — fix identity layer before heavy dispute rounds.',
      'Never cite “illegal” or “fraud” without facts — factual findings tied to screenshots win reinvestigations.',
      'Match the lane to your exhibit: inaccuracy needs contradictions; unverifiable needs validation request language.',
    ],
    powerMove:
      'Power move: Metro2 “status vs grid” conflicts are high-win — e.g., “Current” status with derogatory history codes in the same account block.',
  },
  {
    id: 'step-3',
    heading: 'Step 3 — Structure the letter (your story, then your rights)',
    lead: 'Start in your own words — then cite the law you researched.',
    paragraphs: [
      'Your opening should read like you explaining the problem to someone who can help: what looks wrong on your report, how it is affecting your life (denials, apartment, car, rates), that you pulled your report and looked up your rights, and what you are asking them to do — not like a copy-paste template from the internet.',
      'After your opening paragraphs, list the account once, tie each reason to an exhibit, and close with a clear request for reinvestigation results and method of verification.',
    ],
    bullets: [
      'Opening — part 1: What you noticed that does not look right on your report.',
      'Opening — part 2: How it is hurting you (denied credit, apartment, auto loan, higher deposits, etc.).',
      'Opening — part 3: You pulled your report, compared records, researched the FCRA, and you are exercising your dispute rights.',
      'Body: One account block — furnisher, last 4 digits, specific fields that are wrong, numbered factual reasons.',
      'Reference exhibits in the body (“See Exhibit A — report screenshot dated [date]”).',
      'Closing: Request reinvestigation, corrected report copy, and method of verification if anything is maintained.',
      'Hand-sign in ink; typed name and date; keep a full copy of everything mailed.',
    ],
    powerMove:
      'Power move: Read your opening out loud. If it sounds like a robot, rewrite until it sounds like you explaining the problem to a neighbor.',
  },
  {
    id: 'step-4',
    heading: 'Step 4 — Attach minimum proof',
    lead: 'Less is more — but zero proof is a wasted stamp.',
    paragraphs: [
      'Attach only what proves the specific claim in that letter. Over-attaching unrelated docs dilutes your argument and overwhelzes bureau intake.',
      'Label every attachment Exhibit A, B, C and cite it in the letter body. The reinvestigation analyst should not have to guess why a page is included.',
    ],
    bullets: [
      'Minimum identity pack: government ID + proof of address (utility bill, bank statement ≤ 90 days).',
      'For the tradeline: full account panel screenshot + payment history grid + any statement or letter that contradicts the bureau.',
      'One exhibit per major claim — do not dump 40 pages “just in case.”',
      'Print on plain white paper, black ink; avoid neon highlights and all-caps rage paragraphs.',
      'Keep a mailed copy: letter + exhibits + envelope front + certified mail receipt.',
      'Upload the same packet to your portal Evidence vault and link it to the dispute task.',
    ],
    powerMove:
      'Power move: On Exhibit A, use a simple arrow or circle (on paper or PDF) pointing at the exact field you are disputing — analysts move faster when you guide the eye.',
  },
  {
    id: 'step-5',
    heading: 'Step 5 — Follow-up cadence',
    lead: 'Round 1 opens the file; Round 2 wins on their answer.',
    paragraphs: [
      'Mail once, then wait for the bureau response (typically 30 days). Your job is not to spam — it is to document what changed and tighten the same claim with new facts from their reply.',
      'If they “verify” without explaining how, that itself becomes Round 2 ammunition — request method of verification in writing and cite new contradictions.',
    ],
    bullets: [
      'Round 1: one tradeline, one lane, certified mail, minimum exhibits, log sent date in Tasks.',
      'Day 35: if no response, follow up in writing referencing your certified mail tracking number.',
      'When response arrives: scan immediately; note what changed, what did not, and any verification boilerplate.',
      'Round 2: same account, new factual reason from their response — never recycle the identical paragraph.',
      'Never add unrelated accounts to a follow-up letter; open a new letter stream instead.',
      'Escalation path (CFPB, AG, BBB) only after your paper trail is organized — dates, tracking, exhibits.',
    ],
    powerMove:
      'Power move: Create a one-page timeline (sent → delivered → response → next action). Funders and coaches take you seriously when your file is dated and disciplined.',
  },
];

export function consumerDisputeOpeningForTone(tone: 'formal' | 'neutral' | 'conversational'): string {
  if (tone === 'conversational') return CONSUMER_DISPUTE_OPENING_CONVERSATIONAL;
  return CONSUMER_DISPUTE_OPENING;
}

export function consumerDisputeOpeningHtml(extraRequest?: string): string {
  const text = extraRequest ? `${CONSUMER_DISPUTE_OPENING}\n\n${extraRequest}` : CONSUMER_DISPUTE_OPENING;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}
