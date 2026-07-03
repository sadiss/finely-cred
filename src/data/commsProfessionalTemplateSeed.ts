import type { CommsTemplate } from '../domain/comms';
import { listCommsTemplates, upsertCommsTemplate } from './commsRepo';
import { wrapFinelyEmailHtml, buildDefaultEmailFooter, buildPrimaryCtaButton } from '../comms/prebuiltHtmlEmailLayout';
import { defaultSignatureHtml } from './emailDomainsRepo';
import type { CommsTemplateCategory, CommsStaffRoleTag } from '../domain/commsTemplateCategories';
import type { CommsEmailProviderId } from '../domain/commsEmailProviders';

function nowIso() {
  return new Date().toISOString();
}

function emailTpl(args: {
  id: string;
  name: string;
  subject: string;
  headline: string;
  body: string;
  category: CommsTemplateCategory;
  staffRoles: CommsStaffRoleTag[];
  provider?: CommsEmailProviderId;
  tags?: string[];
  disputeRound?: string;
}): Omit<CommsTemplate, 'createdAt' | 'updatedAt'> {
  return {
    id: args.id,
    name: args.name,
    channel: 'email',
    enabled: true,
    subjectTemplate: args.subject,
    bodyTemplate: wrapFinelyEmailHtml({
      headline: args.headline,
      subheadline: '{{brand.name}} — secure partner communication',
      bodyHtml: args.body,
      signatureHtml: defaultSignatureHtml('{{staffOnDuty}}', 'Credit Strategy Team'),
      footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
      headerTheme: args.category === 'dispute_rounds' ? 'slate' : 'emerald',
    }),
    tags: ['seed', 'professional', args.category, ...(args.tags ?? [])],
    meta: {
      contentType: 'html',
      emailProvider: args.provider ?? 'finely_native',
      category: args.category,
      staffRoles: args.staffRoles,
      layout: 'modern',
      disputeRound: args.disputeRound,
      preheader: args.subject.slice(0, 90),
    },
  };
}

function smsTpl(args: {
  id: string;
  name: string;
  body: string;
  category: CommsTemplateCategory;
  staffRoles: CommsStaffRoleTag[];
  tags?: string[];
}): Omit<CommsTemplate, 'createdAt' | 'updatedAt'> {
  return {
    id: args.id,
    name: args.name,
    channel: 'sms',
    enabled: true,
    bodyTemplate: args.body,
    tags: ['seed', 'sms', args.category, ...(args.tags ?? [])],
    meta: {
      category: args.category,
      staffRoles: args.staffRoles,
      tcpaSafe: true,
    },
  };
}

