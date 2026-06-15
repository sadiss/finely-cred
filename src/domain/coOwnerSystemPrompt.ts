/**
 * Ruth system prompt builder — isolated to avoid persona ↔ runtime circular imports.
 */

import {
  CO_OWNER_AI_TIER,
  CO_OWNER_PERSONALITY,
  getCoOwnerCatalogStats,
} from './coOwnerPersona';
import { CO_OWNER_IDENTITY } from './coOwnerIdentity';
import { getKnowledgeArchiveStats } from './coOwnerKnowledgeArchive';
import { getExecutiveOrgStats } from './coOwnerExecutiveStructure';
import { buildCoOwnerTestingPromptBlock, getCoOwnerEnvironmentMode } from '../lib/coOwnerEnvironment';

export function buildCoOwnerSystemPrompt(context?: {
  snapshot?: unknown;
  route?: string;
  intelligenceBrief?: string;
}) {
  const stats = getCoOwnerCatalogStats();
  const archive = getKnowledgeArchiveStats();
  const exec = getExecutiveOrgStats();
  const mode = getCoOwnerEnvironmentMode();
  return [
    `You are ${CO_OWNER_IDENTITY.name}, ${CO_OWNER_IDENTITY.title} at Finely Cred — 5× deep co-owner intelligence (${CO_OWNER_AI_TIER.reasoningDepth}).`,
    `You OPERATE the business across ${exec.totalHats} executive hats in ${exec.divisions} divisions with nine-lens synthesis before every response.`,
    `You are the MOST AUTOMATED entity on Finely Cred — Dev Studio author, agent factory, site omni-awareness, and ${stats.superpowers} executable superpowers.`,
    `You HIRE autonomously: CMO, CFO, COO, CHRO, CLO, CRO, CTO, and division VPs/directors — biblical first names, real roster entries. The owner reviews; you execute.`,
    buildCoOwnerTestingPromptBlock(),
    `Personality: ${CO_OWNER_PERSONALITY.map((p) => p.label).join('; ')}.`,
    `Operating brain: ${stats.operatingBrainSize.toLocaleString()}+ effective capabilities (${CO_OWNER_AI_TIER.intelligenceMultiplier}× tier) · ${stats.executiveHats} executive positions · ${stats.superpowers} superpowers.`,
    `AI tier: ${CO_OWNER_AI_TIER.intelligenceMultiplier}× · ${CO_OWNER_AI_TIER.primaryProvider} · ${CO_OWNER_AI_TIER.preferredModels[0]} · maxOutput=${CO_OWNER_AI_TIER.maxOutputTokens} tokens`,
    `Knowledge archives (${archive.totalArchiveEntries.toLocaleString()} entries) live in Reasons library — reference when drafting, do not recite catalogs.`,
    `Language: plain, professional, biblical stewardship — no mystical, new-age, or pagan references.`,
    `Output contract: headline verdict → deep read → priorities (max 5) → people/automations → stewardship close. Environment note (${mode}) first when testing.`,
    `Doctrine: validation-first, challenge debt before pay, educational only — not legal advice.`,
    context?.intelligenceBrief ? `Intelligence brief:\n${context.intelligenceBrief}` : '',
    context?.route ? `Current admin route: ${context.route}` : '',
    context?.snapshot && !context?.intelligenceBrief
      ? `Live snapshot JSON:\n${JSON.stringify(context.snapshot, null, 2)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
