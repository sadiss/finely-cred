import type { AutomationBlueprint, AutomationBlueprintCategory } from './types';

const baseCompliance = [
  'Require approval before any external email/SMS/social send unless autonomy allows low-risk execution.',
  'Block guaranteed approval, guaranteed deletion, CPN, wipe credit clean, and illegal shortcut claims.',
  'SMS requires consent proof. Email revival requires unsubscribe/compliance footer.',
];

function node(id: string, type: any, title: string, subtitle: string, detail: string, risk: any = 'low') {
  return { id, type, title, subtitle, detail, risk, locked: true };
}

export const AUTOMATION_BLUEPRINTS: AutomationBlueprint[] = [
  {
    id: 'bp-business-credit-guide-to-booking',
    title: 'Business Credit Guide → Appointment',
    category: 'lead_capture',
    summary: 'Turns business credit e-guide opt-ins into a booked consultation path with education, task creation, and sales handoff.',
    bestFor: ['business credit e-guide', 'funding readiness', 'local business owners'],
    owner: 'Appointment Architect + Revenue Captain',
    expectedOutcome: 'Guide download becomes a timed consultation path instead of sitting in the CRM.',
    nodes: [
      node('trigger', 'trigger', 'Guide form submitted', 'Source: business credit e-guide', 'Capture lead with city, source, short link, consent, and offer metadata.'),
      node('score', 'condition', 'Fit + consent check', 'Score lead and verify communication permissions', 'Business owner + funding/business-credit interest gets high priority.'),
      node('email1', 'action', 'Send educational email', 'Only if email consent or lawful basis exists', 'Send compliance-safe next-step email with guide link and booking CTA.', 'medium'),
      node('sms1', 'approval', 'SMS booking nudge', 'Requires SMS consent', 'Queue short SMS; approval required unless low-risk autonomy is enabled.', 'medium'),
      node('task', 'action', 'Create appointment task', 'Assigned to Appointment Architect', 'Due same day during local business hours.'),
      node('exit', 'exit', 'Report result', 'Emit lead/book/click/reply events', 'Update channel model and dashboard.'),
    ],
    recommendedCaps: ['Max 2 emails / 7 days', 'Max 1 SMS / 48h', 'No sends 9pm–8am local'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-tradeline-guide-to-consult',
    title: 'Tradeline Guide → Consultation',
    category: 'nurture',
    summary: 'Routes tradeline guide leads into education-first nurture, then human sales review.',
    bestFor: ['tradeline guide', 'AU buyer education', 'credit utilization questions'],
    owner: 'Nurture Concierge + Revenue Captain',
    expectedOutcome: 'Prospect understands options and limitations before any sales conversation.',
    nodes: [
      node('trigger', 'trigger', 'Tradeline guide requested', 'Resource or short link form', 'Record source/city/CTA.'),
      node('guard', 'condition', 'Risk language guard', 'No score increase guarantees', 'All outbound copy goes through compliance scan.'),
      node('lesson', 'action', 'Send explainer email', 'Education-first message', 'Explain authorized user concepts, requirements, and no guarantee disclaimer.'),
      node('wait', 'delay', 'Wait 24 hours', 'Avoid pressure', 'Delay before asking whether they want review.'),
      node('book', 'action', 'Offer review link', 'Tracked short link', 'Send booking CTA if engagement exists.', 'medium'),
      node('exit', 'exit', 'Sales queue', 'Only engaged leads', 'Add task for Revenue Captain if clicked/replied.'),
    ],
    recommendedCaps: ['Max 3-touch nurture', 'Always education-first', 'Never claim score outcome'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-credit-specialist-recruiting',
    title: 'Credit Specialist Recruiting Pipeline',
    category: 'recruiting',
    summary: 'From lead magnet or career interest into screening, interview, and onboarding task sequence.',
    bestFor: ['agents page', 'career guide', 'indeed-style applicant capture'],
    owner: 'Partner Recruiter + Professor Apex',
    expectedOutcome: 'Applicants are sorted by fit, readiness, and follow-through.',
    nodes: [
      node('trigger', 'trigger', 'Career interest captured', 'Agents/recruiting funnel', 'Capture why they applied and preferred role.'),
      node('fit', 'condition', 'Fit screen', 'Experience + availability + market', 'Score applicant and route to agent/interviewer.'),
      node('invite', 'action', 'Interview invite', 'Calendar + application link', 'Send next steps with expectations and no income promises.', 'medium'),
      node('task', 'action', 'Recruiter task', 'Assigned owner', 'Create task for human review.'),
      node('training', 'action', 'Training path', 'If approved', 'Send onboarding and compliance basics.'),
      node('exit', 'exit', 'Pipeline report', 'Accepted / hold / reject', 'Update recruiting dashboard.'),
    ],
    recommendedCaps: ['No earnings guarantees', 'Manual approval before final acceptance', 'Two-step screen before interview'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-no-show-rescue',
    title: 'No-Show Rescue',
    category: 'appointment',
    summary: 'Recovers missed consultations without sounding desperate or robotic.',
    bestFor: ['consultation no-show', 'calendar abandon', 'late cancellation'],
    owner: 'Appointment Architect',
    expectedOutcome: 'No-shows receive a respectful rebook path and are staged correctly.',
    nodes: [
      node('trigger', 'trigger', 'Appointment missed', 'Calendar/no-show event', 'Lead moved to no-show stage.'),
      node('delay', 'delay', 'Wait 30 minutes', 'Do not instantly pressure', 'Allow normal delay before outreach.'),
      node('sms', 'approval', 'Friendly SMS', 'Consent required', 'Short rebook link; no guilt or pressure.', 'medium'),
      node('email', 'action', 'Email fallback', 'Helpful tone', 'Send rebook link and “we can still help organize next steps”.'),
      node('task', 'action', 'Call task', 'If high-value', 'Human follow-up task for sales.'),
      node('exit', 'exit', 'Outcome', 'Rebook / cold / disqualified', 'Report conversion and bottleneck.'),
    ],
    recommendedCaps: ['Max 2 no-show touches / 7 days', 'Respect opt-out', 'No pressure language'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-dead-lead-revival',
    title: 'Dead Lead Revival Wave',
    category: 'reactivation',
    summary: 'Revives old leads by city and offer with clear consent/risk gates.',
    bestFor: ['cold leads', 'old resource downloads', 'past consultation requests'],
    owner: 'Revival Specialist + Compliance Cop',
    expectedOutcome: 'Old database produces replies and bookings without compliance risk.',
    nodes: [
      node('trigger', 'trigger', 'Cold lead segment', 'Last contact > 30 days', 'Segment by city, offer, consent, and engagement.'),
      node('guard', 'condition', 'Consent + opt-out guard', 'No consent = no SMS', 'Verify status before any send.', 'high'),
      node('email', 'action', 'Revival email', 'Soft restart', '“Still want the checklist?” with unsubscribe.'),
      node('sms', 'approval', 'SMS if consent', 'Manual approval by default', 'Short reply-style message with tracked link.', 'medium'),
      node('book', 'split', 'Clicked or replied?', 'Route intent', 'Clicked/replied leads create appointment task.'),
      node('exit', 'exit', 'Archive or revive', 'Clean database', 'Trash invalid contacts, revive engaged ones.'),
    ],
    recommendedCaps: ['200/night max across cities', 'No SMS without consent', 'Geo windows only'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-meta-lead-form-to-sales',
    title: 'Meta Lead Form → Sales Handoff',
    category: 'sales',
    summary: 'Takes Meta instant-form leads through speed-to-lead, appointment, and sales owner routing.',
    bestFor: ['Meta retargeting', 'lead form ads', 'local campaign cells'],
    owner: 'Paid Micro Operator + Revenue Captain',
    expectedOutcome: 'Paid leads are contacted quickly and measured honestly.',
    nodes: [
      node('trigger', 'trigger', 'Meta lead webhook', 'Instant form submitted', 'Capture campaign/ad/city/creative.'),
      node('score', 'condition', 'Duplicate + quality check', 'Prevent waste', 'Dedupe email/phone and reject junk patterns.'),
      node('task', 'action', 'Sales task in 5 minutes', 'Speed-to-lead', 'Assign to Revenue Captain or appointment setter.'),
      node('email', 'action', 'Confirmation email', 'Tracked link', 'Send booking confirmation/next step.'),
      node('sms', 'approval', 'SMS if consent', 'Short and clear', 'Queue SMS with opt-out language.', 'medium'),
      node('analytics', 'exit', 'Attribution update', 'CPL + booking rate', 'Update budget brain.'),
    ],
    recommendedCaps: ['$25/day paid plan honesty', 'Do not over-credit paid if free source assisted', 'Track by ad/city/creative'],
    complianceNotes: baseCompliance,
  },
  {
    id: 'bp-community-capture-manual',
    title: 'Community Capture Review Queue',
    category: 'content',
    summary: 'Turns community/social listening into approved replies and tracked links without automated spam.',
    bestFor: ['Reddit/local groups/manual community queues', 'public questions', 'city intent'],
    owner: 'Community Ghost + Velvet Hammer',
    expectedOutcome: 'Admin sees suggested replies and approves only safe, helpful answers.',
    nodes: [
      node('trigger', 'trigger', 'Intent mention found', 'Keyword/social watch', 'Create candidate; do not auto-post.'),
      node('draft', 'action', 'Draft helpful reply', 'No hard sell', 'Answer the question, then offer guide link if relevant.'),
      node('review', 'approval', 'Human approval', 'Required', 'Admin approves, edits, or rejects.', 'medium'),
      node('link', 'action', 'Attach tracked short link', 'Source/city encoded', 'Use right guide or consult page.'),
      node('report', 'exit', 'Track response', 'Click/lead/book', 'Feed back to channel model.'),
    ],
    recommendedCaps: ['No automated group posting', 'No fake identity', 'Value-first replies'],
    complianceNotes: baseCompliance,
  },
];

export function listBlueprintsByCategory(category?: AutomationBlueprintCategory) {
  return category ? AUTOMATION_BLUEPRINTS.filter((b) => b.category === category) : AUTOMATION_BLUEPRINTS;
}

export function getAutomationBlueprint(id: string) {
  return AUTOMATION_BLUEPRINTS.find((b) => b.id === id) ?? null;
}

export function blueprintToPlainEnglish(id: string) {
  const b = getAutomationBlueprint(id);
  if (!b) return 'Choose a blueprint to see the automation path.';
  const steps = b.nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.detail}`).join('\n');
  return `${b.title}\nOwner: ${b.owner}\nOutcome: ${b.expectedOutcome}\n\n${steps}`;
}
