import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1105_complete/, 'execution_status: tier1125_complete');

if (!s.includes('tier1106-1125-plan-handoff')) {
  s = s.replace(
    `  - id: tier1086-1105-plan-handoff
    content: "Tier 1086-1105 — Part AX verified + tier1105_complete (portal wave 5 hubs: documents/build/debt/letters vault)"
    status: completed`,
    `  - id: tier1086-1105-plan-handoff
    content: "Tier 1086-1105 — Part AX verified + tier1105_complete (portal wave 5 hubs: documents/build/debt/letters vault)"
    status: completed
  - id: tier1106-1125-plan-handoff
    content: "Tier 1106-1125 — Part AY verified + tier1125_complete (portal wave 6 + admin ops hub)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1105 complete** — Portal wave 5: documents, build, debt, letters vault unified hubs |',
  '| **Execution status** | **Tier 1125 complete** — Portal wave 6: templates, calendar, identity, messages + admin ops hub |',
);
s = s.replace(
  '| **Execution status** | **Tier 985 complete** — Server nurture email + DB automation rules + pg_cron schedule visibility |',
  '| **Execution status** | **Tier 1125 complete** — Portal wave 6: templates, calendar, identity, messages + admin ops hub |',
);

if (!s.includes('## Tier 1125 —')) {
  s = s.replace(
    '## Tier 1105 — Portal wave 5 Part AX (complete)',
    `## Tier 1125 — Portal wave 6 Part AY (complete)

| Item | Status |
|------|--------|
| **PartnerTemplateLibraryPage** — overview / vault / reasons / bases hub tabs | Done |
| **PartnerCalendarPage** — book / calendar / sessions / settings hub tabs | Done |
| **PartnerIdentityTheftPage** — overview / freeze / recovery hub tabs | Done |
| **PartnerMessagesPage** — ai / team / meetings / guide hub tabs | Done |
| **AdminWorkflowQueuePage** — triage / tasks / crm / activity unified hub | Done |
| Launch + smoke gates for Part AY | Done |

## Tier 1105 — Portal wave 5 Part AX (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1125_complete');
