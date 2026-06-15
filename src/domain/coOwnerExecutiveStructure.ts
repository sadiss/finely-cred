/**
 * Co-owner executive org — 100+ C-suite through director hats Ruth can wear or fill by hiring.
 * Structured for enterprise-scale credit / fintech operations.
 */

import type { AgentPersonaId } from './agentPersonas';
import { loadStaffRoster } from '../data/staffRoster';

export type ExecutiveLevel = 'c_suite' | 'evp' | 'svp' | 'vp' | 'director';

export type ExecutiveDivision =
  | 'executive_office'
  | 'finance'
  | 'operations'
  | 'marketing'
  | 'sales'
  | 'technology'
  | 'people'
  | 'legal_compliance'
  | 'credit_operations'
  | 'partner_success'
  | 'revenue_growth'
  | 'platform_engineering';

export type ExecutiveHat = {
  id: string;
  title: string;
  abbreviation: string;
  division: ExecutiveDivision;
  divisionLabel: string;
  level: ExecutiveLevel;
  reportsTo: string;
  /** Maps to agent persona for AI staff routing when hat is filled */
  agentRoleId: AgentPersonaId;
  /** Ruth wears this hat directly when no human/AI staff is assigned */
  coOwnerCanWear: boolean;
};

const DIVISION_META: Record<
  ExecutiveDivision,
  { label: string; defaultRole: AgentPersonaId; cSuiteTitle: string; cSuiteAbbr: string }
> = {
  executive_office: { label: 'Executive Office', defaultRole: 'finely_coowner', cSuiteTitle: 'Chief Executive Officer', cSuiteAbbr: 'CEO' },
  finance: { label: 'Finance & Accounting', defaultRole: 'ops_copilot', cSuiteTitle: 'Chief Financial Officer', cSuiteAbbr: 'CFO' },
  operations: { label: 'Operations', defaultRole: 'ops_copilot', cSuiteTitle: 'Chief Operating Officer', cSuiteAbbr: 'COO' },
  marketing: { label: 'Marketing & Brand', defaultRole: 'social_creator', cSuiteTitle: 'Chief Marketing Officer', cSuiteAbbr: 'CMO' },
  sales: { label: 'Sales & Revenue', defaultRole: 'sales_closer', cSuiteTitle: 'Chief Revenue Officer', cSuiteAbbr: 'CRO' },
  technology: { label: 'Technology & Product', defaultRole: 'ops_copilot', cSuiteTitle: 'Chief Technology Officer', cSuiteAbbr: 'CTO' },
  people: { label: 'People & Culture', defaultRole: 'support_specialist', cSuiteTitle: 'Chief People Officer', cSuiteAbbr: 'CHRO' },
  legal_compliance: { label: 'Legal & Compliance', defaultRole: 'compliance_agent', cSuiteTitle: 'Chief Legal Officer', cSuiteAbbr: 'CLO' },
  credit_operations: { label: 'Credit Operations', defaultRole: 'finely_advisor', cSuiteTitle: 'Chief Credit Officer', cSuiteAbbr: 'CCO' },
  partner_success: { label: 'Partner Success', defaultRole: 'support_specialist', cSuiteTitle: 'Chief Partner Officer', cSuiteAbbr: 'CPO' },
  revenue_growth: { label: 'Revenue & Affiliates', defaultRole: 'affiliate_specialist', cSuiteTitle: 'Chief Growth Officer', cSuiteAbbr: 'CGO' },
  platform_engineering: { label: 'Platform Engineering', defaultRole: 'ops_copilot', cSuiteTitle: 'Chief Information Officer', cSuiteAbbr: 'CIO' },
};

