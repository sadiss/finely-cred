import {
  executeProspectReferralPartners,
  prospectReferralPartnersDefinition,
} from './tools/prospectReferralPartners';
import type { ProspectorRunParams, ProspectorRunResult } from '../domain/partnerProspector/index.ts';

export type AgentToolName = 'prospectReferralPartners';

export type AgentToolDefinition = {
  name: AgentToolName;
  description: string;
  parameters: Record<string, unknown>;
};

export const AGENT_TOOLS: AgentToolDefinition[] = [prospectReferralPartnersDefinition];

export function listAgentTools(): AgentToolDefinition[] {
  return AGENT_TOOLS;
}

export function agentToolsPromptBlock(): string {
  return [
    'Available tools (call by returning a single JSON object, no markdown):',
    '{"tool":"prospectReferralPartners","args":{"metros":["miami","north_miami","miami_gardens"],"verticals":["tax","bhph","realtor","mortgage","immigration"],"limit":50,"dedupe":true}}',
    'Rules: public business data only. Never invent emails or phones. Never send outreach. Say credit restore, not repair. Live Haitian URL is /haitian — do not require /free-kreyol-guide.',
  ].join('\n');
}

export function parseToolCall(text: string): { tool: AgentToolName; args: Record<string, unknown> } | null {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence?.[1]?.trim() || raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (parsed?.tool === 'prospectReferralPartners') {
      return { tool: 'prospectReferralPartners', args: parsed.args ?? parsed.params ?? {} };
    }
  } catch {
    return null;
  }
  return null;
}

export async function executeAgentTool(
  name: AgentToolName,
  args: Record<string, unknown> | ProspectorRunParams,
): Promise<{ ok: true; data: ProspectorRunResult } | { ok: false; error: string }> {
  try {
    if (name !== 'prospectReferralPartners') return { ok: false, error: `Unknown tool: ${name}` };
    const data = await executeProspectReferralPartners(args as ProspectorRunParams);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
