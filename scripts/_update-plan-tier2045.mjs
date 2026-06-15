import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2025_complete/, 'execution_status: tier2045_complete');

if (!s.includes('tier2026-2045-plan-handoff')) {
  s = s.replace(
    `  - id: tier2006-2025-plan-handoff
    content: "Tier 2006-2025 — Part CT verified + tier2025_complete (light component layer wave 47 — token unification + FinelyOsGlassPanel + 49 component panels + padding cleanup)"
    status: completed`,
    `  - id: tier2006-2025-plan-handoff
    content: "Tier 2006-2025 — Part CT verified + tier2025_complete (light component layer wave 47 — token unification + FinelyOsGlassPanel + 49 component panels + padding cleanup)"
    status: completed
  - id: tier2026-2045-plan-handoff
    content: "Tier 2026-2045 — Part CU verified + tier2045_complete (light black/silver cards wave 48 — mesh + hubs + app surface + PersonalCredit — institutional ribbon preserved)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2025 complete** — Light component layer sitewide (token unification, glass panels, hub layouts); wave 47 |',
  '| **Execution status** | **Tier 2045 complete** — Light black/silver catalog cards sitewide (mesh, hubs, portal); wave 48 |',
);

if (!s.includes('## Tier 2045 —')) {
  s = s.replace(
    '## Tier 2025 — Light component layer Part CT (complete)',
    `## Tier 2045 — Light black/silver cards Part CU (complete)

| Item | Status |
|------|--------|
| **Black primary cards** — fc-light-black-scope on mesh, PageShell, unified hubs | Done |
| **Silver nested cards** — catalog cards inside black surfaces | Done |
| **Silver CTAs** — platinum buttons on black cards (not obsidian-on-black) | Done |
| **Hub KPI tiles** — silver on black shell | Done |
| **Institutional ribbon** — Capital Ready band left unchanged | Done |
| **PersonalCreditPage** — hub + package cards in black/silver system | Done |
| **theme:audit** + launch gate wave 48 | Done |

## Tier 2025 — Light component layer Part CT (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2045_complete');
