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
    welcome: 'Hello — I am Morgan. I help with credit reports, funding questions, and the next step. When you are ready, tell me what arrived.',
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
    welcome: 'Hello — I am Taylor. I walk people through disputes with the report in front of us. You can upload a file or tell me which item you want to talk about first.',
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
    welcome: 'Hello — I am Marcus. I help with business credit, vendors that report, and funding readiness. When you are ready, tell me what you are building toward.',
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
    welcome: 'Hello — I am Avery. I help people find their way: personal restore, business credit, or a collector letter. Whenever you are ready, tell me what brought you in.',
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
    welcome: 'Hello — I am Jamie from the brand team. I can help with a post, a caption, or a compliant share. Tell me what you are working on.',
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
    welcome: 'Hello — I am Jordan. I help partners find the right screen, upload, or task. Tell me where you are in the portal, and I will walk it with you.',
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
      'Hello — I am Sam. I help people book a strategy call. Tell me your goal and timezone, and we will find a time.',
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
      'Hello — I am Riley. I help people choose a Finely path — DIY, done-for-you, tradelines, or books — without pressure. Tell me the outcome you have in mind.',
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
      'Hello — I am Cameron. I help you start: upload a report, pick a path, and lock the next step. Whenever you are ready, tell me where you are.',
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
    welcome: 'Hello — I am Casey. I sit with people on collector letters, validation, and court paper. When you are ready, tell me what arrived.',
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
    welcome: 'Hello — this is the operations desk. I can help with a queue, a handoff, or a blocked step. Tell me what is open in front of you.',
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
    welcome: 'Hello — I am Kai. I review dispute letter drafts and the mail queue. Tell me which letter we are looking at.',
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
    welcome: 'Hello — I am Renee. I review language that could create risk. Tell me what you would like a second look at.',
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
    welcome: 'Hello — I am Priya. I walk partners through lessons and checklists. Tell me where you are in the program.',
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
    welcome: 'Hello — I am Miles. I help affiliates with links, QR kits, and copy that stays compliant. Tell me what you are promoting.',
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
    welcome: 'Hello — I am Elena. I review uploaded reports and bureau-round progress. Tell me where you are in the process.',
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
    welcome: 'Hello — I am Nora. I help organize ID scans, tradeline screenshots, and evidence packs before you mail. Tell me what you have ready to attach.',
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
    welcome: 'Hello — I am Quinn. I help match people to the right lane and specialist. Whenever you are ready, tell me what brought you to Finely Cred.',
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
    welcome: 'Hello — I am Leo. I review funding readiness and the order of business credit work. When you are ready, tell me the funding goal you have in mind.',
    headerGradient: 'from-sky-500/18 via-emerald-600/12 to-violet-500/10',
    avatarGradient: 'from-sky-400 to-violet-500',
    accentText: 'text-sky-200',
    accentBorder: 'border-sky-400/30',
    staffBubble: 'bg-gradient-to-br from-sky-600/45 to-violet-600/40 border-sky-200/30',
    chipClass: 'bg-sky-500/15 text-sky-100 border-sky-400/30',
  },
  haitian_companion: {
    firstName: 'Marie-Claire',
    title: 'Haitian Community Guide',
    tagline: 'Credit help for Haitian Americans',
    welcome:
      'Hello — I am Marie-Claire. I sit with Haitian American families on credit reports and collector letters. When you are ready, tell me what arrived.',
    headerGradient: 'from-emerald-500/28 via-sky-500/18 to-violet-500/12',
    avatarGradient: 'from-emerald-300 to-sky-400',
    accentText: 'text-emerald-100',
    accentBorder: 'border-emerald-300/40',
    staffBubble:
      'bg-gradient-to-br from-emerald-600/50 to-sky-700/45 border-emerald-200/35 shadow-[0_4px_24px_-8px_rgba(110,231,183,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30',
  },
  finely_coowner: {
    firstName: CO_OWNER_IDENTITY.name,
    title: CO_OWNER_IDENTITY.title,
    tagline: 'Validate first · ops · stewardship · launch.',
    welcome: `Hello — I am ${CO_OWNER_IDENTITY.name}, co-owner at Finely Cred. I can help with credit, debt validation, funding, or the business file. When you are ready, tell me what is in front of you.`,
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
