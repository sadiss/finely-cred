export type MarketingMetricHelp = {
  title: string;
  body: string;
  steps?: string[];
};

const HELP: Record<string, MarketingMetricHelp> = {
  autopilot_on: {
    title: 'Growth autopilot — ON',
    body: 'The scheduler runs daily find, nurture steps, and agent review ticks while you are away. Email stays $0; SMS only sends if you turned Comms Delivery on.',
    steps: ['Check exceptions after each morning', 'Use Full console for deep logs', 'Turn off before major config changes'],
  },
  autopilot_off: {
    title: 'Growth autopilot — OFF',
    body: 'Nothing runs on a schedule. You trigger Find, sequences, and agent reviews manually from the desk or agent workrooms.',
    steps: ['Turn on when setup checks are green', 'Run tick now to test once before leaving it on'],
  },
  capability_percent: {
    title: 'Capability %',
    body: 'Each bar is a separate lane — not one blended score. 100% means that lane has the wiring, content, and flags it needs. Under 70% usually means a blocker listed on the card.',
    steps: ['Tap What\'s this? on any card', 'Open the lane to fix blockers', 'Refresh after you save settings'],
  },
  video_wizard: {
    title: 'Video wizard readiness',
    body: 'How complete your short-form / pillar video setup is — providers connected, templates, and at least one job in the pipeline.',
  },
  video_pipeline: {
    title: 'Video pipeline',
    body: 'Percent of import → understand → destinations → publish → promote stages that have real data or completed jobs.',
  },
  voice_previews: {
    title: 'Voice previews',
    body: 'Voice catalog + render health — can Finely generate previews without falling back to browser TTS?',
  },
  course_builder: {
    title: 'Course builder',
    body: 'Courses with lessons, attached videos, and publish-ready structure in Training Academy.',
  },
  marketing_domain: {
    title: 'Marketing domain',
    body: 'Find readiness, mail setup, desk flag, and Caleb auto-find configuration combined into one readiness score.',
  },
  agents_domain: {
    title: 'Growth agents',
    body: 'Average maturity % across Caleb, Alex, Miriam, and the rest — each agent has its own setup checklist in their workroom.',
  },
  agent_readiness: {
    title: 'Agent readiness %',
    body: 'Checklist items complete for this specialist (API keys, flags, first run). Not revenue — operational readiness only.',
  },
  nurture_active: {
    title: 'Active nurture',
    body: 'Partners currently enrolled in an email sequence. $0 channel unless you enabled SMS steps and Comms Delivery.',
  },
  exceptions: {
    title: 'Autopilot exceptions',
    body: 'Runs that failed or need human review from the last autopilot tick — open Full console to clear them.',
  },
  weekly_focus: {
    title: 'Co-owner weekly focus',
    body: 'Esther + Caleb align on one lane and city this week. All find queries and content angles should match this focus.',
  },
  booked_7d: {
    title: 'Booked (7 days)',
    body: 'Consultation sessions booked in CRM/calendar in the last 7 days — Alex owns follow-up from here.',
  },
  channel_ready: {
    title: 'Channel check — ready',
    body: 'This official API path is wired. You can automate posts or replies on this channel.',
  },
  channel_setup: {
    title: 'Channel check — setup',
    body: 'One or more steps still missing — connect OAuth, add env vars, or finish Social Hub settings.',
  },
  sms_live: {
    title: 'SMS — LIVE',
    body: 'Comms Delivery is ON. Texts send through Twilio and incur per-message carrier cost. Email sequences remain $0.',
  },
  sms_dormant: {
    title: 'SMS — dormant ($0)',
    body: 'Comms Delivery is OFF. Nurture SMS steps are wired but nothing sends until you flip the flag and add Twilio secrets.',
  },
  promote_lane: {
    title: 'Promote lane',
    body: 'Top-of-funnel: magnets, social, content, CMO angles, and live find. Goal = new names in pipeline.',
  },
  nurture_lane: {
    title: 'Nurture lane',
    body: 'Middle-of-funnel: sequences, automations, academy drips. Goal = warm partners toward a booked session.',
  },
  communicate_lane: {
    title: 'Communicate lane',
    body: 'Bottom-of-funnel: inbox, campaigns, calendar, phone. Goal = conversations and booked calls.',
  },
};

export function getMarketingMetricHelp(id: string): MarketingMetricHelp {
  return (
    HELP[id] ?? {
      title: 'What am I looking at?',
      body: 'This tile shows live marketing ops data from your workspace — not a static placeholder.',
    }
  );
}

export function capabilityDomainHelpId(domainId: string): string {
  if (domainId in HELP) return domainId;
  if (domainId === 'marketing') return 'marketing_domain';
  if (domainId === 'agents') return 'agents_domain';
  if (domainId === 'ctas') return 'capability_percent';
  return 'capability_percent';
}
