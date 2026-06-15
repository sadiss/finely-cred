export type AutomationCopyTemplate = {
  id: string;
  channel: 'email' | 'sms' | 'portal' | 'meta';
  label: string;
  subject?: string;
  body: string;
  mergeTags: string[];
};

export const AUTOMATION_COPY_LIBRARY: AutomationCopyTemplate[] = [
  {
    id: 'welcome_inbound',
    channel: 'email',
    label: 'Inbound lead welcome',
    subject: 'Thanks for reaching out — {{partner.profile.fullName}}',
    body: 'Hi {{partner.profile.fullName}},\n\nThanks for your interest in Finely Cred. A specialist will review your request and follow up shortly.\n\n— Finely Cred',
    mergeTags: ['partner.profile.fullName', 'partner.profile.email'],
  },
  {
    id: 'task_nudge_sms',
    channel: 'sms',
    label: 'Task nudge SMS',
    body: 'Hi {{partner.profile.fullName}} — you have open tasks in your portal. Log in to complete your next step: {{portal.tasksUrl}}',
    mergeTags: ['partner.profile.fullName', 'portal.tasksUrl'],
  },
  {
    id: 'intel_followup',
    channel: 'email',
    label: 'Intel prospect follow-up',
    subject: 'Quick question about {{crm.company}}',
    body: 'Hi there,\n\nI noticed {{crm.company}} may benefit from structured credit + funding ops. Would a 15-minute strategy call help?\n\n— Finely Cred',
    mergeTags: ['crm.company', 'crm.contact.email'],
  },
  {
    id: 'meta_dm_reply',
    channel: 'meta',
    label: 'Meta DM auto-reply',
    body: 'Thanks for messaging Finely Cred on {{meta.channel}}! A team member will reply shortly. For faster help, book a free session: {{site.bookingUrl}}',
    mergeTags: ['meta.channel', 'site.bookingUrl'],
  },
  {
    id: 'funnel_welcome_nurture',
    channel: 'email',
    label: 'Funnel nurture day 0',
    subject: 'Your free stack is ready — {{lead.guideTitle}}',
    body: 'Hi {{lead.fullName}},\n\nYour guide is ready. Download it anytime from your link.\n\n{{agent.name}} ({{agent.role}}) is assigned to help with your next step.\n\n— Finely Cred',
    mergeTags: ['lead.fullName', 'lead.guideTitle', 'agent.name', 'agent.role'],
  },
  {
    id: 'trial_expiry_nudge',
    channel: 'email',
    label: 'Trial expiry nudge',
    subject: 'Your portal preview ends soon',
    body: 'Hi {{lead.fullName}},\n\nYour {{trial.days}}-day preview ends in {{trial.daysLeft}} days. Book a free strategy call to keep momentum: {{site.bookingUrl}}',
    mergeTags: ['lead.fullName', 'trial.days', 'trial.daysLeft', 'site.bookingUrl'],
  },
];

export function findCopyTemplate(id: string) {
  return AUTOMATION_COPY_LIBRARY.find((t) => t.id === id) ?? null;
}
