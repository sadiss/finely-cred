export type CompliantPacingPlan = {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  activeWindowLocal: string;
  maxPerDomainConcurrency: number;
  globalConcurrency: number;
  notes: string[];
};

export function buildCompliantPacingPlan(kind: 'public_research' | 'email' | 'sms' | 'social_api'): CompliantPacingPlan {
  if (kind === 'public_research') return { minDelaySeconds: 3, maxDelaySeconds: 8, activeWindowLocal: '24/7 with robots.txt and cache respect', maxPerDomainConcurrency: 1, globalConcurrency: 5, notes: ['No stealth, no CAPTCHA bypass, no platform evasion.', 'Cache public fetches for 7 days where possible.'] };
  if (kind === 'sms') return { minDelaySeconds: 30, maxDelaySeconds: 180, activeWindowLocal: '9am-8pm recipient local time, consent required', maxPerDomainConcurrency: 1, globalConcurrency: 1, notes: ['TCPA consent required.', 'STOP handling required before production.'] };
  if (kind === 'email') return { minDelaySeconds: 15, maxDelaySeconds: 90, activeWindowLocal: '8am-9pm recipient local time, unsubscribe required', maxPerDomainConcurrency: 1, globalConcurrency: 3, notes: ['CAN-SPAM footer and unsubscribe required.', 'Throttle by domain and provider reputation.'] };
  return { minDelaySeconds: 60, maxDelaySeconds: 600, activeWindowLocal: 'Use official scheduler APIs only', maxPerDomainConcurrency: 1, globalConcurrency: 2, notes: ['Official OAuth/API only.', 'No fake engagement, no stealth, no impersonation.'] };
}
