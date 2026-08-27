import type { AgentPersonaId } from '../domain/agentPersonas';
import { CO_OWNER_IDENTITY } from '../domain/coOwnerPersona';

export type PublicChatPersonaPresentation = {
  firstName: string;
  title: string;
  tagline: string;
  welcome: string;
  staffMemberId?: string;
  headerGradient: string;
  avatarGradient: string;
  avatarUrl: string;
  accentText: string;
  accentBorder: string;
  staffBubble: string;
  chipClass: string;
  initials: string;
};

export const PERSONA_PRESENTATION_STYLES: Record<
  AgentPersonaId,
  Omit<PublicChatPersonaPresentation, 'initials' | 'avatarUrl' | 'staffMemberId'>
> = {
  finely_advisor: {
    firstName: 'Morgan',
    title: 'Lead Credit Advisor',
    tagline: 'Warm, clear guidance — you are already on the team.',
    welcome:
      "Think of me as the person who helps you map the safest next step — disputes, restore, or funding. What's on your mind?",
    headerGradient: 'from-emerald-500/35 via-teal-400/25 to-cyan-400/15',
    avatarGradient: 'from-emerald-300 to-teal-400',
    accentText: 'text-emerald-100',
    accentBorder: 'border-emerald-300/45',
    staffBubble:
      'bg-gradient-to-br from-emerald-600/55 to-teal-700/50 border-emerald-200/35 shadow-[0_4px_24px_-8px_rgba(110,231,183,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30',
  },
  dispute_coach: {
    firstName: 'Taylor',
    title: 'Dispute Workflow Coach',
    tagline: 'Evidence-first, calm, step-by-step — no guesswork.',
    welcome:
      "I specialize in FCRA dispute workflows: what to send, what to upload, and how to read bureau responses. Tell me what you're working on.",
    headerGradient: 'from-violet-600/20 via-emerald-600/15 to-teal-500/10',
    avatarGradient: 'from-violet-400 to-emerald-500',
    accentText: 'text-violet-200',
    accentBorder: 'border-violet-400/35',
    staffBubble:
      'bg-gradient-to-br from-violet-600/50 to-emerald-600/45 border-violet-200/35 shadow-[0_4px_24px_-8px_rgba(167,139,250,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-violet-500/15 text-violet-100 border-violet-400/30',
  },
  funding_strategist: {
    firstName: 'Marcus',
    title: 'Funding & Business Credit Strategist',
    tagline: 'Underwriting-aware sequencing — realistic timelines.',
    welcome:
      "I help with business credit, vendor ladders, and funding readiness. We'll keep it practical and compliance-safe. What goal are you building toward?",
    headerGradient: 'from-sky-500/20 via-emerald-600/15 to-violet-600/10',
    avatarGradient: 'from-sky-400 to-emerald-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/35',
    staffBubble:
      'bg-gradient-to-br from-sky-600/50 to-emerald-600/45 border-sky-200/35 shadow-[0_4px_24px_-8px_rgba(56,189,248,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/30',
  },
  nurture_concierge: {
    firstName: 'Avery',
    title: 'Welcome Concierge',
    tagline: 'Low-pressure — here to orient you and book your session.',
    welcome:
      "If you're exploring options, that's perfect. I'll help you find the right guide, session, or path without any pressure. Where should we start?",
    headerGradient: 'from-rose-500/15 via-emerald-500/15 to-sky-500/10',
    avatarGradient: 'from-rose-400 to-emerald-400',
    accentText: 'text-rose-200',
    accentBorder: 'border-rose-400/30',
    staffBubble:
      'bg-gradient-to-br from-rose-600/45 to-emerald-500/40 border-rose-200/30 shadow-[0_4px_24px_-8px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-rose-500/15 text-rose-100 border-rose-400/25',
  },
  social_creator: {
    firstName: 'Jamie',
    title: 'Brand & Social',
    tagline: 'Engaging, compliant content.',
    welcome: 'Hi — Jamie from the brand team. How can I help?',
    headerGradient: 'from-fuchsia-500/15 to-emerald-500/10',
    avatarGradient: 'from-fuchsia-400 to-violet-500',
    accentText: 'text-fuchsia-200',
    accentBorder: 'border-fuchsia-400/30',
    staffBubble: 'bg-slate-800/90 border-fuchsia-400/20',
    chipClass: 'bg-fuchsia-500/15 text-fuchsia-100 border-fuchsia-400/25',
  },
  support_specialist: {
    firstName: 'Jordan',
    title: 'Portal Support Specialist',
    tagline: 'Patient, process-focused — walks you through every click.',
    welcome: 'I help partners navigate the portal, uploads, and tasks. What do you need help with?',
    headerGradient: 'from-sky-500/20 via-emerald-500/12 to-teal-500/10',
    avatarGradient: 'from-sky-400 to-teal-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/35',
    staffBubble: 'bg-gradient-to-br from-slate-800/95 to-sky-950/60 border-sky-400/25',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/30',
  },
  appointment_setter: {
    firstName: 'Sam',
    title: 'Session Coordinator',
    tagline: 'Friendly scheduling — finds a time that works for you.',
    welcome:
      "I coordinate strategy calls and calendar bookings. Tell me your goal and timezone, and we'll get you on the calendar.",
    headerGradient: 'from-sky-500/20 via-emerald-500/15 to-teal-500/10',
    avatarGradient: 'from-sky-400 to-emerald-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/35',
    staffBubble: 'bg-gradient-to-br from-slate-800/95 to-sky-950/60 border-sky-400/25',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/30',
  },
  sales_closer: {
    firstName: 'Riley',
    title: 'Solutions Advisor',
    tagline: 'Consultative — matches you to DIY or done-for-you without hype.',
    welcome:
      'I help people choose the right Finely path (DIY, DFY, tradelines, books). No pressure — just clarity. What outcome are you aiming for?',
    headerGradient: 'from-violet-500/20 via-emerald-500/12 to-sky-500/10',
    avatarGradient: 'from-violet-400 to-sky-500',
    accentText: 'text-violet-200',
    accentBorder: 'border-violet-400/35',
    staffBubble: 'bg-gradient-to-br from-slate-800/95 to-violet-950/60 border-violet-400/25',
    chipClass: 'bg-violet-500/15 text-violet-100 border-violet-400/30',
  },
  lead_converter: {
    firstName: 'Cameron',
    title: 'Revenue Activation Director',
    tagline: 'One clear next step — trial to first win.',
    welcome:
      "I'll help you activate your path, upload your first report, and lock the next step. Ready when you are.",
    headerGradient: 'from-emerald-500/15 to-sky-500/15',
    avatarGradient: 'from-emerald-400 to-sky-500',
    accentText: 'text-emerald-200',
    accentBorder: 'border-emerald-400/30',
    staffBubble: 'bg-slate-800/90 border-emerald-400/25',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/25',
  },
  debt_strategist: {
    firstName: 'Casey',
    title: 'Debt Strategy Specialist',
    tagline: 'Calm, documentation-first — validation & summons awareness.',
    welcome:
      "I guide debt validation and collections workflows with a documentation-first mindset. Educational only, not legal advice. What's your situation?",
    headerGradient: 'from-rose-500/18 via-emerald-600/12 to-violet-500/10',
    avatarGradient: 'from-rose-400 to-violet-500',
    accentText: 'text-rose-200',
    accentBorder: 'border-rose-400/35',
    staffBubble:
      'bg-gradient-to-br from-rose-600/50 to-violet-600/45 border-rose-200/35 shadow-[0_4px_24px_-8px_rgba(244,114,182,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-rose-500/15 text-rose-100 border-rose-400/30',
  },
  ops_copilot: {
    firstName: 'Ops',
    title: 'Operations Co-Pilot',
    tagline: 'Precise admin assistance.',
    welcome: 'Ops co-pilot online — how can I assist?',
    headerGradient: 'from-slate-500/20 to-emerald-500/10',
    avatarGradient: 'from-slate-400 to-emerald-500',
    accentText: 'text-slate-200',
    accentBorder: 'border-slate-400/30',
    staffBubble: 'bg-slate-800/90 border-slate-400/25',
    chipClass: 'bg-slate-500/15 text-slate-100 border-slate-400/25',
  },
  letter_ops_agent: {
    firstName: 'Kai',
    title: 'Letter Operations Agent',
    tagline: 'Draft review, factual findings, mail prep.',
    welcome: 'I help review dispute letter drafts and mail queues. Which letter are we looking at?',
    headerGradient: 'from-teal-500/20 to-emerald-500/10',
    avatarGradient: 'from-teal-400 to-emerald-500',
    accentText: 'text-teal-200',
    accentBorder: 'border-teal-400/30',
    staffBubble: 'bg-slate-800/90 border-teal-400/25',
    chipClass: 'bg-teal-500/15 text-teal-100 border-teal-400/25',
  },
  compliance_agent: {
    firstName: 'Renee',
    title: 'Compliance Review Agent',
    tagline: 'Escalations, complaints, careful review.',
    welcome: 'I help flag high-risk language and escalation paths. What needs a second look?',
    headerGradient: 'from-rose-500/15 to-slate-500/10',
    avatarGradient: 'from-rose-400 to-slate-500',
    accentText: 'text-rose-200',
    accentBorder: 'border-rose-400/30',
    staffBubble: 'bg-slate-800/90 border-rose-400/25',
    chipClass: 'bg-rose-500/15 text-rose-100 border-rose-400/25',
  },
  education_coach: {
    firstName: 'Priya',
    title: 'Partner Education Coach',
    tagline: 'Courses, checklists, steady progress.',
    welcome: "I'm here to walk you through lessons and checklists one step at a time. Where are you in the program?",
    headerGradient: 'from-sky-500/15 to-emerald-500/10',
    avatarGradient: 'from-sky-400 to-emerald-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/30',
    staffBubble: 'bg-slate-800/90 border-sky-400/25',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/25',
  },
  affiliate_specialist: {
    firstName: 'Miles',
    title: 'Affiliate Success Specialist',
    tagline: 'Referrals, QR kits, compliant promos.',
    welcome: 'I help affiliates set up links, QR kits, and compliant promo copy. What are you promoting?',
    headerGradient: 'from-violet-500/15 to-emerald-500/10',
    avatarGradient: 'from-violet-400 to-emerald-500',
    accentText: 'text-violet-200',
    accentBorder: 'border-violet-400/30',
    staffBubble: 'bg-slate-800/90 border-violet-400/25',
    chipClass: 'bg-violet-500/15 text-violet-100 border-violet-400/25',
  },
  processing_agent: {
    firstName: 'Elena',
    title: 'Processing Agent',
    tagline: 'Report triage, bureau rounds, timelines.',
    welcome: 'I triage uploaded reports and track bureau round progress. Tell me where you are in the process.',
    headerGradient: 'from-emerald-500/20 via-teal-500/15 to-sky-500/10',
    avatarGradient: 'from-teal-400 to-emerald-500',
    accentText: 'text-teal-200',
    accentBorder: 'border-teal-400/30',
    staffBubble: 'bg-gradient-to-br from-teal-600/50 to-emerald-600/45 border-teal-200/35',
    chipClass: 'bg-teal-500/15 text-teal-100 border-teal-400/25',
  },
  evidence_specialist: {
    firstName: 'Nora',
    title: 'Evidence & Documentation Specialist',
    tagline: 'Proof packs, vault uploads, exhibits.',
    welcome: 'I help organize ID scans, tradeline screenshots, and evidence packs before you mail. What do you need to attach?',
    headerGradient: 'from-emerald-500/15 to-sky-500/10',
    avatarGradient: 'from-emerald-400 to-sky-500',
    accentText: 'text-emerald-200',
    accentBorder: 'border-emerald-400/30',
    staffBubble: 'bg-slate-800/90 border-emerald-400/25',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/25',
  },
  crm_intake_specialist: {
    firstName: 'Quinn',
    title: 'CRM Intake Specialist',
    tagline: 'Lead routing, lane fit, fast intake.',
    welcome: 'I help match you to the right lane and specialist. What brought you to Finely Cred today?',
    headerGradient: 'from-slate-500/20 to-emerald-500/10',
    avatarGradient: 'from-slate-400 to-emerald-500',
    accentText: 'text-slate-200',
    accentBorder: 'border-slate-400/30',
    staffBubble: 'bg-slate-800/90 border-slate-400/25',
    chipClass: 'bg-slate-500/15 text-slate-100 border-slate-400/25',
  },
  underwriting_analyst: {
    firstName: 'Leo',
    title: 'Funding Underwriting Analyst',
    tagline: 'Readiness review, inquiry discipline.',
    welcome: 'I review funding readiness and business credit sequencing. What funding goal are you building toward?',
    headerGradient: 'from-sky-500/18 via-emerald-600/12 to-violet-500/10',
    avatarGradient: 'from-sky-400 to-violet-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/30',
    staffBubble: 'bg-gradient-to-br from-sky-600/45 to-violet-600/40 border-sky-200/30',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/30',
  },
  finely_coowner: {
    firstName: CO_OWNER_IDENTITY.name,
    title: CO_OWNER_IDENTITY.title,
    tagline: 'Validation-first doctrine · ops · stewardship · launch.',
    welcome: `${CO_OWNER_IDENTITY.name} here — your co-owner at Finely Cred. Credit, debt validation, funding, ops, or business priorities — what do you need today?`,
    headerGradient: 'from-violet-500/20 via-fuchsia-600/15 to-purple-500/10',
    avatarGradient: 'from-violet-500 to-fuchsia-600',
    accentText: 'text-violet-200',
    accentBorder: 'border-violet-400/30',
    staffBubble: 'bg-gradient-to-br from-violet-600/50 to-fuchsia-600/45 border-violet-200/30',
    chipClass: 'bg-violet-500/15 text-violet-100 border-violet-400/25',
  },
};

export function welcomeForDutyStaff(welcome: string, catalogFirst: string, dutyFirst: string): string {
  if (!dutyFirst || !catalogFirst || dutyFirst === catalogFirst) return welcome;
  return welcome.replace(new RegExp(`\\b${catalogFirst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`), dutyFirst);
}
