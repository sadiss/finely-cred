import type { SovereignLeadCaptureRoute, SovereignMarketingAssetPlan, SovereignChannelId } from './types';
import { defaultLeadCaptureRoutes, buildDefaultMediaPlans, scoreRouteReadiness } from './marketingIntelligenceVault';

export type LeadCaptureUpgrade = {
  routeId: string;
  readiness: number;
  shortLink: string;
  missing: string[];
  nextBuilds: string[];
  conversationStarter: string;
  suggestedAutomation: string[];
};

export function buildTrackedShortLink(route: SovereignLeadCaptureRoute, source: SovereignChannelId, city?: string): string {
  const params = new URLSearchParams({
    src: source,
    route: route.id,
  });
  if (city) params.set('city', city.toLowerCase().replace(/\s+/g, '-'));
  return `/go/${route.shortLinkSlug}?${params.toString()}`;
}

export function auditLeadCaptureRoute(route: SovereignLeadCaptureRoute): LeadCaptureUpgrade {
  const readiness = scoreRouteReadiness(route);
  const missing: string[] = [];
  if (!route.shortLinkSlug) missing.push('tracked short link slug');
  if (!route.destinationPath.startsWith('/l/')) missing.push('premium landing page path');
  if (!route.followUpSequence) missing.push('follow-up sequence id');
  if (!route.ownerAgentIds.length) missing.push('staff owner assignment');
  if (route.requiredFields.length < 3) missing.push('minimum qualifying fields');
  if (route.complianceNotes.length < 2) missing.push('compliance notes');
  const nextBuilds = [
    `Wire ${route.shortLinkSlug} to ${route.destinationPath}`,
    `Create CTA card that says: ${route.offer}`,
    `Attach nurture sequence ${route.followUpSequence}`,
    `Show owner badges: ${route.ownerAgentIds.join(', ')}`,
  ];
  return {
    routeId: route.id,
    readiness,
    shortLink: buildTrackedShortLink(route, route.sourceChannels[0] ?? 'seo'),
    missing,
    nextBuilds,
    conversationStarter: route.conversationPrompt,
    suggestedAutomation: [
      'On form submit: create lead capture event.',
      'On consent true: queue nurture draft.',
      'On high intent answer: create appointment setter task.',
      'On partner/recruiting route: notify partner owner and sales owner.',
    ],
  };
}

export function auditAllLeadCaptureRoutes(routes: SovereignLeadCaptureRoute[] = defaultLeadCaptureRoutes): LeadCaptureUpgrade[] {
  return routes.map(auditLeadCaptureRoute).sort((a, b) => b.readiness - a.readiness);
}

export function buildConversationPath(route: SovereignLeadCaptureRoute, city?: string): string[] {
  return [
    `Open with ${route.offer}, not a generic contact form.`,
    `Ask only for ${route.requiredFields.slice(0, 4).join(', ')} first.`,
    `Use ${city ? `${city} context` : 'source context'} to make the first line feel relevant.`,
    `Send to ${buildTrackedShortLink(route, route.sourceChannels[0] ?? 'seo', city)}.`,
    `After submit, enroll into ${route.followUpSequence}.`,
    `Notify ${route.ownerAgentIds.join(', ')} if high intent or booking-ready.`,
  ];
}

export function buildAssetPlansForRoute(route: SovereignLeadCaptureRoute): SovereignMarketingAssetPlan[] {
  return buildDefaultMediaPlans().filter((plan) => plan.id.endsWith(route.id));
}
