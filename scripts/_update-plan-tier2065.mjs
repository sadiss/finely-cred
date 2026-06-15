import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2045_complete/, 'execution_status: tier2065_complete');

if (!s.includes('tier2046-2065-plan-handoff')) {
  s = s.replace(
    `  - id: tier2026-2045-plan-handoff
    content: "Tier 2026-2045 — Part CU verified + tier2045_complete (light black/silver cards wave 48 — mesh + hubs + app surface + PersonalCredit — institutional ribbon preserved)"
    status: completed`,
    `  - id: tier2026-2045-plan-handoff
    content: "Tier 2026-2045 — Part CU verified + tier2045_complete (light black/silver cards wave 48 — mesh + hubs + app surface + PersonalCredit — institutional ribbon preserved)"
    status: completed
  - id: tier2046-2065-plan-handoff
    content: "Tier 2046-2065 — Part CV verified + tier2065_complete (light ivory/silver chrome wave 49 — toolbars, tabs, pagination, board shells, chrome-on-black nested)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2045 complete** — Light black/silver catalog cards sitewide (mesh, hubs, portal); wave 48 |',
  '| **Execution status** | **Tier 2065 complete** — Light ivory/silver chrome sitewide (toolbars, tabs, kanban); wave 49 |',
);

if (!s.includes('## Tier 2065 —')) {
  s = s.replace(
    '## Tier 2045 — Light black/silver cards Part CU (complete)',
    `## Tier 2065 — Light ivory/silver chrome Part CV (complete)

| Item | Status |
|------|--------|
| **fc-light-chrome-*** — strip, panel, btn primitives + CSS vars | Done |
| **Token layer** — TOOLBAR, VIEW_TABS, BOARD_SHELL, SOFT_BTN, pagination, notice | Done |
| **Chrome on black** — silver nested toolbars/panels inside black catalog cards | Done |
| **Hub shell fix** — Part CC white fills excluded when fc-light-black-scope | Done |
| **theme:audit** + launch gate wave 49 | Done |

## Tier 2045 — Light black/silver cards Part CU (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2065_complete');
