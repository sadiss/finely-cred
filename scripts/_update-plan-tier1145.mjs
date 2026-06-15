import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1125_complete/, 'execution_status: tier1145_complete');

if (!s.includes('tier1126-1145-plan-handoff')) {
  s = s.replace(
    `  - id: tier1106-1125-plan-handoff
    content: "Tier 1106-1125 — Part AY verified + tier1125_complete (portal wave 6 + admin ops hub)"
    status: completed`,
    `  - id: tier1106-1125-plan-handoff
    content: "Tier 1106-1125 — Part AY verified + tier1125_complete (portal wave 6 + admin ops hub)"
    status: completed
  - id: tier1126-1145-plan-handoff
    content: "Tier 1126-1145 — Part AZ verified + tier1145_complete (portal wave 7: library/education/escalations/my-tasks/courses)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1125 complete** — Portal wave 6: templates, calendar, identity, messages + admin ops hub |',
  '| **Execution status** | **Tier 1145 complete** — Portal wave 7: library, education, escalations, my-tasks, courses hubs |',
);

if (!s.includes('## Tier 1145 —')) {
  s = s.replace(
    '## Tier 1125 — Portal wave 6 Part AY (complete)',
    `## Tier 1145 — Portal wave 7 Part AZ (complete)

| Item | Status |
|------|--------|
| **PartnerLibraryPage** — overview / owned / store hub tabs | Done |
| **PartnerEducationPage** — curriculum / guides / explore hub tabs | Done |
| **PartnerEscalationsPage** — submit / track / regulatory hub tabs | Done |
| **PartnerMyTasksPage** — queue / overdue / projects hub tabs + voice-to-task | Done |
| **PartnerCoursesPage** — catalog / progress / tips hub tabs | Done |
| Launch + smoke gates for Part AZ | Done |

## Tier 1125 — Portal wave 6 Part AY (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1145_complete');
