/**
 * Ruth site-wide knowledge map — every route, hub, automation, and execute surface.
 * Merges admin/portal nav, module playbooks, RAG index stats, and co-owner execution registry.
 */

import { ADMIN_NAV_GROUPS } from '../config/adminNavLanes';
import { PORTAL_NAV_LANES } from '../config/portalNavLanes';
import { MODULE_PLAYBOOKS } from '../config/modulePlaybooks';
import { finelyKnowledgeIndexStats, searchFinelyKnowledge, formatFinelyKnowledgeForPrompt } from './finelyKnowledgeIndex';
import { CO_OWNER_AUTOMATIONS, CO_OWNER_SUPERPOWERS } from '../domain/coOwnerPersona';
import { listCoOwnerExecutionRegistry } from './coOwnerExecutionRegistry';
import { getExecutiveOrgStats } from '../domain/coOwnerExecutiveStructure';
import { getCoOwnerDevStudioStats } from './coOwnerDevStudio';

export type SiteSurface = {
  path: string;
  label: string;
  lane: 'admin' | 'portal' | 'public' | 'agent' | 'business';
  hint?: string;
  executeKeys?: string[];
};

function adminSurfaces(): SiteSurface[] {
  const out: SiteSurface[] = [];
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      out.push({
        path: item.path,
        label: item.label,
        lane: 'admin',
        hint: item.hint,
      });
    }
  }
  return out;
}

function portalSurfaces(): SiteSurface[] {
  const out: SiteSurface[] = [];
  for (const lane of PORTAL_NAV_LANES) {
    for (const item of lane.links) {
      out.push({
        path: item.path,
        label: item.label,
        lane: 'portal',
      });
    }
  }
  return out;
}

const PUBLIC_SURFACES: SiteSurface[] = [
  { path: '/', label: 'Home', lane: 'public' },
  { path: '/start-here', label: 'Start here', lane: 'public' },
  { path: '/pricing/personal-credit-restore', label: 'Personal credit restore', lane: 'public' },
  { path: '/resources', label: 'Resources', lane: 'public' },
  { path: '/fundability', label: 'Fundability readiness', lane: 'public' },
  { path: '/dashboard', label: 'Partner dashboard entry', lane: 'public' },
  { path: '/login', label: 'Login', lane: 'public' },
];

export function buildCoOwnerSiteSurfaces(): SiteSurface[] {
  const registry = listCoOwnerExecutionRegistry();
  const byPath = new Map<string, string[]>();
  for (const entry of registry) {
    if (!entry.navigateTo) continue;
    const path = entry.navigateTo.split('#')[0];
    const keys = byPath.get(path) ?? [];
    keys.push(entry.executeKey);
    byPath.set(path, keys);
  }
  const surfaces = [...adminSurfaces(), ...portalSurfaces(), ...PUBLIC_SURFACES];
  return surfaces.map((s) => ({
    ...s,
    executeKeys: byPath.get(s.path.split('#')[0]) ?? s.executeKeys,
  }));
}

export function summarizeSiteKnowledgeMapForCoOwner(): string {
  const surfaces = buildCoOwnerSiteSurfaces();
  const index = finelyKnowledgeIndexStats();
  const exec = getExecutiveOrgStats();
  const dev = getCoOwnerDevStudioStats();
  const adminCount = surfaces.filter((s) => s.lane === 'admin').length;
  const portalCount = surfaces.filter((s) => s.lane === 'portal').length;
  const automations = CO_OWNER_AUTOMATIONS.length;
  const superpowers = CO_OWNER_SUPERPOWERS.length;
  const executable = listCoOwnerExecutionRegistry().filter((e) => e.handlerKind !== 'prompt_only').length;

  return [
    `SITE MAP: ${surfaces.length} surfaces (${adminCount} admin · ${portalCount} portal · ${PUBLIC_SURFACES.length} public)`,
    `KNOWLEDGE INDEX: ${index.total} chunks (SOP ${index.bySource.sop} · tour ${index.bySource.tour} · module ${index.bySource.module} · article ${index.bySource.article} · eguide ${index.bySource.eguide} · reference ${index.bySource.reference})`,
    `MODULE PLAYBOOKS: ${MODULE_PLAYBOOKS.length}`,
    `EXECUTION: ${superpowers} superpowers · ${automations} automations · ${executable} with real handlers`,
    `EXECUTIVE ORG: ${exec.totalHats} hats · ${exec.vacant} vacant`,
    `DEV STUDIO: ${dev.projects} code projects · ${dev.agentSpecs} agent specs · ${dev.exportsReady} export-ready`,
    `Ruth can navigate, execute automations, hire staff, and author code/agent specs from /admin/ops-agent.`,
  ].join('\n');
}

