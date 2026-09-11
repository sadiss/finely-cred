import type { AgentPersonaId } from '../domain/agentPersonas';
import type { PublicChatGoal } from './publicChatEvents';

export type OperatorChipAction = 'talk' | 'upload' | 'guide' | 'book' | 'live' | 'page';

export type OperatorChip = {
  id: string;
  label: string;
  prompt: string;
  action: OperatorChipAction;
  href?: string;
  image?: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
};

export type OperatorGuide = {
  title: string;
  href: string;
  image: string;
};

export function inferPublicChatGoalFromPath(pathname: string): PublicChatGoal | null {
  const p = pathname.split('?')[0];
  if (/^\/(haitian|kreyol)/.test(p) || p === '/portal/haitian' || p === '/admin/haitian' || p.startsWith('/free-kreyol-guide')) return 'haitian';
  if (/personal-credit-restore|\/personal-credit$/.test(p)) return 'personal';
  if (/business-credit|\/pricing\/business/.test(p)) return 'business';
  if (/debt-legal|\/free-debt|\/debt/.test(p)) return 'debt';
  if (/credit-building|build-my-credit|personal-credit-building/.test(p)) return 'building';
  if (/tradeline/.test(p)) return 'tradelines';
  return null;
}

export function personaForPublicGoal(goal: PublicChatGoal | null): AgentPersonaId | undefined {
  if (goal === 'personal') return 'dispute_coach';
  if (goal === 'business' || goal === 'tradelines') return 'funding_strategist';
  if (goal === 'building') return 'finely_advisor';
  if (goal === 'debt') return 'debt_strategist';
  if (goal === 'haitian') return 'haitian_companion';
  if (goal === 'not_sure') return 'nurture_concierge';
  return undefined;
}

export function publicRoleForGoal(goal: PublicChatGoal | null): string {
  if (goal === 'personal') return 'Credit Restoration Specialist';
  if (goal === 'building') return 'Credit Building Specialist';
  if (goal === 'business') return 'Business Credit Specialist';
  if (goal === 'debt') return 'Debt Resolution Specialist';
  if (goal === 'tradelines') return 'Tradeline Specialist';
  if (goal === 'haitian') return 'Haitian Community Guide';
  return 'Credit Specialist';
}

export function publicRoleForPath(pathname: string, goal: PublicChatGoal | null): string {
  return publicRoleForGoal(inferPublicChatGoalFromPath(pathname) ?? goal);
}

export function guideForGoal(goal: PublicChatGoal | null): OperatorGuide | null {
  if (goal === 'debt') {
    return {
      title: 'Free debt guide',
      href: '/free-debt-guide',
      image: '/images/lead-magnets/debt-eradication-guide-cutout.png',
    };
  }
  if (goal === 'business') {
    return {
      title: 'Business credit guide',
      href: '/free-business-guide',
      image: '/images/lead-magnets/business-credit-power-guide-mockup-transparent.png',
    };
  }
  if (goal === 'tradelines' || goal === 'building') {
    return {
      title: 'Tradeline guide',
      href: '/free-tradeline-guide',
      image: '/images/lead-magnets/tradeline-advantage-guide-cutout.png',
    };
  }
  if (goal === 'haitian') {
    return {
      title: 'Credit kits',
      href: '/free-kreyol-guide',
      image: '/images/lead-magnets/agency-guide-book.png',
    };
  }
  return {
    title: 'Free restore guide',
    href: '/free-guide',
    image: '/images/product-shots/guide-dispute-cover.png',
  };
}

export function consultationLaneForGoal(goal: PublicChatGoal | null): string {
  if (goal === 'business') return 'Business Credit';
  if (goal === 'debt') return 'Debt and Legal';
  if (goal === 'building') return 'Credit building';
  if (goal === 'tradelines') return 'Tradelines';
  if (goal === 'haitian') return 'Haitian community';
  return 'Personal Credit';
}

