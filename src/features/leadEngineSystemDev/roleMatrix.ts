import type { LeadAssignment, LeadEngineFunnel, LeadOwnerRole } from './types';

export const LEAD_ENGINE_ROLE_MATRIX: Record<LeadOwnerRole, Omit<LeadAssignment, 'role'>> = {
  lead_intel: {
    label: 'Lead Intel',
    ownerName: 'Scout Supreme',
    responsibility: 'Find, enrich, dedupe, and score new opportunities before anyone touches them.',
    slaMinutes: 60,
  },
  appointment_setting: {
    label: 'Appointment Setting',
    ownerName: 'Appointment Architect',
    responsibility: 'Turn hot replies and form fills into booked calls with reminders.',
    slaMinutes: 15,
  },
  sales: {
    label: 'Sales',
    ownerName: 'Revenue Captain',
    responsibility: 'Handle qualified buyers, guide offers, and move calls into paid conversion.',
    slaMinutes: 30,
  },
  recruiting: {
    label: 'Recruiting',
    ownerName: 'Recruiting Commander',
    responsibility: 'Move credit specialists, agents, affiliates, and AU sellers through the role funnel.',
    slaMinutes: 45,
  },
  partner_success: {
    label: 'Partner Success',
    ownerName: 'Affiliate Wrangler',
    responsibility: 'Activate partners, issue assets, and keep referral loops moving.',
    slaMinutes: 180,
  },
  pr: {
    label: 'PR',
    ownerName: 'PR Sentinel',
    responsibility: 'Handle interview, local authority, and media collaboration opportunities.',
    slaMinutes: 240,
  },
  nurture: {
    label: 'Nurture',
    ownerName: 'Liora Lifecycle',
    responsibility: 'Select sequence, channel, timing, and follow-up logic after routing.',
    slaMinutes: 30,
  },
  compliance: {
    label: 'Compliance',
    ownerName: 'The Velvet Hammer',
    responsibility: 'Block risky claims, consent failures, spam patterns, and unsafe automation.',
    slaMinutes: 10,
  },
  posting: {
    label: 'Posting',
    ownerName: 'Social Commander',
    responsibility: 'Package approved content into platform-specific scheduled posts.',
    slaMinutes: 120,
  },
  cmo: {
    label: 'CMO',
    ownerName: 'CMO Prime',
    responsibility: 'Prioritize offers, city focus, creative angles, and channel budgets.',
    slaMinutes: 60,
  },
};

export function assignment(role: LeadOwnerRole): LeadAssignment {
  const x = LEAD_ENGINE_ROLE_MATRIX[role];
  return { role, ...x };
}

export function assignmentsForFunnel(funnel: LeadEngineFunnel): LeadAssignment[] {
  switch (funnel) {
    case 'credit_specialist_recruiting':
    case 'agency_partner_recruiting':
    case 'affiliate_partner_recruiting':
    case 'au_seller_recruiting':
      return [assignment('lead_intel'), assignment('recruiting'), assignment('nurture'), assignment('compliance')];
    case 'press_authority':
      return [assignment('lead_intel'), assignment('pr'), assignment('posting'), assignment('compliance')];
    case 'event_webinar':
      return [assignment('cmo'), assignment('posting'), assignment('appointment_setting'), assignment('nurture'), assignment('compliance')];
    case 'consultation_booking':
      return [assignment('lead_intel'), assignment('appointment_setting'), assignment('sales'), assignment('nurture'), assignment('compliance')];
    case 'book_course_buyer':
      return [assignment('cmo'), assignment('nurture'), assignment('sales'), assignment('compliance')];
    default:
      return [assignment('lead_intel'), assignment('sales'), assignment('appointment_setting'), assignment('nurture'), assignment('compliance')];
  }
}

export function primaryOwnerForFunnel(funnel: LeadEngineFunnel): LeadAssignment {
  const list = assignmentsForFunnel(funnel);
  const preferred = list.find((x) => ['sales', 'recruiting', 'pr', 'appointment_setting'].includes(x.role));
  return preferred ?? list[0];
}
