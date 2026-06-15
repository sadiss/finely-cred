import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1585_complete/, 'execution_status: tier1605_complete');

if (!s.includes('tier1586-1605-plan-handoff')) {
  s = s.replace(
    `  - id: tier1566-1585-plan-handoff
    content: "Tier 1566-1585 — Part BV verified + tier1585_complete (drastic light frosted glass wave 23 — aurora shell + glass tokens + surface remaps)"
    status: completed`,
    `  - id: tier1566-1585-plan-handoff
    content: "Tier 1566-1585 — Part BV verified + tier1585_complete (drastic light frosted glass wave 23 — aurora shell + glass tokens + surface remaps)"
    status: completed
  - id: tier1586-1605-plan-handoff
    content: "Tier 1586-1605 — Part BW verified + tier1605_complete (light premium UX wave 24 — typography, catalog glass, interactions, modal scrim)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1585 complete** — Drastic light frosted glass (aurora shell, glass tokens, tinted chips); sitewide_light_glass_wave23 |',
  '| **Execution status** | **Tier 1605 complete** — Light premium UX (typography, marketing glass, hover lift, modal scrim); sitewide_light_premium_wave24 |',
);

if (!s.includes('## Tier 1605 —')) {
  s = s.replace(
    '## Tier 1585 — Light frosted glass wave Part BV (complete)',
    `## Tier 1605 — Light premium UX wave Part BW (complete)

| Item | Status |
|------|--------|
| **Typography ladder** — labels, body, muted, full accent hue remaps on light | Done |
| **Marketing/catalog glass cards** — radial accent cards → frosted glass + hover lift | Done |
| **Selected list states** — violet/emerald/fuchsia/amber selection glow | Done |
| **Modal scrim + soft buttons + side rails** — light glass overlays (not black wash) | Done |
| **theme:audit** + launch gate wave 24 | Done |

## Tier 1585 — Light frosted glass wave Part BV (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1605_complete');
