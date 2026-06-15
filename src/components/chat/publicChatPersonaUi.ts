import type { AgentPersona, AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { ensureStaffRosterSeeded, resolveStaffOnDuty } from '../../data/staffRoster';
import type { StaffMember } from '../../domain/staffMember';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerPersona';
import { resolveStaffPortraitUrl } from '../../lib/staffPortrait';

export type PublicChatPersonaPresentation = {
  firstName: string;
  title: string;
  tagline: string;
  welcome: string;
  /** Resolved roster member when on duty — drives voice profile mapping */
  staffMemberId?: string;
  /** Tailwind gradient for avatar ring / header accent */
  headerGradient: string;
  avatarGradient: string;
  /** Portrait illustration — deterministic per persona */
  avatarUrl: string;
  accentText: string;
  accentBorder: string;
  staffBubble: string;
  chipClass: string;
  initials: string;
};

const PRESENTATION: Record<AgentPersonaId, Omit<PublicChatPersonaPresentation, 'initials' | 'avatarUrl'>> = {
  finely_advisor: {
    firstName: 'Morgan',
    title: 'Lead Credit Advisor',
    tagline: 'Warm, clear guidance — you’re already on the team.',
    welcome:
      "Hey — I'm Morgan, your lead advisor at Finely Cred. Think of me as the person who helps you map the safest next step — disputes, restore, or funding. What's on your mind?",
    headerGradient: 'from-emerald-500/35 via-teal-400/25 to-cyan-400/15',
    avatarGradient: 'from-emerald-300 to-teal-400',
    accentText: 'text-emerald-100',
    accentBorder: 'border-emerald-300/45',
    staffBubble: 'bg-gradient-to-br from-emerald-600/55 to-teal-700/50 border-emerald-200/35 shadow-[0_4px_24px_-8px_rgba(110,231,183,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30',
  },
  dispute_coach: {
    firstName: 'Taylor',
    title: 'Dispute Workflow Coach',
    tagline: 'Evidence-first, calm, step-by-step — no guesswork.',
    welcome:
      "Hi — Taylor here. I specialize in FCRA dispute workflows: what to send, what to upload, and how to read bureau responses. Tell me what you're working on.",
    headerGradient: 'from-violet-600/20 via-emerald-600/15 to-teal-500/10',
    avatarGradient: 'from-violet-400 to-emerald-500',
    accentText: 'text-violet-200',
    accentBorder: 'border-violet-400/35',
    staffBubble: 'bg-gradient-to-br from-violet-600/50 to-emerald-600/45 border-violet-200/35 shadow-[0_4px_24px_-8px_rgba(167,139,250,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-violet-500/15 text-violet-100 border-violet-400/30',
  },
  funding_strategist: {
    firstName: 'Marcus',
    title: 'Funding & Business Credit Strategist',
    tagline: 'Underwriting-aware sequencing — realistic timelines.',
    welcome:
      "Marcus here — I help with business credit, vendor ladders, and funding readiness. We'll keep it practical and compliance-safe. What goal are you building toward?",
    headerGradient: 'from-amber-500/20 via-emerald-600/15 to-teal-600/10',
    avatarGradient: 'from-amber-400 to-emerald-500',
    accentText: 'text-amber-200',
    accentBorder: 'border-amber-400/35',
    staffBubble: 'bg-gradient-to-br from-amber-600/50 to-emerald-600/45 border-amber-200/35 shadow-[0_4px_24px_-8px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-amber-500/15 text-amber-100 border-amber-400/30',
  },
  nurture_concierge: {
    firstName: 'Avery',
    title: 'Welcome Concierge',
    tagline: 'Low-pressure — here to orient you and book your session.',
    welcome:
      "Welcome — I'm Avery. If you're exploring options, that's perfect. I'll help you find the right guide, session, or path without any pressure. Where should we start?",
    headerGradient: 'from-rose-500/15 via-emerald-500/15 to-cyan-500/10',
    avatarGradient: 'from-rose-400 to-emerald-400',
    accentText: 'text-rose-200',
    accentBorder: 'border-rose-400/30',
    staffBubble: 'bg-gradient-to-br from-rose-600/45 to-emerald-500/40 border-rose-200/30 shadow-[0_4px_24px_-8px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-rose-500/15 text-rose-100 border-rose-400/25',
  },
  social_creator: {
    firstName: 'Jamie',
    title: 'Brand & Social',
    tagline: 'Engaging, compliant content.',
    welcome: "Hi — Jamie from the brand team. How can I help?",
    headerGradient: 'from-fuchsia-500/15 to-emerald-500/10',
    avatarGradient: 'from-fuchsia-400 to-pink-500',
    accentText: 'text-fuchsia-200',
    accentBorder: 'border-fuchsia-400/30',
    staffBubble: 'bg-slate-800/90 border-fuchsia-400/20',
    chipClass: 'bg-fuchsia-500/15 text-fuchsia-100 border-fuchsia-400/25',
  },
  support_specialist: {
    firstName: 'Jordan',
    title: 'Portal Support Specialist',
    tagline: 'Patient, process-focused — walks you through every click.',
    welcome: "Hey — Jordan here. I help partners navigate the portal, uploads, and tasks. What do you need help with?",
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
      "Sam here — I coordinate strategy calls and calendar bookings. Tell me your goal and timezone, and we'll get you on the calendar.",
    headerGradient: 'from-cyan-500/20 via-emerald-500/15 to-teal-500/10',
    avatarGradient: 'from-cyan-400 to-emerald-500',
    accentText: 'text-cyan-200',
    accentBorder: 'border-cyan-400/35',
    staffBubble: 'bg-gradient-to-br from-slate-800/95 to-cyan-950/60 border-cyan-400/25',
    chipClass: 'bg-cyan-500/15 text-cyan-100 border-cyan-400/30',
  },
  sales_closer: {
    firstName: 'Riley',
    title: 'Solutions Advisor',
    tagline: 'Consultative — matches you to DIY or done-for-you without hype.',
    welcome:
      "Riley here — I help people choose the right Finely path (DIY, DFY, tradelines, books). No pressure — just clarity. What outcome are you aiming for?",
    headerGradient: 'from-indigo-500/20 via-emerald-500/12 to-violet-500/10',
    avatarGradient: 'from-indigo-400 to-violet-500',
    accentText: 'text-indigo-200',
    accentBorder: 'border-indigo-400/35',
    staffBubble: 'bg-gradient-to-br from-slate-800/95 to-indigo-950/60 border-indigo-400/25',
    chipClass: 'bg-indigo-500/15 text-indigo-100 border-indigo-400/30',
  },
  lead_converter: {
    firstName: 'Alex',
    title: 'Trial Activation Coach',
    tagline: 'One clear next step at a time.',
    welcome: "Alex here — I'll help you activate your trial and upload your first report. Ready when you are.",
    headerGradient: 'from-lime-500/15 to-emerald-500/15',
    avatarGradient: 'from-lime-400 to-emerald-500',
    accentText: 'text-lime-200',
    accentBorder: 'border-lime-400/30',
    staffBubble: 'bg-slate-800/90 border-lime-400/25',
    chipClass: 'bg-lime-500/15 text-lime-100 border-lime-400/25',
  },
  debt_strategist: {
    firstName: 'Casey',
    title: 'Debt Strategy Specialist',
    tagline: 'Calm, documentation-first — validation & summons awareness.',
    welcome:
      "Casey here — I guide debt validation and collections workflows with a documentation-first mindset. Educational only, not legal advice. What's your situation?",
    headerGradient: 'from-orange-500/18 via-emerald-600/12 to-amber-500/10',
    avatarGradient: 'from-orange-400 to-amber-500',
    accentText: 'text-orange-200',
    accentBorder: 'border-orange-400/35',
    staffBubble: 'bg-gradient-to-br from-orange-600/50 to-amber-600/45 border-orange-200/35 shadow-[0_4px_24px_-8px_rgba(251,146,60,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-orange-500/15 text-orange-100 border-orange-400/30',
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
    welcome: 'Hi — I help review dispute letter drafts and mail queues. Which letter are we looking at?',
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
    welcome: 'Compliance review here — I help flag high-risk language and escalation paths. What needs a second look?',
    headerGradient: 'from-red-500/15 to-slate-500/10',
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
    welcome: 'Hey — I\'m here to walk you through lessons and checklists one step at a time. Where are you in the program?',
    headerGradient: 'from-blue-500/15 to-emerald-500/10',
    avatarGradient: 'from-blue-400 to-emerald-500',
    accentText: 'text-blue-200',
    accentBorder: 'border-blue-400/30',
    staffBubble: 'bg-slate-800/90 border-blue-400/25',
    chipClass: 'bg-blue-500/15 text-blue-100 border-blue-400/25',
  },
  affiliate_specialist: {
    firstName: 'Miles',
    title: 'Affiliate Success Specialist',
    tagline: 'Referrals, QR kits, compliant promos.',
    welcome: 'Ethan here — I help affiliates set up links, QR kits, and compliant promo copy. What are you promoting?',
    headerGradient: 'from-yellow-500/15 to-emerald-500/10',
    avatarGradient: 'from-yellow-400 to-emerald-500',
    accentText: 'text-yellow-200',
    accentBorder: 'border-yellow-400/30',
    staffBubble: 'bg-slate-800/90 border-yellow-400/25',
    chipClass: 'bg-yellow-500/15 text-yellow-100 border-yellow-400/25',
  },
  processing_agent: {
    firstName: 'Elena',
    title: 'Processing Agent',
    tagline: 'Report triage, bureau rounds, timelines.',
    welcome: 'Elena here — I triage uploaded reports and track bureau round progress. Tell me where you are in the process.',
    headerGradient: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/10',
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
    welcome: 'Hi — I help organize ID scans, tradeline screenshots, and evidence packs before you mail. What do you need to attach?',
    headerGradient: 'from-lime-500/15 to-emerald-500/10',
    avatarGradient: 'from-lime-400 to-emerald-500',
    accentText: 'text-lime-200',
    accentBorder: 'border-lime-400/30',
    staffBubble: 'bg-slate-800/90 border-lime-400/25',
    chipClass: 'bg-lime-500/15 text-lime-100 border-lime-400/25',
  },
  crm_intake_specialist: {
    firstName: 'Quinn',
    title: 'CRM Intake Specialist',
    tagline: 'Lead routing, lane fit, fast intake.',
    welcome: 'Quinn here — I help match you to the right lane and specialist. What brought you to Finely Cred today?',
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
    welcome: 'Leo here — I review funding readiness and business credit sequencing. What funding goal are you building toward?',
    headerGradient: 'from-amber-500/18 via-emerald-600/12 to-teal-500/10',
    avatarGradient: 'from-amber-400 to-teal-500',
    accentText: 'text-amber-200',
    accentBorder: 'border-amber-400/30',
    staffBubble: 'bg-gradient-to-br from-amber-600/45 to-teal-600/40 border-amber-200/30',
    chipClass: 'bg-amber-500/15 text-amber-100 border-amber-400/25',
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

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? 'FC').toUpperCase();
}

function avatarUrlFor(personaId: AgentPersonaId, staff: StaffMember | null): string {
  if (staff) return resolveStaffPortraitUrl(staff);
  const roleFallbackStaff: Partial<Record<AgentPersonaId, string>> = {
    finely_advisor: 'staff-morgan-hale',
    dispute_coach: 'staff-taylor-brooks',
    funding_strategist: 'staff-marcus-reed',
    nurture_concierge: 'staff-avery-luna',
    social_creator: 'staff-jamie-foster',
    support_specialist: 'staff-jordan-patel',
    appointment_setter: 'staff-sam-ortiz',
    sales_closer: 'staff-riley-chen',
    lead_converter: 'staff-alex-wright',
    debt_strategist: 'staff-casey-nguyen',
    ops_copilot: 'staff-isaac-bell',
    letter_ops_agent: 'staff-kai-morrison',
    compliance_agent: 'staff-renee-cole',
    education_coach: 'staff-priya-shah',
    affiliate_specialist: 'staff-miles-chen',
    processing_agent: 'staff-elena-voss',
    evidence_specialist: 'staff-nora-finch',
    crm_intake_specialist: 'staff-quinn-hayes',
    underwriting_analyst: 'staff-leo-vance',
    finely_coowner: 'staff-morgan-hale',
  };
  const seedId = roleFallbackStaff[personaId] ?? 'staff-morgan-hale';
  const seed = STAFF_ROSTER_FALLBACK.find((s) => s.id === seedId);
  if (seed) return resolveStaffPortraitUrl(seed);
  return resolveStaffPortraitUrl({
    id: seedId,
    firstName: 'Finely',
    lastName: 'Team',
    portraitGender: 'neutral',
    avatarPath: '',
  });
}

const STAFF_ROSTER_FALLBACK = [
  { id: 'staff-morgan-hale', firstName: 'Morgan', lastName: 'Hale', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-taylor-brooks', firstName: 'Taylor', lastName: 'Brooks', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-marcus-reed', firstName: 'Marcus', lastName: 'Reed', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-avery-luna', firstName: 'Avery', lastName: 'Luna', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-jamie-foster', firstName: 'Jamie', lastName: 'Foster', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-jordan-patel', firstName: 'Jordan', lastName: 'Patel', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-sam-ortiz', firstName: 'Sam', lastName: 'Ortiz', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-riley-chen', firstName: 'Riley', lastName: 'Chen', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-alex-wright', firstName: 'Alex', lastName: 'Wright', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-casey-nguyen', firstName: 'Casey', lastName: 'Nguyen', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-isaac-bell', firstName: 'Isaac', lastName: 'Bell', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-kai-morrison', firstName: 'Kai', lastName: 'Morrison', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-renee-cole', firstName: 'Renee', lastName: 'Cole', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-priya-shah', firstName: 'Priya', lastName: 'Shah', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-miles-chen', firstName: 'Miles', lastName: 'Chen', portraitGender: 'masculine' as const, avatarPath: '' },
  { id: 'staff-elena-voss', firstName: 'Elena', lastName: 'Voss', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-nora-finch', firstName: 'Nora', lastName: 'Finch', portraitGender: 'feminine' as const, avatarPath: '' },
  { id: 'staff-quinn-hayes', firstName: 'Quinn', lastName: 'Hayes', portraitGender: 'neutral' as const, avatarPath: '' },
  { id: 'staff-leo-vance', firstName: 'Leo', lastName: 'Vance', portraitGender: 'masculine' as const, avatarPath: '' },
];

export function getPublicChatPersonaPresentation(persona: AgentPersona): PublicChatPersonaPresentation {
  ensureStaffRosterSeeded();
  const base = PRESENTATION[persona.id] ?? PRESENTATION.finely_advisor;
  const staff: StaffMember | null = resolveStaffOnDuty(persona.id);
  const firstName = staff?.firstName ?? (base.firstName || persona.name.split(' ')[0] || persona.name);
  const avatarUrl = avatarUrlFor(persona.id, staff);
  return {
    ...base,
    firstName,
    title: staff?.displayTitle || persona.displayTitle || base.title,
    initials: initialsFor(firstName),
    avatarUrl,
    staffMemberId: staff?.id,
  };
}

export function getPublicChatPersonaPresentationById(id: AgentPersonaId): PublicChatPersonaPresentation {
  return getPublicChatPersonaPresentation(getAgentPersona(id) ?? getAgentPersona('finely_advisor')!);
}
