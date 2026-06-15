import type { TemplateBase, TemplateCategory, TemplateRenderContext, TemplateTone } from '../../domain/templates';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { esc, fmtDateLong, joinLines, tonePhrases, wrapLetterHtml, bulletList } from '../helpers';

function catLabel(c: TemplateCategory) {
  switch (c) {
    case 'court_filing':
      return 'Court filing';
    case 'debt_collection':
      return 'Debt & collections';
    case 'bankruptcy':
      return 'Bankruptcy';
    default:
      return String(c);
  }
}

function partnerAddressBlock(ctx: TemplateRenderContext) {
  return joinLines([
    esc(ctx.partner.fullName),
    esc(ctx.partner.address1 || ''),
    ctx.partner.address2 ? esc(ctx.partner.address2) : null,
    [ctx.partner.city, ctx.partner.state, ctx.partner.postalCode].filter(Boolean).join(', '),
    ctx.partner.phone ? `Phone: ${esc(ctx.partner.phone)}` : null,
    ctx.partner.email ? `Email: ${esc(ctx.partner.email)}` : null,
  ]);
}

function disclaimerFooter() {
  return 'Educational draft only. Review with a licensed attorney/qualified professional for your jurisdiction and facts.';
}

function closingByTone(tone: TemplateTone) {
  const t = tonePhrases(tone);
  return `${esc(t.thanks)}<br/><br/>Respectfully,<br/><br/>${esc('[SIGNATURE]')}<br/>${esc('[PRINTED_NAME]')}`;
}

function letterWrapper(args: {
  title: string;
  ctx: TemplateRenderContext;
  tone: TemplateTone;
  version: number;
  body: string;
  variantLabel: string;
  variant: any;
}) {
  const date = fmtDateLong(args.ctx.nowIso);
  const header = `<div style="display:flex;justify-content:space-between;gap:16px;">
  <div>${partnerAddressBlock(args.ctx)}</div>
  <div style="text-align:right;white-space:nowrap;"><div style="font-weight:700;">${esc(date)}</div><div style="font-size:11px;opacity:0.75;">${esc(
    args.variantLabel,
  )}</div></div>
</div>`;
  const body = `${header}<div style="margin-top:14px;">${args.body}</div>`;
  return wrapLetterHtml({
    title: args.title,
    variant: args.variant,
    bodyHtml: body,
    footerNote: disclaimerFooter(),
  });
}

function courtCaptionBlock(ctx: TemplateRenderContext) {
  const st = (ctx.jurisdictionState || '').trim();
  return `
<div style="border:1px solid rgba(0,0,0,0.18);border-radius:10px;padding:12px;">
  <div style="font-weight:700;">IN THE ${esc('[COURT_NAME]')}</div>
  <div style="margin-top:6px;opacity:0.85;">${esc('[COUNTY]')}${st ? `, ${esc(st)}` : ''}</div>
  <div style="margin-top:12px;display:flex;justify-content:space-between;gap:16px;">
    <div style="min-width:0;">
      <div><strong>${esc('[PLAINTIFF_NAME]')}</strong></div>
      <div style="opacity:0.75;">Plaintiff</div>
      <div style="margin-top:10px;"><strong>${esc('[DEFENDANT_NAME]')}</strong></div>
      <div style="opacity:0.75;">Defendant</div>
    </div>
    <div style="text-align:right;white-space:nowrap;">
      <div><strong>Case No.</strong> ${esc('[CASE_NUMBER]')}</div>
      <div style="margin-top:6px;"><strong>Division</strong> ${esc('[DIVISION]')}</div>
    </div>
  </div>
</div>
  `.trim();
}