export function operatorChipsForPath(pathname: string, goal: PublicChatGoal | null): OperatorChip[] {
  const inferred = goal ?? inferPublicChatGoalFromPath(pathname);
  if (inferred === 'personal') {
    return [
      { id: 'upload', label: 'Upload a report', prompt: 'I want to upload my credit report for a quick read.', action: 'upload', accent: 'emerald' },
      { id: 'guide', label: 'Free restore guide', prompt: 'I want the free restore guide.', action: 'guide', href: '/free-guide', image: '/images/product-shots/guide-dispute-cover.png', accent: 'violet' },
      { id: 'transfer', label: 'Already in a dispute', prompt: 'I already disputed with another company. I want to start at the next round.', action: 'talk', accent: 'sky' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'rose' },
    ];
  }
  if (inferred === 'business') {
    return [
      { id: 'ein', label: 'Start the EIN file', prompt: 'How do I start a business credit file on the EIN?', action: 'talk', accent: 'emerald' },
      { id: 'guide', label: 'Business guide', prompt: 'I want the business credit guide.', action: 'guide', href: '/free-business-guide', image: '/images/lead-magnets/business-credit-power-guide-mockup-transparent.png', accent: 'violet' },
      { id: 'packages', label: 'See packages', prompt: 'Show me business credit packages.', action: 'page', href: '/pricing/business-credit', accent: 'sky' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'rose' },
    ];
  }
  if (inferred === 'debt') {
    return [
      { id: 'validation', label: 'Validation', prompt: 'I have a collection notice and need validation help.', action: 'talk', accent: 'rose' },
      { id: 'summons', label: 'Summons', prompt: 'I received a summons. What do I do first?', action: 'talk', accent: 'violet' },
      { id: 'guide', label: 'Free debt guide', prompt: 'I want the free debt guide.', action: 'guide', href: '/free-debt-guide', image: '/images/lead-magnets/debt-eradication-guide-cutout.png', accent: 'sky' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'emerald' },
    ];
  }
  if (inferred === 'building') {
    return [
      { id: 'util', label: 'Utilization', prompt: 'How should I handle credit utilization?', action: 'talk', accent: 'sky' },
      { id: 'tl', label: 'Tradelines', prompt: 'How do authorized-user tradelines work here?', action: 'page', href: '/tradelines', accent: 'violet' },
      { id: 'packages', label: 'Packages', prompt: 'Show me credit building packages.', action: 'page', href: '/build-my-credit', accent: 'emerald' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'rose' },
    ];
  }
  if (inferred === 'tradelines') {
    return [
      { id: 'seat', label: 'Ask for a seat', prompt: 'I am looking for an authorized-user seat. Age and limit I need: ', action: 'talk', accent: 'violet' },
      { id: 'guide', label: 'Free tradeline guide', prompt: 'I want the free tradeline guide.', action: 'guide', href: '/free-tradeline-guide', image: '/images/lead-magnets/tradeline-advantage-guide-cutout.png', accent: 'sky' },
      { id: 'packages', label: 'See packages', prompt: 'Show me tradeline packages.', action: 'page', href: '/tradelines#tradelines-packages', accent: 'emerald' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a tradeline fit session.', action: 'book', accent: 'rose' },
    ];
  }
  if (inferred === 'haitian') {
    return [
      { id: 'kreyol', label: 'Pale Kreyòl', prompt: 'M vle pale Kreyòl. Esplike m dosye kredi a.', action: 'talk', accent: 'emerald' },
      { id: 'guide', label: 'Credit kits', prompt: 'I want the Haitian community credit kits.', action: 'guide', href: '/free-kreyol-guide', image: '/images/lead-magnets/agency-guide-book.png', accent: 'violet' },
      { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'sky' },
      { id: 'live', label: 'Speak with someone', prompt: 'I want to speak with someone.', action: 'live', accent: 'rose' },
    ];
  }
  return [
    { id: 'restore', label: 'Personal restore', prompt: 'I need help restoring personal credit.', action: 'talk', accent: 'emerald' },
    { id: 'business', label: 'Business credit', prompt: 'I want to build business credit.', action: 'talk', accent: 'violet' },
    { id: 'debt', label: 'Debt help', prompt: 'I need help with a collection or summons.', action: 'talk', accent: 'rose' },
    { id: 'book', label: 'Book a session', prompt: 'I want to book a session.', action: 'book', accent: 'sky' },
  ];
}

export function shortPublicWelcome(firstName: string): string {
  return `Hello — I am ${firstName}. I help with credit reports, collector letters, and the next step. When you are ready, tell me what arrived.`;
}