const DISPUTE_EMAILS: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  emailTpl({
    id: 'tpl_dispute_r1_mailed',
    name: 'Round 1 mailed — partner confirmation',
    subject: 'Round 1 dispute mailed — what happens next, {{firstName}}',
    headline: 'Your Round 1 dispute is on its way',
    body: `<p>Hi {{firstName}},</p><p>Your Round 1 bureau dispute was mailed. Typical investigation window: <strong>30–35 days</strong>.</p><p>Next: upload proof of mailing, watch for bureau mail, and log any response in your evidence vault.</p>${buildPrimaryCtaButton({ label: 'Open dispute workflow', href: '{{links.disputes}}' })}`,
    category: 'dispute_rounds',
    staffRoles: ['dispute_specialist', 'credit_specialist'],
    disputeRound: 'Round 1',
  }),
  emailTpl({
    id: 'tpl_dispute_r1_response_received',
    name: 'Round 1 response — review steps',
    subject: 'Bureau response received — review your Round 1 outcome',
    headline: 'Round 1 response logged',
    body: `<p>Hi {{firstName}},</p><p>We received your Round 1 bureau response. Your specialist will confirm whether items were deleted, updated, or verified unchanged.</p><p>If unchanged, we prepare Round 2 with a new angle and optional furnisher-direct follow-up.</p>${buildPrimaryCtaButton({ label: 'Upload response docs', href: '{{links.documents}}' })}`,
    category: 'dispute_rounds',
    staffRoles: ['dispute_specialist'],
    disputeRound: 'Round 1',
  }),
  emailTpl({
    id: 'tpl_dispute_r2_ready',
    name: 'Round 2 ready — new angle',
    subject: 'Round 2 dispute ready — stronger follow-up for {{firstName}}',
    headline: 'Round 2 letter ready',
    body: `<p>Round 2 references your Round 1 dates and adds new evidence or procedural arguments.</p>${buildPrimaryCtaButton({ label: 'Review Round 2 letter', href: '{{links.letters}}' })}`,
    category: 'dispute_rounds',
    staffRoles: ['dispute_specialist'],
    disputeRound: 'Round 2',
  }),
  emailTpl({
    id: 'tpl_dispute_r3_escalation_path',
    name: 'Round 3 — escalation checkpoint',
    subject: 'Round 3 + regulatory options for your case',
    headline: 'Round 3 escalation checkpoint',
    body: `<p>Before Round 3, we evaluate CFPB/AG complaints if the bureau pattern is non-compliant.</p><p>All contacts are documented in your case timeline.</p>${buildPrimaryCtaButton({ label: 'View escalations', href: '{{links.portal}}/escalations' })}`,
    category: 'complaints_escalation',
    staffRoles: ['dispute_specialist', 'compliance'],
    disputeRound: 'Round 3',
  }),
  emailTpl({
    id: 'tpl_dispute_r4_final_push',
    name: 'Round 4 — final bureau push',
    subject: 'Round 4 final bureau dispute — last step before legal review',
    headline: 'Round 4 — final bureau push',
    body: `<p>Round 4 is the strongest bureau letter before litigation prep. Compliance reviews the full packet.</p>${buildPrimaryCtaButton({ label: 'Open case workflow', href: '{{links.disputes}}' })}`,
    category: 'dispute_rounds',
    staffRoles: ['dispute_specialist', 'compliance'],
    disputeRound: 'Round 4',
  }),
  emailTpl({
    id: 'tpl_litigation_prep_notice',
    name: 'Litigation prep — attorney handoff',
    subject: 'Litigation prep packet — next steps for {{firstName}}',
    headline: 'Pre-litigation review',
    body: `<p>Your case may be ready for litigation prep. We assemble a court-ready timeline, bureau correspondence, and evidence vault export.</p><p><em>This is not legal advice — attorney review required.</em></p>${buildPrimaryCtaButton({ label: 'Message your specialist', href: '{{links.messages}}' })}`,
    category: 'litigation',
    staffRoles: ['compliance', 'admin', 'owner'],
    disputeRound: 'Litigation',
  }),
  emailTpl({
    id: 'tpl_cfpb_filed_update',
    name: 'CFPB complaint filed — partner update',
    subject: 'CFPB complaint filed on your behalf',
    headline: 'Regulatory complaint filed',
    body: `<p>We filed a CFPB complaint documenting bureau non-compliance. You will receive bureau contact within the regulatory window.</p><p>Keep all mail and upload responses to your vault.</p>`,
    category: 'complaints_escalation',
    staffRoles: ['dispute_specialist', 'compliance'],
  }),
  emailTpl({
    id: 'tpl_restore_hud_milestone',
    name: 'Credit restore HUD — letters milestone',
    subject: 'Credit restore milestone — letters mailed',
    headline: 'Letters milestone complete',
    body: `<p>You completed the letters step in your credit restore path. Next: track bureau responses and follow the round playbook.</p>${buildPrimaryCtaButton({ label: 'Open restore HUD', href: '{{links.dashboard}}' })}`,
    category: 'restore_workflow',
    staffRoles: ['credit_specialist', 'partner_success'],
  }),
];

const NURTURE_EMAILS: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  'Day 3 — upload reminder',
  'Day 7 — dispute priorities',
  'Day 14 — evidence discipline',
  'Day 21 — round timing',
  'Day 30 — funding readiness intro',
].map((label, i) =>
  emailTpl({
    id: `tpl_nurture_pro_${i + 3}`,
    name: `Nurture ${label}`,
    subject: `${label.split('—')[0]?.trim()} — {{firstName}}, your next Finely Cred step`,
    headline: label,
    body: `<p>Hi {{firstName}},</p><p>${label.split('—')[1]?.trim() ?? 'Continue your credit restore path with one focused action today.'}</p>${buildPrimaryCtaButton({ label: 'Open portal', href: '{{links.portal}}' })}`,
    category: 'nurture',
    staffRoles: ['partner_success', 'system'],
    provider: i % 3 === 0 ? 'gmail' : i % 3 === 1 ? 'outlook' : 'finely_native',
  }),
);

