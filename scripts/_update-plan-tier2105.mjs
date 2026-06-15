import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2085_complete/, 'execution_status: tier2105_complete');

if (!s.includes('tier2086-2105-plan-handoff')) {
  s = s.replace(
    `  - id: tier2066-2085-plan-handoff
    content: "Tier 2066-2085 — Part CW verified + tier2085_complete (light studio glass wave 50 — comms hub, letter studio, credit intel + bulk glass panels)"
    status: completed`,
    `  - id: tier2066-2085-plan-handoff
    content: "Tier 2066-2085 — Part CW verified + tier2085_complete (light studio glass wave 50 — comms hub, letter studio, credit intel + bulk glass panels)"
    status: completed
  - id: tier2086-2105-plan-handoff
    content: "Tier 2086-2105 — Part CX verified + tier2105_complete (CK harmony closure wave 51 — no Y-lift hovers, light tooltips, credit intel chrome buttons)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2085 complete** — Light studio glass panels (comms, letters, credit intel); wave 50 |',
  '| **Execution status** | **Tier 2105 complete** — CK harmony closure (tooltips, hovers, credit intel chrome); wave 51 |',
);

if (!s.includes('## Tier 2105 —')) {
  s = s.replace(
    '## Tier 2085 — Light studio glass Part CW (complete)',
    `## Tier 2105 — CK harmony closure Part CX (complete)

| Item | Status |
|------|--------|
| **fc-light-tooltip-shell** — onboarding slider bubbles (ivory in light theme) | Done |
| **CK harmony** — portal/onboarding hover Y-lift → brightness + shadow | Done |
| **Credit intel** — fc-soft-surface/bg-white stacks → fc-light-chrome-btn | Done |
| **PortalSteps.jsx** — legacy glass → light glass panels | Done |
| **theme:audit** + launch gate wave 51 | Done |

## Tier 2085 — Light studio glass Part CW (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2105_complete');
