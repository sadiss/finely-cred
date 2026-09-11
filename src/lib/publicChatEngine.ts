import type { ChatLocale } from './publicChatI18n';
import { localeInstruction } from './publicChatI18n';
import { HAITIAN_COMPANION_SYSTEM_PROMPT, HAITIAN_DESK_TRUSTED_LINKS, isHaitianDeskPath } from './haitianCompanionDesk';

export type UserToneHint = 'frustrated' | 'curious' | 'urgent' | 'grateful' | 'neutral';

export type TrustedResource = {
  id: string;
  topics: string[];
  label: string;
  href: string;
  external?: boolean;
  /** Only suggest when topic matches */
};

/** Curated Finely + trusted external resources — never hallucinate URLs outside this list. */
export const TRUSTED_RESOURCES: TrustedResource[] = [
  { id: 'free_guide', topics: ['dispute', 'letter', 'guide', 'fcra'], label: 'Free dispute letter guide', href: '/free-guide' },
  { id: 'debt_guide', topics: ['debt', 'collection', 'validation', 'fdcpa'], label: 'Free debt validation guide', href: '/free-debt-guide' },
  { id: 'business_guide', topics: ['business credit', 'business', 'vendor'], label: 'Business credit guide', href: '/free-business-guide' },
  { id: 'tradeline_guide', topics: ['tradeline', 'authorized user', 'au'], label: 'Tradeline insider guide', href: '/free-tradeline-guide' },
  { id: 'pricing', topics: ['price', 'cost', 'package', 'plan'], label: 'Personal restore', href: '/pricing/personal-credit-restore' },
  { id: 'tradelines', topics: ['tradeline', 'marketplace', 'buy'], label: 'Tradelines marketplace', href: '/tradelines' },
  { id: 'session', topics: ['call', 'appointment', 'session', 'consult', 'book'], label: 'Book a strategy call', href: '/consultation' },
  { id: 'signup', topics: ['sign up', 'register', 'account', 'portal'], label: 'Create partner account', href: '/signup' },
  { id: 'help', topics: ['help', 'start', 'how'], label: 'Start here / help center', href: '/start-here' },
  { id: 'affiliate', topics: ['affiliate', 'referral', 'partner program'], label: 'Affiliate hub', href: '/affiliate' },
  { id: 'agent', topics: ['agent', 'specialist', 'career', 'job'], label: 'Credit specialist program', href: '/signup?role=agent' },
  { id: 'au_seller', topics: ['seller', 'supply', 'inventory'], label: 'AU seller program', href: '/signup?role=au_seller' },
  { id: 'faq', topics: ['faq', 'question'], label: 'FAQ', href: '/faq' },
  { id: 'contact', topics: ['contact', 'phone', 'email us'], label: 'Contact page', href: '/contact' },
  { id: 'haitian_desk', topics: ['haitian', 'kreyol', 'kreyòl', 'creole', 'ayisyen', 'ayiti'], label: 'Haitian community', href: '/haitian' },
  { id: 'kreyol_kit', topics: ['kreyol', 'kreyòl', 'kit', 'feyè', 'gid'], label: 'Credit kits', href: '/free-kreyol-guide' },
  { id: 'cfpb', topics: ['cfpb', 'complaint', 'bureau', 'consumer'], label: 'CFPB — file a complaint (external)', href: 'https://www.consumerfinance.gov/complaint/', external: true },
  { id: 'ftc', topics: ['identity theft', 'fraud', 'ftc'], label: 'FTC Identity Theft (external)', href: 'https://www.identitytheft.gov/', external: true },
  { id: 'annual_report', topics: ['score', 'credit score', 'fico', 'annual', 'free report', 'credit report'], label: 'Annual Credit Report (free official file)', href: 'https://www.annualcreditreport.com/', external: true },
  { id: 'equifax_freeze', topics: ['freeze', 'thaw', 'equifax'], label: 'Equifax — security freeze', href: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/', external: true },
  { id: 'experian_freeze', topics: ['freeze', 'thaw', 'experian'], label: 'Experian — security freeze', href: 'https://www.experian.com/freeze/center.html', external: true },
  { id: 'transunion_freeze', topics: ['freeze', 'thaw', 'transunion'], label: 'TransUnion — security freeze', href: 'https://www.transunion.com/credit-freeze', external: true },
];

export function matchTrustedResources(query: string, limit = 4): TrustedResource[] {
  const q = query.toLowerCase();
  const scored = TRUSTED_RESOURCES.map((r) => {
    let score = 0;
    for (const t of r.topics) {
      if (q.includes(t)) score += 2;
    }
    if (q.includes(r.label.toLowerCase().slice(0, 12))) score += 1;
    return { r, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.r);
}

export function formatTrustedLinksBlock(resources: TrustedResource[], origin = ''): string {
  if (!resources.length) return '';
  const lines = resources.map((r) => {
    const url = r.href.startsWith('http') ? r.href : `${origin}${r.href}`;
    return `- ${r.label}: ${url}${r.external ? ' (trusted external)' : ''}`;
  });
  return `\nTRUSTED LINKS (only share URLs from this list — never invent links):\n${lines.join('\n')}`;
}

export function inferUserTone(text: string): UserToneHint {
  const s = text.toLowerCase();
  if (/\b(angry|frustrated|terrible|scam|ripoff|worst|hate|upset)\b/.test(s)) return 'frustrated';
  if (/\b(asap|urgent|emergency|today|now|help me)\b/.test(s)) return 'urgent';
  if (/\b(thank|thanks|appreciate|great|awesome)\b/.test(s)) return 'grateful';
  if (/\?|how|what|why|can you|explain/.test(s)) return 'curious';
  return 'neutral';
}

export function toneGuidance(tone: UserToneHint): string {
  switch (tone) {
    case 'frustrated':
      return 'Visitor seems frustrated — acknowledge feelings first, stay calm, one clear next step. Do not be defensive or repetitive.';
    case 'urgent':
      return 'Visitor needs urgency — be concise, prioritize actionable steps, offer session booking if appropriate.';
    case 'grateful':
      return 'Visitor is positive — match warmth briefly, then offer one helpful next step.';
    case 'curious':
      return 'Visitor is exploring — educate clearly, ask one clarifying question max, avoid overwhelming lists.';
    default:
      return 'Neutral tone — be warm and conversational, not robotic.';
  }
}

export function humanReplyDelayMs(args: { userMessage: string; botReplyLength?: number; overrideMs?: number }): number {
  if (args.overrideMs != null) return args.overrideMs;
  const readTime = Math.min(1800, args.userMessage.length * 18);
  const thinkTime = 600 + Math.random() * 900;
  const typeTime = Math.min(2200, (args.botReplyLength ?? 120) * 8);
  return Math.round(readTime + thinkTime + typeTime);
}

export function buildConversationalSystemAddendum(args: {
  locale: ChatLocale;
  tone?: UserToneHint;
  priorBotSnippets?: string[];
  staffName?: string;
  onShiftRole?: string;
  isPartner?: boolean;
  origin?: string;
  userMessage?: string;
  easyReadMode?: boolean;
  pathname?: string;
}): string {
  const antiRepeat =
    args.priorBotSnippets?.length ?
      `\nDo NOT repeat these recent phrases or openers:\n${args.priorBotSnippets.slice(-3).map((s) => `- "${s.slice(0, 80)}…"`).join('\n')}`
    : '';

  const resources = args.userMessage ? matchTrustedResources(args.userMessage) : [];
  const linksBlock = formatTrustedLinksBlock(resources, args.origin);

  const easyRead = args.easyReadMode
    ? '\n- EASY READ MODE: Use grade-6 language, short sentences, one idea per sentence, and name the single next action.'
    : '';

  const haitianDesk =
    args.locale === 'ht' || (args.pathname && isHaitianDeskPath(args.pathname))
      ? `\nHAITIAN COMPANION DESK:\n- ${HAITIAN_COMPANION_SYSTEM_PROMPT}\n- Extra trusted links: ${HAITIAN_DESK_TRUSTED_LINKS.map((l) => `${l.label} ${l.href}`).join(' · ')}`
      : '';

  return `
CONVERSATIONAL RULES (critical):
- You are ${args.staffName ?? 'a live support specialist'} (${args.onShiftRole ?? 'Partner Success'}) on shift. Sound like ${args.staffName ?? 'that person'}, not a script every agent recites.
- Answer the question they asked first in 2–4 spoken sentences. If they ask how to find a score or free report, send them to AnnualCreditReport.com — do not lecture about restore.
- If they ask what a law or term is, define it in two spoken sentences. Do not dump a numbered SOP, "Steps:" list, or Start Here checklist unless they asked what to do on this page.
- If you do not know, say so, then offer one door (official site, free guide, or a session). Do not fill silence with restore speech.
- Never open with "Great question," "I'd be happy to help," or "As a credit professional." Do not write brochure copy.
- ${localeInstruction(args.locale)}${haitianDesk}
- ${toneGuidance(args.tone ?? 'neutral')}
- Wait for the visitor to finish their thought. Keep replies short (2–4 sentences usually). One question at a time.
- Never stack multiple long paragraphs. Never repeat the same greeting or disclaimer twice in one conversation.
- Share only trusted links from the list below. Official external doors: Annual Credit Report, bureau freeze pages, CFPB complaint, FTC identity theft. Never invent a bureau URL.
- If they want a specific named staff member: ${args.isPartner ? 'offer to open the Communication Hub team chat.' : 'explain they can book a strategy call to speak with that specialist (use appointment_setter flow).'}
- You know Finely Cred services, portal modules, disputes, funding, tradelines, debt validation, affiliate/agent programs, and Haitian-American community needs (language, clarity, respect).
- Appointment booking: collect name, email, timezone, and preferred times; confirm you submitted the request.
${easyRead}
${antiRepeat}
${linksBlock}`.trim();
}

const APPOINTMENT_PATTERN =
  /\b(book|schedule|appointment|session|call|randevou|reunion|consultation|speak with|talk to|meeting)\b/i;
const SPECIFIC_STAFF_PATTERN =
  /\b(speak with|talk to|connect me with|message|chat with)\s+([a-z]{2,})\b/i;

export function detectPublicChatIntent(text: string): 'appointment' | 'specific_staff' | 'general' {
  if (SPECIFIC_STAFF_PATTERN.test(text)) return 'specific_staff';
  if (APPOINTMENT_PATTERN.test(text)) return 'appointment';
  return 'general';
}

export function extractStaffNameHint(text: string): string | null {
  const m = SPECIFIC_STAFF_PATTERN.exec(text);
  return m?.[2]?.trim() ?? null;
}

/** Parse simple appointment details from conversation */
export function parseAppointmentDraft(text: string): {
  email?: string;
  phone?: string;
  availabilityNotes?: string;
} {
  const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
  const phone = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0];
  return {
    email,
    phone,
    availabilityNotes: text.slice(0, 280),
  };
}

export function shouldUseAppointmentSetter(intent: ReturnType<typeof detectPublicChatIntent>): boolean {
  return intent === 'appointment' || intent === 'specific_staff';
}
