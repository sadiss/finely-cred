import type { AutomationTrigger } from '../../domain/automationStudio';

export type TriggerCatalogEntry = {
  id: string;
  group: 'core' | 'crm' | 'partner' | 'channels' | 'meta';
  label: string;
  description: string;
  sample: AutomationTrigger;
  tier: 'live' | 'preview';
};

export const AUTOMATION_TRIGGER_CATALOG: TriggerCatalogEntry[] = [
  { id: 'manual', group: 'core', label: 'Manual', description: 'Run on demand from Automation Studio.', sample: { type: 'manual' }, tier: 'live' },
  { id: 'interval', group: 'core', label: 'Interval', description: 'Run on a schedule while autopilot is active.', sample: { type: 'interval', everyHours: 24 }, tier: 'live' },
  { id: 'form_submit', group: 'channels', label: 'Form submit', description: 'Public lead capture or funnel form submitted.', sample: { type: 'form_submit', formId: 'lead_capture' }, tier: 'preview' },
  { id: 'crm_record_created', group: 'crm', label: 'CRM record created', description: 'New prospect or inbound lead in CRM.', sample: { type: 'crm_record_created', pipelineId: 'inbound' }, tier: 'preview' },
  { id: 'crm_stage_changed', group: 'crm', label: 'CRM stage changed', description: 'Record moves to a pipeline stage.', sample: { type: 'crm_stage_changed', stage: 'booked' }, tier: 'live' },
  { id: 'partner_stage_changed', group: 'partner', label: 'Partner stage changed', description: 'Customer journey stage updated.', sample: { type: 'partner_stage_changed', stage: 'analysis' }, tier: 'live' },
  { id: 'webhook_inbound', group: 'channels', label: 'Webhook inbound', description: 'Generic webhook ingress (Stripe, Nora, custom).', sample: { type: 'webhook_inbound', provider: 'generic' }, tier: 'preview' },
  { id: 'meta_message', group: 'meta', label: 'Meta message', description: 'Facebook Page or Instagram DM received.', sample: { type: 'meta_message_received', channel: 'messenger' }, tier: 'preview' },
  { id: 'meta_lead', group: 'meta', label: 'Meta Lead Ad', description: 'Lead Ads form submission from Facebook/Instagram.', sample: { type: 'meta_lead_form' }, tier: 'preview' },
  { id: 'funnel_signup', group: 'channels', label: 'Funnel signup', description: 'Lead magnet or funnel form completed.', sample: { type: 'funnel_signup', funnelId: 'credit_dispute' }, tier: 'live' },
  { id: 'funnel_session_booked', group: 'channels', label: 'Funnel session booked', description: 'Inline strategy call requested from funnel success.', sample: { type: 'funnel_session_booked' }, tier: 'live' },
  { id: 'trial_expiring', group: 'partner', label: 'Trial expiring', description: 'Lead magnet trial ends within N days.', sample: { type: 'trial_expiring', daysBefore: 2 }, tier: 'preview' },
  { id: 'billing_past_due', group: 'partner', label: 'Billing past due', description: 'Subscription payment overdue — dunning nudge.', sample: { type: 'billing_past_due', daysSince: 3 }, tier: 'live' },
  { id: 'win_back', group: 'partner', label: 'Trial win-back', description: 'Expired trial without paid conversion.', sample: { type: 'win_back', daysSinceExpiry: 1 }, tier: 'live' },
  { id: 'library_open', group: 'partner', label: 'Library open', description: 'Partner opens a book in My Library.', sample: { type: 'library_open', bookSlug: 'sovereign-blueprint' }, tier: 'preview' },
  { id: 'voice_rendered', group: 'core', label: 'Voice asset rendered', description: 'Voice Studio finished rendering audio.', sample: { type: 'voice_asset_rendered', contentType: 'guide' }, tier: 'preview' },
  { id: 'purchase_completed', group: 'channels', label: 'Purchase completed', description: 'Book or package purchase finalized.', sample: { type: 'purchase_completed', productType: 'book' }, tier: 'live' },
  { id: 'task_created', group: 'partner', label: 'Task created', description: 'New Work OS task assigned.', sample: { type: 'task_created' }, tier: 'live' },
  { id: 'task_completed', group: 'partner', label: 'Task completed', description: 'Work OS task marked done.', sample: { type: 'task_completed' }, tier: 'live' },
  { id: 'task_result_recorded', group: 'partner', label: 'Task result recorded', description: 'Partner saved actual outcome / evidence on a task.', sample: { type: 'task_result_recorded' }, tier: 'live' },
  { id: 'course_lesson_agent', group: 'core', label: 'Course lesson agent run', description: 'Course editor lesson agent narrated + spawned checklist tasks.', sample: { type: 'course_lesson_agent_run' }, tier: 'live' },
  { id: 'task_overdue', group: 'partner', label: 'Task overdue', description: 'Task passed SLA due date.', sample: { type: 'task_overdue' }, tier: 'live' },
  { id: 'dispute_letter_mailed', group: 'partner', label: 'Dispute letter mailed', description: 'FCRA bureau window starts.', sample: { type: 'dispute_letter_mailed' }, tier: 'live' },
  { id: 'lead_scored', group: 'crm', label: 'Lead scored', description: 'ML fit score computed on capture.', sample: { type: 'lead_scored', minScore: 58, band: 'hot' }, tier: 'live' },
];