const SPECIALIST_EMAILS: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  emailTpl({
    id: 'tpl_specialist_intro',
    name: 'Credit specialist — program intro',
    subject: 'Your credit specialist is assigned — {{firstName}}',
    headline: 'Specialist assigned',
    body: `<p>Hi {{firstName}},</p><p>Your credit specialist will coordinate dispute rounds, evidence, and portal tasks. Reply in your team thread anytime.</p>${buildPrimaryCtaButton({ label: 'Open team chat', href: '{{links.messages}}' })}`,
    category: 'specialist_ops',
    staffRoles: ['credit_specialist'],
    provider: 'outlook',
  }),
  emailTpl({
    id: 'tpl_specialist_weekly_checkin',
    name: 'Specialist weekly check-in',
    subject: 'Weekly check-in — dispute status for {{firstName}}',
    headline: 'Weekly specialist check-in',
    body: `<p>Quick status: active rounds, upcoming deadlines, and any evidence we still need from you.</p>`,
    category: 'specialist_ops',
    staffRoles: ['credit_specialist', 'dispute_specialist'],
    provider: 'zoho',
  }),
  emailTpl({
    id: 'tpl_admin_case_review',
    name: 'Admin case review request',
    subject: 'Admin review requested — case {{caseId}}',
    headline: 'Admin case review',
    body: `<p>A dispute case requires admin or compliance review before the next round or litigation prep.</p>`,
    category: 'admin_ops',
    staffRoles: ['admin', 'compliance', 'owner'],
    provider: 'outlook',
  }),
];

const SMS_TEMPLATES: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  smsTpl({
    id: 'sms_dispute_r1_mailed',
    name: 'SMS — Round 1 mailed reminder',
    body: 'Finely Cred: Round 1 dispute mailed for {{firstName}}. Watch for bureau mail in ~30 days. Log responses in portal: {{links.portal}} Reply STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['dispute_specialist', 'system'],
    tags: ['tcpa'],
  }),
  smsTpl({
    id: 'sms_dispute_deadline_7d',
    name: 'SMS — 7-day deadline warning',
    body: 'Finely Cred: Bureau response window due in 7 days for case {{caseId}}. Upload any mail you received: {{links.portal}} STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['credit_specialist', 'system'],
  }),
  smsTpl({
    id: 'sms_response_received',
    name: 'SMS — response received nudge',
    body: 'Finely Cred: Bureau response logged. Your specialist is reviewing — check portal for next steps. {{links.disputes}} STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['dispute_specialist'],
  }),
  smsTpl({
    id: 'sms_round2_ready',
    name: 'SMS — Round 2 ready',
    body: 'Finely Cred: Round 2 letter is ready for {{firstName}}. Review and mail when ready: {{links.letters}} STOP to opt out.',
    category: 'sms_nurture',
    staffRoles: ['dispute_specialist'],
  }),
  smsTpl({
    id: 'sms_complaint_filed',
    name: 'SMS — CFPB complaint filed',
    body: 'Finely Cred: CFPB complaint filed for your case. Watch for bureau contact. Upload docs to vault. STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['compliance', 'dispute_specialist'],
  }),
  smsTpl({
    id: 'sms_restore_upload_report',
    name: 'SMS — upload report nudge',
    body: 'Finely Cred: Upload your 3-bureau report to unlock analysis + dispute targets. {{links.reports}} STOP to opt out.',
    category: 'sms_nurture',
    staffRoles: ['partner_success', 'credit_specialist'],
  }),
  smsTpl({
    id: 'sms_specialist_callback',
    name: 'SMS — specialist callback scheduled',
    body: 'Finely Cred: Your credit specialist call is confirmed. Join from portal messages or reply here. STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['credit_specialist'],
  }),
  smsTpl({
    id: 'sms_billing_past_due',
    name: 'SMS — billing past due',
    body: 'Finely Cred: Your account needs attention to keep dispute workflows active. Update billing: {{links.billing}} STOP to opt out.',
    category: 'billing',
    staffRoles: ['billing_ops', 'system'],
  }),
  smsTpl({
    id: 'sms_bk_home_urgent',
    name: 'SMS — bankruptcy home retention urgent',
    body: 'Finely Cred: Home retention path started for {{firstName}}. Time-sensitive — check portal steps now: {{links.portal}} STOP to opt out.',
    category: 'sms_alerts',
    staffRoles: ['bankruptcy_specialist', 'system'],
    tags: ['tcpa', 'bankruptcy'],
  }),
  smsTpl({
    id: 'sms_bk_nurture',
    name: 'SMS — bankruptcy path nurture',
    body: 'Finely Cred: Your bankruptcy liberation guide is ready in portal. Message your specialist anytime: {{links.messages}} STOP to opt out.',
    category: 'sms_nurture',
    staffRoles: ['bankruptcy_specialist', 'partner_success'],
    tags: ['bankruptcy'],
  }),
];