export const ADVANCED_LITIGATION_TEMPLATE_BASES: TemplateBase[] = [
  {
    id: 'court_answer_general',
    title: 'Answer to Complaint (general) — fill-in',
    category: 'court_filing',
    description: 'A structured “Answer” framework with admissions/denials and affirmative defenses placeholders.',
    tags: ['court', 'answer', 'complaint', 'debt_lawsuit', 'framework'],
    requiredEntitlements: [ENTITLEMENT_KEYS.debt],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'ANSWER TO COMPLAINT';
      const defenses =
        version === 2
          ? [
              'Lack of standing (Plaintiff must prove ownership/assignment).',
              'Improper service / insufficient process (if applicable).',
              'Failure to state a claim upon which relief can be granted.',
              'Statute of limitations (if applicable).',
              'Amount not proven (fees/interest/itemization).',
            ]
          : [
              'Plaintiff has not proven standing/ownership of the alleged account.',
              'Insufficient information to admit/deny the allegations as stated.',
              'Failure to state a claim.',
              'Any other defenses available under the rules and laws of this jurisdiction.',
            ];
      const body = `
${courtCaptionBlock(ctx)}
<div style="margin-top:14px;font-weight:800;text-align:center;letter-spacing:0.08em;">${esc(subject)}</div>

<div style="margin-top:14px;">
Defendant ${esc('[DEFENDANT_NAME]')} (“Defendant”), appearing pro se, answers the Complaint as follows:
</div>

<div style="margin-top:14px;font-weight:700;">Responses to allegations</div>
<div style="margin-top:8px;">
  <div>1. Paragraph 1: ${esc('[ADMIT / DENY / LACK KNOWLEDGE]')} — ${esc('[SHORT EXPLANATION]')}</div>
  <div>2. Paragraph 2: ${esc('[ADMIT / DENY / LACK KNOWLEDGE]')} — ${esc('[SHORT EXPLANATION]')}</div>
  <div>3. Paragraph 3: ${esc('[ADMIT / DENY / LACK KNOWLEDGE]')} — ${esc('[SHORT EXPLANATION]')}</div>
  <div style="margin-top:6px;opacity:0.8;">(Add additional paragraphs to match the Complaint.)</div>
</div>

<div style="margin-top:14px;font-weight:700;">Affirmative defenses (placeholders)</div>
${bulletList(defenses, variant)}

<div style="margin-top:14px;font-weight:700;">Prayer for relief</div>
<div style="margin-top:8px;">
Wherefore, Defendant requests that the Court deny Plaintiff’s requested relief, dismiss the Complaint with prejudice (or as otherwise allowed), and grant any further relief the Court deems just and proper.
</div>

<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('court_filing')}: Answer (general)`,
        ctx,
        tone,
        version,
        body,
        variantLabel: variant.label,
        variant,
      });
    },
  },
  {
    id: 'court_motion_dismiss_service',
    title: 'Motion to Dismiss (improper service) — framework',
    category: 'court_filing',
    description: 'Framework motion when service/process is defective (fill-in).',
    tags: ['court', 'motion', 'dismiss', 'service', 'framework'],
    requiredEntitlements: [ENTITLEMENT_KEYS.debt],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const body = `
${courtCaptionBlock(ctx)}
<div style="margin-top:14px;font-weight:800;text-align:center;letter-spacing:0.08em;">MOTION TO DISMISS (INSUFFICIENT SERVICE OF PROCESS)</div>

<div style="margin-top:14px;">
Defendant ${esc('[DEFENDANT_NAME]')} (“Defendant”), appearing pro se, moves to dismiss the Complaint pursuant to ${esc(
        ctx.jurisdictionState ? `[${ctx.jurisdictionState} RULE]` : '[RULE]',
      )} for insufficient service of process, and states:
</div>

${bulletList(
  [
    'Defendant was not properly served as required by applicable rules.',
    'Service documents were left with an unauthorized person and/or at an improper address.',
    'Plaintiff has not provided competent proof of valid service.',
    'Defendant was prejudiced by the defective service and requests dismissal or quash of service.',
  ],
  variant,
)}

<div style="margin-top:14px;font-weight:700;">Requested relief</div>
<div style="margin-top:8px;">
Defendant respectfully requests the Court dismiss the action, or alternatively quash service and require Plaintiff to perfect service in compliance with the rules.
</div>

<div style="margin-top:14px;opacity:0.85;">${version === 2 ? esc('Attach any proof: address records, travel records, sworn statement, etc.') : ''}</div>

<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('court_filing')}: Motion to dismiss (service)`,
        ctx,
        tone,
        version,
        body,
        variantLabel: variant.label,
        variant,
      });
    },
  },
  {
    id: 'debt_validation_1692g',
    title: 'Debt Validation Request (FDCPA 1692g) — collector',
    category: 'debt_collection',
    description: 'Request validation, itemization, and documentation from a debt collector.',
    tags: ['FDCPA', 'validation', 'collector', 'itemization'],
    requiredEntitlements: [ENTITLEMENT_KEYS.debt],
    versions: 3,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const t = tonePhrases(tone);
      const subject = 'RE: Debt Validation Request';
      const asks =
        version === 3
          ? [
              'Name and address of the original creditor.',
              'Complete itemization (principal, interest, fees) with dates.',
              'Copy of the signed contract or other proof of liability.',
              'Copy of the assignment/chain of title authorizing collection.',
              'How you calculated the amount claimed.',
            ]
          : [
              'Itemization of the amount claimed, including interest/fees.',
              'Name and address of the original creditor.',
              'Copy of the contract/application or other proof I owe the debt.',
              'Proof you are authorized to collect (assignment/chain of title).',
            ];
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc('[COLLECTOR_NAME]')}</div>
<div style="margin-top:6px;">${esc('[COLLECTOR_ADDRESS]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">
To Whom It May Concern,<br/><br/>
I am requesting validation of the alleged debt referenced below. ${esc(t.request)}
${version === 2 ? '<br/><br/>This request is made in good faith to ensure accurate information and proper documentation.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Account reference</div>
<div style="margin-top:8px;">• Account: ${esc(ctx.accountRef || '[ACCOUNT_REF]')}<br/>• Alleged amount: ${esc(
        ctx.amountCents ? `$${(ctx.amountCents / 100).toFixed(2)}` : '[AMOUNT]',
      )}</div>
<div style="margin-top:14px;font-weight:700;">Validation requested</div>
${bulletList(asks, variant)}
<div style="margin-top:14px;">
Please communicate in writing. If you cannot validate, please cease collection activity and correct any reporting as appropriate.
</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('debt_collection')}: Debt validation`,
        ctx,
        tone,
        version,
        body,
        variantLabel: variant.label,
        variant,
      });
    },
  },
  {
    id: 'bankruptcy_discharge_dispute_bureau',
    title: 'Bankruptcy Discharge Dispute to Bureau — framework',
    category: 'bankruptcy',
    description: 'Framework to dispute accounts that should reflect bankruptcy discharge correctly (fill-in).',
    tags: ['bankruptcy', 'discharge', 'bureau', 'framework'],
    requiredEntitlements: [ENTITLEMENT_KEYS.packBankruptcy],
    versions: 2,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const bureau = esc(String(ctx.bureau || '[BUREAU]'));
      const body = `
<div style="margin-top:14px;font-weight:700;">${bureau}</div>
<div style="margin-top:14px;font-weight:700;">RE: Bankruptcy Discharge Reporting Dispute</div>
<div style="margin-top:14px;">
To Whom It May Concern,<br/><br/>
I am disputing the accuracy of how certain accounts are reporting in connection with a bankruptcy filing/discharge.
${version === 2 ? '<br/><br/>Please investigate and correct any reporting that is incomplete, inaccurate, or not supported by competent documentation.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Bankruptcy information (fill-in)</div>
${bulletList(
  ['Case number: [CASE_NUMBER]', 'Court: [COURT]', 'Chapter: [7/11/13]', 'Discharge date: [DISCHARGE_DATE]'],
  variant,
)}
<div style="margin-top:14px;font-weight:700;">Account(s) at issue</div>
${bulletList(
  [
    `Creditor/Furnisher: ${ctx.creditorName || '[CREDITOR_NAME]'}`,
    `Account reference: ${ctx.accountRef || '[ACCOUNT_LAST4_OR_REF]'}`,
    'Issue: [e.g., balance not zero / status not discharged / dates incorrect / duplicated tradeline]',
    'Requested outcome: correct to reflect bankruptcy discharge accurately or delete if unverifiable.',
  ],
  variant,
)}
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('bankruptcy')}: Discharge dispute`,
        ctx,
        tone,
        version,
        body,
        variantLabel: variant.label,
        variant,
      });
    },
  },
];

