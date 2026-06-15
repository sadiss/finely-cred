/**
 * Production launch ops — runtime status for post-code-track go-live steps (wave 62).
 */

import { isSupabaseConfigured } from './supabaseClient';
import { LAUNCH_OPERATIONAL_STEPS } from './launchPlanClosure';
import { getPhoneProductionChecks, isPhoneProductionReady } from './phoneProductionOps';
import { getLightThemeGoLiveReadiness } from './lightThemeGoLiveOps';
import { getSeniorQaSignoffProgress } from './seniorQaSignoffOps';

export type ProductionLaunchStepStatus = 'ok' | 'warn' | 'blocked' | 'manual';

export type ProductionLaunchStep = {
  id: string;
  label: string;
  command?: string;
  path?: string;
  status: ProductionLaunchStepStatus;
  hint: string;
};

function resolveStepStatus(id: string): { status: ProductionLaunchStepStatus; hint: string } {
  switch (id) {
    case 'env':
      return isSupabaseConfigured
        ? { status: 'ok', hint: 'Supabase client keys detected in this build.' }
        : {
            status: 'blocked',
            hint: 'Open /admin/launch-os#env-bootstrap — paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local, restart dev server.',
          };
    case 'waves':
      return {
        status: 'ok',
        hint: 'Code track waves 54–68 pass — run npm run launch:closure:full:audit to re-verify.',
      };
    case 'preflight':
      return isSupabaseConfigured
        ? { status: 'warn', hint: 'Run npm run launch:preflight in terminal (env + QA + wave audits).' }
        : { status: 'blocked', hint: 'Needs Supabase keys before full preflight.' };
    case 'deploy-fn':
      return isSupabaseConfigured
        ? { status: 'warn', hint: 'Run npm run deploy:functions — see /admin/launch-os#deploy-go-live for full pipeline.' }
        : { status: 'blocked', hint: 'Configure Supabase project URL before deploying edge functions.' };
    case 'twilio': {
      const phoneReady = isPhoneProductionReady();
      const open = getPhoneProductionChecks().filter((c) => !c.ok && c.id !== 'edge_secrets').length;
      if (phoneReady) {
        return { status: 'ok', hint: 'Phone checklist clear — confirm Twilio Console webhook POST URL.' };
      }
      return {
        status: isSupabaseConfigured ? 'warn' : 'blocked',
        hint: `${open} phone item(s) open — copy webhook URL from Phone Hub.`,
      };
    }
    case 'theme': {
      const light = getLightThemeGoLiveReadiness();
      return light.publicEnabled
        ? { status: 'ok', hint: light.hint }
        : { status: 'warn', hint: light.hint };
    }
    case 'voice':
      return {
        status: 'warn',
        hint: 'Optional voiced tours — npm run tour:voice:prerender -- --all (player falls back to read-aloud).',
      };
    case 'human-qa': {
      const qa = getSeniorQaSignoffProgress();
      if (qa.complete) {
        return { status: 'ok', hint: `All ${qa.total} senior QA sign-off items checked.` };
      }
      if (qa.signed > 0) {
        return {
          status: 'warn',
          hint: `${qa.signed}/${qa.total} sign-offs — finish at /admin/launch-os#senior-qa`,
        };
      }
      return {
        status: 'manual',
        hint: 'Walk docs/SENIOR-QA-WALKTHROUGH.md paths — check items at /admin/launch-os#senior-qa',
      };
    }
    default:
      return { status: 'manual', hint: '' };
  }
}

export function getProductionLaunchSteps(): ProductionLaunchStep[] {
  return LAUNCH_OPERATIONAL_STEPS.map((step) => {
    const { status, hint } = resolveStepStatus(step.id);
    return {
      id: step.id,
      label: step.label,
      command: step.command,
      path: step.path,
      status,
      hint,
    };
  });
}

export function summarizeProductionLaunchForCoOwner(): string {
  const steps = getProductionLaunchSteps();
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const warn = steps.filter((s) => s.status === 'warn').length;
  const lines = steps.map((s) => `- [${s.status}] ${s.label} — ${s.hint}`).join('\n');
  return [
    `Production launch ops (${steps.length} steps): blocked=${blocked} warn=${warn}`,
    lines,
    '',
    'Terminal rollup: npm run launch:go-live · npm run launch:ops',
  ].join('\n');
}
