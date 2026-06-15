#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planPath = path.join(__dirname, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');

let content = fs.readFileSync(planPath, 'utf8');

content = content.replace(/execution_status: tier945_complete/, 'execution_status: tier965_complete');

if (!content.includes('tier946-965-plan-handoff')) {
  content = content.replace(
    `  - id: tier926-945-plan-handoff
    content: "Tier 926–945 — Part AP verified + tier945_complete (server automation cron + heartbeat + runbook)"
    status: completed
isProject: false`,
    `  - id: tier926-945-plan-handoff
    content: "Tier 926–945 — Part AP verified + tier945_complete (server automation cron + heartbeat + runbook)"
    status: completed
  - id: tier946-965-plan-handoff
    content: "Tier 946–965 — Part AQ verified + tier965_complete (nurture + automation Supabase persistence + server nurture tick)"
    status: completed
isProject: false`,
  );
}

content = content.replace(
  '**Execution status** | **Tier 945 complete** — Server automation/nurture cron sweep + platform heartbeat monitoring |',
  '**Execution status** | **Tier 965 complete** — Nurture + automation Supabase persistence + server due-enrollment processing |',
);

const tier965Block = `## Tier 965 — Nurture + automation persistence Part AQ (complete)

| Item | Status |
|------|--------|
| **nurture_enrollments + automation_rules migrations** — admin RLS + due index | Done |
| **nurtureSupabaseSync + automationSupabaseSync** — boot hydrate, upsert on enroll/rule save | Done |
| **processDueNurtureEnrollments** — server cron advances due DB enrollments | Done |
| **automation-runner v4 + platform-cron v5** — nurtureProcess in heartbeat | Done |
| Launch + smoke gates for server_nurture_persistence | Done |

`;

if (!content.includes('## Tier 965 — Nurture + automation persistence Part AQ')) {
  content = content.replace('## Tier 945 — Server automation cron Part AP (complete)', tier965Block + '## Tier 945 — Server automation cron Part AP (complete)');
}

fs.writeFileSync(planPath, content);
console.log('Plan updated → tier965_complete');