/** Route → topic keywords, so an empty/ambiguous query still retrieves relevant chunks
 * instead of falling back to one fixed phrase for every admin surface. */
const ROUTE_TOPIC_HINTS: Array<{ test: RegExp; topic: string }> = [
  { test: /^\/admin\/billing/, topic: 'billing invoices payments dunning past due entitlements agreements' },
  { test: /^\/admin\/affiliates?/, topic: 'affiliate commission payout referral tracking campaigns' },
  { test: /^\/admin\/social-hub/, topic: 'social content compliance autopilot posting' },
  { test: /^\/admin\/phone-hub/, topic: 'phone queue voicemail sla missed calls' },
  { test: /^\/admin\/comms/, topic: 'comms routing nurture sequences messaging' },
  { test: /^\/admin\/dispute-collaboration|^\/portal\/letters|^\/portal\/disputes/, topic: 'dispute letters validation credit bureaus letter studio' },
  { test: /^\/admin\/workflow/, topic: 'validation clocks case deadlines tasks' },
  { test: /^\/admin\/staff-roles|^\/admin\/staff/, topic: 'staff roster hiring executive roles coverage' },
  { test: /^\/admin\/training-academy|^\/admin\/courses/, topic: 'training academy courses curriculum' },
  { test: /^\/admin\/launch-os/, topic: 'launch readiness gates go live' },
  { test: /^\/admin\/monitoring/, topic: 'platform health engineering dev triage' },
  { test: /^\/admin\/crm/, topic: 'crm pipeline leads prospects stages' },
  { test: /^\/portal\/wealth-paths|^\/admin\/nora-capital/, topic: 'funding underwriting business credit readiness' },
  { test: /^\/pricing/, topic: 'pricing packages personal business debt bundles' },
];

/** Derive a topic-aware fallback query from recent conversation turns or the active
 * admin route, instead of always defaulting to one static phrase. */
function deriveFallbackKnowledgeQuery(route?: string, recentMessages?: string[]): string {
  const fromMessages = (recentMessages ?? [])
    .map((m) => (m || '').trim())
    .filter(Boolean)
    .slice(-4)
    .join(' ');
  if (fromMessages.length > 8) return fromMessages.slice(-500);
  if (route) {
    const hit = ROUTE_TOPIC_HINTS.find((r) => r.test.test(route));
    if (hit) return hit.topic;
  }
  return 'operations launch credit dispute';
}

export function buildCoOwnerSiteKnowledgeContext(query: string, route?: string, recentMessages?: string[]): string {
  const map = summarizeSiteKnowledgeMapForCoOwner();
  const effectiveQuery = (query || '').trim() || deriveFallbackKnowledgeQuery(route, recentMessages);
  const hits = searchFinelyKnowledge(effectiveQuery, {
    limit: 16,
    contextRoute: route,
  });
  const rag = formatFinelyKnowledgeForPrompt(hits);
  const surfaces = buildCoOwnerSiteSurfaces();
  const routeHits = route
    ? surfaces.filter((s) => s.path === route || route.startsWith(s.path)).slice(0, 6)
    : surfaces.filter((s) => s.lane === 'admin').slice(0, 12);
  const routeBlock = routeHits.length
    ? `ROUTE AFFINITY:\n${routeHits.map((s) => `- ${s.label} → ${s.path}${s.executeKeys?.length ? ` [${s.executeKeys.join(', ')}]` : ''}`).join('\n')}`
    : '';

  return [map, routeBlock, rag].filter(Boolean).join('\n\n');
}
