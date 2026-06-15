#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planPath = path.join(__dirname, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');

let content = fs.readFileSync(planPath, 'utf8');

content = content.replace(/execution_status: tier965_complete/, 'execution_status: tier985_complete');

if (!content.includes('tier966-985-plan-handoff')) {
  content = content.replace(
    `  - id: tier946-965-plan-handoff
    content: "Tier 946-965 — Part AQ verified + tier965_complete (nurture + automation Supabase persistence + server nurture tick)"
    status: completed
isProject: false`,
    `  - id: tier946-965-plan-handoff
    content: "Tier 946-965 — Part AQ verified + tier965_complete (nurture + automation Supabase persistence + server nurture tick)"
    status: completed
  - id: tier966-985-plan-handoff
    content: "Tier 966-985 — Part AR verified + tier985_complete (server nurture email + DB automation rules + pg_cron schedule)"
    status: completed
isProject: false`,
  );
}

content = content.replace(
  '**Execution status** | **Tier 965 complete** — Nurture + automation Supabase persistence + server due-enrollment processing |',
  '**Execution status** | **Tier 985 complete** — Server nurture email + DB automation rules + pg_cron schedule visibility |',
);

const tier985Block = `## Tier 985 — Server nurture email + DB rules Part AR (complete)

| Item | Status |
|------|--------|
| **commsSendEmail + nurtureStepEmailCopy** — SendGrid dispatch from server cron | Done |
| **processDueNurtureEnrollments v2** — process current step + emailsSent heartbeat | Done |
| **processAutomationRulesFromDb** — interval notify_admin rules from automation_rules | Done |
| **automation_rule_runs + platform_cron_schedule migrations** | Done |
| Deploy panel — live nurture tick + pg_cron SQL copy | Done |
| Launch + smoke gates for server_nurture_email + server_automation_rules_db | Done |

`;

if (!content.includes('## Tier 985 — Server nurture email')) {
  content = content.replace('## Tier 965 — Nurture + automation persistence Part AQ (complete)', tier985Block + '## Tier 965 — Nurture + automation persistence Part AQ (complete)');
}

fs.writeFileSync(planPath, content);
console.log('Plan updated → tier985_complete');
