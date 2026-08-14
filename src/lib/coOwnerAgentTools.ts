/**
 * Co-owner Ruth — native Anthropic tool-calling schemas + executor (Phase 5).
 *
 * This is the PRIMARY execution path for high-value co-owner actions. The gateway
 * (`supabase/functions/ai-gateway/index.ts`) passes these tool defs to Anthropic for
 * `ops.coowner_agent` calls; when the model returns `tool_use` blocks we execute them
 * directly here. The older fenced-markdown-block parsing (`coOwnerStaffActions.ts`,
 * `coOwnerDevActions.ts`) remains as a FALLBACK for turns where the model replies with
 * a `coowner-action` / `coowner-dev` block instead of (or in addition to) native tool
 * calls — e.g. non-Anthropic providers, or a model turn that skips tool_use.
 */

import type { AiGatewayToolDef, AiGatewayToolUse } from './aiClient';
import { executeCoOwnerStaffAction, type CoOwnerStaffAction } from './coOwnerStaffActions';
import { executeCoOwnerAutomationNow } from './coOwnerAutomationRunner';
import { getCoOwnerExecutionEntry, listCoOwnerExecutionRegistry } from './coOwnerExecutionRegistry';

export type CoOwnerToolCall = AiGatewayToolUse;
export type CoOwnerToolExecResult = { ok: boolean; message: string; navigateTo?: string; prompt?: string };

/** Tool names that always require explicit human confirmation before executing. */
const ALWAYS_HIGH_RISK_TOOLS = new Set(['deactivate_staff']);
/** Execution-registry domains that are irreversible/high-blast-radius enough to confirm. */
const HIGH_RISK_AUTOMATION_DOMAINS = new Set(['billing']);
const BROADCAST_PATTERN = /broadcast|mass[_\s-]?send|blast/i;

/** Appended to the system prompt so the model knows native tools exist and are preferred
 * over emitting fenced coowner-action/coowner-dev blocks. */
export const CO_OWNER_TOOL_PROMPT_APPEND = `
You have native tools available: hire_staff, promote_staff, promote_agent, deactivate_staff, run_automation, navigate. PREFER calling these tools directly over writing a fenced action block — only fall back to a \`\`\`coowner-action\`\`\` block if tools are unavailable. Some tool calls (deactivate_staff, and run_automation on billing-domain keys) will pause for a human confirmation click before they actually execute — that's expected, just tell the owner what you're proposing.
`;

export function buildCoOwnerAgentTools(): AiGatewayToolDef[] {
  const automationKeys = listCoOwnerExecutionRegistry().map((e) => e.executeKey);
  return [
    {
      name: 'hire_staff',
      description:
        'Hire a new staff/agent member onto the live roster. Use for filling coverage gaps or vacant executive hats. Low risk — executes immediately.',
      input_schema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          primaryRoleId: { type: 'string', description: 'Agent persona id, e.g. dispute_coach, finely_advisor, funding_strategist.' },
          department: {
            type: 'string',
            enum: ['credit_operations', 'dispute_processing', 'funding', 'debt_resolution', 'partner_success', 'growth_sessions', 'marketing', 'internal_ops'],
          },
          bioLine: { type: 'string' },
          portraitGender: { type: 'string', enum: ['masculine', 'feminine', 'neutral'] },
          executiveHatId: { type: 'string', description: 'Optional executive hat id if filling a C-suite/director vacancy.' },
        },
        required: ['firstName', 'lastName', 'primaryRoleId', 'department'],
      },
    },
    {
      name: 'promote_staff',
      description: 'Advance an existing staff member to a new primary role. Low risk — executes immediately.',
      input_schema: {
        type: 'object',
        properties: {
          staffId: { type: 'string' },
          newRoleId: { type: 'string', description: 'Agent persona id to promote into.' },
        },
        required: ['staffId', 'newRoleId'],
      },
    },
    {
      name: 'promote_agent',
      description: 'Advance a credit specialist agent user to the next training phase. Low risk — executes immediately.',
      input_schema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          trainingPhase: { type: 'string', enum: ['apprenticeship', 'guided', 'independent', 'partner'] },
        },
        required: ['userId', 'trainingPhase'],
      },
    },
    {
      name: 'deactivate_staff',
      description:
        'Deactivate (terminate) a staff member from the active roster. IRREVERSIBLE-FEELING and high-risk — the UI will require an explicit human confirmation click before this executes, even though you may call the tool.',
      input_schema: {
        type: 'object',
        properties: { staffId: { type: 'string' } },
        required: ['staffId'],
      },
    },
    {
      name: 'run_automation',
      description:
        'Run one of the named platform automations by execute key (data pull + real action where applicable). Automations in the "billing" domain require human confirmation; everything else executes immediately.',
      input_schema: {
        type: 'object',
        properties: {
          executeKey: { type: 'string', enum: automationKeys },
        },
        required: ['executeKey'],
      },
    },
    {
      name: 'navigate',
      description: 'Navigate the admin UI to a specific route so the owner can see relevant data. Low risk — executes immediately.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'App route, e.g. /admin/billing' } },
        required: ['path'],
      },
    },
  ];
}

export function isHighRiskCoOwnerTool(call: { name: string; input: Record<string, unknown> }): boolean {
  if (ALWAYS_HIGH_RISK_TOOLS.has(call.name)) return true;
  if (call.name === 'run_automation') {
    const key = String(call.input?.executeKey ?? '');
    const entry = getCoOwnerExecutionEntry(key);
    if (entry?.domain && HIGH_RISK_AUTOMATION_DOMAINS.has(entry.domain)) return true;
    if (BROADCAST_PATTERN.test(key)) return true;
  }
  if (BROADCAST_PATTERN.test(call.name)) return true;
  return false;
}

export function describePendingToolAction(call: { name: string; input: Record<string, unknown> }): string {
  switch (call.name) {
    case 'deactivate_staff':
      return `Deactivate staff member "${String(call.input?.staffId ?? 'unknown')}"? This removes them from active scheduling immediately.`;
    case 'run_automation': {
      const key = String(call.input?.executeKey ?? '');
      const entry = getCoOwnerExecutionEntry(key);
      return `Run "${entry?.label ?? key}"? This touches live billing/financial data.`;
    }
    default:
      return `Execute ${call.name}?`;
  }
}

export function runCoOwnerToolCall(call: { name: string; input: Record<string, unknown> }): CoOwnerToolExecResult {
  switch (call.name) {
    case 'hire_staff':
    case 'promote_staff':
    case 'promote_agent':
    case 'deactivate_staff': {
      const action = { type: call.name, ...call.input } as CoOwnerStaffAction;
      const r = executeCoOwnerStaffAction(action);
      return { ok: r.ok, message: r.message };
    }
    case 'run_automation': {
      const key = String(call.input?.executeKey ?? '');
      const r = executeCoOwnerAutomationNow(key);
      return { ok: r.ok, message: r.message, navigateTo: r.navigateTo, prompt: r.prompt };
    }
    case 'navigate': {
      const path = String(call.input?.path ?? '').trim();
      if (!path) return { ok: false, message: 'Navigate tool called without a path.' };
      return { ok: true, message: `Navigating to ${path}.`, navigateTo: path };
    }
    default:
      return { ok: false, message: `Unknown tool: ${call.name}` };
  }
}
