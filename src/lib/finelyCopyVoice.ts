/** Site-wide hospitality copy. Direct, with context. Never “What do you need?” */

export const FINELY_COPY_COMPLIANCE_EN =
  'Results vary · not legal advice · funding subject to underwriting';
export const FINELY_COPY_COMPLIANCE_HT =
  'Rezilta yo varye. Sa a pa konsèy legal. Si w bezwen lajen, sa depann si yo apwouve w.';

export const FINELY_MARKETING_PRICE_LAW =
  'Do not post prices on marketing. Share an amount only when the person asks, or send them to /pricing.';

export function finelyHospitalityWelcome(firstName: string, helpWith: string): string {
  const name = (firstName || '').trim() || 'Finely';
  const desk = (helpWith || '').trim() || 'credit reports, collector letters, and the next step';
  return `Hello — I am ${name}. I help with ${desk}. When you are ready, tell me what arrived.`;
}

export function finelyHospitalityWelcomeHt(firstName: string): string {
  const name = (firstName || '').trim() || 'Finely';
  return `Bonjou. Mwen se ${name}. Nou ede Ayisyen ki viv Ozetazini ak dosye kredi ak lèt kolektè. Lè w pare, di m sa ki rive nan lapòs la.`;
}

/** Marketing CTA — never “see prices.” */
export function finelyMarketingNextStep(invite: string): string {
  const line = (invite || '').trim() || 'Pale Kreyòl when you are ready, or book a session if the paper is messy.';
  return line;
}
