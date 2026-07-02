import type { HumanStaffKnowledgeCard } from './types';

export const HUMAN_STAFF_KNOWLEDGE_BASE: HumanStaffKnowledgeCard[] = [
  {
    id: 'deep-swarm-ownership',
    title: 'Deep Swarm ownership map',
    departmentId: 'lead_intel',
    agentIds: ['pipeline_titan', 'scout_supreme', 'night_owl_intel', 'switchboard'],
    level: 'expert',
    summary: 'Deep Swarm is a lead-intel department process with multiple staff owners. It is not a single agent pressing a button.',
    rules: [
      'Pipeline Titan owns the lead target and throughput quality.',
      'Scout Supreme owns source plans, query variation, and discovery quality.',
      'Night Owl Intel owns overnight queue progress and morning handoff.',
      'Switchboard owns queue/function reliability and blocked integration reporting.',
      'The system may run the queue, but staff own the interpretation and handoff.',
    ],
    examples: [
      'If a user clicks Start Swarm, show active owners and what each one is doing.',
      'If a worker is blocked, notify Switchboard and Pipeline Titan, not every staff member.',
      'If a hot lead appears, notify Appointment Architect or Revenue Captain depending on intent.',
    ],
    handoffTriggers: ['new_hot_lead', 'swarm_stuck', 'worker_blocked', 'city_source_thin', 'overnight_summary_ready'],
  },
  {
    id: 'lead-action-center-standard',
    title: 'Lead Action Center standard',
    departmentId: 'lead_intel',
    agentIds: ['pipeline_titan', 'appointment_architect', 'liora_lifecycle', 'revenue_captain'],
    level: 'expert',
    summary: 'A discovered lead is not useful until the system produces the next best action, owner, funnel, message, and tracked link.',
    rules: [
      'Every lead card must explain why the lead matters.',
      'Every lead card must show the recommended funnel and short link.',
      'Every lead card must show the assigned owner and approval gate.',
      'Every suggested message must be specific to source, city, intent, and role.',
      'SMS should not be suggested unless consent exists or the workflow is manually approved under lawful basis.',
    ],
    examples: [
      'Business owner with funding language -> Business Funding Readiness funnel -> Revenue Captain + Appointment Architect.',
      'Person searching credit specialist jobs -> Credit Specialist recruiting funnel -> Partner Recruiter.',
      'Local journalist/podcast signal -> PR pitch route -> PR Sentinel.',
    ],
    handoffTriggers: ['lead_scored_hot', 'needs_booking', 'needs_sales_review', 'needs_recruiting_screen', 'needs_pr_pitch'],
  },
  {
    id: 'human-feeling-agent-replies',
    title: 'Human-feeling internal agent replies',
    departmentId: 'executive_suite',
    agentIds: ['professor_apex', 'fun_captain', 'liora_lifecycle'],
    level: 'advanced',
    summary: 'Staff replies should feel varied, contextual, and useful while staying transparent that they are AI/system staff.',
    rules: [
      'Do not repeat the same opening line across messages.',
      'Reference current mission context, selected city, lead type, or blocker.',
      'Give one clear next action instead of a wall of generic text.',
      'Use each agent personality, but do not let style overpower execution.',
      'External customer messages stay professional Finely Cred brand, not playful staff banter.',
    ],
    examples: [
      'Pipeline Titan: "We have discovery, but not enough action-ready cards yet. I am putting Scout on source depth and Appointment on hot handoffs."',
      'Liora: "I will rewrite the follow-up so it sounds like it came from context, not a template."',
      'Switchboard: "The workflow is blocked by missing function deployment, not by strategy. Fix path: deploy, test tick, verify log."',
    ],
    handoffTriggers: ['agent_message_repeated', 'user_confused', 'mission_needs_summary', 'external_copy_requested'],
  },
  {
    id: 'geo-growth-realness',
    title: 'Geo Growth must be real',
    departmentId: 'geo_growth',
    agentIds: ['geo_commander', 'local_news_radar', 'retarget_architect', 'analytics_beast'],
    level: 'expert',
    summary: 'Geo is not just a city list. It needs local pages, zip focus, source mix, attribution, local content angles, and city owners.',
    rules: [
      'Each city needs a visible readiness state.',
      'Each city needs at least one active offer/funnel and one local content angle.',
      'Each city needs tracked short links so lead source can be attributed.',
      'Paid micro-budget cannot be expected to deliver 50 leads by itself.',
      'If a city is thin, recommend source expansion or page creation, not fake success.',
    ],
    examples: [
      'Dallas is active but source mix is thin on partner referrals -> assign Affiliate Wrangler.',
      'Houston has business credit demand but no strong local proof -> assign Local News Radar + Goldframe.',
      'Atlanta has clicks but low bookings -> assign Appointment Architect.',
    ],
    handoffTriggers: ['city_readiness_red', 'geo_page_missing', 'paid_cpl_high', 'local_angle_found', 'source_mix_imbalanced'],
  },
  {
    id: 'role-clarity',
    title: 'Role clarity rule',
    departmentId: 'executive_suite',
    agentIds: ['professor_apex', 'pipeline_titan', 'cmo_prime'],
    level: 'foundation',
    summary: 'Every mission must clearly identify who owns discovery, message, approval, delivery, and follow-up.',
    rules: [
      'Lead owner is the staff member accountable for outcome.',
      'Support owners contribute work products, not vague help.',
      'Escalation owner handles blocked credentials, compliance, or missing proof.',
      'Future real staff must be shown separately from active AI staff.',
      'The user should be able to select one, two, or three staff members for a mission.',
    ],
    examples: [
      'Deep Swarm -> Pipeline Titan leads, Scout Supreme discovers, Switchboard watches queue.',
      'Appointment Blitz -> Appointment Architect leads, Liora writes, Revenue Captain prepares sales notes.',
      'Recruiting Drive -> Partner Recruiter leads, Affiliate Wrangler activates, Velvet Hammer checks claims.',
    ],
    handoffTriggers: ['mission_created', 'owner_unclear', 'future_staff_needed', 'blocked_by_credentials'],
  },
  {
    id: 'agent-notifications',
    title: 'Agent-to-agent notifications',
    departmentId: 'automation_ops',
    agentIds: ['switchboard', 'professor_apex', 'pipeline_titan', 'velvet_hammer'],
    level: 'advanced',
    summary: 'Agents should notify each other when a handoff, blocker, risk, or decision changes.',
    rules: [
      'A notification must have sender, recipient, reason, priority, route hint, and action label.',
      'Do not spam all agents; notify the owner and relevant support staff.',
      'High-risk copy always notifies Velvet Hammer.',
      'Blocked queue/function issues notify Switchboard.',
      'Hot lead handoffs notify the next owner: appointment, sales, recruiting, or PR.',
    ],
    examples: [
      'Scout -> Pipeline: "Dallas search found 12 warm business funding signals."',
      'Pipeline -> Appointment: "Two leads need booking messages with /consultation short link."',
      'Liora -> Velvet Hammer: "Review reactivation message before send."',
    ],
    handoffTriggers: ['handoff_created', 'risk_detected', 'approval_needed', 'worker_failed', 'hot_lead_ready'],
  },
  {
    id: 'conversation-durability',
    title: 'Conversation durability',
    departmentId: 'nurture_comms',
    agentIds: ['liora_lifecycle', 'inbox_triage', 'professor_apex'],
    level: 'expert',
    summary: 'Agent conversations should remember mission context, previous answers, decisions, blockers, and user preferences.',
    rules: [
      'Store mission thread memory separately from global staff profile.',
      'Summaries should update after each mission turn.',
      'Agents should avoid repeating recent phrase patterns.',
      'Threads should include next action and owner.',
      'A user should be able to re-open a mission and understand where it left off.',
    ],
    examples: [
      'A staff thread remembers that Dallas is active, Houston needs local pages, and Meta is blocked.',
      'A repeated response is rewritten with a different opening, different structure, and more specific next step.',
      'A mission thread stores "User wants brief, direct answers" as memory.',
    ],
    handoffTriggers: ['thread_reopened', 'user_preference_detected', 'agent_repetition_detected', 'mission_paused'],
  },
  {
    id: 'external-communication-boundary',
    title: 'Internal staff vs external customer voice',
    departmentId: 'compliance',
    agentIds: ['velvet_hammer', 'liora_lifecycle', 'cmo_prime'],
    level: 'expert',
    summary: 'Internal staff can be energetic and human-feeling. External outreach must be transparent, brand-safe, and compliant.',
    rules: [
      'Do not pretend AI staff are real people to customers.',
      'Do not write outreach that claims a personal conversation happened when it did not.',
      'Do not use stealth, anti-detection, or impersonation workflows.',
      'Use consent checks before SMS and unsubscribe language for marketing email.',
      'Keep credit/funding language qualified and safe.',
    ],
    examples: [
      'Internal: "Pipeline Titan says Dallas is getting spicy."',
      'External: "Finely Cred noticed your interest in business credit resources. Here is a guide that may help."',
      'Unsafe: "I personally saw your post and wanted to help delete your bad credit."',
    ],
    handoffTriggers: ['external_message_requested', 'credit_claim_detected', 'sms_send_requested', 'high_risk_offer'],
  },
];

export function getKnowledgeForAgent(agentId: string): HumanStaffKnowledgeCard[] {
  return HUMAN_STAFF_KNOWLEDGE_BASE.filter((card) => card.agentIds.includes(agentId as any));
}

export function getKnowledgeForDepartment(departmentId: string): HumanStaffKnowledgeCard[] {
  return HUMAN_STAFF_KNOWLEDGE_BASE.filter((card) => card.departmentId === departmentId);
}

export function findKnowledgeByTrigger(trigger: string): HumanStaffKnowledgeCard[] {
  const q = trigger.toLowerCase();
  return HUMAN_STAFF_KNOWLEDGE_BASE.filter((card) => card.handoffTriggers.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase())));
}
