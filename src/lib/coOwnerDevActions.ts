/**
 * Ruth Dev Studio — parse and execute ```coowner-dev``` action blocks from AI responses.
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import type { StaffDepartment } from '../domain/staffMember';
import { extractFirstJsonObject } from '../utils/jsonExtract';
import { upsertCoOwnerDevProject, upsertCoOwnerAgentSpec, type DevProjectKind } from './coOwnerDevStudio';
import { executeCoOwnerStaffAction, type CoOwnerActionResult } from './coOwnerStaffActions';

export type CoOwnerDevAction =
  | {
      type: 'save_code_project';
      title: string;
      kind: DevProjectKind;
      language: 'typescript' | 'tsx' | 'javascript' | 'python' | 'sql' | 'markdown';
      purpose: string;
      code: string;
      targetPath?: string;
      tags?: string[];
      status?: 'draft' | 'ready';
    }
  | {
      type: 'create_agent_spec';
      name: string;
      displayTitle: string;
      primaryRoleId: AgentPersonaId;
      systemPrompt: string;
      purpose: string;
      toneTags?: string[];
      hireToRoster?: boolean;
      firstName?: string;
      lastName?: string;
      department?: StaffDepartment;
      portraitGender?: 'masculine' | 'feminine' | 'neutral';
    };

const DEV_BLOCK_RE = /```coowner-dev\s*([\s\S]*?)```/gi;

export function parseCoOwnerDevActionsFromAssistant(text: string): CoOwnerDevAction[] {
  const actions: CoOwnerDevAction[] = [];
  let m: RegExpExecArray | null;
  while ((m = DEV_BLOCK_RE.exec(text)) !== null) {
    const parsed = extractFirstJsonObject(m[1] ?? '') as CoOwnerDevAction | null;
    if (parsed?.type) actions.push(parsed);
  }
  return actions;
}

export function executeCoOwnerDevAction(action: CoOwnerDevAction): CoOwnerActionResult {
  switch (action.type) {
    case 'save_code_project': {
      const project = upsertCoOwnerDevProject({
        title: action.title,
        kind: action.kind,
        language: action.language,
        purpose: action.purpose,
        code: action.code,
        targetPath: action.targetPath,
        tags: action.tags ?? [],
        status: action.status ?? 'draft',
      });
      return {
        ok: true,
        message: `Saved Dev Studio project "${project.title}" (${project.kind}).`,
        detail: project,
      };
    }
    case 'create_agent_spec': {
      const spec = upsertCoOwnerAgentSpec({
        name: action.name,
        displayTitle: action.displayTitle,
        primaryRoleId: action.primaryRoleId,
        systemPrompt: action.systemPrompt,
        purpose: action.purpose,
        toneTags: action.toneTags ?? [],
        allowedChannels: ['chat', 'portal'],
      });
      if (action.hireToRoster && action.firstName && action.lastName && action.department) {
        const hire = executeCoOwnerStaffAction({
          type: 'hire_staff',
          firstName: action.firstName,
          lastName: action.lastName,
          primaryRoleId: action.primaryRoleId,
          department: action.department,
          portraitGender: action.portraitGender ?? 'neutral',
          bioLine: `${action.displayTitle} · Agent spec ${spec.id} · Hired by Ruth`,
        });
        return {
          ok: true,
          message: `Created agent spec "${spec.displayTitle}" and ${hire.message}`,
          detail: { spec, hire },
        };
      }
      return {
        ok: true,
        message: `Created agent spec "${spec.displayTitle}" (${spec.primaryRoleId}).`,
        detail: spec,
      };
    }
    default:
      return { ok: false, message: 'Unknown dev action type.' };
  }
}

export const CO_OWNER_DEV_PROMPT_APPEND = `
DEV STUDIO — Ruth authors code and agent specs purposefully (not random snippets):

For Finely Cred site work (components, libs, automations):
\`\`\`coowner-dev
{"type":"save_code_project","title":"Validation clock badge","kind":"site_feature","language":"tsx","purpose":"Surface FDCPA countdown on partner disputes","targetPath":"src/components/dispute/ValidationClockBadge.tsx","code":"// full component here","status":"ready","tags":["credit_ops","validation"]}
\`\`\`

For medium external projects (scripts, utilities, small apps outside Finely):
\`\`\`coowner-dev
{"type":"save_code_project","title":"Partner CSV exporter","kind":"external_script","language":"typescript","purpose":"Export anonymized partner metrics for owner review","code":"// full script","status":"ready"}
\`\`\`

To create a new AI agent specialist (+ optional roster hire):
\`\`\`coowner-dev
{"type":"create_agent_spec","name":"Summons Response Coach","displayTitle":"Summons Response Specialist","primaryRoleId":"dispute_coach","purpose":"Coach partners on affidavit + validation for summons","systemPrompt":"You are a Summons Response Specialist...","toneTags":["calm","validation-first"],"hireToRoster":true,"firstName":"Micah","lastName":"Eli","department":"dispute_processing","portraitGender":"masculine"}
\`\`\`

Kinds: site_patch, site_feature, agent_spec, automation_rule, external_app, external_script.
Always include complete, purposeful code — not placeholders. Confirm what you saved in plain language.
`;