const GLOBAL_C_SUITE: Array<{ abbr: string; title: string; division: ExecutiveDivision; role: AgentPersonaId }> = [
  { abbr: 'CEO', title: 'Chief Executive Officer', division: 'executive_office', role: 'finely_coowner' },
  { abbr: 'President', title: 'President', division: 'executive_office', role: 'finely_coowner' },
  { abbr: 'COO', title: 'Chief Operating Officer', division: 'operations', role: 'ops_copilot' },
  { abbr: 'CFO', title: 'Chief Financial Officer', division: 'finance', role: 'ops_copilot' },
  { abbr: 'CTO', title: 'Chief Technology Officer', division: 'technology', role: 'ops_copilot' },
  { abbr: 'CMO', title: 'Chief Marketing Officer', division: 'marketing', role: 'social_creator' },
  { abbr: 'CRO', title: 'Chief Revenue Officer', division: 'sales', role: 'sales_closer' },
  { abbr: 'CHRO', title: 'Chief People Officer', division: 'people', role: 'support_specialist' },
  { abbr: 'CLO', title: 'Chief Legal Officer', division: 'legal_compliance', role: 'compliance_agent' },
  { abbr: 'CISO', title: 'Chief Information Security Officer', division: 'platform_engineering', role: 'compliance_agent' },
  { abbr: 'CCO', title: 'Chief Compliance Officer', division: 'legal_compliance', role: 'compliance_agent' },
  { abbr: 'CGO', title: 'Chief Growth Officer', division: 'revenue_growth', role: 'affiliate_specialist' },
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildDivisionHats(division: ExecutiveDivision): ExecutiveHat[] {
  const meta = DIVISION_META[division];
  const hats: ExecutiveHat[] = [];
  const divSlug = division;

  hats.push({
    id: `exec_${divSlug}_c_suite`,
    title: meta.cSuiteTitle,
    abbreviation: meta.cSuiteAbbr,
    division,
    divisionLabel: meta.label,
    level: 'c_suite',
    reportsTo: 'owner',
    agentRoleId: meta.defaultRole,
    coOwnerCanWear: division === 'operations' || division === 'executive_office',
  });

  const evpTitles = [`Executive VP — ${meta.label}`, `EVP — ${meta.label} Strategy`];
  evpTitles.forEach((title, i) => {
    hats.push({
      id: `exec_${divSlug}_evp_${i}`,
      title,
      abbreviation: `EVP-${meta.cSuiteAbbr}`,
      division,
      divisionLabel: meta.label,
      level: 'evp',
      reportsTo: `exec_${divSlug}_c_suite`,
      agentRoleId: meta.defaultRole,
      coOwnerCanWear: false,
    });
  });

  const svpFocus = ['Programs', 'Delivery', 'Analytics', 'Partnerships'];
  svpFocus.forEach((focus, i) => {
    hats.push({
      id: `exec_${divSlug}_svp_${i}`,
      title: `Senior VP — ${meta.label} ${focus}`,
      abbreviation: `SVP-${meta.cSuiteAbbr}${i + 1}`,
      division,
      divisionLabel: meta.label,
      level: 'svp',
      reportsTo: `exec_${divSlug}_evp_0`,
      agentRoleId: meta.defaultRole,
      coOwnerCanWear: false,
    });
  });

  const vpFocus = ['North America', 'Digital', 'Quality', 'Enablement', 'Planning'];
  vpFocus.forEach((focus, i) => {
    hats.push({
      id: `exec_${divSlug}_vp_${i}`,
      title: `VP — ${meta.label} ${focus}`,
      abbreviation: `VP-${meta.cSuiteAbbr}${i + 1}`,
      division,
      divisionLabel: meta.label,
      level: 'vp',
      reportsTo: `exec_${divSlug}_svp_${i % svpFocus.length}`,
      agentRoleId: meta.defaultRole,
      coOwnerCanWear: false,
    });
  });

  const dirFocus = ['Programs', 'Ops', 'Compliance', 'Training', 'Systems', 'Reporting'];
  dirFocus.forEach((focus, i) => {
    hats.push({
      id: `exec_${divSlug}_dir_${i}`,
      title: `Director — ${meta.label} ${focus}`,
      abbreviation: `DIR-${meta.cSuiteAbbr}${i + 1}`,
      division,
      divisionLabel: meta.label,
      level: 'director',
      reportsTo: `exec_${divSlug}_vp_${i % vpFocus.length}`,
      agentRoleId: meta.defaultRole,
      coOwnerCanWear: false,
    });
  });

  return hats;
}

/** All executive hats — 12 divisions × ~11 roles + global C-suite overlap ≈ 132 positions */
export const CO_OWNER_EXECUTIVE_HATS: ExecutiveHat[] = [
  ...GLOBAL_C_SUITE.map((c) => ({
    id: `exec_global_${slug(c.abbr)}`,
    title: c.title,
    abbreviation: c.abbr,
    division: c.division,
    divisionLabel: DIVISION_META[c.division].label,
    level: 'c_suite' as ExecutiveLevel,
    reportsTo: 'owner' as const,
    agentRoleId: c.role,
    coOwnerCanWear: c.abbr === 'COO' || c.abbr === 'CEO' || c.abbr === 'President',
  })),
  ...(Object.keys(DIVISION_META) as ExecutiveDivision[]).flatMap((d) => buildDivisionHats(d)),
];

export function getExecutiveHatById(id: string): ExecutiveHat | null {
  return CO_OWNER_EXECUTIVE_HATS.find((h) => h.id === id) ?? null;
}

export function listExecutiveHatsByDivision(division?: ExecutiveDivision): ExecutiveHat[] {
  if (!division) return CO_OWNER_EXECUTIVE_HATS;
  return CO_OWNER_EXECUTIVE_HATS.filter((h) => h.division === division);
}

export function staffFillsExecutiveHat(staffBio: string | undefined, hat: ExecutiveHat): boolean {
  const bio = (staffBio ?? '').toLowerCase();
  if (!bio) return false;
  return bio.includes(hat.title.toLowerCase()) || bio.includes(`executive hat: ${hat.title.toLowerCase()}`) || bio.includes(hat.id);
}

export function getStaffAssignedToExecutiveHat(hatId: string) {
  const hat = getExecutiveHatById(hatId);
  if (!hat) return null;
  return loadStaffRoster().find((s) => s.active !== false && staffFillsExecutiveHat(s.bioLine, hat)) ?? null;
}

export function listVacantExecutiveHats(level?: ExecutiveLevel): ExecutiveHat[] {
  return CO_OWNER_EXECUTIVE_HATS.filter((hat) => {
    if (level && hat.level !== level) return false;
    return !getStaffAssignedToExecutiveHat(hat.id);
  });
}

export function getExecutiveOrgStats() {
  const vacant = listVacantExecutiveHats();
  const byLevel = (lvl: ExecutiveLevel) => CO_OWNER_EXECUTIVE_HATS.filter((h) => h.level === lvl).length;
  return {
    totalHats: CO_OWNER_EXECUTIVE_HATS.length,
    divisions: Object.keys(DIVISION_META).length,
    vacant: vacant.length,
    filled: CO_OWNER_EXECUTIVE_HATS.length - vacant.length,
    cSuite: byLevel('c_suite'),
    evp: byLevel('evp'),
    svp: byLevel('svp'),
    vp: byLevel('vp'),
    director: byLevel('director'),
    coOwnerWearable: CO_OWNER_EXECUTIVE_HATS.filter((h) => h.coOwnerCanWear).length,
  };
}

export function summarizeExecutiveStructureForCoOwner(): string {
  const stats = getExecutiveOrgStats();
  const vacantCsuite = listVacantExecutiveHats('c_suite')
    .slice(0, 8)
    .map((h) => `- ${h.title} (${h.divisionLabel})`)
    .join('\n');
  return [
    `Executive org: ${stats.totalHats} hats · ${stats.divisions} divisions · ${stats.filled} filled · ${stats.vacant} vacant`,
    `Levels: C-suite ${stats.cSuite} · EVP ${stats.evp} · SVP ${stats.svp} · VP ${stats.vp} · Director ${stats.director}`,
    `Ruth can wear ${stats.coOwnerWearable} hats directly (CEO/COO/President lane)`,
    vacantCsuite ? `Vacant C-suite / priority:\n${vacantCsuite}` : 'All priority C-suite hats staffed.',
    '',
    'Autonomous hire: npm run coowner:audit · Admin /admin/ops-agent → Autonomous hiring',
  ].join('\n');
}
