import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2105_complete/, 'execution_status: tier2125_complete');

if (!s.includes('tier2106-2125-plan-handoff')) {
  s = s.replace(
    `  - id: tier2086-2105-plan-handoff
    content: "Tier 2086-2105 — Part CX verified + tier2105_complete (CK harmony closure wave 51 — no Y-lift hovers, light tooltips, credit intel chrome buttons)"
    status: completed`,
    `  - id: tier2086-2105-plan-handoff
    content: "Tier 2086-2105 — Part CX verified + tier2105_complete (CK harmony closure wave 51 — no Y-lift hovers, light tooltips, credit intel chrome buttons)"
    status: completed
  - id: tier2106-2125-plan-handoff
    content: "Tier 2106-2125 — Part CY verified + tier2125_complete (light residue sweep wave 52 — landing CK harmony, bg-white/07 panels, fc-panel → catalog cards)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2105 complete** — CK harmony closure (tooltips, hovers, credit intel chrome); wave 51 |',
  '| **Execution status** | **Tier 2125 complete** — Light theme residue sweep (landing, public shell, fc-panel); wave 52 |',
);

if (!s.includes('## Tier 2125 —')) {
  s = s.replace(
    '## Tier 2105 — CK harmony closure Part CX (complete)',
    `## Tier 2125 — Light residue sweep Part CY (complete)

| Item | Status |
|------|--------|
| **Landing CK harmony** — card stack + service grid hovers → brightness (no Y-lift) | Done |
| **Bulk glass pass 2** — bg-white/[0.07–0.08] stacks → fc-light-glass-panel | Done |
| **fc-panel retirement** — CrmForecastPanel + AdminCourses modal → catalog cards | Done |
| **Public shell CSS** — Part CY landing/glass overrides on data-fc-public-shell | Done |
| **theme:audit** + launch gate wave 52 | Done |

## Tier 2105 — CK harmony closure Part CX (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2125_complete');