const BANKRUPTCY_EMAILS: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'>> = [
  emailTpl({
    id: 'tpl_bk_save_home',
    name: 'Bankruptcy — save your home (foreclosure)',
    subject: 'Your home retention path — next steps inside',
    headline: 'Save your home — time-sensitive steps',
    body: `<p>Hi {{firstName}},</p><p>You chose the <strong>save your home</strong> path. Your bankruptcy specialist will help you understand options like automatic stay, cure plans, and Chapter 13 catch-up — before sale dates harden.</p>${buildPrimaryCtaButton({ label: 'Open bankruptcy hub', href: '{{links.portal}}' })}<p><em>Educational only — not legal advice.</em></p>`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist', 'partner_success'],
    tags: ['bankruptcy', 'foreclosure'],
  }),
  emailTpl({
    id: 'tpl_bk_fresh_start_ch7',
    name: 'Bankruptcy — fresh start Chapter 7',
    subject: 'Fresh start path — what happens next',
    headline: 'Chapter 7 fresh start overview',
    body: `<p>Hi {{firstName}},</p><p>You selected a <strong>fresh start</strong> path. We will walk through means test basics, exemptions, and the discharge timeline — in plain language.</p>${buildPrimaryCtaButton({ label: 'Continue in portal', href: '{{links.portal}}' })}`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist'],
    tags: ['bankruptcy', 'ch7'],
  }),
  emailTpl({
    id: 'tpl_bk_ch13_cure',
    name: 'Bankruptcy — Chapter 13 catch-up',
    subject: 'Chapter 13 catch-up plan — your roadmap',
    headline: 'Chapter 13 catch-up roadmap',
    body: `<p>Hi {{firstName}},</p><p>Chapter 13 can help cure mortgage arrears over time. Your specialist will outline plan length, trustee payments, and what to gather before filing.</p>${buildPrimaryCtaButton({ label: 'View steps', href: '{{links.portal}}' })}`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist'],
    tags: ['bankruptcy', 'ch13'],
  }),
  emailTpl({
    id: 'tpl_bk_stop_harassment',
    name: 'Bankruptcy — stop collection harassment',
    subject: 'Relief from collection pressure — your path',
    headline: 'Stop collection harassment',
    body: `<p>Hi {{firstName}},</p><p>You chose the path focused on <strong>stopping harassment</strong>. We will explain how bankruptcy's automatic stay works and how to document creditor contact.</p>${buildPrimaryCtaButton({ label: 'Open hub', href: '{{links.portal}}' })}`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist', 'compliance'],
    tags: ['bankruptcy'],
  }),
  emailTpl({
    id: 'tpl_bk_business_ch11',
    name: 'Bankruptcy — business reorganization',
    subject: 'Business reorganization overview',
    headline: 'Business reorganization path',
    body: `<p>Hi {{firstName}},</p><p>Your business reorganization path covers operating while restructuring, creditor committees, and plan confirmation basics.</p>${buildPrimaryCtaButton({ label: 'Continue', href: '{{links.portal}}' })}`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist'],
    tags: ['bankruptcy', 'ch11'],
  }),
  emailTpl({
    id: 'tpl_bk_post_discharge_credit',
    name: 'Bankruptcy — rebuild credit after discharge',
    subject: 'After discharge — credit rebuild playbook',
    headline: 'Rebuild credit after discharge',
    body: `<p>Hi {{firstName}},</p><p>Discharge is a milestone — not the end. We will pair credit rebuild education with dispute workflows where inaccurate post-bankruptcy reporting appears.</p>${buildPrimaryCtaButton({ label: 'View playbook', href: '{{links.portal}}' })}`,
    category: 'bankruptcy',
    staffRoles: ['bankruptcy_specialist', 'credit_specialist'],
    tags: ['bankruptcy', 'credit_rebuild'],
  }),
];

const ALL_PROFESSIONAL = [...DISPUTE_EMAILS, ...NURTURE_EMAILS, ...SPECIALIST_EMAILS, ...BANKRUPTCY_EMAILS, ...SMS_TEMPLATES];

export function ensureProfessionalCommsTemplatesOnce() {
  const existing = new Set(listCommsTemplates().map((t) => t.id));
  const now = nowIso();
  for (const tpl of ALL_PROFESSIONAL) {
    if (existing.has(tpl.id)) continue;
    upsertCommsTemplate({ ...tpl, createdAt: now, updatedAt: now });
  }
}

export function countProfessionalCommsTemplates() {
  return ALL_PROFESSIONAL.length;
}
