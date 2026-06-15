import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1605_complete/, 'execution_status: tier1625_complete');

if (!s.includes('tier1606-1625-plan-handoff')) {
  s = s.replace(
    `  - id: tier1586-1605-plan-handoff
    content: "Tier 1586-1605 — Part BW verified + tier1605_complete (light premium UX wave 24 — typography, catalog glass, interactions, modal scrim)"
    status: completed`,
    `  - id: tier1586-1605-plan-handoff
    content: "Tier 1586-1605 — Part BW verified + tier1605_complete (light premium UX wave 24 — typography, catalog glass, interactions, modal scrim)"
    status: completed
  - id: tier1606-1625-plan-handoff
    content: "Tier 1606-1625 — Part BX verified + tier1625_complete (light solid accent wave 25 — colored icons/boxes, lane nav restore, More menu)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1605 complete** — Light premium UX (typography, marketing glass, hover lift, modal scrim); sitewide_light_premium_wave24 |',
  '| **Execution status** | **Tier 1625 complete** — Light solid accents (icons/boxes are the color, no glow) + full lane menus; sitewide_light_solid_wave25 |',
);

if (!s.includes('## Tier 1625 —')) {
  s = s.replace(
    '## Tier 1605 — Light premium UX wave Part BW (complete)',
    `## Tier 1625 — Light solid accent wave Part BX (complete)

| Item | Status |
|------|--------|
| **Solid accent cards** — fc-accent-card tinted fills, no radial glow | Done |
| **FlashyIcon light** — solid colored icon + box (no aura/blur glow) | Done |
| **Lane nav** — all portal/admin lane destinations visible (no 6-item cap) | Done |
| **Desktop More menu** — PUBLIC_MOBILE_EXPLORE restored to top nav | Done |
| **theme:audit** + launch gate wave 25 | Done |

## Tier 1605 — Light premium UX wave Part BW (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1625_complete');
