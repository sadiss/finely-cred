import type { TemplateBase, TemplateCategory, TemplateRenderContext, TemplateTone } from '../../domain/templates';
import { bureauDisputeAddress, ENCLOSURES_LINE, SUBJECT_LINE } from '../../letters/disputeLetterTemplate';
import { consumerDisputeOpeningHtml } from '../../letters/consumerDisputeVoice';
import { esc, fmtDateLong, joinLines, tonePhrases, wrapLetterHtml } from '../helpers';

function catLabel(c: TemplateCategory) {
  switch (c) {
    case 'credit_dispute':
      return 'Credit dispute';
    case 'furnisher_dispute':
      return 'Furnisher dispute';
    case 'identity_theft':
      return 'Identity theft';
    case 'debt_collection':
      return 'Debt & collections';
    case 'court_filing':
      return 'Court filing';
    case 'bankruptcy':
      return 'Bankruptcy';
    case 'chexsystems':
      return 'ChexSystems / EWS';
    case 'business_funding':
      return 'Business funding';
    case 'contracts':
      return 'Contracts';
    case 'ops':
      return 'Operations';
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

function bureauBlock(ctx: TemplateRenderContext) {
  if (!ctx.bureau) return '';
  const addr = bureauDisputeAddress(ctx.bureau);
  return joinLines([addr.name, ...addr.lines].map((x) => esc(x)));
}

function disclaimerFooter() {
  return 'Educational draft. Review with a licensed attorney/qualified professional for your jurisdiction and facts.';
}

function openingByVersion(v: number, tone: TemplateTone) {
  const t = tonePhrases(tone);
  const base = consumerDisputeOpeningHtml(t.request);
  if (v === 2) {
    return `${base}<br/><br/>${esc('This letter applies only to the specific item(s) listed below.')}`;
  }
  if (v === 3) {
    return `${base}<br/><br/>${esc('Please limit your review to the disputed tradeline(s) identified in this notice.')}`;
  }
  return base;
}

function closingByTone(tone: TemplateTone) {
  const t = tonePhrases(tone);
  return `${esc(t.thanks)}<br/><br/>Sincerely,<br/><br/>${esc('[SIGNATURE]')}<br/>${esc('[PRINTED_NAME]')}`;
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

export const STARTER_TEMPLATE_BASES: TemplateBase[] = [
  {
    id: 'credit_bureau_dispute_general',
    title: 'Credit Bureau Dispute (general)',
    category: 'credit_dispute',
    description: 'General FCRA dispute letter to a credit bureau with disputed items summary.',
    tags: ['FCRA', 'reinvestigation', 'bureau', 'dispute'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = SUBJECT_LINE;
      const itemSummary = [
        `Creditor/Furnisher: ${ctx.creditorName || '[CREDITOR_NAME]'}`,
        `Account reference: ${ctx.accountRef || '[ACCOUNT_LAST4_OR_REF]'}`,
        `Dispute reason(s): [LIST_REASONS]`,
        `Requested outcome: correction or deletion if unverifiable`,
      ];
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">${openingByVersion(version, tone)}</div>
<div style="margin-top:14px;font-weight:700;">Disputed item(s)</div>
<div style="margin-top:8px;">${itemSummary.map((x) => `<div>• ${esc(x)}</div>`).join('')}</div>
<div style="margin-top:14px;">
Please provide written confirmation of the results of your reinvestigation. If an item is “verified,” please include what information was relied upon to maintain it, and how it was verified.
</div>
<div style="margin-top:14px;">${esc(ENCLOSURES_LINE)}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: Bureau dispute`,
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
    id: 'credit_method_of_verification',
    title: 'Method of Verification (MOV) request',
    category: 'credit_dispute',
    description: 'Request details on how a bureau verified an item after a prior dispute.',
    tags: ['FCRA', 'MOV', 'verification', 'bureau'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Request for Method of Verification (15 U.S.C. § 1681i(a)(6)(B)(iii))';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I recently disputed inaccurate information on my file and received results stating the item(s) were “verified.” I am requesting the complete Method of Verification for the item(s) listed below.
${version === 2 ? '<br/><br/>Please include the name of the furnisher, the address/telephone number used, the documentation relied upon, and the procedures used to verify.' : ''}
${version === 3 ? '<br/><br/>Provide the precise steps taken, sources consulted, and the evidence used to maintain the reporting.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Item(s) at issue</div>
<div style="margin-top:8px;">• Creditor/Furnisher: ${esc(ctx.creditorName || '[CREDITOR_NAME]')}<br/>• Account reference: ${esc(
        ctx.accountRef || '[ACCOUNT_REF]',
      )}<br/>• Dispute date: ${esc(ctx.incidentDate || '[DISPUTE_DATE]')}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: MOV`,
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
    id: 'furnisher_dispute_623',
    title: 'Furnisher Dispute (FCRA § 623) – Direct dispute',
    category: 'furnisher_dispute',
    description: 'Direct dispute to a furnisher for inaccurate reporting; request investigation and correction.',
    tags: ['FCRA', '623', 'furnisher', 'direct_dispute'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Direct Dispute of Inaccurate Credit Reporting (FCRA § 623)';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[FURNISHER_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am disputing the accuracy and completeness of your reporting to the consumer reporting agencies regarding the account below.
${version === 2 ? '<br/><br/>If you cannot substantiate each data field being furnished with competent evidence, you must correct or delete the reporting you have provided.' : ''}
${version === 3 ? '<br/><br/>This notice is made in good faith to ensure accurate reporting. Please investigate and respond in writing with your findings and corrections.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Account</div>
<div style="margin-top:8px;">• Account reference: ${esc(ctx.accountRef || '[ACCOUNT_REF_OR_LAST4]')}<br/>• Dispute reason(s): [LIST_REASONS]<br/>• Bureaus reporting: [EXP/EQF/Trans]</div>
<div style="margin-top:14px;">Requested resolution: Correct inaccurate fields and ensure all bureaus receive updated reporting, or delete if unverifiable.</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('furnisher_dispute')}: Direct dispute`,
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
    id: 'identity_theft_bureau_block',
    title: 'Identity Theft Dispute to Bureau',
    category: 'identity_theft',
    description: 'Dispute fraudulent accounts and request blocking under identity theft protections (attach FTC/police docs).',
    tags: ['identity_theft', 'fraud', 'block', 'bureau'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Identity Theft Dispute & Request to Block Fraudulent Items';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am a victim of identity theft and I am requesting that you block and remove fraudulent information from my credit file.
${version === 2 ? '<br/><br/>Enclosed are identity theft documents, proof of identity, and supporting evidence.' : ''}
${version === 3 ? '<br/><br/>Please update my file to reflect that I dispute the listed items as identity theft and remove any resulting negative reporting.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Fraudulent item(s)</div>
<div style="margin-top:8px;">• Creditor/Furnisher: ${esc(ctx.creditorName || '[FRAUD_CREDITOR]')}<br/>• Account reference: ${esc(
        ctx.accountRef || '[ACCOUNT_REF]',
      )}<br/>• Date discovered: ${esc(ctx.incidentDate || '[DATE_DISCOVERED]')}</div>
<div style="margin-top:14px;">Enclosures: FTC Identity Theft Report, Police Report (if any), Proof of Identity, Proof of Address, Account Evidence</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('identity_theft')}: Bureau dispute`,
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
    id: 'chexsystems_dispute',
    title: 'ChexSystems Dispute (general)',
    category: 'chexsystems',
    description: 'Dispute inaccurate ChexSystems reporting and request investigation/correction.',
    tags: ['chexsystems', 'banking', 'dispute'],
    versions: 3,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Dispute of Inaccurate Consumer Report Information (ChexSystems)';
      const body = `
<div style="margin-top:14px;font-weight:700;">ChexSystems, Inc.</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am disputing the accuracy and/or completeness of information on my ChexSystems consumer report. Please investigate the item(s) below and correct or delete any information that cannot be verified.
${version === 2 ? '<br/><br/>If you maintain any negative reporting, provide the source, supporting documentation, and the method used to verify.' : ''}
${version === 3 ? '<br/><br/>Please send me an updated consumer report reflecting your results.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Item(s) at issue</div>
<div style="margin-top:8px;">• Financial institution: ${esc(ctx.creditorName || '[FI_NAME]')}<br/>• Item reference: ${esc(
        ctx.accountRef || '[ITEM_REF]',
      )}<br/>• Dispute reason(s): [LIST_REASONS]</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('chexsystems')}: Dispute`,
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
    id: 'debt_validation_request',
    title: 'Debt Validation Request (FDCPA § 1692g)',
    category: 'debt_collection',
    description: 'Request validation of debt and demand cessation of collection until verified.',
    tags: ['FDCPA', 'validation', 'collections'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Debt Validation Request (15 U.S.C. § 1692g)';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[COLLECTOR_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
This letter is a timely request for validation of the alleged debt referenced below. Until you provide validation, you must cease collection activity.
${version === 2 ? '<br/><br/>Provide the name/address of the original creditor, the amount claimed with itemization, and documentation showing you have authority to collect.' : ''}
${version === 3 ? '<br/><br/>If you have reported this account to any consumer reporting agency without validation, I dispute the reporting and request immediate correction or deletion.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Alleged account</div>
<div style="margin-top:8px;">• Reference: ${esc(ctx.accountRef || '[ACCOUNT_OR_CASE_REF]')}<br/>• Amount claimed: ${esc(
        ctx.amountCents ? `$${(ctx.amountCents / 100).toLocaleString()}` : '[AMOUNT]',
      )}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('debt_collection')}: Validation`,
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
    id: 'debt_cease_and_desist',
    title: 'Cease & Desist (FDCPA § 1692c(c))',
    category: 'debt_collection',
    description: 'Demand a collector cease communication (with limited exceptions).',
    tags: ['FDCPA', 'cease_and_desist', 'collections'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Cease & Desist Notice (15 U.S.C. § 1692c(c))';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[COLLECTOR_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I hereby demand that you cease all communication with me regarding the alleged debt referenced below.
${version === 2 ? '<br/><br/>Any further contact beyond what the statute permits may be documented as a violation.' : ''}
${version === 3 ? '<br/><br/>If you believe you have legal grounds for action, communicate only as permitted by law and in writing.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Reference</div>
<div style="margin-top:8px;">• ${esc(ctx.accountRef || '[ACCOUNT_OR_CASE_REF]')}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('debt_collection')}: Cease`,
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
    id: 'bankruptcy_court_inquiry_furnishing',
    title: 'Court Inquiry: Furnishing of Bankruptcy Data to Bureaus',
    category: 'bankruptcy',
    description: 'Draft inquiry to court clerk re: whether/what bankruptcy data is furnished to credit bureaus (records and reporting).',
    tags: ['bankruptcy', 'court', 'furnishing', 'records'],
    versions: 3,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Public Record / Bankruptcy Reporting Inquiry';
      const state = ctx.jurisdictionState || ctx.partner.state || '[STATE]';
      const body = `
<div style="margin-top:14px;font-weight:700;">Clerk of Court</div>
<div style="margin-top:2px;">${esc(`[Court Name], ${state}`)}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To the Clerk,<br/><br/>
I am writing to request clarification regarding public record data related to bankruptcy filings and whether any information is furnished or provided to consumer reporting agencies.
${version === 2 ? '<br/><br/>Specifically, I request information about record availability, certified copies, and any procedures or data-sharing arrangements relevant to consumer report accuracy.' : ''}
${version === 3 ? '<br/><br/>This request is for record-keeping and consumer-report accuracy purposes. Please respond in writing with any relevant guidance or contact points.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Information requested</div>
<div style="margin-top:8px;">
• Whether the court directly furnishes bankruptcy/public record data to credit bureaus, and if so, which bureaus/vendors<br/>
• How a consumer may obtain certified copies or docket records for verification purposes<br/>
• The appropriate department/contact for questions on record reporting and corrections (if any)
</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('bankruptcy')}: Court inquiry`,
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
    id: 'contract_dfy_services_agreement',
    title: 'DFY Services Agreement (draft)',
    category: 'contracts',
    description: 'Services agreement draft for DFY credit restoration/business services with scope, fees, disclaimers, consent.',
    tags: ['contract', 'dfy', 'services', 'consent'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">DFY Services Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Effective date: ${esc(date)} • Partner: ${esc(ctx.partner.fullName)}</div>

<div style="margin-top:14px;font-weight:700;">1. Scope of Services</div>
<div style="margin-top:8px;">
Finely Cred will provide workflow assistance, document organization, education, and template-based correspondence drafts related to credit reporting accuracy, disputes, evidence management, and funding readiness planning.
${version === 2 ? '<br/><br/>Where applicable, services may include scheduling support, task management, and coordination of documentation needed for bureau or furnisher investigations.' : ''}
</div>

<div style="margin-top:14px;font-weight:700;">2. Partner Responsibilities</div>
<div style="margin-top:8px;">
You agree to provide accurate information, maintain current contact details, and promptly upload bureau mail, creditor correspondence, and supporting evidence. You remain responsible for all submissions and decisions.
</div>

<div style="margin-top:14px;font-weight:700;">3. Disclaimers</div>
<div style="margin-top:8px;">
This agreement and all templates are educational drafts. Finely Cred is not a law firm and does not provide legal advice. Outcomes vary and are not guaranteed.
</div>

<div style="margin-top:14px;font-weight:700;">4. Authorization & Consent</div>
<div style="margin-top:8px;">
You authorize Finely Cred to draft correspondence and manage documentation on your behalf, subject to your review and approval. You consent to communication about your case via email/in-app.
</div>

<div style="margin-top:14px;font-weight:700;">5. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Partner signature • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred representative • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({
        title: 'DFY Services Agreement (Draft)',
        variant,
        bodyHtml: body,
        footerNote: disclaimerFooter(),
      });
    },
  },
  {
    id: 'credit_reinvestigation_followup',
    title: 'Reinvestigation Follow-up (after bureau response)',
    category: 'credit_dispute',
    description: 'Follow-up letter when a bureau claims an item was verified; requests clarification and correction.',
    tags: ['FCRA', 'follow_up', 'reinvestigation'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Reinvestigation Follow-up — Disputed Item(s) Remain Inaccurate';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am following up regarding my prior dispute and your response indicating the item(s) were verified. The reporting remains inaccurate and/or not reasonably verifiable as displayed on my file.
${version === 2 ? '<br/><br/>Please provide the documentation or data relied upon to maintain each disputed field (dates, status, balance, remarks, and any delinquency dates).' : ''}
${version === 3 ? '<br/><br/>If you cannot substantiate the reporting with competent verification, delete or correct the item(s) immediately and provide an updated report.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Item(s) at issue</div>
<div style="margin-top:8px;">• Creditor/Furnisher: ${esc(ctx.creditorName || '[CREDITOR_NAME]')}<br/>• Account reference: ${esc(
        ctx.accountRef || '[ACCOUNT_REF]',
      )}<br/>• Prior dispute date: ${esc(ctx.incidentDate || '[PRIOR_DISPUTE_DATE]')}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: Follow-up`,
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
    id: 'credit_609_request',
    title: '§609 Request (records/disclosure request)',
    category: 'credit_dispute',
    description: 'Request disclosure of the information in your file (commonly referred to as a “609 request”).',
    tags: ['FCRA', '609', 'disclosure'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Request for File Disclosure / Consumer Report Information';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am requesting a complete disclosure of the information maintained in my consumer file, including all sources, identifiers, and any documentation used to generate my consumer report.
${version === 2 ? '<br/><br/>Please include all account-level data fields, inquiry sources, public record sources, and any notes/remarks associated with items on my file.' : ''}
${version === 3 ? '<br/><br/>This request includes any data shared or received through third-party vendors and any reinvestigation results history available for my file.' : ''}
</div>
<div style="margin-top:14px;">Enclosures: Proof of Identity, Proof of Address</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: Disclosure request`,
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
    id: 'credit_611_procedures_request',
    title: '§611 Request (procedures used to verify)',
    category: 'credit_dispute',
    description: 'Request the procedures used to verify disputed information (FCRA reinvestigation procedures).',
    tags: ['FCRA', '611', 'procedures'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Request for Description of Reinvestigation Procedures (FCRA)';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am requesting a detailed description of the procedures used to investigate and verify the disputed item(s) on my file, including the sources consulted and the steps taken.
${version === 2 ? '<br/><br/>Please include the furnisher name, address/telephone used, and whether documentation was reviewed or only data fields were matched.' : ''}
${version === 3 ? '<br/><br/>If you did not review underlying documentation, please explain how the item was deemed verified and provide the basis for maintaining the reporting.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Item(s) at issue</div>
<div style="margin-top:8px;">• Creditor/Furnisher: ${esc(ctx.creditorName || '[CREDITOR_NAME]')}<br/>• Account reference: ${esc(
        ctx.accountRef || '[ACCOUNT_REF]',
      )}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: Procedures request`,
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
    id: 'credit_frivolous_rebuttal',
    title: 'Frivolous Dispute Rebuttal',
    category: 'credit_dispute',
    description: 'Rebut a bureau “frivolous/irrelevant” dispute determination; resubmit with clarity and evidence references.',
    tags: ['FCRA', 'frivolous', 'rebuttal'],
    versions: 3,
    requiredFields: ['partner.fullName', 'bureau'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const addr = bureauBlock(ctx);
      const subject = 'RE: Rebuttal — Dispute Is Not Frivolous or Irrelevant';
      const body = `
<div style="margin-top:14px;">${addr}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
You previously stated that my dispute was “frivolous or irrelevant.” This is a good-faith dispute of specific, identifiable data fields and I am providing clarifying information below.
${version === 2 ? '<br/><br/>Please conduct a reinvestigation and provide results in writing. If you require additional information, please specify exactly what is needed.' : ''}
${version === 3 ? '<br/><br/>I am disputing accuracy and verifiability, not merely “ownership.” Review the evidence references and correct or delete as appropriate.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Dispute clarification</div>
<div style="margin-top:8px;">
• Furnisher: ${esc(ctx.creditorName || '[CREDITOR_NAME]')}<br/>
• Account reference: ${esc(ctx.accountRef || '[ACCOUNT_REF]')}<br/>
• Specific field(s) disputed: [LIST_FIELDS]<br/>
• Evidence reference(s): [LIST_EXHIBITS]
</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('credit_dispute')}: Frivolous rebuttal`,
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
    id: 'furnisher_notice_of_dispute',
    title: 'Notice of Dispute (furnisher) + request to correct',
    category: 'furnisher_dispute',
    description: 'Notice to furnisher that reporting is disputed; request correction across bureaus.',
    tags: ['furnisher', 'dispute_notice', 'correction'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Notice of Dispute — Request to Correct Furnished Reporting';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[FURNISHER_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
Please consider this a formal notice that I dispute your furnished reporting. The information as reported is inaccurate, incomplete, and/or not supported by competent evidence.
${version === 2 ? '<br/><br/>If you cannot substantiate the reporting, you must correct or delete it and notify all consumer reporting agencies to which you have furnished the information.' : ''}
${version === 3 ? '<br/><br/>Please respond in writing with your investigation results, the data relied upon, and the corrections submitted (if any).' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Account</div>
<div style="margin-top:8px;">• Reference: ${esc(ctx.accountRef || '[ACCOUNT_REF]')}<br/>• Dispute reason(s): [LIST_REASONS]</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('furnisher_dispute')}: Notice`,
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
    id: 'goodwill_adjustment_request',
    title: 'Goodwill Adjustment Request (late payments)',
    category: 'furnisher_dispute',
    description: 'Request a goodwill adjustment for late-payment reporting when circumstances support it.',
    tags: ['goodwill', 'late_payment', 'furnisher'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Goodwill Adjustment Request';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[CREDITOR_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am requesting a goodwill adjustment regarding the late-payment reporting on the account below. I value my relationship with your institution and I am working to maintain an accurate, positive file.
${version === 2 ? '<br/><br/>The late payment(s) occurred due to [CIRCUMSTANCES]. Since then, I have maintained timely payments and improved my financial stability.' : ''}
${version === 3 ? '<br/><br/>If you can make a one-time courtesy adjustment to remove the late mark(s), it would significantly help my credit profile while I continue responsible account management.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Account</div>
<div style="margin-top:8px;">• Reference: ${esc(ctx.accountRef || '[ACCOUNT_REF]')}<br/>• Late month(s): [LIST_MONTHS]</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('furnisher_dispute')}: Goodwill`,
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
    id: 'ews_dispute',
    title: 'Early Warning Services (EWS) Dispute',
    category: 'chexsystems',
    description: 'Dispute inaccurate EWS file information (banking deposit account screening).',
    tags: ['EWS', 'banking', 'dispute'],
    versions: 3,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Dispute of Inaccurate Consumer Report Information (Early Warning Services)';
      const body = `
<div style="margin-top:14px;font-weight:700;">Early Warning Services, LLC</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am disputing inaccurate and/or incomplete information maintained in my file. Please investigate and correct or delete any information that cannot be verified.
${version === 2 ? '<br/><br/>Provide the source of the information, any identifiers used, and your method of verification.' : ''}
${version === 3 ? '<br/><br/>Send updated results to me in writing reflecting the outcome of your investigation.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Item(s) at issue</div>
<div style="margin-top:8px;">• Financial institution: ${esc(ctx.creditorName || '[FI_NAME]')}<br/>• Reference: ${esc(
        ctx.accountRef || '[ITEM_REF]',
      )}<br/>• Dispute reason(s): [LIST_REASONS]</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('chexsystems')}: EWS dispute`,
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
    id: 'identity_theft_freeze_instructions',
    title: 'Identity Theft: Freeze/Fraud Alert Request (draft)',
    category: 'identity_theft',
    description: 'Draft request for fraud alert and/or security freeze, with enclosure checklist.',
    tags: ['freeze', 'fraud_alert', 'identity_theft'],
    versions: 3,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Request for Security Freeze / Fraud Alert';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc('[BUREAU_OR_AGENCY_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I am requesting that you place a security freeze and/or fraud alert on my file due to suspected identity theft or risk of unauthorized use of my identity.
${version === 2 ? '<br/><br/>Please provide written confirmation and any PIN/password required to manage the freeze.' : ''}
${version === 3 ? '<br/><br/>Enclosed is proof of identity and proof of address. If additional documentation is required, please specify exactly what is needed.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Enclosures</div>
<div style="margin-top:8px;">• Government ID<br/>• Proof of address<br/>• FTC report / police report (if available)</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('identity_theft')}: Freeze request`,
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
    id: 'debt_validation_followup_no_response',
    title: 'Debt Validation Follow-up (no response)',
    category: 'debt_collection',
    description: 'Follow-up when collector fails to validate; requests cessation and correction of any reporting.',
    tags: ['FDCPA', 'validation', 'follow_up'],
    versions: 3,
    requiredFields: ['partner.fullName', 'creditorName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const subject = 'RE: Follow-up — Validation Not Provided';
      const body = `
<div style="margin-top:14px;font-weight:700;">${esc(ctx.creditorName || '[COLLECTOR_NAME]')}</div>
<div style="margin-top:14px;font-weight:700;">${esc(subject)}</div>
<div style="margin-top:14px;">To Whom It May Concern,<br/><br/>
I previously requested validation of the alleged debt. To date, you have not provided the requested validation. Until validation is provided, you must cease collection activity.
${version === 2 ? '<br/><br/>If you have reported this account to any consumer reporting agency without validation, I dispute the reporting and request correction or deletion.' : ''}
${version === 3 ? '<br/><br/>Please respond in writing confirming that you have ceased collection and that any reporting will be updated accordingly.' : ''}
</div>
<div style="margin-top:14px;font-weight:700;">Reference</div>
<div style="margin-top:8px;">• ${esc(ctx.accountRef || '[ACCOUNT_OR_CASE_REF]')}</div>
<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return letterWrapper({
        title: `${catLabel('debt_collection')}: Follow-up`,
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
    id: 'court_answer_outline',
    title: 'Court Answer Outline (summons/complaint) — draft',
    category: 'court_filing',
    description: 'High-level answer outline (responses + affirmative defenses placeholders). State-specific rules vary.',
    tags: ['summons', 'answer', 'affirmative_defenses'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const state = ctx.jurisdictionState || ctx.partner.state || '[STATE]';
      const body = `
<div style="font-weight:700;font-size:16px;">Answer to Complaint (Draft Outline)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Jurisdiction: ${esc(state)} • Case #: ${esc(ctx.accountRef || '[CASE_NUMBER]')}</div>

<div style="margin-top:14px;font-weight:700;">1. Caption</div>
<div style="margin-top:8px;">[COURT NAME]<br/>[PLAINTIFF] v. [DEFENDANT]<br/>Case No. ${esc(ctx.accountRef || '[CASE_NUMBER]')}</div>

<div style="margin-top:14px;font-weight:700;">2. Responses to Allegations</div>
<div style="margin-top:8px;">
For each numbered paragraph in the complaint, respond: Admit / Deny / Deny for lack of knowledge.<br/>
${version === 2 ? 'Include brief factual clarifications where appropriate without admitting liability.' : ''}
</div>

<div style="margin-top:14px;font-weight:700;">3. Affirmative defenses (placeholders)</div>
<div style="margin-top:8px;">
• Lack of standing / chain of assignment not proven<br/>
• Statute of limitations (state SOL varies)<br/>
• Failure to state a claim<br/>
• Improper amount / lack of itemization<br/>
• Arbitration clause (if applicable)<br/>
</div>

<div style="margin-top:14px;font-weight:700;">4. Prayer for relief</div>
<div style="margin-top:8px;">Request dismissal with prejudice where appropriate and any other relief the court deems just.</div>

<div style="margin-top:14px;">${closingByTone(tone)}</div>
      `.trim();
      return wrapLetterHtml({
        title: 'Answer Outline (Draft)',
        variant,
        bodyHtml: body,
        footerNote: disclaimerFooter(),
      });
    },
  },
  {
    id: 'contract_affiliate_agreement',
    title: 'Affiliate Agreement (draft)',
    category: 'contracts',
    description: 'Affiliate agreement draft with referral terms, compliance, and payout placeholders.',
    tags: ['affiliate', 'agreement', 'compliance'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Affiliate Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Effective date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Purpose</div>
<div style="margin-top:8px;">This agreement defines the terms for referring customers to Finely Cred services using your unique referral link.</div>

<div style="margin-top:14px;font-weight:700;">2. Commission</div>
<div style="margin-top:8px;">Commission structure: [TIER / PERCENT / FLAT]. Payment schedule: [SCHEDULE]. Chargeback policy: [POLICY].</div>

<div style="margin-top:14px;font-weight:700;">3. Compliance</div>
<div style="margin-top:8px;">
No misleading claims. No guarantees of results. All marketing must use approved language and direct prospects to onboarding/intake.
${version === 2 ? '<br/><br/>Affiliates must comply with privacy obligations and obtain consent before contacting prospects.' : ''}
</div>

<div style="margin-top:14px;font-weight:700;">4. Term & termination</div>
<div style="margin-top:8px;">Either party may terminate with notice. Outstanding commissions are paid per policy.</div>

<div style="margin-top:14px;font-weight:700;">5. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Affiliate signature • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred representative • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({
        title: 'Affiliate Agreement (Draft)',
        variant,
        bodyHtml: body,
        footerNote: disclaimerFooter(),
      });
    },
  },
  {
    id: 'contract_white_label_agreement',
    title: 'White Label / Agency Partnership Agreement (draft)',
    category: 'contracts',
    description: 'Draft agreement for agents/companies using white-label services (branding, responsibilities, compliance).',
    tags: ['white_label', 'agency', 'partnership'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">White Label / Agency Partnership Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Effective date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Branding & Presentation</div>
<div style="margin-top:8px;">Partner may present services under approved branding. All compliance disclosures must remain intact.</div>

<div style="margin-top:14px;font-weight:700;">2. Responsibilities</div>
<div style="margin-top:8px;">
Partner is responsible for client acquisition, consent, and communications. Finely Cred provides workflow tools, templates, and operations support as agreed.
${version === 2 ? '<br/><br/>Data handling: partner must follow privacy/security requirements and avoid storing sensitive identifiers in unapproved systems.' : ''}
</div>

<div style="margin-top:14px;font-weight:700;">3. Fees & revenue share</div>
<div style="margin-top:8px;">[PRICING / SHARE / PAYOUT TERMS].</div>

<div style="margin-top:14px;font-weight:700;">4. Termination</div>
<div style="margin-top:8px;">Termination triggers, transition plan, and confidentiality obligations remain in effect.</div>

<div style="margin-top:14px;font-weight:700;">5. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Agency signature • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred representative • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({
        title: 'White Label Agreement (Draft)',
        variant,
        bodyHtml: body,
        footerNote: disclaimerFooter(),
      });
    },
  },
  {
    id: 'contract_client_portal_agreement',
    title: 'Customer Portal & DIY Services Agreement (draft)',
    category: 'contracts',
    description: 'Agreement for DIY portal access: report uploads, AI checklist, template library, and self-directed dispute workflow.',
    tags: ['client', 'diy', 'portal', 'subscription'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Customer Portal & DIY Services Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Effective date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Services</div>
<div style="margin-top:8px;">Finely Cred provides self-service tools including credit report upload, comparison workflows, dispute letter builders, AI restoration checklist, and document vault storage.</div>

<div style="margin-top:14px;font-weight:700;">2. Customer /responsibilities</div>
<div style="margin-top:8px;">Customer /certifies report accuracy, maintains login security, and acknowledges that DIY tools are educational — not legal advice.</div>

<div style="margin-top:14px;font-weight:700;">3. Fees & trial periods</div>
<div style="margin-top:8px;">[SUBSCRIPTION / TRIAL TERMS]. Promotional trial access may expire unless client upgrades to a paid DIY plan.</div>

<div style="margin-top:14px;font-weight:700;">4. Data & privacy</div>
<div style="margin-top:8px;">Customer /authorizes processing of uploaded credit reports solely for restoration workflow purposes. Data retention follows the privacy policy.</div>

<div style="margin-top:14px;font-weight:700;">5. Limitation of liability</div>
<div style="margin-top:8px;">No guarantee of score improvement or deletions. Customer /assumes responsibility for letters sent and disputes filed.</div>

<div style="margin-top:14px;font-weight:700;">6. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Customer: ${esc(ctx.partner.fullName)} • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred representative • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({ title: 'Customer Portal Agreement (Draft)', variant, bodyHtml: body, footerNote: disclaimerFooter() });
    },
  },
  {
    id: 'contract_credit_specialist_ic',
    title: 'Independent Credit Specialist Agreement (draft)',
    category: 'contracts',
    description: 'Contract for agents/specialists: compensation splits, compliance, client ownership, and platform usage rules.',
    tags: ['agent', 'specialist', 'ic', 'splits'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Independent Credit Specialist Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Effective date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Relationship</div>
<div style="margin-top:8px;">Specialist is an independent contractor, not an employee. Specialist may use Finely Cred platform tools under approved branding.</div>

<div style="margin-top:14px;font-weight:700;">2. Compensation</div>
<div style="margin-top:8px;">Revenue share, apprenticeship tiers, and payout schedules per the active agent program schedule. [SPLIT TABLE / TIER].</div>

<div style="margin-top:14px;font-weight:700;">3. Compliance</div>
<div style="margin-top:8px;">Specialist must obtain client consent, avoid unauthorized guarantees, and follow FCRA/CROA marketing rules.</div>

<div style="margin-top:14px;font-weight:700;">4. Customer /data</div>
<div style="margin-top:8px;">Specialist may not export client PII to unapproved systems. Platform audit logs may be reviewed for compliance.</div>

<div style="margin-top:14px;font-weight:700;">5. Term & termination</div>
<div style="margin-top:8px;">Either party may terminate with [NOTICE PERIOD]. Transition obligations for open customer files apply.</div>

<div style="margin-top:14px;font-weight:700;">6. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Specialist: ${esc(ctx.partner.fullName)} • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred representative • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({ title: 'Credit Specialist IC Agreement (Draft)', variant, bodyHtml: body, footerNote: disclaimerFooter() });
    },
  },
  {
    id: 'contract_data_privacy_authorization',
    title: 'Credit Data Processing & Privacy Authorization (draft)',
    category: 'contracts',
    description: 'Authorization for credit report upload, bureau dispute activity, and secure storage in the Finely Cred vault.',
    tags: ['privacy', 'authorization', 'fcra', 'data'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Credit Data Processing & Privacy Authorization</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Customer: ${esc(ctx.partner.fullName)} • Date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">Authorization</div>
<div style="margin-top:8px;">I authorize Finely Cred and its designated agents to receive, store, parse, and analyze my credit reports for restoration, dispute, and funding-readiness purposes.</div>

<div style="margin-top:14px;font-weight:700;">Scope</div>
<div style="margin-top:8px;">Includes HTML/PDF report uploads, tradeline comparison between report versions, letter generation, and evidence vault storage.</div>

<div style="margin-top:14px;font-weight:700;">Revocation</div>
<div style="margin-top:8px;">I may revoke this authorization in writing. Revocation does not affect prior lawful processing.</div>

<div style="margin-top:14px;font-weight:700;">Signature</div>
<div style="margin-top:24px;border-top:1px solid #111;opacity:0.5;padding-top:8px;">${esc(ctx.partner.fullName)} • Date</div>
      `.trim();
      return wrapLetterHtml({ title: 'Data Privacy Authorization', variant, bodyHtml: body, footerNote: disclaimerFooter() });
    },
  },
  {
    id: 'contract_payment_plan_agreement',
    title: 'Restoration Payment Plan Agreement (draft)',
    category: 'contracts',
    description: 'Installment plan for DFY or hybrid services: schedule, late fees, pause rules, and completion triggers.',
    tags: ['payment', 'installment', 'dfy'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Restoration Payment Plan Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Customer: ${esc(ctx.partner.fullName)} • Effective: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Total fees</div>
<div style="margin-top:8px;">Total service fee: [TOTAL]. Down payment: [DOWN]. Remaining balance split across [N] installments of [AMOUNT].</div>

<div style="margin-top:14px;font-weight:700;">2. Schedule</div>
<div style="margin-top:8px;">Payments due on [DATES]. Late payments may incur [LATE FEE] after [GRACE DAYS] days.</div>

<div style="margin-top:14px;font-weight:700;">3. Service delivery</div>
<div style="margin-top:8px;">Work continues while account is current. Paused accounts may suspend dispute rounds until brought current.</div>

<div style="margin-top:14px;font-weight:700;">4. Cancellation</div>
<div style="margin-top:8px;">[CANCELLATION / REFUND POLICY]. Customer /remains responsible for fees earned through date of cancellation.</div>

<div style="margin-top:14px;font-weight:700;">5. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Customer /• Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Finely Cred • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({ title: 'Payment Plan Agreement (Draft)', variant, bodyHtml: body, footerNote: disclaimerFooter() });
    },
  },
  {
    id: 'contract_non_disclosure_agreement',
    title: 'Mutual Non-Disclosure Agreement (draft)',
    category: 'contracts',
    description: 'NDA for partners, agents, and enterprise customers accessing proprietary workflows, templates, and pricing.',
    tags: ['nda', 'confidential', 'enterprise'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const date = fmtDateLong(ctx.nowIso);
      const body = `
<div style="font-weight:700;font-size:16px;">Mutual Non-Disclosure Agreement (Draft)</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Parties: Finely Cred and ${esc(ctx.partner.fullName)} • Date: ${esc(date)}</div>

<div style="margin-top:14px;font-weight:700;">1. Confidential information</div>
<div style="margin-top:8px;">Includes platform workflows, template libraries, pricing schedules, client data, and business strategies disclosed in connection with the relationship.</div>

<div style="margin-top:14px;font-weight:700;">2. Obligations</div>
<div style="margin-top:8px;">Receiving party will use confidential information only for authorized purposes and protect it with reasonable care.</div>

<div style="margin-top:14px;font-weight:700;">3. Term</div>
<div style="margin-top:8px;">Confidentiality obligations survive [SURVIVAL PERIOD] after termination.</div>

<div style="margin-top:14px;font-weight:700;">4. Signatures</div>
<div style="margin-top:24px;display:flex;gap:36px;">
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Disclosing party • Date</div>
  <div style="flex:1;border-top:1px solid #111;opacity:0.5;padding-top:8px;">Receiving party • Date</div>
</div>
      `.trim();
      return wrapLetterHtml({ title: 'Mutual NDA (Draft)', variant, bodyHtml: body, footerNote: disclaimerFooter() });
    },
  },
  {
    id: 'ops_consultation_intake_form',
    title: 'Strategy call intake form (ops)',
    category: 'ops',
    description: 'Printable intake form for sessions: goals, scores, issues, consent checklist.',
    tags: ['intake', 'session', 'ops'],
    versions: 2,
    requiredFields: ['partner.fullName'],
    renderHtml: ({ variant, tone, version, ...ctx }) => {
      const body = `
<div style="font-weight:700;font-size:16px;">Strategy Call Intake Form</div>
<div style="margin-top:6px;font-size:12px;opacity:0.8;">Partner: ${esc(ctx.partner.fullName)} • Date: ${esc(fmtDateLong(ctx.nowIso))}</div>

<div style="margin-top:14px;font-weight:700;">Contact</div>
<div style="margin-top:8px;">Email: ${esc(ctx.partner.email || '')}<br/>Phone: ${esc(ctx.partner.phone || '')}</div>

<div style="margin-top:14px;font-weight:700;">Goals</div>
<div style="margin-top:8px;">Funding goal: [AMOUNT] • Timeline: [TIMELINE] • Primary focus: personal / business / debt / identity theft</div>

<div style="margin-top:14px;font-weight:700;">Current profile</div>
<div style="margin-top:8px;">Scores (if known): [SCORES] • Utilization: [UTIL] • Derogs: [DEROGS] • Inquiries: [INQUIRIES]</div>

<div style="margin-top:14px;font-weight:700;">Compliance & consent</div>
<div style="margin-top:8px;">□ Terms accepted □ Privacy accepted □ Disclaimer acknowledged □ Consent to communication</div>

<div style="margin-top:14px;font-weight:700;">Notes</div>
<div style="margin-top:8px;border:1px solid #111;opacity:0.25;height:160px;"></div>

      `.trim();
      return wrapLetterHtml({
        title: 'Consultation Intake Form',
        variant,
        bodyHtml: body,
        footerNote: disclaimerFooter(),
      });
    },
  },
];

