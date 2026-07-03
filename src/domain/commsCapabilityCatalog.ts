/** Searchable registry of comms capabilities — Outlook-class option surface (educational catalog). */

export type CommsCapabilityGroup = {
  id: string;
  label: string;
  options: string[];
};

export const COMMS_CAPABILITY_GROUPS: CommsCapabilityGroup[] = [
  {
    id: 'compose_headers',
    label: 'Compose & headers',
    options: [
      'To / Cc / Bcc', 'Reply-To', 'List-Unsubscribe', 'Custom headers', 'Priority flag', 'Read receipt request',
      'Delay delivery', 'Send-as alias', 'Per-tenant from domain', 'DKIM status chip', 'Bounce handling', 'Message-ID trace',
      'Thread-Id append', 'In-Reply-To', 'Preheader text', 'Subject A/B variants', 'UTF-8 safe subjects', 'Attachment slots',
      'Inline images', 'Calendar invite attach', 'ICS meeting bridge', 'Plain-text part', 'HTML part', 'Multipart alternative',
      'Snippet library', 'Emoji-safe subjects', 'CAN-SPAM physical address', 'TCPA quiet hours', 'Timezone-aware send',
      'Schedule send datetime', 'Draft autosave', 'Recall window (dry-run)', 'Send test to admin', 'Send test to partner',
      'Duplicate detection', 'Template from compose', 'Save compose as template', 'Merge preview', 'Spam score hint',
      'Link tracking wrap', 'UTM append', 'Short link inject', 'Portal deep link', 'Appointment URL merge', 'Unsubscribe footer',
    ],
  },
  {
    id: 'personalization',
    label: 'Personalization & merge',
    options: [
      '{{firstName}}', '{{lastName}}', '{{fullName}}', '{{email}}', '{{city}}', '{{state}}', '{{lane}}', '{{journeyStage}}',
      '{{trackedLink}}', '{{appointmentUrl}}', '{{portalDeepLink}}', '{{caseNumber}}', '{{bureau}}', '{{staffOnDuty}}',
      '{{brand.name}}', '{{links.dashboard}}', '{{links.reports}}', '{{links.letters}}', 'Conditional: lane=debt',
      'Conditional: stage=letters', 'Conditional: entitlement=disputes', 'Dynamic CTA by funnel', 'Geo merge blocks',
      'Offer slug merge', 'Lead magnet title', 'Course lesson title', 'Dispute round number', 'Debt case name',
      'Foreclosure sale date', 'Bankruptcy chapter', 'Funding readiness score', 'Affiliate code', 'Agent name',
      'Partner tier', 'Trial days left', 'Last login date', 'Evidence count', 'Open case count', 'Preferred channel',
      'Language locale', 'SMS segment split', 'HTML entity escape', 'Fallback if blank', 'Uppercase format pipe',
      'Currency format pipe', 'Date format pipe', 'Relative time ("in 2 days")', 'Staff portrait URL', 'Co-owner Ruth sign-off',
      'Owner Sanz escalation line', 'Compliance disclaimer block', 'Educational-only footer', 'STOP keyword line',
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery & routing',
    options: [
      'Channel: portal', 'Channel: email', 'Channel: SMS', 'New thread strategy', 'Append by subject', 'Hub topic routing',
      'Support inbox mirror', 'Specialist thread assign', 'Staff owner assign', 'Escalate to compliance', 'Escalate to Ruth',
      'Meta inbox bridge', 'Phone Hub SMS handoff', 'CRM timeline sync', 'Lead capture enroll', 'Sequence enroll trigger',
      'Task create on send', 'Webhook on send', 'Retry with backoff', 'Idempotent dedupe key', 'Partner-scoped dedupe',
      'Lead-scoped dedupe', 'Within-hours throttle', 'Daily send cap', 'Batch broadcast', 'Segment filter', 'Lane filter',
      'Entitlement filter', 'Geo filter', 'Active case filter', 'Dry-run mode', 'Live mode gate', 'Provider: Resend',
      'Provider: SendGrid', 'Provider: SES', 'Provider: Twilio SMS', 'Bounce suppress list', 'Complaint suppress list',
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & trust',
    options: [
      'Velvet Hammer scan', 'David Okonkwo queue', 'Forbidden phrase list', 'Guarantee blocker', 'Income claim blocker',
      'Deletion promise blocker', 'Score promise blocker', 'Funding approval blocker', 'Consent flag check', 'STOP enforcement',
      'Unsubscribe enforcement', 'CAN-SPAM footer inject', 'TCPA opt-in proof', 'Educational disclaimer inject',
      'AI disclosure line', 'Human executive disclosure', 'Record approval audit', 'Rewrite suggestion', 'Block send',
      'Require dual approval', 'PR risk flag', 'Mini-Miranda check', 'FDCPA validation wording', 'FCRA accuracy wording',
      'Bankruptcy not legal advice', 'State bar referral line', 'Record retention tag', 'PII minimization', 'SSN redaction',
      'Attachment virus scan (future)', 'Link domain allowlist', 'Sandbox test domain',
    ],
  },
  {
    id: 'automation',
    label: 'Automation hooks',
    options: [
      'Trigger: lead captured', 'Trigger: report uploaded', 'Trigger: letter mailed', 'Trigger: case opened',
      'Trigger: SLA breach', 'Trigger: appointment booked', 'Trigger: payment received', 'Trigger: trial ending',
      'Trigger: dispute round sent', 'Trigger: debt validation sent', 'Trigger: bankruptcy filed', 'Enroll nurture sequence',
      'Send template step', 'Create admin task', 'Notify ops agent', 'Notify co-owner Ruth', 'Automation Studio recipe link',
      'Webhook outbound', 'CRM stage advance', 'Partner journey advance', 'Score recompute', 'Evidence reminder',
      'Follow-up timer', 'No-reply bump', 'Win-back sequence', 'Affiliate nurture', 'Recruiting drip', 'Geo campaign enroll',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    options: [
      'Open tracking', 'Click tracking', 'Template performance', 'Sequence drop-off', 'A/B winner pick', 'Reply rate',
      'Bounce rate', 'Unsubscribe rate', 'Portal read receipt', 'Hub thread response time', 'Campaign ROI hint',
      'Lane conversion hint', 'Send volume by day', 'Failed delivery log', 'Dry-run audit count', 'Compliance block count',
      'Staff-assigned response SLA', 'Nurture health score', 'Digest engagement', 'SMS delivery status',
    ],
  },
];

export function countCommsCapabilities(): number {
  return COMMS_CAPABILITY_GROUPS.reduce((n, g) => n + g.options.length, 0);
}

export function searchCommsCapabilities(query: string): Array<{ group: string; option: string }> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return COMMS_CAPABILITY_GROUPS.flatMap((g) => g.options.map((option) => ({ group: g.label, option })));
  }
  return COMMS_CAPABILITY_GROUPS.flatMap((g) =>
    g.options.filter((o) => o.toLowerCase().includes(q)).map((option) => ({ group: g.label, option })),
  );
}
