import { executeAgentTool } from '../agents/toolRegistry';
import type { ProspectorRunParams, ProspectorRunResult } from '../domain/partnerProspector/index.ts';

/**
 * Admin + site-agent entry point. Same engine, no auto-send.
 */
export async function prospectReferralPartners(params: ProspectorRunParams = {}): Promise<ProspectorRunResult> {
  const result = await executeAgentTool('prospectReferralPartners', params);
  if (!result.ok) throw new Error(result.error || 'Partner Prospector failed.');
  return result.data as ProspectorRunResult;
}
