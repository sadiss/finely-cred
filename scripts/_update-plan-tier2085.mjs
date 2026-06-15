import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2065_complete/, 'execution_status: tier2085_complete');

if (!s.includes('tier2066-2085-plan-handoff')) {
  s = s.replace(
    `  - id: tier2046-2065-plan-handoff
    content: "Tier 2046-2065 — Part CV verified + tier2065_complete (light ivory/silver chrome wave 49 — toolbars, tabs, pagination, board shells, chrome-on-black nested)"
    status: completed`,
    `  - id: tier2046-2065-plan-handoff
    content: "Tier 2046-2065 — Part CV verified + tier2065_complete (light ivory/silver chrome wave 49 — toolbars, tabs, pagination, board shells, chrome-on-black nested)"
    status: completed
  - id: tier2066-2085-plan-handoff
    content: "Tier 2066-2085 — Part CW verified + tier2085_complete (light studio glass wave 50 — comms hub, letter studio, credit intel + bulk glass panels)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2065 complete** — Light ivory/silver chrome sitewide (toolbars, tabs, kanban); wave 49 |',
  '| **Execution status** | **Tier 2085 complete** — Light studio glass panels (comms, letters, credit intel); wave 50 |',
);

if (!s.includes('## Tier 2085 —')) {
  s = s.replace(
    '## Tier 2065 — Light ivory/silver chrome Part CV (complete)',
    `## Tier 2085 — Light studio glass Part CW (complete)

| Item | Status |
|------|--------|
| **fc-light-glass-panel** — primitive + finelyOsLightGlassPanel() helper | Done |
| **Studio scopes** — data-fc-comms-shell, letter-studio, credit-intel | Done |
| **Bulk replace** — dark bg-white/[0.0x] stacks → light glass panels (66 files) | Done |
| **Chrome on black** — silver nested glass inside black catalog scope | Done |
| **theme:audit** + launch gate wave 50 | Done |

## Tier 2065 — Light ivory/silver chrome Part CV (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2085_complete');
