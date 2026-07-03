import type { CommsEmailProviderId } from './commsEmailProviders';

export type CommsTemplateCategory =
  | 'onboarding'
  | 'nurture'
  | 'billing'
  | 'dispute_rounds'
  | 'restore_workflow'
  | 'complaints_escalation'
  | 'litigation'
  | 'specialist_ops'
  | 'partner_success'
  | 'admin_ops'
  | 'marketing'
  | 'transactional'
  | 'sms_alerts'
  | 'sms_nurture'
  | 'bankruptcy';

export type CommsStaffRoleTag =
  | 'owner'
  | 'co_owner'
  | 'credit_specialist'
  | 'dispute_specialist'
  | 'partner_success'
  | 'billing_ops'
  | 'compliance'
  | 'admin'
  | 'system'
  | 'bankruptcy_specialist';

export const COMMS_TEMPLATE_CATEGORIES: Array<{ id: CommsTemplateCategory; label: string; hint: string }> = [
  { id: 'onboarding', label: 'Onboarding', hint: 'Welcome, portal setup, first report upload' },
  { id: 'nurture', label: 'Nurture', hint: 'Day 1–30 education sequences' },
  { id: 'billing', label: 'Billing', hint: 'Invoices, past due, trial win-back' },
  { id: 'dispute_rounds', label: 'Dispute rounds', hint: 'R1–R4 mail, response, next-step nudges' },
  { id: 'restore_workflow', label: 'Credit restore', hint: 'Report → analyze → evidence → letters HUD' },
  { id: 'complaints_escalation', label: 'Complaints & escalation', hint: 'CFPB, AG, BBB, internal escalation' },
  { id: 'litigation', label: 'Litigation prep', hint: 'Pre-litigation notices, attorney handoff' },
  { id: 'specialist_ops', label: 'Specialist ops', hint: 'Credit specialist program threads' },
  { id: 'partner_success', label: 'Partner success', hint: 'Milestones, check-ins, CSAT' },
  { id: 'admin_ops', label: 'Admin ops', hint: 'Digests, internal alerts' },
  { id: 'marketing', label: 'Marketing', hint: 'Campaigns, lead magnets' },
  { id: 'transactional', label: 'Transactional', hint: 'Receipts, confirmations' },
  { id: 'sms_alerts', label: 'SMS alerts', hint: 'TCPA-safe reminders and deadlines' },
  { id: 'sms_nurture', label: 'SMS nurture', hint: 'Short-form education nudges' },
  { id: 'bankruptcy', label: 'Bankruptcy liberation', hint: 'Home retention, Ch 7/13, harassment relief paths' },
];

export const COMMS_STAFF_ROLE_TAGS: Array<{ id: CommsStaffRoleTag; label: string }> = [
  { id: 'owner', label: 'Owner (Sanz)' },
  { id: 'co_owner', label: 'Co-Owner (Ruth)' },
  { id: 'credit_specialist', label: 'Credit specialist' },
  { id: 'dispute_specialist', label: 'Dispute specialist' },
  { id: 'partner_success', label: 'Partner success' },
  { id: 'billing_ops', label: 'Billing ops' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'admin', label: 'Admin' },
  { id: 'system', label: 'System / automation' },
  { id: 'bankruptcy_specialist', label: 'Bankruptcy specialist' },
];

export type CommsTemplateMeta = {
  contentType?: 'html' | 'plain';
  emailProvider?: CommsEmailProviderId;
  category?: CommsTemplateCategory;
  staffRoles?: CommsStaffRoleTag[];
  layout?: 'modern' | 'editorial' | 'minimal' | 'dispute_ops';
  disputeRound?: string;
  preheader?: string;
};

export function categoryLabel(id: CommsTemplateCategory): string {
  return COMMS_TEMPLATE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryTone(id: CommsTemplateCategory): string {
  const map: Partial<Record<CommsTemplateCategory, string>> = {
    dispute_rounds: 'text-amber-300 border-amber-500/25 bg-amber-500/10',
    restore_workflow: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10',
    complaints_escalation: 'text-red-300 border-red-500/25 bg-red-500/10',
    litigation: 'text-violet-300 border-violet-500/25 bg-violet-500/10',
    sms_alerts: 'text-sky-300 border-sky-500/25 bg-sky-500/10',
    sms_nurture: 'text-fuchsia-300 border-fuchsia-500/25 bg-fuchsia-500/10',
    bankruptcy: 'text-sky-300 border-sky-500/25 bg-sky-500/10',
  };
  return map[id] ?? 'text-white/60 border-white/10 bg-white/[0.04]';
}
